import { API_URL, DEMO_MODE } from './api';
import { demoCategories, demoSettings, demoTestimonials } from './demo-data';
import type { Service, ServiceCategory, ServiceVariant, SiteSettings, Testimonial } from './types';

function normalizeVariant(variant: ServiceVariant & { price: number | string }): ServiceVariant {
  return { ...variant, price: Number(variant.price) };
}

function normalizeService(service: Service & { basePrice: number | string }): Service {
  return {
    ...service,
    basePrice: Number(service.basePrice),
    variants: service.variants.map(normalizeVariant),
  };
}

function normalizeCatalogue(categories: ServiceCategory[]): ServiceCategory[] {
  return categories.map((category) => ({
    ...category,
    services: category.services.map(normalizeService),
  }));
}

async function fetchJson<T>(path: string, revalidate = 300): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const body = (await response.json()) as { success: boolean; data: T };
  if (!body.success) throw new Error('API returned an error');
  return body.data;
}

export async function loadCatalogue(): Promise<ServiceCategory[]> {
  if (DEMO_MODE) return normalizeCatalogue(demoCategories);
  try {
    const data = await fetchJson<ServiceCategory[]>('/services');
    return normalizeCatalogue(data);
  } catch {
    return normalizeCatalogue(demoCategories);
  }
}

export async function loadService(slug: string): Promise<Service | null> {
  const catalogue = await loadCatalogue();
  return catalogue.flatMap((category) => category.services).find((service) => service.slug === slug) ?? null;
}

export interface TestimonialFeed {
  items: Testimonial[];
  source: 'api' | 'sample';
}

export async function loadTestimonialFeed(limit = 9): Promise<TestimonialFeed> {
  if (DEMO_MODE) {
    return {
      items: demoTestimonials.filter((item) => item.isPublished).slice(0, limit),
      source: 'sample',
    };
  }
  try {
    const data = await fetchJson<{ items: Testimonial[] }>(`/testimonials?limit=${limit}`);
    return { items: data.items, source: 'api' };
  } catch {
    return {
      items: demoTestimonials.filter((item) => item.isPublished).slice(0, limit),
      source: 'sample',
    };
  }
}

export async function loadTestimonials(limit = 9): Promise<Testimonial[]> {
  return (await loadTestimonialFeed(limit)).items;
}

export async function loadSettings(): Promise<SiteSettings> {
  if (DEMO_MODE) return demoSettings;
  try {
    return await fetchJson<SiteSettings>('/settings/public');
  } catch {
    return demoSettings;
  }
}
