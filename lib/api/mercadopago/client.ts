import { MercadoPagoConfig, Payment } from 'mercadopago';

// Validar token no startup
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('[MercadoPago] ⚠️ MERCADOPAGO_ACCESS_TOKEN não configurado');
}

// Criar configuração SEM idempotencyKey fixo
// (será passado por requisição quando necessário — idempotencyKey fixo tornaria
//  todas as requisições idempotentes com a mesma chave, retornando sempre o primeiro resultado)
const client = new MercadoPagoConfig({
  accessToken: accessToken || '',
  options: {
    timeout: 10000, // 10 segundos — PIX pode demorar mais que outros métodos
  },
});

// Exportar cliente de pagamentos (Payment suporta .create() e .get() para PIX)
export const paymentClient = new Payment(client);

// Helper para verificar se o Mercado Pago está configurado
export function isMercadoPagoConfigured(): boolean {
  return !!accessToken && accessToken.length > 10;
}
