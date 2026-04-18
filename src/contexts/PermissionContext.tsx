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
      setPermissions(me.permissions || []);
      setAllowedRoutes((me.allowedRoutes || []).map(normalizePath));
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
