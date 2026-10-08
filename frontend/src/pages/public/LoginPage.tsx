/**
 * Campus Recover — Institutional Login Page
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

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
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <Card glass className="p-2 sm:p-4 shadow-glass">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Badge variant="primary" size="sm">
                Institutional Access
              </Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Sign In to Campus Recover</CardTitle>
            <CardDescription>
              Use your authorized university email credentials to access matches and manage reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-xs sm:text-sm text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Institutional Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@student.university.edu"
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Must end in @student.university.edu or @university.edu"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full mt-6 shadow-glow"
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-surface-800">
              <div className="flex items-center gap-1.5 text-xs text-surface-400 mb-3 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
                <span>Demo One-Click Accounts:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillCredentials("jane.doe@student.university.edu", "Student@12345")}
                  className="px-3 py-2 rounded-xl bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/50 text-left transition"
                >
                  <div className="font-semibold text-accent-400">Student Account</div>
                  <div className="text-[10px] text-surface-400 truncate">jane.doe@...</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials("admin@university.edu", "Admin@12345")}
                  className="px-3 py-2 rounded-xl bg-surface-800/60 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/50 text-left transition"
                >
                  <div className="font-semibold text-primary-400">Admin Account</div>
                  <div className="text-[10px] text-surface-400 truncate">admin@...</div>
                </button>
              </div>
            </div>

            <div className="text-center mt-6 text-xs text-surface-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-400 hover:text-primary-300 font-semibold transition"
              >
                Create one now
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
