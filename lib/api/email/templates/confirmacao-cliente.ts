import { POUSADA } from '@/lib/constants/pousada';

interface ConfirmacaoClienteData {
  nomeCliente: string;
  reservaId: string;
  dataCheckin: string;     // formato dd/MM/yyyy
  dataCheckout: string;    // formato dd/MM/yyyy
  tipoQuarto: string;
  pessoas: number;
  totalDiarias: number;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
}

export function gerarEmailConfirmacaoCliente(data: ConfirmacaoClienteData): {
  subject: string;
  html: string;
} {
  const subject = `✅ Reserva Confirmada - ${data.reservaId} | ${POUSADA.nome}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Reserva</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#1a1a1a;color:#ffffff;padding:30px 40px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:700;">${POUSADA.nome}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#cccccc;">${POUSADA.endereco.completo}</p>
    </div>

    <!-- Conteúdo -->
    <div style="padding:40px;">
      <div style="text-align:center;margin-bottom:30px;">
        <div style="display:inline-block;background:#e6f7e6;color:#2e7d32;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">
          ✅ Reserva Confirmada
        </div>
      </div>

      <p style="font-size:16px;color:#333;">Olá, <strong>${data.nomeCliente}</strong>!</p>
      <p style="font-size:14px;color:#666;line-height:1.6;">
        Sua reserva foi confirmada com sucesso. Confira os detalhes abaixo:
      </p>

      <!-- Dados da Reserva -->
      <div style="background:#f9f9f9;border-radius:8px;padding:24px;margin:24px 0;">
        <h2 style="margin:0 0 16px;font-size:16px;color:#333;border-bottom:1px solid #e0e0e0;padding-bottom:8px;">
          Dados da Reserva
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#666;">Código:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">${data.reservaId}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;">Check-in:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">${data.dataCheckin} (a partir das ${POUSADA.horarios.checkin.inicio})</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;">Check-out:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">${data.dataCheckout} (até ${POUSADA.horarios.checkout.limite})</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;">Acomodação:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">${data.tipoQuarto}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;">Hóspedes:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">${data.pessoas} pessoa${data.pessoas > 1 ? 's' : ''}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;">Diárias:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">${data.totalDiarias} noite${data.totalDiarias > 1 ? 's' : ''}</td>
          </tr>
        </table>
      </div>

      <!-- Valores -->
      <div style="background:#f0f7ff;border-radius:8px;padding:24px;margin:24px 0;">
        <h2 style="margin:0 0 16px;font-size:16px;color:#333;border-bottom:1px solid #d0e4f7;padding-bottom:8px;">
          Valores
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#666;">Valor Total:</td>
            <td style="padding:6px 0;font-weight:600;color:#333;">R$ ${data.valorTotal.toFixed(2).replace('.', ',')}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;">Valor Pago (PIX):</td>
            <td style="padding:6px 0;font-weight:600;color:#2e7d32;">R$ ${data.valorPago.toFixed(2).replace('.', ',')}</td>
          </tr>
        </table>
      </div>

      <!-- Informações Importantes -->
      <div style="background:#fff8e1;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #ffc107;">
        <h3 style="margin:0 0 12px;font-size:15px;color:#333;">📋 Informações Importantes</h3>
        <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#555;line-height:1.8;">
          <li>Check-in: ${POUSADA.horarios.checkin.label}</li>
          <li>Check-out: ${POUSADA.horarios.checkout.label}</li>
          ${data.valorRestante > 0 ? `<li>O valor restante (R$ ${data.valorRestante.toFixed(2).replace('.', ',')}) deve ser pago no check-in</li>` : ''}
          <li>Recepção: ${POUSADA.horarios.recepcao.label}</li>
        </ul>
      </div>

      <!-- Contato -->
      <div style="text-align:center;margin-top:30px;">
        <p style="font-size:14px;color:#666;">Dúvidas? Entre em contato:</p>
        <a href="https://wa.me/${POUSADA.whatsapp}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">
          📱 WhatsApp: ${POUSADA.telefone}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f5f5f5;padding:20px 40px;text-align:center;font-size:12px;color:#999;">
      <p style="margin:0;">${POUSADA.nomeCompleto}</p>
      <p style="margin:4px 0 0;">${POUSADA.endereco.completo}</p>
      <p style="margin:4px 0 0;">Este é um email automático. Não responda diretamente.</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
