import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { hasRouteAccess } from "@/config/permissions";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();
  const location = useLocation();

  // If allowedRoles provided, use them directly; otherwise check permissions config
  const hasAccess = allowedRoles
    ? allowedRoles.includes(user?.role || "")
    : hasRouteAccess(user?.role, location.pathname);

  if (!user || !hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
