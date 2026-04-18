import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS } from "@/constants/permissions";

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

// Mapeamento de permissões para rotas (Fallback se o backend não enviar allowedRoutes)
const PERMISSION_TO_ROUTES: Record<string, string[]> = {
  [PERMISSIONS.DASHBOARD_VIEW]: ["/"],
  [PERMISSIONS.PRODUCTS_VIEW]: ["/products"],
  [PERMISSIONS.SALES_VIEW]: ["/sales", "/sales/analytics"],
  [PERMISSIONS.ORDERS_VIEW]: ["/orders", "/budgets"],
  [PERMISSIONS.PAYMENTS_VIEW]: ["/payments", "/financeiro", "/cashflow"],
  [PERMISSIONS.CUSTOMERS_VIEW]: ["/customers"],
  [PERMISSIONS.CATEGORIES_VIEW]: ["/categories"],
  [PERMISSIONS.INVENTORY_VIEW]: ["/inventory"],
  [PERMISSIONS.USERS_VIEW]: ["/users"],
  [PERMISSIONS.COMPANY_SETTINGS]: ["/settings/company", "/settings/integrations"],
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
      const perms = extractPermissions(me);
      let routes = extractAllowedRoutes(me).map(normalizePath);

      // Fallback: Se o backend não enviou rotas, gera com base nas permissões
      if (routes.length === 0) {
        const generatedRoutes = new Set<string>();
        perms.forEach(p => {
          if (PERMISSION_TO_ROUTES[p]) {
            PERMISSION_TO_ROUTES[p].forEach(r => generatedRoutes.add(r));
          }
        });
        routes = Array.from(generatedRoutes).map(normalizePath);
      }

      setPermissions(perms);
      setAllowedRoutes(routes);
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
        if (allowedRoutes.length === 0) return false; // Mudado para false para ser restritivo
        const normalizedPath = normalizePath(path);
        if (allowedRoutes.includes(normalizedPath)) return true;
        return allowedRoutes.some((route) => route !== "/" && normalizedPath.startsWith(`${route}/`));
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