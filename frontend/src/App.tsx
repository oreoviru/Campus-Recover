/**
 * Campus Recover — Root Application Component
 *
 * Sets up routing, global auth state, layouts, and protected views.
 */

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/store/AuthContext";
import { NotificationProvider } from "@/store/NotificationContext";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { BrowseItemsPage } from "@/pages/public/BrowseItemsPage";
import { ItemDetailPage } from "@/pages/public/ItemDetailPage";
import { DashboardPage } from "@/pages/student/DashboardPage";
import { ReportLostPage } from "@/pages/student/ReportLostPage";
import { ReportFoundPage } from "@/pages/student/ReportFoundPage";
import { MyReportsPage } from "@/pages/student/MyReportsPage";
import { MatchesPage } from "@/pages/student/MatchesPage";
import { NotificationsPage } from "@/pages/student/NotificationsPage";
import { ClaimVerificationPage } from "@/pages/student/ClaimVerificationPage";
import { MyClaimsPage } from "@/pages/student/MyClaimsPage";
import { ClaimDetailPage } from "@/pages/student/ClaimDetailPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminClaimsPage } from "@/pages/admin/AdminClaimsPage";
import { UserRole } from "@/types";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
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
        <Route
          path="/browse"
          element={
            <AppLayout showSidebar={false}>
              <BrowseItemsPage />
            </AppLayout>
          }
        />
        <Route
          path="/items/:id"
          element={
            <AppLayout showSidebar={false}>
              <ItemDetailPage />
            </AppLayout>
          }
        />

        {/* Authenticated Student Views (with collapsible Sidebar) */}
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
        <Route
          path="/report-lost"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <ReportLostPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-found"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <ReportFoundPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <MyReportsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <MatchesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <NotificationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items/:id/claim"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <ClaimVerificationPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-claims"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <MyClaimsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/claims/:id"
          element={
            <ProtectedRoute>
              <AppLayout showSidebar={true}>
                <ClaimDetailPage />
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
        <Route
          path="/admin/claims"
          element={
            <ProtectedRoute requiredRole={UserRole.ADMIN}>
              <AppLayout showSidebar={true}>
                <AdminClaimsPage />
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
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
