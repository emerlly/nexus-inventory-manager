import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/contexts/PermissionContext";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export function RoleGuard({ children, requiredPermissions = [], fallbackPath = "/" }: RoleGuardProps) {
  const location = useLocation();
  const { loading, hasAnyPermission, canAccessRoute } = usePermissions();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const routeAllowed = canAccessRoute(location.pathname);
  const permissionAllowed = requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);

  if (!routeAllowed && !permissionAllowed) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
