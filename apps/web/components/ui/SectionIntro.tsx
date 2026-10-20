import { cn } from '@/lib/format';

interface SectionIntroProps {
  index: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  align?: 'split' | 'stack';
}

export function SectionIntro({
  index,
  title,
  description,
  className,
  titleClassName,
  align = 'split',
}: SectionIntroProps) {
  if (align === 'stack') {
    return (
      <div className={cn('border-t border-line pt-5', className)}>
        <p className="meta text-muted">{index}</p>
        <h2 className={cn('h2 mt-4 max-w-[18ch]', titleClassName)}>{title}</h2>
        {description ? (
          <p className="mt-4 max-w-[52ch] text-[0.98rem] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-5 border-t border-line pt-5 md:grid-cols-12 md:items-start md:gap-8',
        className,
      )}
    >
      <p className="meta text-muted md:col-span-2">{index}</p>
      <h2 className={cn('h2 md:col-span-7', titleClassName)}>{title}</h2>
      {description ? (
        <p className="max-w-[42ch] text-[0.94rem] leading-relaxed text-muted md:col-span-3 md:pt-1">
          {description}
        </p>
      ) : null}
    </div>
  );
}
