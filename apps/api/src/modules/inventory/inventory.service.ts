import type { InventoryItem, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import type { z } from 'zod';
import type {
  inventoryItemCreateSchema,
  inventoryItemUpdateSchema,
  stockMovementSchema,
} from './inventory.schema';

function withMoney<T extends { costPrice: Prisma.Decimal }>(item: T) {
  return { ...item, costPrice: Number(item.costPrice) };
}

export async function listItems(filters: { q?: string; category?: string; lowStock?: boolean }) {
  const where: Prisma.InventoryItemWhereInput = {};
  if (filters.category) where.category = filters.category;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { sku: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });

  const shaped = items.map((item) => ({
    ...withMoney(item),
    isLowStock: item.quantity <= item.minQuantity,
  }));

  return filters.lowStock ? shaped.filter((item) => item.isLowStock) : shaped;
}

export async function listCategories() {
  const rows = await prisma.inventoryItem.findMany({
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });
  return rows.map((row) => row.category);
}

export async function createItem(input: z.infer<typeof inventoryItemCreateSchema>) {
  const item = await prisma.inventoryItem.create({ data: input });
  return withMoney(item);
}

export async function updateItem(
  id: string,
  input: z.infer<typeof inventoryItemUpdateSchema>,
) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Barang tidak ditemukan.');
  const item = await prisma.inventoryItem.update({ where: { id }, data: input });
  return { ...withMoney(item), isLowStock: item.quantity <= item.minQuantity };
}

export async function deactivateItem(id: string) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Barang tidak ditemukan.');
  const item = await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
  return withMoney(item);
}

export async function recordMovement(
  itemId: string,
  input: z.infer<typeof stockMovementSchema>,
  actor: { userId?: string },
) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Barang tidak ditemukan.');

  if (input.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true },
    });
    if (!booking) throw new NotFoundError('Pesanan tidak ditemukan.');
  }

  // Movement rows store a signed delta: IN positive, OUT negative, ADJUSTMENT the difference.
  const delta =
    input.type === 'IN'
      ? input.quantity
      : input.type === 'OUT'
        ? -input.quantity
        : input.quantity - item.quantity;

  if (input.type === 'ADJUSTMENT' && delta === 0) {
    throw new BadRequestError('Jumlah stok fisik sama dengan catatan saat ini.');
  }

  // Stock is mutated atomically inside one transaction. An OUT uses a
  // conditional decrement so two concurrent movements cannot drive stock
  // negative or overwrite each other's result.
  const { movement, updated } = await prisma.$transaction(async (tx) => {
    let changed: InventoryItem;

    if (input.type === 'OUT') {
      const result = await tx.inventoryItem.updateMany({
        where: { id: itemId, quantity: { gte: input.quantity } },
        data: { quantity: { decrement: input.quantity } },
      });
      if (result.count === 0) {
        throw new BadRequestError(
          `Stok ${item.name} tidak mencukupi. Tersedia ${item.quantity} ${item.unit}.`,
        );
      }
      changed = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
    } else if (input.type === 'IN') {
      changed = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: { increment: input.quantity } },
      });
    } else {
      // A stocktake is an absolute count; the last physical count wins.
      changed = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: input.quantity },
      });
    }

    const created = await tx.stockMovement.create({
      data: {
        itemId,
        type: input.type,
        quantity: delta,
        note: input.note,
        bookingId: input.bookingId,
        createdById: actor.userId,
      },
      include: {
        item: { select: { name: true, sku: true, unit: true } },
        createdBy: { select: { name: true } },
        booking: { select: { code: true } },
      },
    });

    return { movement: created, updated: changed };
  });

  return {
    movement,
    item: {
      ...withMoney(updated),
      isLowStock: updated.quantity <= updated.minQuantity,
    },
  };
}

export async function listMovements(itemId: string, limit = 30) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Barang tidak ditemukan.');

  return prisma.stockMovement.findMany({
    where: { itemId },
    include: {
      createdBy: { select: { name: true } },
      booking: { select: { code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
