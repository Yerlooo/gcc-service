import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { normalizePhone } from '../../lib/codes';
import { jakartaDayRange } from '../../lib/slots';
import type { technicianCreateSchema, technicianUpdateSchema } from './technicians.schema';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  technician: true,
} as const;

export async function listPublicTechnicians() {
  return prisma.user.findMany({
    where: { role: 'TECHNICIAN', isActive: true, technician: { isNot: null } },
    select: {
      name: true,
      technician: { select: { zone: true, specialties: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function listTechnicians(dateISO?: string) {
  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: userSelect,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });

  const workloads = new Map<string, number>();
  if (dateISO) {
    const { start, end } = jakartaDayRange(dateISO);
    const grouped = await prisma.booking.groupBy({
      by: ['technicianId'],
      where: {
        technicianId: { not: null },
        scheduledAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      _count: { _all: true },
    });
    for (const row of grouped) {
      if (row.technicianId) workloads.set(row.technicianId, row._count._all);
    }
  }

  return technicians.map((technician) => {
    const workload = dateISO ? workloads.get(technician.id) ?? 0 : null;
    const capacity = technician.technician?.capacityPerDay ?? 0;
    return {
      ...technician,
      workload,
      remaining: workload === null ? null : Math.max(0, capacity - workload),
    };
  });
}

export async function createTechnician(input: z.infer<typeof technicianCreateSchema>) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone ? normalizeOptionalPhone(input.phone) : null,
      passwordHash,
      role: 'TECHNICIAN',
      technician: {
        create: {
          zone: input.zone,
          specialties: input.specialties,
          capacityPerDay: input.capacityPerDay,
          isAvailable: input.isAvailable,
          notes: input.notes,
        },
      },
    },
    select: userSelect,
  });
  return user;
}

export async function updateTechnician(
  id: string,
  input: z.infer<typeof technicianUpdateSchema>,
) {
  const existing = await prisma.user.findFirst({
    where: { id, role: 'TECHNICIAN' },
    include: { technician: true },
  });
  if (!existing) throw new NotFoundError('Teknisi tidak ditemukan.');

  const { password, zone, specialties, capacityPerDay, isAvailable, notes } = input;

  const userData: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) userData.name = input.name;
  if (input.email !== undefined) userData.email = input.email.toLowerCase();
  if (input.phone !== undefined) {
    userData.phone = input.phone ? normalizeOptionalPhone(input.phone) : null;
  }
  if (input.isActive !== undefined) userData.isActive = input.isActive;
  if (password) userData.passwordHash = await bcrypt.hash(password, 12);

  const profileUpdate: Prisma.TechnicianProfileUpdateWithoutUserInput = {};
  if (zone !== undefined) profileUpdate.zone = zone;
  if (specialties !== undefined) profileUpdate.specialties = specialties;
  if (capacityPerDay !== undefined) profileUpdate.capacityPerDay = capacityPerDay;
  if (isAvailable !== undefined) profileUpdate.isAvailable = isAvailable;
  if (notes !== undefined) profileUpdate.notes = notes;

  if (Object.keys(profileUpdate).length > 0) {
    userData.technician = {
      upsert: {
        create: {
          zone: zone ?? 'Belum ditentukan',
          specialties: specialties ?? [],
          capacityPerDay: capacityPerDay ?? 4,
          isAvailable: isAvailable ?? true,
          notes,
        },
        update: profileUpdate,
      },
    };
  }

  const result = await prisma.user.update({
    where: { id },
    data: userData,
    select: userSelect,
  });

  if (password) {
    await prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return result;
}

export async function deactivateTechnician(id: string) {
  const existing = await prisma.user.findFirst({
    where: { id, role: 'TECHNICIAN' },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Teknisi tidak ditemukan.');

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { isActive: false } }),
    prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { id, isActive: false };
}

function normalizeOptionalPhone(value: string): string {
  // validate() has checked the format; store the same canonical 62… form the
  // booking flow uses so lookups and WhatsApp delivery agree.
  return normalizePhone(value);
}
