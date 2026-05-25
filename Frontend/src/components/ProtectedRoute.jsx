import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component.
 * Redirects to login if user is unauthenticated.
 * Redirects to dashboard if user has insufficient permissions (e.g. employee trying to access owner settings).
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save location to redirect back after logging in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if restrict parameters are set
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
