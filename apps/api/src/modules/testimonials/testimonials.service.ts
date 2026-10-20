import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError, UnprocessableError } from '../../lib/errors';
import { normalizePhone } from '../../lib/codes';
import type { z } from 'zod';
import type {
  testimonialCreateSchema,
  testimonialSubmitSchema,
  testimonialUpdateSchema,
} from './testimonials.schema';

const publicSelect = {
  id: true,
  customerName: true,
  customerMeta: true,
  rating: true,
  content: true,
  createdAt: true,
  service: { select: { name: true, slug: true } },
} as const;

export async function listPublished(featuredOnly = false, limit = 9) {
  const where = { isPublished: true, ...(featuredOnly ? { isFeatured: true } : {}) };
  const [items, aggregate] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      select: publicSelect,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    }),
    prisma.testimonial.aggregate({
      where: { isPublished: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    items,
    average: Number((aggregate._avg.rating ?? 0).toFixed(1)),
    total: aggregate._count._all,
  };
}

export async function submitTestimonial(input: z.infer<typeof testimonialSubmitSchema>) {
  const booking = await prisma.booking.findUnique({
    where: { code: input.code.trim().toUpperCase() },
    include: { customer: true, service: true, testimonial: true },
  });
  if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');
  if (normalizePhone(input.phone) !== booking.customer.phone) {
    throw new NotFoundError('Pesanan tidak ditemukan. Periksa kembali kode dan nomor Anda.');
  }
  if (booking.status !== 'COMPLETED') {
    throw new UnprocessableError('Testimoni dapat dikirim setelah pekerjaan selesai.');
  }
  if (booking.testimonial) {
    throw new ConflictError('Testimoni untuk pesanan ini sudah dikirim.');
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      bookingId: booking.id,
      serviceId: booking.serviceId,
      customerName: booking.customer.name,
      customerMeta: `${booking.city} · ${booking.service.name}`,
      rating: input.rating,
      content: input.content,
      isPublished: false,
    },
    select: { id: true, rating: true, createdAt: true },
  });

  return {
    ...testimonial,
    message: 'Terima kasih. Testimoni Anda akan tampil setelah ditinjau admin.',
  };
}

export async function listAdmin() {
  return prisma.testimonial.findMany({
    include: {
      service: { select: { id: true, name: true, slug: true } },
      booking: { select: { id: true, code: true, status: true } },
    },
    orderBy: [{ isPublished: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createTestimonial(input: z.infer<typeof testimonialCreateSchema>) {
  if (input.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
    if (!service) throw new NotFoundError('Layanan tidak ditemukan.');
  }
  if (input.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');
  }
  return prisma.testimonial.create({ data: input });
}

export async function updateTestimonial(
  id: string,
  input: z.infer<typeof testimonialUpdateSchema>,
) {
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Testimoni tidak ditemukan.');
  return prisma.testimonial.update({ where: { id }, data: input });
}

export async function deleteTestimonial(id: string) {
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Testimoni tidak ditemukan.');
  await prisma.testimonial.delete({ where: { id } });
  return { id };
}
