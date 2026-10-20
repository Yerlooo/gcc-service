import { cn } from '@/lib/format';

interface PageIntroProps {
  index: string;
  title: React.ReactNode;
  description: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

export function PageIntro({
  index,
  title,
  description,
  actions,
  aside,
  className,
}: PageIntroProps) {
  return (
    <section className={cn('border-b border-line', className)}>
      <div className="frame grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
        <div className={aside ? 'lg:col-span-8' : 'lg:col-span-10'}>
          <p className="meta text-muted">{index}</p>
          <h1 className="statement mt-4 max-w-[16ch]">{title}</h1>
          <div className="mt-6 max-w-[54ch] text-[0.98rem] leading-relaxed text-muted">
            {description}
          </div>
          {actions ? <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div> : null}
        </div>
        {aside ? <div className="lg:col-span-4">{aside}</div> : null}
      </div>
    </section>
  );
}
