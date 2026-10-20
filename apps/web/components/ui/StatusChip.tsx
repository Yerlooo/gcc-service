import { cn, STATUS_LABEL, STATUS_SHORT, STATUS_TONE } from '@/lib/format';
import type { BookingStatus } from '@/lib/types';

export function StatusChip({
  status,
  className,
  long = false,
}: {
  status: BookingStatus;
  className?: string;
  long?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-[0.68rem] font-semibold tracking-wide',
        STATUS_TONE[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {long ? STATUS_LABEL[status] : STATUS_SHORT[status]}
    </span>
  );
}
