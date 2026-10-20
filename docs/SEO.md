# GCC Web — SEO & Content Guide

The site targets local, high-intent searches such as “servis AC Jakarta
Selatan”, “cuci AC Tebet”, and “perbaikan kulkas Depok”. SEO here is mostly
technical correctness plus useful local content, not keyword stuffing.

## 1. Page inventory

| Route | Purpose | Rendering | Indexed |
| --- | --- | --- | --- |
| `/` | conversion landing page | ISR 300 s | yes |
| `/layanan` | full catalogue with starting prices | ISR 300 s | yes |
| `/layanan/[slug]` | service detail, variants, process, FAQ | ISR 300 s + generated params | yes |
| `/booking` | Quick Booking flow | dynamic | yes |
| `/lacak` | order tracking | static shell + client | yes |
| `/area` | list of service areas | ISR 300 s | yes |
| `/area/[city]` | city-specific service copy | ISR 300 s | yes |
| `/kontak` | contact, hours, WhatsApp form | ISR 300 s | yes |
| `/privasi` | privacy policy | static | yes |
| `/admin/**` | operator panel | client | no |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | metadata routes | generated | — |

## 2. Metadata

Every public page exports a `metadata` object with:

- a unique `title` (page title + `· GCC Web` via the root template);
- a 140–160 character `description` written as a customer benefit;
- `alternates.canonical` pointing at the production URL;
- an Open Graph title, description, and URL;
- for service pages, a price in the title (“Cuci AC — mulai Rp75.000”).

The root layout sets `metadataBase` to `NEXT_PUBLIC_SITE_URL`, so relative
canonical paths resolve correctly. Production must set:

```
NEXT_PUBLIC_SITE_URL=https://gcc-web.id
```

If the canonical URL is left at localhost, search engines will index the wrong
host.

The root metadata intentionally does **not** set `robots: noindex`; the admin
layout does, and `robots.txt` disallows `/admin` and `/api`.

## 3. Structured data

| Schema | Where | Contents |
| --- | --- | --- |
| `HVACBusiness` | root layout | name, address, phone, email, opening hours, area served, service catalogue, slogan |
| `BreadcrumbList` | list/detail pages | Home → section → item |
| `Service` + `AggregateOffer` | service detail | service name, description, provider, cities, low/high price, offer count |
| `FAQPage` | home and service detail | the FAQ questions rendered on the page |
| `ItemList` | home | featured services with offers |

Rules:

- JSON-LD must describe content visible on the page. Do not add reviews or
  ratings that are not rendered.
- `AggregateOffer.priceCurrency` is `IDR`, values are integers in rupiah.
- The business `@id` is `${SITE_URL}/#business`; service/provider references
  point back to it.
- Replace the placeholder postal code (`12130`), address, phone, and email in
  `apps/web/lib/site.ts` and in the admin settings before launch.

## 4. Sitemap and robots

- `app/sitemap.ts` includes static routes, all service slugs, and all service
  area slugs, each with `lastModified`, `changeFrequency`, and `priority`.
- `app/robots.ts` allows the public site, disallows `/admin` and `/api`, and
  advertises the sitemap and host.
- The sitemap is generated at build/request time and calls `loadCatalogue()`, so
  services created through the admin API appear automatically. If the API is
  unavailable, it falls back to the demo catalogue just like the public pages.

Submit `https://gcc-web.id/sitemap.xml` in Google Search Console and Bing
Webmaster Tools after the domain is live.

## 5. Local SEO

Five area pages are fully written: Jakarta Selatan, Jakarta Pusat, Jakarta
Barat, Depok, and Tangerang Selatan. Each has:

- a city-specific intro about housing, AC usage, and access constraints;
- a list of neighbourhoods;
- practical notes for apartments, offices, clusters, and parking;
- links to relevant services and the booking flow.

To extend coverage:

1. Add a new entry to `SERVICE_AREAS` with a unique slug, city, intro,
   neighbourhoods, and note.
2. Add the area to `business.serviceAreas` in admin settings so contact and
   footer copy agree.
3. Keep each page genuinely different. Duplicating the same paragraph with a
   swapped city name creates thin pages and can hurt the whole domain.
4. Only target cities actually served. Add “layanan di luar area” copy for the
   rest.

