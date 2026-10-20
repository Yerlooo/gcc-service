# GCC Web — Deployment Guide

Two processes and one database:

| Process | Default port | Start command |
| --- | --- | --- |
| Next.js web | 3000 | `npm --workspace @gcc/web run start` |
| Express API | 4000 | `npm --workspace @gcc/api run start` |
| PostgreSQL | 5432 | managed by the OS |

In production, put both behind one Nginx host so the browser talks to a single
origin (`https://gcc-web.id` for pages, `/api` for the API). That avoids
cross-site cookies and CORS complexity.

## 1. Local setup (Laragon or plain PostgreSQL)

Requirements:

- Node.js **20 or newer** (22 LTS recommended)
- npm 10+
- PostgreSQL **15+**
- Git (optional for local work)

### 1.1 Install dependencies

From the repository root:

```bash
npm install
```

This installs both workspaces. Do not run `npm install` inside `apps/web` and
`apps/api` separately; use the root so versions stay consistent.

### 1.2 Create the databases

Using Laragon: start PostgreSQL, open a terminal, then:

```bash
createdb -U postgres gcc_web
```

Or with `psql`:

```sql
CREATE DATABASE gcc_web;
```

The default connection string expects user `postgres`, password `postgres`,
port `5432`. Change it if your local install differs.

### 1.3 Environment files

API — copy the API template:

```bash
cp apps/api/.env.example apps/api/.env
```

Generate real secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the first value in `JWT_ACCESS_SECRET`, the second in
`JWT_REFRESH_SECRET`.

Web — create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
NEXT_PUBLIC_DEMO_MODE=0
```

Set `NEXT_PUBLIC_DEMO_MODE=1` only for a design review without a database or
API. In demo mode the admin accepts fixed credentials and changes are local to
the browser session.

Never commit `.env`, `.env.local`, or any real token. Only `.env.example` is
tracked. If a secret was ever committed, rotate it; deleting the file is not
enough.

### 1.4 Prisma client and schema

```bash
npm run db:generate
npm run db:migrate
```

`db:migrate` runs `prisma migrate dev` and creates the first migration from
`apps/api/prisma/schema.prisma` if none exists. Name it when prompted (for
example `init`). Commit the generated `apps/api/prisma/migrations/` directory.

Alternative, for a fresh database without Prisma migrations:

```bash
psql -U postgres -d gcc_web -f database/schema.sql
```

The SQL file mirrors the Prisma schema but does not create `_prisma_migrations`;
do not mix both approaches on the same database.

### 1.5 Seed

Preferred (TypeScript seed, same data as development):

```bash
npm run db:seed
```

Or SQL seed (requires `pgcrypto`):

```bash
psql -U postgres -d gcc_web -f database/seed.sql
```

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@gcc-web.id` | `Admin#12345` |
| Technician | `budi@gcc-web.id` | `Teknisi#12345` |
| Technician | `rizky@gcc-web.id` | `Teknisi#12345` |
| Technician | `dedi@gcc-web.id` | `Teknisi#12345` |
| Technician | `agus@gcc-web.id` | `Teknisi#12345` |

Change the admin password before any public deployment. The SQL seed creates
bcrypt-compatible hashes through `crypt(..., gen_salt('bf', 12))`.

### 1.6 Run

```bash
npm run dev
```

| URL | Purpose |
| --- | --- |
| `http://localhost:3000` | public site |
| `http://localhost:3000/booking` | booking flow |
| `http://localhost:3000/lacak` | tracking |
| `http://localhost:3000/admin/login` | admin login |
| `http://localhost:4000/api/health` | API + database health |

Quick checks:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/services
curl "http://localhost:4000/api/bookings/availability?date=$(date +%F)"
```

If the public site shows sample content while the API is down, that is the
intentional fallback in `lib/content.ts`, not a database connection.

### 1.7 Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | web + API with concurrently |
| `npm run build` | compile API, build web |
| `npm run lint` | Next.js lint |
| `npm run db:generate` | regenerate Prisma client |
| `npm run db:migrate` | create/apply a development migration |
| `npm run db:seed` | run the TypeScript seed |
| `npm run db:studio` | Prisma Studio |

There is no automated test suite yet. Run type checks manually:

```bash
npm --workspace @gcc/api run typecheck
npm --workspace @gcc/web run typecheck
```

## 2. Production architecture

Recommended small deployment:

```
Internet
   │ 443
   ▼
