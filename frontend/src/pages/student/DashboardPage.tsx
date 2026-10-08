/**
 * Campus Recover — Student Dashboard Page
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
  ArrowRight,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-surface-900/80 via-surface-900/50 to-primary-950/30 border border-surface-800 shadow-glass"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Welcome, {user?.name}
              </h1>
              <Badge
                variant={
                  user?.role === "ADMIN"
                    ? "danger"
                    : user?.role === "STAFF"
                    ? "warning"
                    : "accent"
                }
              >
                {user?.role}
              </Badge>
            </div>
            <p className="text-surface-400 text-xs sm:text-sm">
              Institutional Email: <span className="text-surface-200">{user?.email}</span>
              {user?.student_id && (
                <span className="ml-3 font-mono text-surface-400">• ID: {user.student_id}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/report-lost">
              <Button
                variant="primary"
                size="md"
                leftIcon={<HelpCircle className="w-4 h-4" />}
                className="shadow-glow"
              >
                Report Lost Item
              </Button>
            </Link>
            <Link to="/report-found">
              <Button
                variant="accent"
                size="md"
                leftIcon={<PackagePlus className="w-4 h-4" />}
                className="shadow-glow-accent"
              >
                Report Found Item
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Counter Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="My Lost Reports"
          value="0"
          icon={<Clock className="w-5 h-5 text-primary-400" />}
          subtext="Active searches"
        />
        <StatCard
          label="My Found Reports"
          value="0"
          icon={<Layers className="w-5 h-5 text-warning-400" />}
          subtext="In custody"
        />
        <StatCard
          label="AI Match Candidates"
          value="0"
          icon={<Sparkles className="w-5 h-5 text-accent-400" />}
          subtext="High recovery score"
        />
        <StatCard
          label="Items Recovered"
          value="0"
          icon={<CheckCircle2 className="w-5 h-5 text-accent-400" />}
          subtext="Verified return"
        />
      </div>

      {/* Two Column Section: Quick Actions + Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Action Centers */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-400" />
              Recovery Action Gateways
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActionCard
                title="Report Lost Property"
                description="Input item category, color, marks, and last-known campus coordinates."
                icon={<HelpCircle className="w-6 h-6 text-primary-400" />}
                badge="Report"
                to="/report-lost"
                accent="primary"
              />
              <ActionCard
                title="Report Found Property"
                description="List found item with private verification challenges to protect legitimate owners."
                icon={<PackagePlus className="w-6 h-6 text-accent-400" />}
                badge="Custodian"
                to="/report-found"
                accent="accent"
              />
              <ActionCard
                title="Browse Campus Registry"
                description="Search active public listings by keywords, categories, and campus landmarks."
                icon={<Search className="w-6 h-6 text-warning-400" />}
                badge="Search"
                to="/browse"
                accent="warning"
              />
              <ActionCard
                title="View Match Queue"
                description="Check potential algorithmic matches calculated by Sentence-Transformers."
                icon={<Sparkles className="w-6 h-6 text-primary-400" />}
                badge="Neural"
                to="/matches"
                accent="primary"
              />
            </div>
          </div>

          {/* Activity / Reports Empty State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Recent Reports</CardTitle>
              <CardDescription>
                Track status updates and automated match alerts for items you have reported.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<HelpCircle className="w-8 h-8 text-surface-500" />}
                title="No active reports yet"
                description="You haven't reported any lost or found items. Submit a report to begin automated matching."
                actionLabel="Report an Item"
                onAction={() => {}}
                className="py-10"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Match Alerts & Verification Hub */}
        <div className="space-y-6">
          {/* Notifications / Alerts Teaser */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent-400" />
                  Live Match Feed
                </CardTitle>
                <CardDescription>Real-time algorithm updates</CardDescription>
              </div>
              <Badge variant="accent" size="sm">
                0 New
              </Badge>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Sparkles className="w-6 h-6 text-accent-400" />}
                title="All caught up"
                description="No matching reports detected at this time. Our background AI scanner will alert you immediately."
                className="py-8 bg-transparent border-0"
              />
            </CardContent>
          </Card>

          {/* Security & Verification Card */}
          <Card glass className="border-accent-500/20 bg-accent-950/10">
            <CardHeader>
              <div className="flex items-center gap-2 text-accent-400 mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                  Verification Protocol
                </span>
              </div>
              <CardTitle className="text-base text-white">How Ownership is Proven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-surface-400 leading-relaxed mb-4">
                To prevent fraud, found reports allow finders to configure private challenge questions (e.g. unique scratches, serial prefixes, stickers).
              </p>
              <div className="p-3 rounded-xl bg-surface-900/60 border border-surface-800 text-[11px] text-surface-300">
                🔒 Verification answers are salted & hashed with bcrypt and never visible to administrators or other students.
              </div>
            </CardContent>
          </Card>
        </div>
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
    <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-5 rounded-2xl hover:border-surface-700 transition">
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
      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors flex items-center justify-between">
        <span>{title}</span>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </h3>
      <p className="text-surface-400 text-xs leading-relaxed">{description}</p>
    </Link>
  );
}
