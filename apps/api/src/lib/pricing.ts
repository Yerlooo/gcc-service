import { Prisma } from '@prisma/client';

const rupiah = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);

export interface PriceInput {
  unitPrice: number | string | Prisma.Decimal;
  unitCount: number;
  addOnTotal?: number | string | Prisma.Decimal;
  discount?: number | string | Prisma.Decimal;
}

/**
 * Prices are computed on the server from the catalogue, never trusted from the
 * browser. Quantities are integers and every figure is rounded to whole rupiah.
 */
export function calculateBookingTotal(input: PriceInput) {
  const unitCount = Math.max(1, Math.floor(input.unitCount));
  const base = rupiah(input.unitPrice).times(unitCount);
  const addOn = rupiah(input.addOnTotal ?? 0);
  const discount = rupiah(input.discount ?? 0);
  const total = base.plus(addOn).minus(discount);

  if (total.isNegative()) {
    throw new Error('Total pesanan tidak boleh negatif.');
  }

  return {
    unitCount,
    basePrice: base.toDecimalPlaces(2),
    addOnTotal: addOn.toDecimalPlaces(2),
    discount: discount.toDecimalPlaces(2),
    total: total.toDecimalPlaces(2),
  };
}

export const formatRupiah = (value: number | string | Prisma.Decimal): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
