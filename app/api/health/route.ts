import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    const supabase = createAdminClient();
    const { error } = await (supabase.from('periodos_reserva') as any).select('id').limit(1);
    checks.supabase = error ? `error: ${error.message}` : 'ok';
    if (error) healthy = false;
  } catch {
    checks.supabase = 'unreachable';
    healthy = false;
  }

  checks.mercadopago = process.env.MERCADOPAGO_ACCESS_TOKEN ? 'configured' : 'missing';
  checks.resend = process.env.RESEND_API_KEY ? 'configured' : 'missing';
  checks.app_url = process.env.NEXT_PUBLIC_APP_URL || 'missing';

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_SUPABASE_URL) healthy = false;

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', timestamp: new Date().toISOString(), version: '1.0.0', checks },
    { status: healthy ? 200 : 503 }
  );
}
