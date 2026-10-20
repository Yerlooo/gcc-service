import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { slugify } from '../../lib/utils';
import type {
  ServiceCreateInput,
  ServiceUpdateInput,
  VariantInput,
} from './services.schema';

const variantSelect = {
  id: true,
  name: true,
  price: true,
  durationMinutes: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.ServiceVariantSelect;

const publicServiceSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  basePrice: true,
  unit: true,
  durationMinutes: true,
  warrantyDays: true,
  isFeatured: true,
  sortOrder: true,
  variants: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: variantSelect,
  },
} satisfies Prisma.ServiceSelect;

export async function getPublicCatalogue(filters: { category?: string; featured?: boolean } = {}) {
  const categories = await prisma.serviceCategory.findMany({
    where: {
      isActive: true,
      ...(filters.category ? { slug: filters.category } : {}),
      services: { some: { isActive: true } },
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      services: {
        where: { isActive: true, ...(filters.featured ? { isFeatured: true } : {}) },
        orderBy: { sortOrder: 'asc' },
        select: publicServiceSelect,
      },
    },
  });

  return categories;
}

export async function getPublicServiceBySlug(slug: string) {
  const service = await prisma.service.findFirst({
    where: { slug, isActive: true },
    select: {
      ...publicServiceSelect,
      category: { select: { slug: true, name: true } },
    },
  });
  if (!service) throw new NotFoundError('Layanan tidak ditemukan.');
  return service;
}

export async function listAdminServices() {
  return prisma.service.findMany({
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { bookings: true } },
    },
  });
}

export async function listAdminCategories() {
  return prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { services: true } } },
  });
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const base = input.slug ?? slugify(input.name);
  const slug = await uniqueCategorySlug(base);
  return prisma.serviceCategory.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  await assertCategoryExists(id);
  return prisma.serviceCategory.update({
    where: { id },
    data: {
      ...input,
      ...(input.slug ? { slug: await uniqueCategorySlug(input.slug, id) } : {}),
    },
  });
}

export async function createService(input: ServiceCreateInput) {
  await assertCategoryExists(input.categoryId);
  const base = input.slug ?? slugify(input.name);
  const slug = await uniqueServiceSlug(base);
  const { variants, ...rest } = input;

  return prisma.service.create({
    data: {
      ...rest,
      slug,
      variants: variants?.length
        ? {
            create: variants.map((variant, index) => ({
              name: variant.name,
              price: variant.price,
              durationMinutes: variant.durationMinutes ?? input.durationMinutes ?? 60,
              sortOrder: variant.sortOrder ?? index,
              isActive: variant.isActive ?? true,
            })),
          }
        : undefined,
    },
    include: { category: true, variants: true },
  });
}

export async function updateService(id: string, input: ServiceUpdateInput) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Layanan tidak ditemukan.');
  if (input.categoryId) await assertCategoryExists(input.categoryId);

  return prisma.service.update({
    where: { id },
    data: {
      ...input,
      ...(input.slug
        ? { slug: await uniqueServiceSlug(input.slug, id) }
        : {}),
    },
    include: { category: true, variants: true },
  });
}

export async function deactivateService(id: string) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Layanan tidak ditemukan.');
  return prisma.service.update({ where: { id }, data: { isActive: false } });
}

export async function createVariant(serviceId: string, input: VariantInput) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new NotFoundError('Layanan tidak ditemukan.');

  return prisma.serviceVariant.create({
    data: {
      serviceId,
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes ?? service.durationMinutes,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateVariant(
  serviceId: string,
  variantId: string,
  input: Partial<VariantInput>,
) {
  const variant = await prisma.serviceVariant.findFirst({
    where: { id: variantId, serviceId },
  });
  if (!variant) throw new NotFoundError('Varian layanan tidak ditemukan.');

  return prisma.serviceVariant.update({ where: { id: variantId }, data: input });
}

export async function deactivateVariant(serviceId: string, variantId: string) {
  const variant = await prisma.serviceVariant.findFirst({
    where: { id: variantId, serviceId },
  });
  if (!variant) throw new NotFoundError('Varian layanan tidak ditemukan.');
  return prisma.serviceVariant.update({ where: { id: variantId }, data: { isActive: false } });
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new NotFoundError('Kategori tidak ditemukan.');
}

async function uniqueCategorySlug(base: string, ignoreId?: string): Promise<string> {
  let candidate = base;
  let counter = 2;
  while (
    await prisma.serviceCategory.findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function uniqueServiceSlug(base: string, ignoreId?: string): Promise<string> {
  let candidate = base;
  let counter = 2;
  while (
    await prisma.service.findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}
