import type { Metadata } from 'next';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { NotFoundContent } from '@/components/site/NotFoundContent';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <>
      <Header />
      <main id="konten">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
