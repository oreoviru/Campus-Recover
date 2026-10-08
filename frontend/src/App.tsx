/**
 * Campus Recover — Root Application Component
 *
 * Phase 1: Shows a health-check landing page to verify the app runs.
 * Routes, layouts, and auth context will be added in Phase 4.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Radar, MapPin, Sparkles } from "lucide-react";

function App() {
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  useEffect(() => {
    // Check backend health
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-primary-950 to-surface-950 flex items-center justify-center p-6">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-2xl w-full"
      >
        {/* Logo + Title */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow mb-6"
          >
            <Radar className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl font-display font-bold text-white mb-3">
            Campus{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-400">
              Recover
            </span>
          </h1>

          <p className="text-lg text-surface-400 max-w-md mx-auto">
            AI-Powered Campus Lost & Found Platform
          </p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-surface-900/50 backdrop-blur-xl border border-surface-700/50 rounded-2xl p-8 shadow-glass"
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            System Status
          </h2>

          <div className="space-y-4">
            {/* Frontend Status */}
            <StatusRow
              label="Frontend"
              detail="React + Vite + TypeScript"
              status="online"
            />

            {/* Backend Status */}
            <StatusRow
              label="Backend"
              detail="FastAPI + Python"
              status={backendStatus}
            />

            {/* Database Status */}
            <StatusRow
              label="Database"
              detail="PostgreSQL 16"
              status={backendStatus === "online" ? "online" : "checking"}
            />
          </div>

          {/* Phase Checklist */}
          <div className="mt-8 pt-6 border-t border-surface-700/50">
            <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Development Progress
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <PhaseItem phase={1} label="Architecture" done />
              <PhaseItem phase={2} label="Database" />
              <PhaseItem phase={3} label="Authentication" />
              <PhaseItem phase={4} label="Frontend Foundation" />
              <PhaseItem phase={5} label="Lost/Found Reports" />
              <PhaseItem phase={6} label="Search & Browse" />
              <PhaseItem phase={7} label="AI Text Matching" />
              <PhaseItem phase={8} label="Location/Time" />
              <PhaseItem phase={9} label="Image Matching" />
              <PhaseItem phase={10} label="Claims" />
              <PhaseItem phase={11} label="Notifications" />
              <PhaseItem phase={12} label="Campus Map" />
              <PhaseItem phase={13} label="Admin Dashboard" />
              <PhaseItem phase={14} label="Security" />
              <PhaseItem phase={15} label="Testing" />
              <PhaseItem phase={16} label="Deployment" />
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-surface-500 text-sm mt-8"
        >
          Campus Recover v0.1.0 — Phase 1 Complete
        </motion.p>
      </motion.div>
    </div>
  );
}

// ---- Sub-components ----

function StatusRow({
  label,
  detail,
  status,
}: {
  label: string;
  detail: string;
  status: "checking" | "online" | "offline";
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-800/50">
      <div>
        <span className="text-white font-medium">{label}</span>
        <span className="text-surface-500 text-sm ml-2">— {detail}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            status === "online"
              ? "bg-accent-400 shadow-glow-accent"
              : status === "offline"
              ? "bg-danger-400"
              : "bg-warning-400 animate-pulse"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            status === "online"
              ? "text-accent-400"
              : status === "offline"
              ? "text-danger-400"
              : "text-warning-400"
          }`}
        >
          {status === "online"
            ? "Online"
            : status === "offline"
            ? "Offline"
            : "Checking..."}
        </span>
      </div>
    </div>
  );
}

function PhaseItem({
  phase,
  label,
  done = false,
}: {
  phase: number;
  label: string;
  done?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${
        done
          ? "bg-accent-500/10 text-accent-400"
          : "bg-surface-800/30 text-surface-500"
      }`}
    >
      <MapPin className={`w-3.5 h-3.5 ${done ? "text-accent-400" : "text-surface-600"}`} />
      <span className="text-surface-500 font-mono text-xs">
        {String(phase).padStart(2, "0")}
      </span>
      <span className={done ? "text-accent-400 font-medium" : ""}>
        {label}
      </span>
    </div>
  );
}

export default App;
