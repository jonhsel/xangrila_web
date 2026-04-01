'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { POUSADA, ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Acomodações', href: ROUTES.acomodacoes },
  { label: 'Day Use', href: ROUTES.dayUse },
  { label: 'Expedições', href: ROUTES.expedicoes },
  { label: 'Sobre', href: ROUTES.sobre },
  { label: 'Contato', href: ROUTES.contato },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={ROUTES.home} className="text-xl font-bold text-primary">
          {POUSADA.nome}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.minhasReservas}>Minhas Reservas</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={ROUTES.reservar}>Reservar</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t bg-background px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.minhasReservas} onClick={() => setMobileOpen(false)}>Minhas Reservas</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={ROUTES.reservar} onClick={() => setMobileOpen(false)}>Reservar</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
