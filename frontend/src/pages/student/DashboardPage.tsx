/**
 * Campus Recover — Student / User Dashboard Page
 */

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck,
  Search,
  PackagePlus,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface-900/40 backdrop-blur-xl border border-surface-800 p-6 sm:p-8 rounded-3xl"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold text-white">
              Welcome, {user?.name}
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-accent-500/10 text-accent-400 border border-accent-500/20">
              {user?.role}
            </span>
          </div>
          <p className="text-surface-400 text-sm">
            Institutional Account: <span className="text-surface-200">{user?.email}</span>
            {user?.student_id && (
              <span className="ml-3 font-mono text-surface-400">• ID: {user.student_id}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-800/80 border border-surface-700/60 text-xs text-accent-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-accent-400" />
            <span>JWT Session Verified</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Counter Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Lost Reports"
          value="0"
          icon={<Clock className="w-5 h-5 text-primary-400" />}
          subtext="Items you are looking for"
        />
        <StatCard
          label="Active Found Reports"
          value="0"
          icon={<Layers className="w-5 h-5 text-warning-400" />}
          subtext="Items in campus custody"
        />
        <StatCard
          label="Potential AI Matches"
          value="0"
          icon={<Sparkles className="w-5 h-5 text-accent-400" />}
          subtext="Algorithms scanning reports"
        />
        <StatCard
          label="Successfully Recovered"
          value="0"
          icon={<CheckCircle2 className="w-5 h-5 text-accent-400" />}
          subtext="Returned to rightful owners"
        />
      </div>

      {/* Quick Action Navigation */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Report Lost Item"
          description="Submit detailed characteristics, campus location, and approximate loss time for automated AI matching."
          icon={<HelpCircle className="w-6 h-6 text-primary-400" />}
          badge="Step-by-Step"
          to="/report-lost"
          accent="primary"
        />
        <ActionCard
          title="Report Found Item"
          description="Register an item found on campus with optional private ownership verification challenges."
          icon={<PackagePlus className="w-6 h-6 text-accent-400" />}
          badge="Finder Protocol"
          to="/report-found"
          accent="accent"
        />
        <ActionCard
          title="Search & Browse"
          description="Explore active public campus listings with category filters, keyword query, and interactive map geolocations."
          icon={<Search className="w-6 h-6 text-warning-400" />}
          badge="Public Registry"
          to="/browse"
          accent="warning"
        />
      </div>
    </div>
  );
};

function StatCard({
  label,
  value,
  icon,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext: string;
}) {
  return (
    <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-surface-400 text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <div className="p-2 rounded-xl bg-surface-800/80">{icon}</div>
      </div>
      <div className="text-2xl font-bold font-display text-white mb-1">{value}</div>
      <div className="text-[11px] text-surface-500">{subtext}</div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  badge,
  to,
  accent,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  to: string;
  accent: "primary" | "accent" | "warning";
}) {
  const borderColors = {
    primary: "hover:border-primary-500/50 hover:shadow-glow",
    accent: "hover:border-accent-500/50 hover:shadow-glow-accent",
    warning: "hover:border-warning-500/50",
  };

  return (
    <Link
      to={to}
      className={`group bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-2xl transition duration-200 ${borderColors[accent]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-800 text-surface-400 border border-surface-700/50">
          {badge}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors">
        {title}
      </h3>
      <p className="text-surface-400 text-xs leading-relaxed">{description}</p>
    </Link>
  );
}
