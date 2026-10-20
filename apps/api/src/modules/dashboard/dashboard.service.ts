import type { BookingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import {
  jakartaDateISO,
  jakartaDayRange,
  lastNDates,
  slotLabel,
  todayISO,
} from '../../lib/slots';
import { STATUS_LABELS } from '../../lib/status';

const ACTIVE_STATUSES: BookingStatus[] = ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS'];

export async function getDashboard(range: '7d' | '30d' = '7d') {
  const today = todayISO();
  const todayRange = jakartaDayRange(today);
  const monthStart = jakartaDayRange(`${today.slice(0, 7)}-01`).start;
  const days = range === '30d' ? 30 : 7;
  const dates = lastNDates(days);
  const trendStart = jakartaDayRange(dates[0]).start;

  const [
    bookingsToday,
    pendingConfirmations,
    activeJobs,
    completedThisMonth,
    revenueThisMonth,
    todaySchedule,
    recentBookings,
    statusGroups,
    trendRows,
    inventory,
    pendingTestimonials,
    latestTestimonials,
    technicians,
  ] = await Promise.all([
    prisma.booking.count({
      where: { scheduledAt: { gte: todayRange.start, lte: todayRange.end }, status: { not: 'CANCELLED' } },
    }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.booking.count({
      where: { status: 'COMPLETED', completedAt: { gte: monthStart } },
    }),
    prisma.booking.aggregate({
      where: { paymentStatus: 'PAID', paidAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.booking.findMany({
      where: {
        scheduledAt: { gte: todayRange.start, lte: todayRange.end },
        status: { not: 'CANCELLED' },
      },
      include: {
        customer: { select: { name: true, phone: true, district: true } },
        service: { select: { name: true } },
        variant: { select: { name: true } },
        technician: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        service: { select: { name: true } },
        technician: { select: { name: true } },
      },
    }),
    prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.booking.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true, paidAt: true, total: true, paymentStatus: true },
    }),
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: { quantity: 'asc' },
    }),
    prisma.testimonial.count({ where: { isPublished: false } }),
    prisma.testimonial.findMany({
      where: { isPublished: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        customerName: true,
        rating: true,
        content: true,
        createdAt: true,
        service: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'TECHNICIAN', isActive: true },
      select: {
        id: true,
        name: true,
        technician: { select: { capacityPerDay: true, isAvailable: true, zone: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const byDay = new Map(
    dates.map((date) => [date, { date, bookings: 0, revenue: 0 }]),
  );
  for (const row of trendRows) {
    const createdDay = byDay.get(jakartaDateISO(row.createdAt));
    if (createdDay) createdDay.bookings += 1;

    if (row.paymentStatus === 'PAID' && row.paidAt) {
      const paidDay = byDay.get(jakartaDateISO(row.paidAt));
      if (paidDay) paidDay.revenue += Number(row.total);
    }
  }

  const technicianIds = technicians.map((tech) => tech.id);
  const workloadRows = technicianIds.length
    ? await prisma.booking.groupBy({
        by: ['technicianId'],
        where: {
          technicianId: { in: technicianIds },
          scheduledAt: { gte: todayRange.start, lte: todayRange.end },
          status: { not: 'CANCELLED' },
        },
        _count: { _all: true },
      })
    : [];
  const workload = new Map<string, number>();
  for (const row of workloadRows) {
    if (row.technicianId) workload.set(row.technicianId, row._count._all);
  }

  const lowStock = inventory
    .filter((item) => item.quantity <= item.minQuantity)
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
    }));

  return {
    generatedAt: new Date(),
    range,
    kpis: {
      bookingsToday,
      pendingConfirmations,
      activeJobs,
      completedThisMonth,
      revenueThisMonth: Number(revenueThisMonth._sum.total ?? 0),
      slotCapacity: env.SLOT_CAPACITY,
    },
    todaySchedule: todaySchedule.map((booking) => ({
      id: booking.id,
      code: booking.code,
      status: booking.status,
      statusLabel: STATUS_LABELS[booking.status],
      paymentStatus: booking.paymentStatus,
      slot: slotLabel(booking.slotLabel),
      scheduledAt: booking.scheduledAt,
      customer: booking.customer,
      service: booking.service.name,
      variant: booking.variant?.name ?? null,
      technician: booking.technician?.name ?? null,
      total: Number(booking.total),
    })),
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      code: booking.code,
      status: booking.status,
      statusLabel: STATUS_LABELS[booking.status],
      paymentStatus: booking.paymentStatus,
      customer: booking.customer.name,
      service: booking.service.name,
      technician: booking.technician?.name ?? null,
      total: Number(booking.total),
      createdAt: booking.createdAt,
    })),
    statusBreakdown: statusGroups.map((row) => ({
      status: row.status,
      label: STATUS_LABELS[row.status],
      count: row._count._all,
    })),
    trend: dates.map((date) => byDay.get(date)!),
    lowStock,
    pendingTestimonials,
    latestTestimonials,
    technicians: technicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      zone: tech.technician?.zone ?? '—',
      isAvailable: tech.technician?.isAvailable ?? false,
      workload: workload.get(tech.id) ?? 0,
      capacity: tech.technician?.capacityPerDay ?? 0,
    })),
  };
}
