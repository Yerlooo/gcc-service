import { StarMark } from './Icons';
import { cn } from '@/lib/format';

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-teal', className)}
      aria-label={`${rating} dari 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <StarMark key={index} filled={index < rating} className="h-3 w-3" />
      ))}
    </span>
  );
}
