import type { ReactNode } from 'react';
import { cn, PAYMENT_STATUS_LABEL } from '@/lib/format';
import type { PaymentStatus } from '@/lib/types';

export type DataSource = 'api' | 'demo' | 'fallback';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-5">
      <div>
        <p className="meta text-muted">{eyebrow}</p>
        <h1 className="mt-2 text-[1.55rem] font-bold tracking-[-0.03em] sm:text-[1.85rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[62ch] text-[0.82rem] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 no-print">{actions}</div> : null}
    </header>
  );
}

export function SourceNotice({ source }: { source: DataSource }) {
  if (source === 'api') return null;
  return (
    <p
      className={cn(
        'border px-3 py-2 text-[0.72rem] leading-relaxed',
        source === 'demo'
          ? 'border-teal/25 bg-teal-soft/45 text-ink'
          : 'border-amber/35 bg-amber/10 text-ink',
      )}
    >
      {source === 'demo'
        ? 'Mode demo: data dan tindakan hanya berlaku di tab ini, tidak tersimpan ke database.'
        : 'API belum terhubung. Data contoh ditampilkan; tindakan tidak akan tersimpan.'}
    </p>
  );
}

export function DemoActionNote({ children }: { children?: ReactNode }) {
  return (
    <p className="border border-amber/35 bg-amber/10 px-3 py-2 text-[0.72rem] leading-relaxed">
      {children ??
        'Mode demo: perubahan disimulasikan di layar dan tidak dikirim ke database.'}
    </p>
  );
}

export function AdminLoading({ label = 'Memuat data…' }: { label?: string }) {
  return (
    <div className="space-y-4" aria-live="polite">
      <div className="h-3 w-40 animate-pulse bg-line" />
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-paper p-5">
            <div className="h-2.5 w-16 animate-pulse bg-line" />
            <div className="mt-4 h-7 w-20 animate-pulse bg-line" />
          </div>
        ))}
      </div>
      <p className="text-[0.72rem] text-muted">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line bg-paper px-5 py-10 text-center">
      <p className="text-[0.9rem] font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-[46ch] text-[0.78rem] leading-relaxed text-muted">
        {body}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex border px-1.5 py-0.5 text-[0.62rem] font-semibold',
        status === 'PAID'
          ? 'border-teal/25 bg-teal-soft text-teal'
          : status === 'PENDING'
            ? 'border-amber/30 bg-amber/10 text-amber'
            : status === 'FAILED'
              ? 'border-rust/30 bg-rust/5 text-rust'
              : 'border-line bg-surface text-muted',
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export function AdminField({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
