import type { BookingStatus, PaymentStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableError,
} from '../../lib/errors';
import { createUniqueBookingCode, maskPhone, normalizePhone } from '../../lib/codes';
import { calculateBookingTotal } from '../../lib/pricing';
import {
  jakartaDateISO,
  jakartaDayRange,
  isPastDate,
  isSlotStarted,
  maxBookingDate,
  slotLabel,
  slotToDate,
  TIME_SLOTS,
  todayISO,
} from '../../lib/slots';
import { STATUS_LABELS, canTransition } from '../../lib/status';
import { recordAudit } from '../../lib/audit';
import { notifyBookingCreated, notifyPaymentPaid, notifyStatusChange } from '../../integrations/whatsapp';
import type {
  AssignTechnicianInput,
  CreateBookingInput,
  PaymentUpdateInput,
  StatusUpdateInput,
} from './bookings.schema';

const listInclude = {
  customer: {
    select: { id: true, name: true, phone: true, city: true, district: true },
  },
  service: { select: { id: true, name: true, slug: true } },
  variant: { select: { id: true, name: true } },
  technician: { select: { id: true, name: true } },
} satisfies Prisma.BookingInclude;

const detailInclude = {
  customer: true,
  service: { include: { category: { select: { id: true, name: true, slug: true } } } },
  variant: true,
  technician: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      technician: { select: { zone: true, specialties: true, isAvailable: true } },
    },
  },
  statusHistory: {
    orderBy: { createdAt: 'asc' },
    include: { changedBy: { select: { name: true } } },
  },
  stockMovements: {
    orderBy: { createdAt: 'desc' },
    include: { item: { select: { sku: true, name: true, unit: true } } },
  },
  testimonial: { select: { id: true, rating: true, content: true, isPublished: true } },
} satisfies Prisma.BookingInclude;

type MoneyRow = {
  basePrice: Prisma.Decimal;
  addOnTotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
};

/** Decimal does not survive JSON as a number; money leaves the API as a number. */
function withMoney<T extends MoneyRow>(row: T) {
  return {
    ...row,
    basePrice: Number(row.basePrice),
    addOnTotal: Number(row.addOnTotal),
    discount: Number(row.discount),
    total: Number(row.total),
  };
}

