export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const UNIT_RE = /^(\d+)\s*(ms|s|m|h|d|w)$/;

/** Parse the compact TTL syntax used by the JWT env vars ("15m", "7d"). */
export function durationToMs(value: string, fallbackMs: number): number {
  const match = UNIT_RE.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return amount * multipliers[match[2]];
}
