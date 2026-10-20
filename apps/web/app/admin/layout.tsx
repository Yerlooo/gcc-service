import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Panel Admin · GCC Web',
    template: '%s · Admin GCC Web',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
