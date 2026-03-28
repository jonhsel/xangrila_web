import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('⚠️ RESEND_API_KEY não configurado — emails não serão enviados');
}

export const resend = apiKey ? new Resend(apiKey) : null;

export function isEmailEnabled(): boolean {
  return !!resend;
}
