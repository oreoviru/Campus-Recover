/**
 * Campus Recover — Protected Route Component
 *
 * Enforces authentication and optional role-based access control.
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { ShieldAlert, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-surface-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p className="text-sm">Verifying institutional credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-900/60 backdrop-blur-xl border border-danger-500/30 rounded-2xl p-8 text-center shadow-glass">
          <div className="w-16 h-16 rounded-full bg-danger-500/10 text-danger-400 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-surface-400 text-sm mb-6">
            This area requires <span className="text-danger-400 font-semibold">{requiredRole}</span> privileges.
            Your current account role is <span className="text-primary-400 font-semibold">{user.role}</span>.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-medium transition"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