### Google Business Profile

- Use the same business name, phone, and address as the site.
- Category: HVAC contractor / home services; add secondary categories for
  appliance repair.
- Service area: the five cities above, not the whole province.
- Add real photos of technicians, vehicles, and work (with permission).
- Ask completed customers for a review; link to the Google profile from the
  WhatsApp receipt message later.

Do not publish fake addresses or virtual offices; suspended profiles are hard
to recover.

## 6. On-page content rules

- One `<h1>` per page. The homepage H1 is a short promise; service pages use
  the service name plus a price in the title.
- Section headings are `<h2>`; card titles are `<h3>`.
- Every service page includes: overview, variants with prices, what is
  included, process, warranty, FAQ, related services, and a booking action.
- Prices on the public site are starting prices and are labelled as such when
  the final cost depends on inspection.
- Avoid promising exact arrival times. Give a two-hour window and say the
  admin confirms technician availability.
- Write in Indonesian, with “Anda” consistent across pages.
- Alt text describes the action or object (“Teknisi mencuci evaporator AC
  indoor”), not a keyword list.

## 7. Images and performance

- `next/image` is used on the homepage. Images must exist in `apps/web/public/`
  with the exact filenames referenced by the page; a missing file is a broken
  image, not an empty slot.
- Preferred assets: real photographs of AC cleaning, an outdoor unit, a
  manifold gauge, and a Jakarta residential street, licensed for commercial
  use and credited in the footer.
- Serve AVIF/WebP via Next.js; keep hero images under ~250 KB and other images
  under ~150 KB.
- Always set `width`/`height` or `fill` with a sized parent to avoid layout
  shift.
- Fonts are self-hosted through `next/font` (Plus Jakarta Sans) with
  `display: swap`.
- Public pages are statically rendered and revalidated every 300 seconds. The
  booking page is dynamic; keep its client bundle lean.

Targets: LCP < 2.5 s on a mid-range Android phone over 4G, CLS < 0.1, INP <
200 ms. The editorial design uses large type and images; test with the
Lighthouse mobile preset rather than desktop.

## 8. Accessibility and semantic HTML

Accessibility contributes to quality signals and is a legal expectation in
many markets.

- Skip link to `#konten`; one `<main>` per page.
- Header, nav, main, footer landmarks.
- Visible focus rings on every interactive element.
- Form labels are always associated with inputs; errors use `role="alert"`.
- Status changes use `role="status"`.
- Colour contrast: ink on bone and bone on ink pass AA; teal on bone is used
  for large text and buttons, not small body copy.
- Motion respects `prefers-reduced-motion`.
- Decorative SVGs are `aria-hidden`; meaningful icons have a label.

## 9. Tracking and consent

No analytics or advertising pixels are installed. If you add them:

1. Add a consent banner that blocks non-essential scripts until accepted.
2. Document cookies in `/privasi`.
3. Prefer a privacy-friendly analytics tool (Plausible, Umami) over a full ad
   pixel.
4. Track the funnel as: service view → booking form started → booking created
   → tracking page opened → review submitted. Do not send names, phone
   numbers, or addresses to analytics.

## 10. Launch checklist

- [ ] `NEXT_PUBLIC_SITE_URL` is the real HTTPS domain.
- [ ] Business name, address, phone, WhatsApp, email, hours, and bank account
      are real (not the `0000000000` seed placeholder).
- [ ] All public prices match the catalogue managed in admin.
- [ ] All five area pages are accurate and only list served neighbourhoods.
- [ ] Real images exist and have licences/credits.
- [ ] Testimonials are real, published, and have customer permission.
- [ ] `robots.txt` disallows `/admin`; admin returns `noindex`.
- [ ] Sitemap contains every public URL and no admin URL.
- [ ] Canonical URLs resolve to `https://gcc-web.id`, not localhost.
- [ ] Google Search Console and Bing Webmaster Tools verified.
- [ ] Google Business Profile created with matching NAP (name, address, phone).
- [ ] Structured data passes the Rich Results Test.
- [ ] Lighthouse mobile: performance, accessibility, best practices, SEO all
      ≥ 90.
- [ ] 404 page returns HTTP 404 and offers links back.
- [ ] Privacy policy describes WhatsApp, payment, and data retention.
