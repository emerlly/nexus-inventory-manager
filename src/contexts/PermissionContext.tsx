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

const getNested = (obj: Record<string, unknown>, path: string[]): unknown => {
  return path.reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
};

const normalizePermissions = (value: string[]): string[] => {
  return Array.from(new Set(value.map((permission) => permission.trim().toLowerCase()).filter(Boolean)));
};

const extractPermissions = (me: unknown): string[] => {
  if (!me || typeof me !== "object") return [];
  const response = me as Record<string, unknown>;

  const candidates: unknown[] = [
    response.permissions,
    response.rolePermissions,
    response.role_permissions,
    response.userPermissions,
    response.user_permissions,
    getNested(response, ["user", "permissions"]),
    getNested(response, ["user", "rolePermissions"]),
    getNested(response, ["user", "role_permissions"]),
    getNested(response, ["data", "permissions"]),
    getNested(response, ["data", "user", "permissions"]),
  ];

  const firstNonEmpty = candidates.map(normalizeStringArray).find((list) => list.length > 0) || [];
  return normalizePermissions(firstNonEmpty);
};

const extractAllowedRoutes = (me: unknown): string[] => {
  if (!me || typeof me !== "object") return [];
  const response = me as Record<string, unknown>;

  const candidates: unknown[] = [
    response.allowedRoutes,
    response.allowed_routes,
    response.routes,
    getNested(response, ["user", "allowedRoutes"]),
    getNested(response, ["user", "allowed_routes"]),
    getNested(response, ["data", "allowedRoutes"]),
    getNested(response, ["data", "allowed_routes"]),
    getNested(response, ["data", "user", "allowedRoutes"]),
  ];

  return candidates.map(normalizeStringArray).find((list) => list.length > 0) || [];
};

// Mapeamento de permissões para rotas (Fallback se o backend não enviar allowedRoutes)
const PERMISSION_TO_ROUTES: Record<string, string[]> = {
  [PERMISSIONS.DASHBOARD_VIEW]: ["/"],
  [PERMISSIONS.PRODUCTS_VIEW]: ["/products"],
  [PERMISSIONS.SALES_VIEW]: ["/sales", "/sales/analytics"],
  [PERMISSIONS.ORDERS_VIEW]: ["/orders", "/budgets"],
  [PERMISSIONS.PAYMENTS_VIEW]: ["/payments", "/financeiro", "/cashflow"],
  [PERMISSIONS.CUSTOMERS_VIEW]: ["/customers", "/suppliers", "/crm"],
  [PERMISSIONS.CATEGORIES_VIEW]: ["/categories"],
  [PERMISSIONS.INVENTORY_VIEW]: ["/inventory", "/stock/movements"],
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
      hasAnyPermission: (required: string[]) => required.some((permission) => permissions.includes(permission.toLowerCase())),
      canAccessRoute: (path: string) => {
        if (allowedRoutes.length === 0) return true;
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
