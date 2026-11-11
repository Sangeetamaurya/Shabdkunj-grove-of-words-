import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types";
import * as api from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  demoLogin: (role: UserRole) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole | "guest") => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Default to guest (null) so Log In and Sign Up buttons are clearly visible in the Navbar
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = await api.login(email, password);
          set({ user, isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to log in", isLoading: false });
          return false;
        }
      },

      demoLogin: async (role) => {
        set({ isLoading: true, error: null });
        try {
          const user = await api.demoLogin(role);
          set({ user, isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || "Demo sign-in failed", isLoading: false });
          return false;
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = await api.signup(name, email, password);
          set({ user, isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || "Failed to sign up", isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await api.logout();
        set({ user: null, isLoading: false, error: null });
      },

      switchRole: (role) => {
        if (role === "guest") {
          void useAuthStore.getState().logout();
          return;
        }
        void useAuthStore.getState().demoLogin(role);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "shabdkunj-auth",
    }
  )
);
