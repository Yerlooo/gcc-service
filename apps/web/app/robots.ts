import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gcc-web.id'}/sitemap.xml`,
    host: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gcc-web.id',
  };
}
