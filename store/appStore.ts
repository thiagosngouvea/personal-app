import { create } from 'zustand';
import { Client, Evaluation } from '@/types';
import { clientService } from '@/services/clientService';
import { evaluationService } from '@/services/evaluationService';
import { Language } from '@/i18n';

interface AppState {
  // Language
  language: Language;

  // Clients
  clients: Client[];
  clientsLoading: boolean;
  clientCount: number;

  // Recent evaluations
  recentEvaluations: Evaluation[];
  recentLoading: boolean;

  // Actions
  setLanguage: (language: Language) => void;
  loadClients: (trainerId: string) => Promise<void>;
  loadDashboard: (trainerId: string) => Promise<void>;
  addClient: (client: Client) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'pt',

  clients: [],
  clientsLoading: false,
  clientCount: 0,

  recentEvaluations: [],
  recentLoading: false,

  setLanguage: (language) => set({ language }),

  loadClients: async (trainerId) => {
    set({ clientsLoading: true });
    try {
      const { clients } = await clientService.listByTrainer(trainerId);
      const count = await clientService.getClientCount(trainerId);
      set({ clients, clientsLoading: false, clientCount: count });
    } catch (err) {
      console.error('Failed to load clients:', err);
      set({ clientsLoading: false });
    }
  },

  loadDashboard: async (trainerId) => {
    set({ clientsLoading: true, recentLoading: true });
    try {
      const [{ clients }, count, recentEvaluations] = await Promise.all([
        clientService.listByTrainer(trainerId),
        clientService.getClientCount(trainerId),
        evaluationService.getRecentByTrainer(trainerId, 5),
      ]);
      set({
        clients,
        clientCount: count,
        recentEvaluations,
        clientsLoading: false,
        recentLoading: false,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      set({ clientsLoading: false, recentLoading: false });
    }
  },

  addClient: (client) => {
    set((state) => ({
      clients: [client, ...state.clients],
      clientCount: state.clientCount + 1,
    }));
  },

  reset: () => {
    set({
      clients: [],
      clientsLoading: false,
      clientCount: 0,
      recentEvaluations: [],
      recentLoading: false,
    });
  },
}));
