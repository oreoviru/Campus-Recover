import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/store/NotificationContext";
import { UserRole } from "@/types";
import {
  LayoutDashboard,
  Search,
  PackagePlus,
  HelpCircle,
  Sparkles,
  FileText,
  ShieldCheck,
  ShieldAlert,
  PackageCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  className = "",
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    {
      label: "Overview",
      to: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      label: "Browse Registry",
      to: "/browse",
      icon: <Search className="w-5 h-5 shrink-0" />,
    },
    {
      label: "Report Lost Item",
      to: "/report-lost",
      icon: <HelpCircle className="w-5 h-5 shrink-0" />,
    },
    {
      label: "Report Found Item",
      to: "/report-found",
      icon: <PackagePlus className="w-5 h-5 shrink-0" />,
    },
    {
      label: "My Reports",
      to: "/my-reports",
      icon: <FileText className="w-5 h-5 shrink-0" />,
    },
    {
      label: "My Claims",
      to: "/my-claims",
      icon: <PackageCheck className="w-5 h-5 shrink-0" />,
    },
    {
      label: "AI Matches",
      to: "/matches",
      icon: <Sparkles className="w-5 h-5 shrink-0 text-accent-400" />,
      badge: "AI",
    },
    {
      label: "Notifications",
      to: "/notifications",
      icon: <Bell className="w-5 h-5 shrink-0" />,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : undefined,
    },
  ];

  if (user?.role === UserRole.ADMIN) {
    navItems.push({
      label: "Admin Console",
      to: "/admin",
      icon: <ShieldCheck className="w-5 h-5 shrink-0 text-danger-400" />,
      badge: "Staff",
    });
    navItems.push({
      label: "Claims Review",
      to: "/admin/claims",
      icon: <ShieldAlert className="w-5 h-5 shrink-0 text-warning-400" />,
      badge: "Admin",
    });
  }

  const isActive = (to: string) => location.pathname === to;

  return (
    <aside
      className={`bg-surface-950/90 border-r border-surface-850 flex flex-col transition-all duration-300 select-none ${
        isCollapsed ? "w-20" : "w-64"
      } ${className}`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-primary-600/15 text-primary-300 border border-primary-500/30 shadow-sm"
                  : "text-surface-400 hover:text-white hover:bg-surface-900 border border-transparent"
              }`}
            >
              <span
                className={`transition-colors ${
                  active ? "text-primary-400" : "text-surface-400 group-hover:text-white"
                }`}
              >
                {item.icon}
              </span>

              {!isCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-800 text-surface-400 border border-surface-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle Footer Button */}
      <div className="p-3 border-t border-surface-850 hidden lg:block">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-900 transition border border-transparent hover:border-surface-800"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium w-full px-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
