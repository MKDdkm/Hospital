import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Redirects unauthenticated users to /login.
 * Optionally restricts access to specific roles — wrong-role users are sent
 * back to their own dashboard instead of seeing a blank/broken page.
 */
const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
