/**
 * Campus Recover — Institutional Registration Page
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { User, Mail, Lock, IdCard, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { isInstitutionalEmail } from "@/utils/sanitize";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [studentId, setStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    clearError();

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!isInstitutionalEmail(email)) {
      setErrorMessage("Please use your official college email (@nst.rishihood.edu.in or @rishihood.edu.in).");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const success = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      student_id: studentId.trim() || undefined,
    });
    setIsSubmitting(false);

    if (success) {
      navigate("/dashboard");
    }
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
              <Badge variant="accent" size="sm">
                New Account
              </Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Register for Campus Recover</CardTitle>
            <CardDescription>
              Join the institutional network to report lost belongings and verify matches.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {(errorMessage || authError) && (
              <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-xs sm:text-sm text-center">
                {errorMessage || authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                leftIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Institutional Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="viraj.s26387@nst.rishihood.edu.in"
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Must be @nst.rishihood.edu.in or @rishihood.edu.in"
              />

              <Input
                label="Password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Campus Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  options={[
                    { value: UserRole.STUDENT, label: "Student" },
                    { value: UserRole.STAFF, label: "Staff / Faculty" },
                  ]}
                />

                <Input
                  label="Student / Staff ID"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU-1029"
                  leftIcon={<IdCard className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full mt-6 shadow-glow-accent"
              >
                Create Account
              </Button>
            </form>

            <div className="text-center mt-6 text-xs text-surface-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-semibold transition"
              >
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
