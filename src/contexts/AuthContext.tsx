import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@/types";
import { authService } from "@/services";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const me = await authService.me();
      setUser(me.user);
    } catch (err) {
      console.error("Erro ao atualizar usuario:", err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem("nexus_token");

    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        setLoading(true);

        const res = await authService.login({ email, password });

        localStorage.setItem("nexus_token", res.token);
        if (res.refreshToken) {
          localStorage.setItem("nexus_refresh_token", res.refreshToken);
        }
        setToken(res.token);
        setUser(res.user);

        try {
          const me = await authService.me();
          setUser(me.user);
        } catch (err) {
          console.warn("Nao foi possivel atualizar usuario apos login; mantendo dados do login.", err);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao fazer login";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        refreshUser,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
