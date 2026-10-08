/**
 * Campus Recover — Authenticated Navbar
 */

import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { Radar, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-display font-bold text-white tracking-tight">
                Campus <span className="text-accent-400">Recover</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-primary-950 text-primary-400 border border-primary-800">
                AI Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive("/")
                  ? "bg-surface-800 text-white"
                  : "text-surface-400 hover:text-white hover:bg-surface-850"
              }`}
            >
              Overview
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-surface-800 text-white"
                    : "text-surface-400 hover:text-white hover:bg-surface-850"
                }`}
              >
                Dashboard
              </Link>
            )}

            {user?.role === UserRole.ADMIN && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive("/admin")
                    ? "bg-primary-900/60 text-primary-300 border border-primary-700/50"
                    : "text-primary-400 hover:text-primary-300 hover:bg-primary-950/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </span>
              </Link>
            )}
          </nav>

          {/* Right Action / Auth State */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* User Info & Role Badge */}
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800">
                  <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center text-primary-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-surface-400">
                      {user.email}
                    </span>
                  </div>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider ${
                      user.role === UserRole.ADMIN
                        ? "bg-danger-500/10 text-danger-400 border border-danger-500/20"
                        : user.role === UserRole.STAFF
                        ? "bg-warning-500/10 text-warning-400 border border-warning-500/20"
                        : "bg-accent-500/10 text-accent-400 border border-accent-500/20"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 border border-transparent hover:border-danger-500/20 transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white shadow-glow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
