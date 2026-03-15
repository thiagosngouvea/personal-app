import { create } from 'zustand';
import { User } from 'firebase/auth';
import { authService } from '@/services/authService';
import { studentAuthService } from '@/services/studentAuthService';
import { UserRole, StudentProfile } from '@/types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  studentProfile: StudentProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signUp: (email: string, password: string, name: string, photoUri?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserRole>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  studentProfile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    const unsubscribe = authService.onAuthChanged(async (user) => {
      if (user) {
        // Determine role
        const role = await studentAuthService.getUserRole(user.uid);
        let studentProfile: StudentProfile | null = null;
        if (role === 'student') {
          studentProfile = await studentAuthService.getStudentProfile(user.uid);
        }
        set({ user, role, studentProfile, isInitialized: true, isLoading: false });
      } else {
        set({ user: null, role: null, studentProfile: null, isInitialized: true, isLoading: false });
      }
    });
    return unsubscribe;
  },

  signUp: async (email, password, name, photoUri) => {
    set({ isLoading: true, error: null });
    try {
      await authService.signUp(email, password, name, photoUri);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      const role = await studentAuthService.getUserRole(user.uid);
      let studentProfile: StudentProfile | null = null;
      if (role === 'student') {
        studentProfile = await studentAuthService.getStudentProfile(user.uid);
      }
      set({ role, studentProfile, isLoading: false });
      return role;
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
      set({ user: null, role: null, studentProfile: null, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
