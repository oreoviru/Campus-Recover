/**
 * Campus Recover — Admin Dashboard Page
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { ApiResponse } from "@/types";
import { ShieldCheck, Users, ShieldAlert, CheckCircle, Database, ArrowRight } from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [adminCheckData, setAdminCheckData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      try {
        const res = await apiClient.get<ApiResponse<any>>("/auth/admin-check");
        if (res.data.success) {
          setAdminCheckData(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to confirm administrator privileges.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminPrivileges();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 bg-surface-900/40 backdrop-blur-xl border border-surface-800 p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-white">
                Campus Admin Console
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-danger-500/10 text-danger-400 border border-danger-500/20">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-surface-400 text-sm">
              Logged in as <span className="text-white font-medium">{user?.name}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-2 rounded-xl bg-danger-500/10 border border-danger-500/30 text-xs text-danger-400 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Role: {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Privileges Verification Card */}
      <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-2xl mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-400" />
          Backend Role-Based Access Control Verification
        </h2>

        {loading ? (
          <p className="text-surface-400 text-sm">Validating role with /auth/admin-check...</p>
        ) : error ? (
          <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-300 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-accent-400" />
              <span>
                Backend successfully verified ADMIN credentials via <code className="font-mono text-xs bg-surface-900 px-1 py-0.5 rounded">require_admin</code> dependency.
              </span>
            </div>
            <div className="bg-surface-950/60 rounded-xl p-4 font-mono text-xs text-surface-300">
              <pre>{JSON.stringify(adminCheckData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Admin Modules Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-900/50 border border-surface-800 p-6 rounded-2xl">
          <Users className="w-8 h-8 text-primary-400 mb-3" />
          <h3 className="text-white font-semibold mb-1">User Management</h3>
          <p className="text-surface-400 text-xs">Review student accounts, deactivate fraudulent profiles, manage roles.</p>
        </div>
        <Link
          to="/admin/claims"
          className="bg-surface-900/50 hover:bg-surface-900/80 border border-surface-800 hover:border-warning-500/40 p-6 rounded-2xl transition group block"
        >
          <div className="flex items-center justify-between mb-3">
            <ShieldAlert className="w-8 h-8 text-warning-400" />
            <ArrowRight className="w-4 h-4 text-surface-500 group-hover:text-warning-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-white font-semibold mb-1 group-hover:text-warning-300 transition">
            Claim Moderation & Verification
          </h3>
          <p className="text-surface-400 text-xs">
            Review disputes, inspect verification proof, prevent fraud, and approve custody handovers.
          </p>
        </Link>
        <div className="bg-surface-900/50 border border-surface-800 p-6 rounded-2xl">
          <Database className="w-8 h-8 text-accent-400 mb-3" />
          <h3 className="text-white font-semibold mb-1">Campus Locations</h3>
          <p className="text-surface-400 text-xs">Configure campus buildings, geo coordinates, and hotspot zones.</p>
        </div>
      </div>
    </div>
  );
};
