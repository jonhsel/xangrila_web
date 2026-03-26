'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { POUSADA } from '@/lib/constants';

export function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  const message = encodeURIComponent('Olá! Gostaria de mais informações sobre a Pousada Xangrilá.');
  const href = `https://wa.me/${POUSADA.whatsapp}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {showTooltip && (
        <div className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-lg">
          Fale conosco!
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com a Pousada Xangrilá pelo WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