export async function createBooking(input: CreateBookingInput) {
  if (input.scheduledDate > maxBookingDate()) {
    throw new BadRequestError('Pemesanan dapat dilakukan maksimal 60 hari ke depan.');
  }
  if (isPastDate(input.scheduledDate)) {
    throw new BadRequestError('Tanggal layanan sudah lewat.');
  }
  if (isSlotStarted(input.scheduledDate, input.slot)) {
    throw new BadRequestError('Jam kedatangan ini sudah lewat. Silakan pilih jam lain.');
  }

  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, isActive: true },
    include: { variants: { where: { isActive: true } } },
  });
  if (!service) throw new NotFoundError('Layanan tidak tersedia.');

  const variant = input.variantId
    ? service.variants.find((item) => item.id === input.variantId)
    : undefined;
  if (input.variantId && !variant) {
    throw new BadRequestError('Varian layanan tidak tersedia untuk layanan ini.');
  }

  const scheduledAt = slotToDate(input.scheduledDate, input.slot);
  const price = calculateBookingTotal({
    unitPrice: variant?.price ?? service.basePrice,
    unitCount: input.unitCount,
  });
  const customerPhone = normalizePhone(input.customer.phone);
  const email = input.customer.email ?? null;

  const booking = await withSerializableRetry(async () => {
    const code = await createUniqueBookingCode(async (candidate) => {
      const found = await prisma.booking.findUnique({ where: { code: candidate }, select: { id: true } });
      return Boolean(found);
    });

    return prisma.$transaction(
      async (tx) => {
        const booked = await tx.booking.count({
          where: { scheduledAt, status: { not: 'CANCELLED' } },
        });
        if (booked >= env.SLOT_CAPACITY) {
          throw new ConflictError(
            `Slot ${slotLabel(input.slot)} pada tanggal ini sudah penuh. Silakan pilih jam atau tanggal lain.`,
          );
        }

        const customer = await tx.customer.upsert({
          where: { phone: customerPhone },
          create: {
            name: input.customer.name,
            phone: customerPhone,
            email,
            address: input.customer.address,
            city: input.customer.city,
            district: input.customer.district,
            postalCode: input.customer.postalCode,
            notes: input.customer.notes,
          },
          update: {
            name: input.customer.name,
            email,
            address: input.customer.address,
            city: input.customer.city,
            district: input.customer.district,
            postalCode: input.customer.postalCode,
            notes: input.customer.notes,
          },
        });

        const created = await tx.booking.create({
          data: {
            code,
            customerId: customer.id,
            serviceId: service.id,
            variantId: variant?.id,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            source: 'WEBSITE',
            scheduledAt,
            slotLabel: input.slot,
            durationMinutes: variant?.durationMinutes ?? service.durationMinutes,
            propertyType: input.propertyType,
            address: input.customer.address,
            city: input.customer.city,
            district: input.customer.district,
            postalCode: input.customer.postalCode,
            notes: input.notes,
            unitCount: price.unitCount,
            basePrice: price.basePrice,
            addOnTotal: price.addOnTotal,
            discount: price.discount,
            total: price.total,
            statusHistory: {
              create: {
                status: 'PENDING',
                note: 'Pesanan dibuat melalui website.',
              },
            },
          },
          include: {
            customer: true,
            service: { select: { name: true, slug: true } },
            variant: { select: { name: true } },
          },
        });

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  });

  void notifyBookingCreated(booking).catch(() => undefined);

  return {
    ...withMoney(booking),
    statusLabel: STATUS_LABELS[booking.status],
    slotLabel: slotLabel(booking.slotLabel),
  };
}

export async function getAvailability(dateISO: string) {
  if (dateISO < todayISO()) {
    return {
      date: dateISO,
      slots: TIME_SLOTS.map((slot) => ({
        id: slot.id,
        label: slot.label,
        start: slot.start,
        end: slot.end,
        capacity: env.SLOT_CAPACITY,
        booked: 0,
        remaining: 0,
        available: false,
        reason: 'Tanggal sudah lewat.',
      })),
    };
  }

  const { start, end } = jakartaDayRange(dateISO);
  const bookings = await prisma.booking.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    },
    select: { slotLabel: true },
  });

  const counts = new Map<string, number>();
  for (const booking of bookings) {
    counts.set(booking.slotLabel, (counts.get(booking.slotLabel) ?? 0) + 1);
  }

  return {
    date: dateISO,
    slots: TIME_SLOTS.map((slot) => {
      const booked = counts.get(slot.id) ?? 0;
      const remaining = Math.max(0, env.SLOT_CAPACITY - booked);
      const started = dateISO === todayISO() && isSlotStarted(dateISO, slot.id);
      return {
        id: slot.id,
        label: slot.label,
        start: slot.start,
        end: slot.end,
        capacity: env.SLOT_CAPACITY,
        booked,
        remaining,
        available: remaining > 0 && !started,
        reason: started ? 'Jam ini sudah lewat.' : remaining === 0 ? 'Slot penuh.' : undefined,
      };
    }),
  };
}

export async function trackBooking(codeInput: string, phoneInput?: string) {
  const code = codeInput.trim().toUpperCase();
  const booking = await prisma.booking.findUnique({
    where: { code },
    select: {
      code: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      scheduledAt: true,
      slotLabel: true,
      createdAt: true,
      total: true,
      city: true,
      district: true,
      address: true,
      postalCode: true,
      notes: true,
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true, slug: true } },
      variant: { select: { name: true } },
      technician: { select: { name: true } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        select: { status: true, note: true, createdAt: true },
      },
    },
  });

  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan. Periksa kembali kode Anda.');

  const verified = phoneInput
    ? normalizePhone(phoneInput) === booking.customer.phone
    : false;

  if (phoneInput && !verified) {
    // Do not confirm that the code exists when the phone does not match.
    throw new NotFoundError('Pesanan tidak ditemukan. Periksa kembali kode dan nomor Anda.');
  }

  const nameParts = booking.customer.name.trim().split(/\s+/);
  const maskedName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
      : nameParts[0];

  return {
    code: booking.code,
    status: booking.status,
    statusLabel: STATUS_LABELS[booking.status],
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    scheduledAt: booking.scheduledAt,
    slotLabel: slotLabel(booking.slotLabel),
    createdAt: booking.createdAt,
    total: Number(booking.total),
    city: booking.city,
    district: booking.district,
    service: booking.service,
    variant: booking.variant,
    technician: booking.technician
      ? { name: booking.technician.name.split(/\s+/)[0] }
      : null,
    customer: verified
      ? {
          name: booking.customer.name,
          phone: booking.customer.phone,
          address: booking.address,
          postalCode: booking.postalCode,
        }
      : {
          name: maskedName,
          phone: maskPhone(booking.customer.phone),
          address: null,
          postalCode: null,
        },
    notes: verified ? booking.notes : null,
    verified,
    history: booking.statusHistory.map((entry) => ({
      status: entry.status,
      label: STATUS_LABELS[entry.status],
      note: verified ? entry.note : null,
      createdAt: entry.createdAt,
    })),
  };
}

