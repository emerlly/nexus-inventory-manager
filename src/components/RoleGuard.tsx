import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/contexts/PermissionContext";
import { useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
  fallbackPath?: string;
}

export function RoleGuard({ children, requiredPermissions = [], fallback, fallbackPath = "/" }: RoleGuardProps) {
  const location = useLocation();
  const { loading, hasAnyPermission, canAccessRoute } = usePermissions();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <Navigate to="/login" replace />;
  }

  const routeAllowed = canAccessRoute(location.pathname);
  const normalizedUserPermissions = (user.permissions || []).map((permission) => permission.toLowerCase());
  const hasAllUserPermissions = requiredPermissions.every((permission) =>
    normalizedUserPermissions.includes(permission.toLowerCase())
  );
  const permissionAllowed =
    requiredPermissions.length === 0 || hasAllUserPermissions || hasAnyPermission(requiredPermissions);

  if (!routeAllowed && !permissionAllowed) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
