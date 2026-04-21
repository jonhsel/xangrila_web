'use client';

import { useState } from 'react';
import { LoginSocialButtons } from './login-social-buttons';
import { LoginEmailForm } from './login-email-form';

type TabAtiva = 'social' | 'email' | 'telefone';

interface AuthTabsProps {
  redirectTo?: string;
  onPhoneAuthSuccess?: () => void;
  renderPhoneAuth?: () => React.ReactNode;
}

export function AuthTabs({ redirectTo, renderPhoneAuth }: AuthTabsProps) {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('social');

  return (
    <div className="space-y-6">
      {/* Seletor de tabs */}
      <div className="flex rounded-lg border p-1 gap-1">
        {(
          [
            { id: 'social', label: 'Google' },
            { id: 'email', label: 'Email' },
            { id: 'telefone', label: 'Telefone' },
          ] as { id: TabAtiva; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabAtiva(tab.id)}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-medium ${
              tabAtiva === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabAtiva === 'social' && (
        <div className="space-y-4">
          <LoginSocialButtons redirectTo={redirectTo} />
          <p className="text-xs text-muted-foreground text-center">
            No primeiro acesso, pediremos seu telefone para confirmações via WhatsApp
          </p>
        </div>
      )}

      {tabAtiva === 'email' && (
        <LoginEmailForm redirectTo={redirectTo} />
      )}

      {tabAtiva === 'telefone' && (
        <div className="space-y-4">
          {renderPhoneAuth ? (
            renderPhoneAuth()
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Digite seu número de WhatsApp para receber um código de acesso.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
