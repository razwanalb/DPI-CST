
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading, authError } = useAuth();
  const location = useLocation();

  // 1. First, check for critical connection errors.
  if (authError) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-background text-text p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-red-400 mb-4">gpp_bad</span>
              <h1 className="text-2xl font-bold text-red-300">Authentication System Error</h1>
              <p className="mt-2 text-text/80 max-w-2xl bg-surface border border-border p-4 rounded-lg">
                  {authError}
              </p>
              <p className="mt-6 text-sm text-text/60">
                  Please resolve the issue described above and then refresh the page.
              </p>
          </div>
      );
  }

  // 2. While the initial session and role check is happening, show a loading screen.
  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
    );
  }

  // 3. After loading, if there's no logged-in user, redirect to login.
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. CRITICAL FIX: After loading, if a user is logged in but their role has NOT been confirmed as 'admin',
  // it means they are not authorized. Redirect them to login. This prevents the race condition.
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
      return <Navigate to="/login" replace />;
  }

  // 5. If all checks pass, the user is authenticated and authorized. Show the content.
  return <>{children}</>;
};

export default ProtectedRoute;