/**
 * Campus Recover — Root Application Component
 *
 * Sets up routing, global auth state, layouts, and protected views.
 */

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/store/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { DashboardPage } from "@/pages/student/DashboardPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { UserRole } from "@/types";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes with Navbar and Footer (no sidebar) */}
        <Route
          path="/"
          element={
            <AppLayout showSidebar={false}>
              <LandingPage />
            </AppLayout>
          }
        />
        <Route
          path="/login"
          element={
            <AppLayout showSidebar={false}>
              <LoginPage />
            </AppLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AppLayout showSidebar={false}>
              <RegisterPage />
            </AppLayout>
          }
        />

        {/* Authenticated Dashboard Views (with collapsible Sidebar) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Admin Console */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AppLayout showSidebar={true}>
                <AdminDashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback to Landing */}
        <Route
          path="*"
          element={
            <AppLayout showSidebar={false}>
              <LandingPage />
            </AppLayout>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
