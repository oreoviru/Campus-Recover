/**
 * Campus Recover — Responsive Authenticated Navbar
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import {
  Radar,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Menu,
  X,
  LayoutDashboard,
  Search,
  HelpCircle,
  PackagePlus,
  Bell,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNotifications } from "@/store/NotificationContext";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-surface-950/85 backdrop-blur-2xl border-b border-surface-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-display font-bold text-white tracking-tight">
                Campus <span className="gradient-text">Recover</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-primary-950 text-primary-400 border border-primary-800">
                AI Powered
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive("/")
                  ? "bg-surface-850 text-white shadow-sm"
                  : "text-surface-400 hover:text-white hover:bg-surface-900"
              }`}
            >
              Overview
            </Link>

            <Link
              to="/browse"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive("/browse")
                  ? "bg-surface-850 text-white shadow-sm"
                  : "text-surface-400 hover:text-white hover:bg-surface-900"
              }`}
            >
              Browse Registry
            </Link>

            <Link
              to="/map"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive("/map")
                  ? "bg-surface-850 text-white shadow-sm"
                  : "text-surface-400 hover:text-white hover:bg-surface-900"
              }`}
            >
              Campus Map
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "bg-surface-850 text-white shadow-sm"
                    : "text-surface-400 hover:text-white hover:bg-surface-900"
                }`}
              >
                Dashboard
              </Link>
            )}

            {user?.role === UserRole.ADMIN && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/admin")
                    ? "bg-danger-500/15 text-danger-300 border border-danger-500/30"
                    : "text-danger-400 hover:text-danger-300 hover:bg-danger-500/10"
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
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Notification Dropdown Bell */}
                <NotificationDropdown />

                {/* User Info & Role Badge */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-900/80 border border-surface-800">
                  <div className="w-7 h-7 rounded-lg bg-surface-800 flex items-center justify-center text-primary-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-surface-400 truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                  <Badge
                    size="sm"
                    variant={
                      user.role === UserRole.ADMIN
                        ? "danger"
                        : user.role === UserRole.STAFF
                        ? "warning"
                        : "accent"
                    }
                  >
                    {user.role}
                  </Badge>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 border border-transparent hover:border-danger-500/20 transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-850 transition"
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

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-850 focus-ring"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-850 bg-surface-950 px-4 pt-3 pb-6 space-y-3 animate-slide-down">
          {isAuthenticated && user && (
            <div className="p-3 rounded-2xl bg-surface-900 border border-surface-800 mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-xs text-surface-400">{user.email}</div>
              </div>
              <Badge
                size="sm"
                variant={
                  user.role === UserRole.ADMIN
                    ? "danger"
                    : user.role === UserRole.STAFF
                    ? "warning"
                    : "accent"
                }
              >
                {user.role}
              </Badge>
            </div>
          )}

          <nav className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
            >
              <Radar className="w-5 h-5 text-primary-400" />
              <span>Overview</span>
            </Link>

            <Link
              to="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
            >
              <Search className="w-5 h-5 text-accent-400" />
              <span>Browse Items</span>
            </Link>

            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
            >
              <Compass className="w-5 h-5 text-primary-400" />
              <span>Campus Map</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
                >
                  <LayoutDashboard className="w-5 h-5 text-primary-400" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/report-lost"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
                >
                  <HelpCircle className="w-5 h-5 text-warning-400" />
                  <span>Report Lost Item</span>
                </Link>

                <Link
                  to="/report-found"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
                >
                  <PackagePlus className="w-5 h-5 text-accent-400" />
                  <span>Report Found Item</span>
                </Link>

                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-surface-300 hover:bg-surface-900 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary-400" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {user?.role === UserRole.ADMIN && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-400 hover:bg-danger-500/10"
                  >
                    <ShieldCheck className="w-5 h-5 text-danger-400" />
                    <span>Admin Console</span>
                  </Link>
                )}

                <div className="pt-3 border-t border-surface-850 mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-400 hover:bg-danger-500/10"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-surface-850">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-xl text-sm font-medium bg-surface-900 hover:bg-surface-850 text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
