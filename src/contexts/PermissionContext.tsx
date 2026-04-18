import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionContextType {
  permissions: string[];
  allowedRoutes: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (required: string[]) => boolean;
  canAccessRoute: (path: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

const normalizePath = (path: string) => {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const extractPermissions = (me: unknown): string[] => {
  if (!me || typeof me !== "object") return [];
  const response = me as Record<string, unknown>;
  const direct = normalizeStringArray(response.permissions);
  if (direct.length > 0) return direct;
  const nestedUser = response.user;
  if (!nestedUser || typeof nestedUser !== "object") return [];
  return normalizeStringArray((nestedUser as Record<string, unknown>).permissions);
};

const extractAllowedRoutes = (me: unknown): string[] => {
  if (!me || typeof me !== "object") return [];
  const response = me as Record<string, unknown>;
  const direct = normalizeStringArray(response.allowedRoutes);
  if (direct.length > 0) return direct;
  const nestedUser = response.user;
  if (!nestedUser || typeof nestedUser !== "object") return [];
  return normalizeStringArray((nestedUser as Record<string, unknown>).allowedRoutes);
};

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setPermissions([]);
      setAllowedRoutes([]);
      return;
    }

    setLoading(true);

    try {
      const me = await authService.me();
      setPermissions(extractPermissions(me));
      setAllowedRoutes(extractAllowedRoutes(me).map(normalizePath));
    } catch {
      setPermissions([]);
      setAllowedRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const value = useMemo<PermissionContextType>(
    () => ({
      permissions,
      allowedRoutes,
      loading,
      hasPermission: (permission: string) => permissions.includes(permission),
      hasAnyPermission: (required: string[]) => required.some((permission) => permissions.includes(permission)),
      canAccessRoute: (path: string) => {
        if (allowedRoutes.length === 0) return true;
        const normalizedPath = normalizePath(path);
        if (allowedRoutes.includes(normalizedPath)) return true;
        return allowedRoutes.some((route) => normalizedPath.startsWith(`${route}/`));
      },
      refreshPermissions,
    }),
    [permissions, allowedRoutes, loading, refreshPermissions]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error("usePermissions must be used within PermissionProvider");
  return context;
}