export async function listBookings(
  filters: {
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    technicianId?: string;
    from?: string;
    to?: string;
    q?: string;
  },
  pagination: { page: number; limit: number; skip: number },
) {
  const where: Prisma.BookingWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.technicianId) where.technicianId = filters.technicianId;

  if (filters.from || filters.to) {
    const from = filters.from ? jakartaDayRange(filters.from).start : undefined;
    const to = filters.to ? jakartaDayRange(filters.to).end : undefined;
    where.scheduledAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  }

  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { code: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { phone: { contains: q.replace(/\D/g, '') } } },
      { address: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: listInclude,
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  return {
    rows: rows.map((row) => withMoney(row)),
    total,
  };
}

export async function getBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');
  const { statusHistory, ...rest } = booking;
  return withMoney({ ...rest, history: statusHistory });
}

export async function updateStatus(
  id: string,
  input: StatusUpdateInput,
  actor: { userId?: string; ip?: string },
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');

  if (booking.status === input.status) {
    throw new ConflictError(`Status pesanan sudah ${STATUS_LABELS[input.status]}.`);
  }
  if (!canTransition(booking.status, input.status)) {
    throw new UnprocessableError(
      `Status tidak dapat diubah dari "${STATUS_LABELS[booking.status]}" ke "${STATUS_LABELS[input.status]}".`,
    );
  }
  if (
    (input.status === 'ASSIGNED' ||
      input.status === 'EN_ROUTE' ||
      input.status === 'IN_PROGRESS' ||
      input.status === 'COMPLETED') &&
    !booking.technicianId
  ) {
    throw new UnprocessableError(
      'Tugaskan teknisi terlebih dahulu sebelum mengubah status ini.',
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
      include: {
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
        variant: { select: { name: true } },
        technician: { select: { name: true } },
      },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        status: input.status,
        note: input.note,
        changedById: actor.userId,
      },
    });
    return result;
  });

  void notifyStatusChange(updated, STATUS_LABELS[input.status], input.note).catch(() => undefined);
  await recordAudit({
    userId: actor.userId,
    action: 'booking.status.update',
    entity: 'Booking',
    entityId: id,
    meta: { from: booking.status, to: input.status, note: input.note },
    ip: actor.ip,
  });

  return getBooking(id);
}

