import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { DEFAULT_SETTINGS, type SettingsKey, type SettingsUpdateInput } from './settings.schema';

const KEYS: SettingsKey[] = ['business', 'payment'];

type SettingsShape = {
  business: typeof DEFAULT_SETTINGS.business;
  payment: typeof DEFAULT_SETTINGS.payment;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function getSettings(): Promise<SettingsShape> {
  const rows = await prisma.setting.findMany({ where: { key: { in: KEYS } } });
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const storedBusiness = stored.get('business');
  const storedPayment = stored.get('payment');

  return {
    business: {
      ...DEFAULT_SETTINGS.business,
      ...(isPlainObject(storedBusiness) ? storedBusiness : {}),
    },
    payment: {
      ...DEFAULT_SETTINGS.payment,
      ...(isPlainObject(storedPayment) ? storedPayment : {}),
    },
  } as SettingsShape;
}

export async function getPublicSettings() {
  const settings = await getSettings();
  return {
    business: settings.business,
    payment: settings.payment,
  };
}

export async function updateSettings(
  input: SettingsUpdateInput,
  actor: { userId?: string; ip?: string },
) {
  const current = await getSettings();
  const next: Partial<SettingsShape> = {};

  if (input.business) {
    next.business = { ...current.business, ...input.business };
  }
  if (input.payment) {
    next.payment = { ...current.payment, ...input.payment };
  }

  await prisma.$transaction(
    (Object.entries(next) as Array<[SettingsKey, SettingsShape[SettingsKey]]>).map(
      ([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: value as unknown as Prisma.InputJsonValue },
          update: { value: value as unknown as Prisma.InputJsonValue },
        }),
    ),
  );

  await recordAudit({
    userId: actor.userId,
    action: 'settings.update',
    entity: 'Setting',
    meta: { keys: Object.keys(next) } as Prisma.InputJsonValue,
    ip: actor.ip,
  });

  return getSettings();
}
