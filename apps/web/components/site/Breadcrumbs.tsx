import Link from 'next/link';
import { cn } from '@/lib/format';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-[0.7rem] text-muted', className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="transition-colors hover:text-ink">
            Beranda
          </Link>
        </li>
        {items.map((item) => (
          <li key={`${item.href ?? 'current'}-${item.label}`} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-line">
              /
            </span>
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