Nginx  ── /api/* ──► 127.0.0.1:4000  (Express)
   └────── /* ─────► 127.0.0.1:3000  (Next.js)
                             │
                             ▼
                     PostgreSQL 15+
```

Why one origin:

- `NEXT_PUBLIC_API_URL=https://gcc-web.id/api` is first-party, so cookies work
  without `SameSite=None`.
- No CORS preflight in production.
- One TLS certificate, one cache policy, simpler CSP later.

If the API must live on `api.gcc-web.id`, then:

- `WEB_ORIGIN=https://gcc-web.id`
- `NEXT_PUBLIC_API_URL=https://api.gcc-web.id/api`
- set `COOKIE_DOMAIN=.gcc-web.id`
- production cookies become `SameSite=None; Secure`, so HTTPS is mandatory.

## 3. Server preparation (Ubuntu 22.04/24.04)

```bash
sudo apt update
sudo apt install -y postgresql nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Create a deployment user and directory:

```bash
sudo adduser --disabled-password --gecos "" gcc
sudo mkdir -p /srv/gcc-web
sudo chown -R gcc:gcc /srv/gcc-web
```

Clone the repository into `/srv/gcc-web` and run `npm ci` as the `gcc` user.

### 3.1 Production environment

`apps/api/.env`:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://gcc_user:STRONG_PASSWORD@127.0.0.1:5432/gcc_web?schema=public"
WEB_ORIGIN=https://gcc-web.id
JWT_ACCESS_SECRET="<64 hex chars>"
JWT_REFRESH_SECRET="<different 64 hex chars>"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
SLOT_CAPACITY=3
WHATSAPP_PROVIDER=fonnte
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_TOKEN="<provider token>"
ADMIN_WHATSAPP=6281234567890
MIDTRANS_SERVER_KEY="<server key>"
MIDTRANS_CLIENT_KEY="<client key>"
MIDTRANS_IS_PRODUCTION=true
```

`apps/web/.env.production` (or the deployment environment, set **before**
building because `NEXT_PUBLIC_*` is inlined):

```env
NEXT_PUBLIC_API_URL=https://gcc-web.id/api
NEXT_PUBLIC_SITE_URL=https://gcc-web.id
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
NEXT_PUBLIC_DEMO_MODE=0
```

Restrict permissions:

```bash
chmod 600 apps/api/.env apps/web/.env.production
```

The API refuses to boot in production if a JWT secret contains `dev-` or
`change-me`.

### 3.2 Build and migrate

```bash
npm ci
npm run db:generate
npm --workspace @gcc/api run db:deploy   # prisma migrate deploy
npm run build
```

`prisma migrate deploy` requires committed migrations. If the repository has
none yet, create the initial migration locally once (`npm run db:migrate -- --name init`),
commit it, and deploy it. Do not use `migrate dev` on the production database:
it can reset data.

Seed only on a brand-new database:

```bash
npm run db:seed
```

Change seeded passwords immediately afterward.

### 3.3 Process management with PM2

Create `ecosystem.config.cjs` at the repository root:

```js
module.exports = {
  apps: [
    {
      name: 'gcc-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      instances: 1,
    },
    {
      name: 'gcc-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
      instances: 1,
    },
  ],
};
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # follow the printed command
pm2 logs gcc-api
```

If `next` is hoisted to the root `node_modules`, use
`script: 'node_modules/next/dist/bin/next'` with the repository root as `cwd`
and add `--prefix apps/web` or keep the app-level script. Verify with
`pm2 describe gcc-web` that the resolved path exists.

### 3.4 Nginx

`/etc/nginx/sites-available/gcc-web`:

```nginx
server {
    listen 80;
    server_name gcc-web.id www.gcc-web.id;
    return 301 https://gcc-web.id$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gcc-web.id;

    ssl_certificate     /etc/letsencrypt/live/gcc-web.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gcc-web.id/privkey.pem;

    client_max_body_size 1m;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gcc-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d gcc-web.id -d www.gcc-web.id
```

The API enables `trust proxy`, so rate limits and audit IPs see the real client
address through Nginx.

Add HSTS only after HTTPS is stable:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 3.5 Database

Use a dedicated role, not `postgres`:

```sql
CREATE ROLE gcc_user LOGIN PASSWORD 'STRONG_PASSWORD';
CREATE DATABASE gcc_web OWNER gcc_user;
```

Backups:

```bash
pg_dump -U gcc_user -Fc gcc_web > /var/backups/gcc_web-$(date +%F).dump
```

Schedule daily with cron, keep at least 14 days, and store a copy off the
server. Test a restore monthly into a scratch database:

```bash
pg_restore -U gcc_user -d gcc_web_restore /var/backups/gcc_web-2026-10-21.dump
```

Do not run `prisma migrate reset` against production.

## 4. Health checks and monitoring

- External uptime check: `GET https://gcc-web.id/api/health` expecting 200 and
  `"database":"up"`.
- Page check: homepage 200, `/admin/login` 200, `/admin` redirects to login for
  anonymous users.
- Logs: `pm2 logs`, Nginx access/error logs, PostgreSQL logs.
- Alert on 5xx rate and on health-check failure.
- Track disk space for PostgreSQL and backups.

## 5. Deploying a new version

```bash
cd /srv/gcc-web
git pull --ff-only
npm ci
npm run db:generate
npm --workspace @gcc/api run db:deploy
npm run build
pm2 reload ecosystem.config.cjs
```

Order matters: apply backwards-compatible migrations before new code, and keep
old code able to run during the reload. For destructive schema changes, use a
two-step deploy (add column, backfill, switch code, drop later).

Rollback: check out the previous commit, reinstall, rebuild, reload PM2. A
database rollback needs a tested backup; Prisma does not auto-revert data.

## 6. Docker (optional)

The repository is not containerised. If you add Docker:

- one image per app, built from the monorepo root;
- run `prisma generate` in the API image;
- run `prisma migrate deploy` as a one-shot release job, not in every replica;
- use a non-root user and a read-only filesystem where possible;
- keep secrets out of the image and pass them as environment variables;
- set `NEXT_PUBLIC_*` at image build time or build once per environment.

## 7. Production launch checklist

- [ ] Fresh PostgreSQL database and dedicated role.
- [ ] `prisma migrate deploy` succeeded; no schema drift (`prisma migrate status`).
- [ ] Admin password changed from the seed.
- [ ] Technician passwords changed or accounts disabled.
- [ ] `NEXT_PUBLIC_DEMO_MODE=0`.
- [ ] `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` point at HTTPS.
- [ ] JWT secrets are random, 32+ bytes, and different from each other.
- [ ] `WEB_ORIGIN` matches the real site origin.
- [ ] Business phone, WhatsApp, email, address, hours, and bank account are real.
- [ ] WhatsApp provider token set and a test message received.
- [ ] Midtrans production keys set, webhook URL registered, test transaction
      settled.
- [ ] `/api/health` returns 200 from the public internet.
- [ ] Cookies are `Secure` and set on the production domain.
- [ ] `/admin` is `noindex` and not linked from public pages.
- [ ] Backups scheduled and a restore has been tested.
- [ ] TLS certificate auto-renewal works (`certbot renew --dry-run`).
- [ ] Logs rotate; disk alerts configured.
- [ ] Error pages return correct status codes.

## 8. Known deployment gaps

- No CI/CD pipeline is included. Add one that runs typecheck, lint, and build
  before deploy.
- No automated tests run in CI yet.
- Background jobs (WhatsApp retries, session cleanup) are not scheduled.
- WhatsApp sends are fire-and-forget; a provider outage is only visible in
  logs. Add a queue and retry policy before high volume.
- The CSP is not set; add it once final asset origins are known.
