import type { SVGProps } from 'react';

export function TicketMark({ className = '', ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="1" y="1" width="30" height="30" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 1v30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M5 22.5h7M5 26h4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M21 9.5h6M21 13h4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="24.5" cy="22.5" r="2.2" fill="#0B5D4F" />
    </svg>
  );
}

export function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M4 12L12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 12" fill="none" aria-hidden="true" className={className}>
      <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function PlusMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function StarMark({ filled = true, className = '' }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={className}>
      <path
        d="M6 .8l1.55 3.2 3.5.45-2.58 2.4.66 3.45L6 8.6 2.87 10.3l.66-3.45L.95 4.45l3.5-.45L6 .8z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="0.7"
      />
    </svg>
  );
}

export function WhatsAppMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.19c-.24.68-1.42 1.31-1.96 1.36-.54.05-1.05.24-3.53-.74-2.98-1.17-4.87-4.23-5.02-4.43-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.17 1.03-2.46.27-.29.59-.37.78-.37l.56.01c.18.01.42-.07.66.5.24.58.82 2.03.89 2.18.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.71.81 2 .96.29.15.49.22.56.34.07.12.07.7-.17 1.38z" />
    </svg>
  );
}
