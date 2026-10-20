import type { Service } from './types';

export function startingPrice(service: Service): number {
  const prices = [service.basePrice, ...service.variants.map((variant) => variant.price)];
  return Math.min(...prices);
}

export function longestDuration(service: Service): number {
  return Math.max(
    service.durationMinutes,
    ...service.variants.map((variant) => variant.durationMinutes),
  );
}
