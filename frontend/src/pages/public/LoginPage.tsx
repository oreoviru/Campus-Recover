/**
 * Campus Recover — Login Page
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Radar, Mail, Lock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const success = await login({ email, password });
    setIsSubmitting(false);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage("Authentication failed. Please verify your email and password.");
    }
  };

  // Quick fill helper for demo/evaluation
  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-surface-900/70 backdrop-blur-2xl border border-surface-800 rounded-3xl p-8 shadow-glass relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow mx-auto mb-4">
            <Radar className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Institutional Sign In</h1>
          <p className="text-surface-400 text-sm mt-1">
            Access your campus recovery dashboard
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm text-center"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@student.university.edu"
                className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition placeholder:text-surface-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition placeholder:text-surface-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition group mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-surface-800/80">
          <div className="flex items-center justify-between mb-3 text-xs text-surface-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-400" /> Demo Quick Login:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials("jane.doe@student.university.edu", "Student@12345")}
              className="px-3 py-2 rounded-lg bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/50 text-left transition"
            >
              <div className="font-semibold text-accent-400">Student</div>
              <div className="text-[10px] text-surface-400 truncate">jane.doe@...</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("admin@university.edu", "Admin@12345")}
              className="px-3 py-2 rounded-lg bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/50 text-left transition"
            >
              <div className="font-semibold text-primary-400">Admin</div>
              <div className="text-[10px] text-surface-400 truncate">admin@...</div>
            </button>
          </div>
        </div>

        {/* Register link */}
        <div className="text-center mt-6 text-sm text-surface-400">
          Don't have an institutional account?{" "}
          <Link
            to="/register"
            className="text-primary-400 hover:text-primary-300 font-semibold transition"
          >
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
