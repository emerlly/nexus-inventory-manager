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
  { path: "/orders", roles: ["admin", "gerente", "vendedor"] },
  { path: "/payments", roles: ["admin", "gerente"] },
  { path: "/budgets", roles: ["admin", "gerente", "vendedor"] },
  { path: "/pricing", roles: ["admin", "gerente", "vendedor"] },
  { path: "/cashflow", roles: ["admin", "gerente"] },
  { path: "/crm", roles: ["admin", "gerente", "vendedor"] },
  { path: "/users", roles: ["admin", "gerente"] },
  { path: "/settings/company", roles: ["admin", "gerente"] },
];

export function hasRouteAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const permission = routePermissions.find((r) => r.path === path);
  // If no permission defined, deny by default
  if (!permission) return false;
  return permission.roles.includes(role as AppRole);
}

export function getAccessibleRoutes(role: string | undefined): string[] {
  if (!role) return [];
  return routePermissions
    .filter((r) => r.roles.includes(role as AppRole))
    .map((r) => r.path);
}
