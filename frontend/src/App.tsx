/**
 * Campus Recover — Root Application Component
 *
 * Sets up routing, authentication state, and protected views.
 */

import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthProvider } from "@/store/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { DashboardPage } from "@/pages/student/DashboardPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { UserRole } from "@/types";
import { Shield, Sparkles, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";

function HomeOverview() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-6"
        >
          <Sparkles className="w-4 h-4 text-accent-400" />
          <span>Intelligent Multi-Modal Recovery Engine</span>
        </motion.div>

        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-tight mb-6">
          Lost something on campus? <br />
          <span className="gradient-text">Let AI help you find it.</span>
        </h1>

        <p className="text-surface-400 text-base sm:text-lg mb-8 leading-relaxed">
          Campus Recover connects lost and found reports and intelligently identifies
          potential matches using AI, location, time, and visual similarity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 shadow-glow transition flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-medium text-surface-300 hover:text-white bg-surface-900 hover:bg-surface-850 border border-surface-800 transition"
          >
            Sign In with Campus ID
          </Link>
        </div>
      </div>

      {/* System Status & Roadmap Progress */}
      <div className="max-w-2xl mx-auto bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-3xl p-6 sm:p-8 shadow-glass">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          System Status & Architecture
        </h2>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-surface-800/50 text-sm">
            <span className="text-white font-medium">Frontend</span>
            <span className="text-accent-400 flex items-center gap-1.5 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-accent-400" /> Online
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-surface-800/50 text-sm">
            <span className="text-white font-medium">FastAPI Backend</span>
            <span
              className={`flex items-center gap-1.5 font-mono text-xs ${
                backendStatus === "online" ? "text-accent-400" : "text-warning-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "online" ? "bg-accent-400" : "bg-warning-400 animate-pulse"
                }`}
              />
              {backendStatus === "online" ? "Online" : "Checking..."}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-surface-800/50 text-sm">
            <span className="text-white font-medium">Authentication Module</span>
            <span className="text-accent-400 flex items-center gap-1.5 font-mono text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> JWT & Bcrypt Active
            </span>
          </div>
        </div>

        {/* Phase checklist */}
        <div className="pt-4 border-t border-surface-800">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <PhaseBadge phase={1} label="Architecture & Setup" done />
            <PhaseBadge phase={2} label="Database & Items CRUD" done />
            <PhaseBadge phase={3} label="Authentication" done />
            <PhaseBadge phase={4} label="Frontend Foundation" />
            <PhaseBadge phase={5} label="Lost/Found Reports" />
            <PhaseBadge phase={6} label="Search & Browse" />
            <PhaseBadge phase={7} label="AI Text Matching" />
            <PhaseBadge phase={8} label="Location/Time Matching" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseBadge({ phase, label, done = false }: { phase: number; label: string; done?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-xl border ${
        done
          ? "bg-accent-500/10 border-accent-500/20 text-accent-300 font-medium"
          : "bg-surface-800/30 border-surface-800 text-surface-500"
      }`}
    >
      <MapPin className={`w-3.5 h-3.5 ${done ? "text-accent-400" : "text-surface-600"}`} />
      <span className="font-mono text-[10px]">{String(phase).padStart(2, "0")}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col font-sans selection:bg-primary-500 selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomeOverview />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole={UserRole.ADMIN}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<HomeOverview />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