export async function assignTechnician(
  id: string,
  input: AssignTechnicianInput,
  actor: { userId?: string; ip?: string },
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');

  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw new ConflictError('Pesanan yang sudah selesai atau dibatalkan tidak dapat ditugaskan.');
  }
  if (booking.status === 'EN_ROUTE' || booking.status === 'IN_PROGRESS') {
    throw new ConflictError('Teknisi tidak dapat diganti setelah pekerjaan dimulai.');
  }

  const technician = await prisma.user.findFirst({
    where: { id: input.technicianId, role: 'TECHNICIAN', isActive: true },
    include: { technician: true },
  });
  if (!technician || !technician.technician) {
    throw new NotFoundError('Teknisi tidak ditemukan atau tidak aktif.');
  }
  if (!technician.technician.isAvailable) {
    throw new ConflictError(`${technician.name} sedang tidak tersedia.`);
  }

  const dateISO = jakartaDateISO(booking.scheduledAt);
  const { start, end } = jakartaDayRange(dateISO);

  const workload = await prisma.booking.count({
    where: {
      technicianId: technician.id,
      scheduledAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
      id: { not: booking.id },
    },
  });
  if (workload >= technician.technician.capacityPerDay) {
    throw new ConflictError(
      `${technician.name} sudah mencapai kapasitas ${technician.technician.capacityPerDay} pesanan pada tanggal tersebut.`,
    );
  }

  const overlap = await prisma.booking.findFirst({
    where: {
      technicianId: technician.id,
      scheduledAt: { gte: start, lte: end },
      slotLabel: booking.slotLabel,
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      id: { not: booking.id },
    },
    select: { code: true },
  });
  if (overlap) {
    throw new ConflictError(
      `${technician.name} sudah memiliki pesanan ${overlap.code} pada jam yang sama.`,
    );
  }

  const previousStatus = booking.status;
  const nextStatus =
    previousStatus === 'PENDING' || previousStatus === 'CONFIRMED' ? 'ASSIGNED' : previousStatus;
  const note =
    input.note ??
    (previousStatus === 'ASSIGNED'
      ? `Teknisi diganti ke ${technician.name}.`
      : `Dikonfirmasi dan ditugaskan kepada ${technician.name}.`);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { technicianId: technician.id, status: nextStatus },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: id,
        status: nextStatus,
        note,
        changedById: actor.userId,
      },
    });
  });

  const updated = await prisma.booking.findUniqueOrThrow({
    where: { id },
    include: {
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true } },
      variant: { select: { name: true } },
      technician: { select: { name: true } },
    },
  });

  void notifyStatusChange(updated, STATUS_LABELS[nextStatus], note).catch(() => undefined);
  await recordAudit({
    userId: actor.userId,
    action: 'booking.technician.assign',
    entity: 'Booking',
    entityId: id,
    meta: { technicianId: technician.id, technicianName: technician.name },
    ip: actor.ip,
  });

  return getBooking(id);
}

export async function updatePayment(
  id: string,
  input: PaymentUpdateInput,
  actor: { userId?: string; ip?: string },
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');
  if (booking.paymentStatus === input.status) {
    if (input.reference || input.method) {
      const same = await prisma.booking.update({
        where: { id },
        data: {
          ...(input.method ? { paymentMethod: input.method } : {}),
          ...(input.reference ? { paymentRef: input.reference } : {}),
        },
      });
      return getBooking(same.id);
    }
    throw new ConflictError('Status pembayaran tidak berubah.');
  }

  if (input.status === 'REFUNDED' && booking.paymentStatus !== 'PAID') {
    throw new UnprocessableError('Hanya pembayaran yang sudah lunas yang dapat direfund.');
  }
  if (input.status === 'PAID' && booking.status === 'CANCELLED') {
    throw new ConflictError('Pesanan sudah dibatalkan; pembayaran tidak dapat ditandai lunas.');
  }
  if (booking.paymentStatus === 'REFUNDED') {
    throw new ConflictError('Pembayaran yang sudah direfund tidak dapat diubah lagi.');
  }

  const method = input.method ?? booking.paymentMethod;
  if ((input.status === 'PAID' || input.status === 'PENDING') && !method) {
    throw new UnprocessableError('Pilih metode pembayaran terlebih dahulu.');
  }

  const wasPaid = booking.paymentStatus === 'PAID';
  await prisma.booking.update({
    where: { id },
    data: {
      paymentStatus: input.status,
      paymentMethod: method,
      paymentRef: input.reference ?? booking.paymentRef,
      paidAt:
        input.status === 'PAID'
          ? booking.paidAt ?? new Date()
          : input.status === 'UNPAID' || input.status === 'FAILED'
            ? null
            : booking.paidAt,
    },
  });

  await recordAudit({
    userId: actor.userId,
    action: 'booking.payment.update',
    entity: 'Booking',
    entityId: id,
    meta: { from: booking.paymentStatus, to: input.status, method, note: input.note },
    ip: actor.ip,
  });

  if (input.status === 'PAID' && !wasPaid) {
    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
        variant: { select: { name: true } },
        technician: { select: { name: true } },
      },
    });
    void notifyPaymentPaid(updated).catch(() => undefined);
  }

  return getBooking(id);
}

async function withSerializableRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const isWriteConflict =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
      if (!isWriteConflict || attempt === maxAttempts) throw error;
    }
  }
  throw new Error('Unreachable');
}
