import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types";
import * as api from "@/lib/api";
import { MOCK_USERS } from "@/lib/mock-data";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
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

      // Demo role switcher helper
      switchRole: (role) => {
        if (role === "guest") {
          set({ user: null });
        } else if (role === "librarian") {
          set({ user: MOCK_USERS[1] }); // Elena Vance
        } else if (role === "admin") {
          set({ user: MOCK_USERS[2] }); // Vikram Malhotra
        } else {
          set({ user: MOCK_USERS[0] }); // Amelia Moore (user)
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "shabdkunj-auth",
    }
  )
);
