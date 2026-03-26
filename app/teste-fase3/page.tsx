import { createClient } from '@/lib/supabase/server';
import { formatarMoeda, formatarData, formatarPessoas, formatarDiarias, formatarTelefone } from '@/lib/utils';
import { CAPACIDADE_POR_TIPO, ESTOQUE_POR_TIPO } from '@/types';

/**
 * Página de teste da Fase 3.
 * 
 * Acesse: http://localhost:3000/teste-fase3
 * 
 * Após validar que tudo funciona, APAGUE esta pasta:
 *   rm -rf app/teste-fase3
 */
export default async function TesteFase3() {
  // 1. Testar conexão com Supabase (server client)
  const supabase = await createClient();

  // 2. Testar query em reservas_confirmadas
  const { data: reservas, error: erroReservas } = await supabase
    .from('reservas_confirmadas')
    .select('reserva_id, tipo_quarto, valor_total, pessoas, status, status_checkin')
    .limit(5);

  // 3. Testar query em clientes_xngrl (com nomes lowercase)
  const { data: clientes, error: erroClientes } = await supabase
    .from('clientes_xngrl')
    .select('id_cliente, nome_cliente, telefonewhatsapp_cliente, total_reservas')
    .limit(5);

  // 4. Testar query em acomodacoes (tabela que faltava no type antigo)
  const { data: acomodacoes, error: erroAcomodacoes } = await supabase
    .from('acomodacoes')
    .select('id, nome_exibicao, tipo, categoria, capacidade_maxima, ativo')
    .limit(10);

  // 5. Testar query em pacotes_especiais
  const { data: pacotes, error: erroPacotes } = await supabase
    .from('pacotes_especiais')
    .select('id, nome, data_inicio, data_fim, diarias_pacote, tipo_pacote')
    .eq('is_active', true)
    .limit(5);

  // 6. Testar query em periodos_reserva
  const { data: periodos, error: erroPeriodos } = await supabase
    .from('periodos_reserva')
    .select('id, nome, data_inicio, data_fim, reservas_abertas')
    .eq('is_active', true)
    .limit(5);

  // Montar resultados dos testes
  const testes = [
    {
      nome: 'Conexão Supabase (Server Client)',
      ok: !erroReservas,
      detalhe: erroReservas ? erroReservas.message : 'Conectado com sucesso',
    },
    {
      nome: 'Query reservas_confirmadas (com campo status_checkin)',
      ok: !erroReservas,
      detalhe: erroReservas
        ? erroReservas.message
        : `${reservas?.length ?? 0} registro(s) encontrado(s)`,
    },
    {
      nome: 'Query clientes_xngrl (campo telefonewhatsapp_cliente lowercase)',
      ok: !erroClientes,
      detalhe: erroClientes
        ? erroClientes.message
        : `${clientes?.length ?? 0} registro(s) encontrado(s)`,
    },
    {
      nome: 'Query acomodacoes (tabela nova no type)',
      ok: !erroAcomodacoes,
      detalhe: erroAcomodacoes
        ? erroAcomodacoes.message
        : `${acomodacoes?.length ?? 0} registro(s) encontrado(s)`,
    },
    {
      nome: 'Query pacotes_especiais',
      ok: !erroPacotes,
      detalhe: erroPacotes
        ? erroPacotes.message
        : `${pacotes?.length ?? 0} pacote(s) ativo(s)`,
    },
    {
      nome: 'Query periodos_reserva',
      ok: !erroPeriodos,
      detalhe: erroPeriodos
        ? erroPeriodos.message
        : `${periodos?.length ?? 0} período(s) ativo(s)`,
    },
  ];

  const todosOk = testes.every((t) => t.ok);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        {todosOk ? '✅' : '⚠️'} Teste Fase 3 — Código Base Corrigido
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Se tudo estiver verde, a Fase 3 está 100% funcional.
      </p>

      {/* ===== TESTES DE CONEXÃO ===== */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
          1. Testes de Conexão e Queries
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Teste</th>
              <th style={{ padding: '8px' }}>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {testes.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{t.ok ? '✅' : '❌'}</td>
                <td style={{ padding: '8px' }}>{t.nome}</td>
                <td style={{ padding: '8px', color: t.ok ? '#16a34a' : '#dc2626' }}>
                  {t.detalhe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ===== FUNÇÕES UTILS ===== */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
          2. Funções Utilitárias
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>Função</th>
              <th style={{ padding: '8px' }}>Entrada</th>
              <th style={{ padding: '8px' }}>Saída</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>formatarMoeda</td>
              <td style={{ padding: '8px' }}>1500</td>
              <td style={{ padding: '8px' }}>{formatarMoeda(1500)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>formatarData</td>
              <td style={{ padding: '8px' }}>2025-06-15</td>
              <td style={{ padding: '8px' }}>{formatarData('2025-06-15')}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>formatarPessoas</td>
              <td style={{ padding: '8px' }}>3</td>
              <td style={{ padding: '8px' }}>{formatarPessoas(3)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>formatarDiarias</td>
              <td style={{ padding: '8px' }}>5</td>
              <td style={{ padding: '8px' }}>{formatarDiarias(5)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>formatarTelefone</td>
              <td style={{ padding: '8px' }}>98981672949</td>
              <td style={{ padding: '8px' }}>{formatarTelefone('98981672949')}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ===== CONSTANTES ===== */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
          3. Constantes da Pousada
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>Tipo</th>
              <th style={{ padding: '8px' }}>Capacidade Máx.</th>
              <th style={{ padding: '8px' }}>Estoque (unidades)</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(CAPACIDADE_POR_TIPO) as Array<keyof typeof CAPACIDADE_POR_TIPO>).map((tipo) => (
              <tr key={tipo} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{tipo}</td>
                <td style={{ padding: '8px' }}>{CAPACIDADE_POR_TIPO[tipo]} pessoas</td>
                <td style={{ padding: '8px' }}>{ESTOQUE_POR_TIPO[tipo]} unidades</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ===== DADOS DO BANCO ===== */}
      {acomodacoes && acomodacoes.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
            4. Acomodações Cadastradas
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Nome</th>
                <th style={{ padding: '8px' }}>Tipo</th>
                <th style={{ padding: '8px' }}>Categoria</th>
                <th style={{ padding: '8px' }}>Capacidade</th>
                <th style={{ padding: '8px' }}>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {acomodacoes.map((ac) => (
                <tr key={ac.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{ac.nome_exibicao}</td>
                  <td style={{ padding: '8px' }}>{ac.tipo}</td>
                  <td style={{ padding: '8px' }}>{ac.categoria ?? '—'}</td>
                  <td style={{ padding: '8px' }}>{ac.capacidade_maxima}</td>
                  <td style={{ padding: '8px' }}>{ac.ativo ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ===== RESULTADO FINAL ===== */}
      <section
        style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: todosOk ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${todosOk ? '#bbf7d0' : '#fecaca'}`,
        }}
      >
        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          {todosOk
            ? '🎉 FASE 3 CONCLUÍDA COM SUCESSO! Tudo funcionando.'
            : '⚠️ Alguns testes falharam. Verifique os erros acima.'}
        </p>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
          Após validar, apague esta página:{' '}
          <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
            rm -rf app/teste-fase3
          </code>
        </p>
      </section>
    </div>
  );
}
