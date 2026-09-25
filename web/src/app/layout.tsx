import { BottomNav } from '@/components/bottom-nav';
import { SiteFooter } from '@/components/site-footer';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Merriweather } from 'next/font/google';
import './globals.css';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: 'Haras Exemplo',
  description: 'Cobertura, cavalos e produtos oficiais',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Haras Exemplo',
    description: 'Cobertura, cavalos e produtos oficiais',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${merriweather.className} min-h-screen`}>
        <Providers>
          {children}
          <SiteFooter />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
