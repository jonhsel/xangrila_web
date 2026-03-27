'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TipoQuartoReserva } from '@/types';

// ============================================
// TIPOS
// ============================================

interface PacoteInfo {
  id: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
  diarias: number;
}

interface ReservaState {
  autenticado: boolean;
  clienteId: number | null;
  clienteNome: string | null;
  clienteTelefone: string | null;

  dataCheckin: string | null;     // ISO string YYYY-MM-DD
  dataCheckout: string | null;    // ISO string YYYY-MM-DD
  totalDiarias: number;

  tipoQuarto: TipoQuartoReserva | null;
  pessoas: number;
  valorDiaria: number;
  valorTotal: number;
  ehPacote: boolean;
  pacoteInfo: PacoteInfo | null;

  observacoes: string;
  step: number;
  reservaId: string | null;
  valorSinal: number;
  expiraEm: string | null;
}

interface ReservaActions {
  setAutenticado: (
    autenticado: boolean,
    clienteId?: number | null,
    clienteNome?: string | null,
    clienteTelefone?: string | null
  ) => void;
  setDatas: (checkin: string, checkout: string, diarias: number) => void;
  setQuarto: (
    tipo: TipoQuartoReserva,
    pessoas: number,
    valorDiaria: number,
    valorTotal: number,
    ehPacote?: boolean,
    pacoteInfo?: PacoteInfo | null
  ) => void;
  setObservacoes: (obs: string) => void;
  setClienteNome: (nome: string) => void;
  setStep: (step: number) => void;
  setReservaId: (id: string) => void;
  setDadosPagamento: (valorSinal: number, expiraEm: string) => void;
  reset: () => void;
}

const estadoInicial: ReservaState = {
  autenticado: false,
  clienteId: null,
  clienteNome: null,
  clienteTelefone: null,
  dataCheckin: null,
  dataCheckout: null,
  totalDiarias: 0,
  tipoQuarto: null,
  pessoas: 1,
  valorDiaria: 0,
  valorTotal: 0,
  ehPacote: false,
  pacoteInfo: null,
  observacoes: '',
  step: 1,
  reservaId: null,
  valorSinal: 0,
  expiraEm: null,
};

// ============================================
// STORE
// ============================================

export const useReserva = create<ReservaState & ReservaActions>()(
  persist(
    (set) => ({
      ...estadoInicial,

      setAutenticado: (autenticado, clienteId = null, clienteNome = null, clienteTelefone = null) =>
        set({ autenticado, clienteId, clienteNome, clienteTelefone }),

      setDatas: (dataCheckin, dataCheckout, totalDiarias) =>
        set({ dataCheckin, dataCheckout, totalDiarias }),

      setQuarto: (tipoQuarto, pessoas, valorDiaria, valorTotal, ehPacote = false, pacoteInfo = null) =>
        set({ tipoQuarto, pessoas, valorDiaria, valorTotal, ehPacote, pacoteInfo }),

      setObservacoes: (observacoes) => set({ observacoes }),

      setClienteNome: (clienteNome) => set({ clienteNome }),

      setStep: (step) => set({ step }),

      setReservaId: (reservaId) => set({ reservaId }),

      setDadosPagamento: (valorSinal, expiraEm) => set({ valorSinal, expiraEm }),

      reset: () => set(estadoInicial),
    }),
    {
      name: 'xangrila-reserva',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
    }
  )
);
