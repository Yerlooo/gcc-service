import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="konten">{children}</main>
      <Footer />
      <noscript>
        <style>{`
          .reveal { opacity: 1 !important; transform: none !important; filter: none !important; }
        `}</style>
      </noscript>
    </>
  );
}
