import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Globe, Share2 } from 'lucide-react';
import { POUSADA, ROUTES } from '@/lib/constants';

export function Footer() {
  return (
    <footer role="contentinfo" className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Sobre */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{POUSADA.nome}</h3>
            <p className="text-sm text-muted-foreground">{POUSADA.descricao}</p>
            <div className="flex gap-3 pt-1">
              <Link
                href={POUSADA.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram da ${POUSADA.nome}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="h-5 w-5" />
              </Link>
              <Link
                href={POUSADA.social.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Facebook da ${POUSADA.nome}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={ROUTES.home} className="hover:text-foreground transition-colors">Início</Link></li>
              <li><Link href={ROUTES.quartos} className="hover:text-foreground transition-colors">Acomodações</Link></li>
              <li><Link href={ROUTES.dayUse} className="hover:text-foreground transition-colors">Day Use</Link></li>
              <li><Link href={ROUTES.sobre} className="hover:text-foreground transition-colors">Sobre</Link></li>
              <li><Link href={ROUTES.reservar} className="hover:text-foreground transition-colors">Reservar</Link></li>
              <li><Link href={ROUTES.termos} className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
              <li><Link href={ROUTES.privacidade} className="hover:text-foreground transition-colors">Privacidade</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Contato</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{POUSADA.telefone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{POUSADA.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{POUSADA.endereco.completo}</span>
              </li>
            </ul>
          </div>

          {/* Horários */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Horários</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Check-in</p>
                  <p>{POUSADA.horarios.checkin.label}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Check-out</p>
                  <p>{POUSADA.horarios.checkout.label}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Recepção</p>
                  <p>{POUSADA.horarios.recepcao.label}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {POUSADA.nome}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
