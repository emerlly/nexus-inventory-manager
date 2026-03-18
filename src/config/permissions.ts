// Role-based route permissions
// admin & gerente: full access
// vendedor: sales-focused routes
// estoquista: stock-focused routes

export type AppRole = "admin" | "gerente" | "vendedor" | "estoquista";

interface RoutePermission {
  path: string;
  roles: AppRole[];
}

const ALL_ROLES: AppRole[] = ["admin", "gerente", "vendedor", "estoquista"];

export const routePermissions: RoutePermission[] = [
  { path: "/", roles: ALL_ROLES },
  { path: "/products", roles: ALL_ROLES },
  { path: "/customers", roles: ["admin", "gerente", "vendedor"] },
  { path: "/suppliers", roles: ["admin", "gerente", "estoquista"] },
  { path: "/categories", roles: ["admin", "gerente", "estoquista"] },
  { path: "/sales", roles: ["admin", "gerente", "vendedor"] },
  { path: "/sales/analytics", roles: ["admin", "gerente", "vendedor"] },
  { path: "/stock/movements", roles: ["admin", "gerente", "estoquista"] },
  { path: "/orders", roles: ALL_ROLES },
  { path: "/payments", roles: ["admin", "gerente"] },
  { path: "/financeiro", roles: ["admin", "gerente"] },
  { path: "/budgets", roles: ["admin", "gerente", "vendedor"] },
  { path: "/pricing", roles: ["admin", "gerente", "vendedor"] },
  { path: "/cashflow", roles: ["admin", "gerente"] },
  { path: "/crm", roles: ["admin", "gerente", "vendedor"] },
  { path: "/users", roles: ["admin", "gerente"] },
  { path: "/settings/company", roles: ["admin", "gerente"] },
  { path: "/settings/integrations", roles: ["admin"] },
];

export function hasRouteAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const permission = routePermissions.find((r) => r.path === path);
  if (!permission) return false;
  return permission.roles.includes(role as AppRole);
}

export function getAccessibleRoutes(role: string | undefined): string[] {
  if (!role) return [];
  return routePermissions
    .filter((r) => r.roles.includes(role as AppRole))
    .map((r) => r.path);
}
