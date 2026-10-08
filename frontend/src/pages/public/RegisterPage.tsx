/**
 * Campus Recover — Registration Page
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { Radar, User, Mail, Lock, IdCard, Loader2, ArrowRight } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [studentId, setStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic client checks
    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const success = await register({
      name,
      email,
      password,
      role,
      student_id: studentId.trim() || undefined,
    });
    setIsSubmitting(false);

    if (success) {
      navigate("/dashboard");
    } else {
      setErrorMessage("Registration could not be completed. Check institutional domain and details.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-surface-900/70 backdrop-blur-2xl border border-surface-800 rounded-3xl p-8 shadow-glass relative overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow mx-auto mb-4">
            <Radar className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Create Campus Account</h1>
          <p className="text-surface-400 text-sm mt-1">
            Join the automated lost & found recovery network
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm text-center"
          >
            {errorMessage}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition placeholder:text-surface-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@student.university.edu"
                className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition placeholder:text-surface-600"
              />
            </div>
            <p className="text-[11px] text-surface-500 mt-1">
              Must use @student.university.edu or @university.edu domain
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition placeholder:text-surface-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5">
                Campus Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition"
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.STAFF}>Staff / Faculty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1.5">
                Student / Staff ID
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU-1029"
                  className="w-full bg-surface-950/60 border border-surface-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition placeholder:text-surface-600"
                />
              </div>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-surface-400">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-300 font-semibold transition"
          >
            Sign in here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
