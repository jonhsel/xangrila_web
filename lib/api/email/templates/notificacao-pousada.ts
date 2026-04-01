import { POUSADA } from '@/lib/constants/pousada';

interface NotificacaoPousadaData {
  // Dados da reserva
  reservaId: string;
  dataCheckin: string;
  dataCheckout: string;
  tipoQuarto: string;
  pessoas: number;
  totalDiarias: number;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  observacoes: string | null;

  // Dados do cliente
  nomeCliente: string;
  telefoneCliente: string;
  emailCliente: string | null;
  totalReservasCliente: number;
  valorTotalGastoCliente: number;

  // Metadados do pagamento
  mercadoPagoPaymentId: string | number;
  dataPagamento: string;
  metodoPagamento: string;
}

export function gerarEmailNotificacaoPousada(data: NotificacaoPousadaData): {
  subject: string;
  html: string;
} {
  const isClienteFrequente = data.totalReservasCliente >= 3;
  const isVIP = data.valorTotalGastoCliente >= 5000;

  const subject = `🔔 Nova Reserva Confirmada - ${data.reservaId} | ${data.nomeCliente}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <div style="max-width:650px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#1a1a1a;color:#ffffff;padding:20px 30px;">
      <h1 style="margin:0;font-size:20px;">🔔 Nova Reserva Confirmada</h1>
      <p style="margin:5px 0 0;font-size:14px;color:#aaa;">Sistema de Reservas - ${POUSADA.nome}</p>
    </div>

    <div style="padding:30px;">
      <!-- Resumo rápido -->
      <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
        <span style="font-size:24px;font-weight:700;color:#2e7d32;">R$ ${data.valorPago.toFixed(2).replace('.', ',')}</span>
        <p style="margin:4px 0 0;font-size:13px;color:#666;">Pagamento integral via ${data.metodoPagamento}</p>
      </div>

      <!-- Dados do Cliente -->
      <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin-bottom:20px;">
        <h2 style="margin:0 0 12px;font-size:15px;color:#333;border-bottom:1px solid #ddd;padding-bottom:8px;">
          👤 Dados do Cliente
          ${isVIP ? ' <span style="background:#ffd700;color:#333;padding:2px 8px;border-radius:10px;font-size:11px;">⭐ VIP</span>' : ''}
          ${isClienteFrequente && !isVIP ? ' <span style="background:#90caf9;color:#333;padding:2px 8px;border-radius:10px;font-size:11px;">🔄 Frequente</span>' : ''}
        </h2>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#666;width:140px;">Nome:</td><td style="font-weight:600;">${data.nomeCliente}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Telefone:</td><td><a href="https://wa.me/${data.telefoneCliente.replace(/\D/g, '')}" style="color:#25D366;font-weight:600;">${data.telefoneCliente}</a></td></tr>
          ${data.emailCliente ? `<tr><td style="padding:4px 0;color:#666;">Email:</td><td>${data.emailCliente}</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#666;">Total de reservas:</td><td>${data.totalReservasCliente}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Gasto acumulado:</td><td>R$ ${data.valorTotalGastoCliente.toFixed(2).replace('.', ',')}</td></tr>
        </table>
      </div>

      <!-- Dados da Reserva -->
      <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin-bottom:20px;">
        <h2 style="margin:0 0 12px;font-size:15px;color:#333;border-bottom:1px solid #ddd;padding-bottom:8px;">
          🏨 Dados da Reserva
        </h2>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#666;width:140px;">Código:</td><td style="font-weight:600;">${data.reservaId}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Check-in:</td><td style="font-weight:600;">${data.dataCheckin}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Check-out:</td><td style="font-weight:600;">${data.dataCheckout}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Acomodação:</td><td>${data.tipoQuarto}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Hóspedes:</td><td>${data.pessoas}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Diárias:</td><td>${data.totalDiarias}</td></tr>
          ${data.observacoes ? `<tr><td style="padding:4px 0;color:#666;vertical-align:top;">Observações:</td><td style="color:#e65100;">${data.observacoes}</td></tr>` : ''}
        </table>
      </div>

      <!-- Valores -->
      <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin-bottom:20px;">
        <h2 style="margin:0 0 12px;font-size:15px;color:#333;border-bottom:1px solid #ddd;padding-bottom:8px;">
          💰 Valores
        </h2>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#666;width:140px;">Valor Total:</td><td style="font-weight:600;">R$ ${data.valorTotal.toFixed(2).replace('.', ',')}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Valor Pago:</td><td style="font-weight:600;color:#2e7d32;">R$ ${data.valorPago.toFixed(2).replace('.', ',')}</td></tr>
        </table>
      </div>

      <!-- Dados do Pagamento -->
      <div style="background:#f5f5f5;border-radius:8px;padding:20px;">
        <h2 style="margin:0 0 12px;font-size:15px;color:#333;border-bottom:1px solid #ddd;padding-bottom:8px;">
          📱 Dados do Pagamento
        </h2>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#666;width:140px;">ID Mercado Pago:</td><td>${data.mercadoPagoPaymentId}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Data/Hora:</td><td>${data.dataPagamento}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Método:</td><td>${data.metodoPagamento}</td></tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f0f0f0;padding:16px 30px;text-align:center;font-size:11px;color:#999;">
      Email automático do sistema de reservas — ${POUSADA.nomeCompleto}
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
