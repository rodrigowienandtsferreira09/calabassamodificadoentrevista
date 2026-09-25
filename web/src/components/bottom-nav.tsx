'use client';

import { useAuth } from '@/context/auth-context';
import { hideMainSiteChrome } from '@/lib/main-chrome';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/search', icon: Search, label: 'Buscar' },
  { href: '/cart', icon: ShoppingBag, label: 'Sacola' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  if (hideMainSiteChrome(pathname)) return null;

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/95 font-sans shadow-[0_8px_24px_-12px_rgba(0,0,0,0.85)] backdrop-blur md:hidden">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo.svg"
              alt="Logo Haras Exemplo"
              width={150}
              height={38}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <span className="max-w-[45vw] truncate text-right text-sm text-zinc-400">
            Olá, <span className="font-medium text-zinc-200">{user?.name || 'Visitante'}</span>
          </span>
        </div>
      </header>

      <header className="fixed left-0 right-0 top-0 z-50 hidden bg-zinc-950/90 font-sans shadow-[0_8px_32px_-8px_rgba(0,0,0,0.85)] backdrop-blur-md md:block">
        <div className="relative mx-auto flex h-[3.75rem] max-w-7xl items-center px-6 lg:px-10">
          <Link href="/" className="group relative z-10 inline-flex shrink-0 items-center">
            <Image
              src="/logo.svg"
              alt="Logo Haras Exemplo"
              width={168}
              height={42}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <nav
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 gap-1 lg:gap-2"
            aria-label="Menu principal"
          >
            {nav.map(({ href, icon: Icon, label }) => {
              const active =
                pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`pointer-events-auto relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {active ? (
                    <span
                      className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-[min(100%,4.5rem)] -translate-x-1/2 bg-brand"
                      aria-hidden
                    />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 ml-auto flex min-w-0 shrink-0 items-center justify-end gap-3">
            {user ? (
              <span
                className="hidden max-w-[12rem] truncate text-right text-sm text-zinc-400 lg:block"
                title={user.name}
              >
                Olá, <span className="font-medium text-zinc-200">{user.name}</span>
              </span>
            ) : (
              <Link
                href="/auth"
                className="rounded-xl bg-zinc-200 px-4 py-2 text-sm font-bold text-zinc-900 shadow-md shadow-black/20 transition hover:bg-zinc-300"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 font-sans shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.85)] backdrop-blur md:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2 safe-area-pb">
          {nav.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                  active ? 'text-zinc-100' : 'text-zinc-500'
                }`}
              >
                {active ? (
                  <span
                    className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-11 -translate-x-1/2 bg-brand"
                    aria-hidden
                  />
                ) : null}
                <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
