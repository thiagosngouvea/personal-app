import { create } from 'zustand';
import { User } from 'firebase/auth';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    const unsubscribe = authService.onAuthChanged((user) => {
      set({ user, isInitialized: true, isLoading: false });
    });
    return unsubscribe;
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      await authService.signUp(email, password, name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await authService.signIn(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logOut();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
