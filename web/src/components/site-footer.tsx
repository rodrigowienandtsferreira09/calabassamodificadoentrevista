'use client';

import { hideMainSiteChrome } from '@/lib/main-chrome';
import { Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();

const links = [
  { href: '/', label: 'Início' },
  { href: '/search', label: 'Buscar' },
  { href: '/news', label: 'Destaques' },
  { href: '/contact', label: 'Contato' },
] as const;

export function SiteFooter() {
  const pathname = usePathname();
  if (hideMainSiteChrome(pathname)) return null;

  return (
    <footer className="relative z-10 border-t border-zinc-800/90 bg-zinc-950/95 text-zinc-400 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-10 sm:px-6 md:pb-12 lg:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-x-10 md:gap-y-8">
          <div className="max-w-sm shrink-0">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Logo Haras Exemplo"
                width={200}
                height={52}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-2 font-sans text-sm leading-relaxed text-zinc-500">
              Catálogo oficial para compra de cobertura, cavalos, camisetas e bonés.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 md:justify-end"
            aria-label="Links do rodapé"
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                {label}
              </Link>
            ))}
          </nav>

          {instagramUrl ? (
            <div className="flex flex-col gap-3 md:min-w-[10rem] md:text-right">
              <p className="text-xs uppercase tracking-widest text-zinc-600">Redes</p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-100 md:justify-end"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-800/80 pt-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Haras Exemplo. Todos os direitos reservados.</p>
          <p className="text-zinc-600">Brasil</p>
        </div>
      </div>
    </footer>
  );
}
