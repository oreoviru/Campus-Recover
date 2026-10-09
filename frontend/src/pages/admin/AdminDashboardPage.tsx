/**
 * Campus Recover — Complete Admin Command Center (Phase 11)
 *
 * Full-featured executive dashboard with:
 * - Real-time KPIs (Total Users, Lost, Found, Recovered, Recovery Rate, Pending Claims, Suspicious Reports)
 * - Interactive Recharts visualizations (Lost vs Found, Reports Timeline, Categories, Locations, Recovery Funnel)
 * - User administration with account suspension/reactivation
 * - Item report moderation & permanent deletion
 * - Centralized claims review, approval, and rejection
 * - University campus landmarks management (CRUD)
 * - Automated suspicious activity detection & manual overrides
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  ShieldCheck,
  Users,
  Search,
  PackageCheck,
  CheckCircle2,
  Sparkles,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  UserX,
  UserCheck,
  Plus,
  Edit2,
  X,
  MapPin,
  FileText,
  Eye,
  ShieldAlert,
  Building2,
  Activity,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/api/admin";
import {
  AdminOverviewStats,
  AdminChartsData,
  AdminUserSummary,
  AdminReportSummary,
  AdminClaimSummary,
  AdminLocationSummary,
  AdminSuspiciousItem,
  UserRole,
  ItemType,
  ItemStatus,
  ItemCategory,
  ClaimStatus,
} from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type AdminTab = "analytics" | "users" | "reports" | "claims" | "locations" | "suspicious";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const [refreshing, setRefreshing] = useState(false);

  // --- Core Data States ---
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [charts, setCharts] = useState<AdminChartsData | null>(null);
  const [usersList, setUsersList] = useState<AdminUserSummary[]>([]);
  const [reportsList, setReportsList] = useState<AdminReportSummary[]>([]);
  const [claimsList, setClaimsList] = useState<AdminClaimSummary[]>([]);
  const [locationsList, setLocationsList] = useState<AdminLocationSummary[]>([]);
  const [suspiciousList, setSuspiciousList] = useState<AdminSuspiciousItem[]>([]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- Filter States ---
  // Users Filter
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("ALL");

  // Reports Filter
  const [reportSearch, setReportSearch] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("ALL");
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>("ALL");

  // Claims Filter
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("ALL");

  // --- Modals States ---
  // User Suspension Modal
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<AdminUserSummary | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);

  // Report Deletion Modal
  const [selectedReportForDelete, setSelectedReportForDelete] = useState<AdminReportSummary | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeletingReport, setIsDeletingReport] = useState(false);

  // Location Create/Edit Modal
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AdminLocationSummary | null>(null);
  const [locFormName, setLocFormName] = useState("");
  const [locFormBuilding, setLocFormBuilding] = useState("");
  const [locFormFloor, setLocFormFloor] = useState("");
  const [locFormLat, setLocFormLat] = useState("28.9832");
  const [locFormLng, setLocFormLng] = useState("77.0908");
  const [locFormDescription, setLocFormDescription] = useState("");
  const [locFormIsActive, setLocFormIsActive] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Claim Quick Review Modal
  const [selectedClaimForReview, setSelectedClaimForReview] = useState<AdminClaimSummary | null>(null);
  const [claimReviewNotes, setClaimReviewNotes] = useState("");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // ------------------------------------------------------------------
  // Data Fetching
  // ------------------------------------------------------------------
  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, chartsRes, usersRes, reportsRes, claimsRes, locsRes, suspRes] =
        await Promise.all([
          adminApi.getStats(),
          adminApi.getCharts(14),
          adminApi.getUsers({ per_page: 100 }),
          adminApi.getReports({ per_page: 100 }),
          adminApi.getClaims({ per_page: 100 }),
          adminApi.getLocations(),
          adminApi.getSuspiciousActivity(),
        ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (chartsRes.success && chartsRes.data) setCharts(chartsRes.data);
      if (usersRes.success && usersRes.data) setUsersList(usersRes.data);
      if (reportsRes.success && reportsRes.data) setReportsList(reportsRes.data);
      if (claimsRes.success && claimsRes.data) setClaimsList(claimsRes.data);
      if (locsRes.success && locsRes.data) setLocationsList(locsRes.data);
      if (suspRes.success && suspRes.data) setSuspiciousList(suspRes.data);
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to load administrative telemetry.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // ------------------------------------------------------------------
  // User Actions (Suspend / Reactivate)
  // ------------------------------------------------------------------
  const handleToggleUserStatus = async () => {
    if (!selectedUserForSuspend) return;
    setIsSuspending(true);
    const targetStatus = !selectedUserForSuspend.is_active;

    try {
      const res = await adminApi.toggleUserStatus(
        selectedUserForSuspend.id,
        targetStatus,
        suspendReason || undefined
      );
      if (res.success) {
        showNotification(
          "success",
          `User ${selectedUserForSuspend.email} has been ${targetStatus ? "activated" : "suspended"}.`
        );
        setSelectedUserForSuspend(null);
        setSuspendReason("");
        // Refresh users and stats
        const usersRes = await adminApi.getUsers({ per_page: 100 });
        if (usersRes.success && usersRes.data) setUsersList(usersRes.data);
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.error?.message || "Action failed.");
    } finally {
      setIsSuspending(false);
    }
  };

  // ------------------------------------------------------------------
  // Report Actions (Delete Report)
  // ------------------------------------------------------------------
  const handleDeleteReport = async () => {
    if (!selectedReportForDelete) return;
    setIsDeletingReport(true);
    try {
      const res = await adminApi.deleteReport(
        selectedReportForDelete.id,
        deleteReason || "Removed by campus administrator"
      );
      if (res.success) {
        showNotification("success", "Item report has been permanently deleted.");
        setSelectedReportForDelete(null);
        setDeleteReason("");
        // Reload reports and stats
        const [repsRes, statsRes, chartsRes] = await Promise.all([
          adminApi.getReports({ per_page: 100 }),
          adminApi.getStats(),
          adminApi.getCharts(14),
        ]);
        if (repsRes.success && repsRes.data) setReportsList(repsRes.data);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (chartsRes.success && chartsRes.data) setCharts(chartsRes.data);
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.error?.message || "Failed to delete report.");
    } finally {
      setIsDeletingReport(false);
    }
  };

  // ------------------------------------------------------------------
  // Claim Actions (Approve / Reject)
  // ------------------------------------------------------------------
  const handleReviewClaimAction = async (decision: "APPROVE" | "REJECT") => {
    if (!selectedClaimForReview) return;
    setIsProcessingClaim(true);
    try {
      let res;
      if (decision === "APPROVE") {
        res = await adminApi.approveClaim(selectedClaimForReview.id, claimReviewNotes);
      } else {
        res = await adminApi.rejectClaim(selectedClaimForReview.id, claimReviewNotes);
      }

      if (res.success) {
        showNotification("success", `Claim ${decision === "APPROVE" ? "approved" : "rejected"} successfully.`);
        setSelectedClaimForReview(null);
        setClaimReviewNotes("");
        // Refresh claims & stats
        const [claimsRes, statsRes] = await Promise.all([
          adminApi.getClaims({ per_page: 100 }),
          adminApi.getStats(),
        ]);
        if (claimsRes.success && claimsRes.data) setClaimsList(claimsRes.data);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.error?.message || "Failed to process claim.");
    } finally {
      setIsProcessingClaim(false);
    }
  };

  // ------------------------------------------------------------------
  // Campus Location Actions (Create / Update / Delete)
  // ------------------------------------------------------------------
  const openLocationModal = (loc?: AdminLocationSummary) => {
    if (loc) {
      setEditingLocation(loc);
      setLocFormName(loc.name);
      setLocFormBuilding(loc.building || "");
      setLocFormFloor(loc.floor || "");
      setLocFormLat(loc.latitude.toString());
      setLocFormLng(loc.longitude.toString());
      setLocFormDescription(loc.description || "");
      setLocFormIsActive(loc.is_active);
    } else {
      setEditingLocation(null);
      setLocFormName("");
      setLocFormBuilding("");
      setLocFormFloor("");
      setLocFormLat("28.9832");
      setLocFormLng("77.0908");
      setLocFormDescription("");
      setLocFormIsActive(true);
    }
    setLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locFormName.trim()) return;

    setIsSavingLocation(true);
    try {
      const payload = {
        name: locFormName.trim(),
        building: locFormBuilding.trim() || undefined,
        floor: locFormFloor.trim() || undefined,
        latitude: parseFloat(locFormLat) || 28.9832,
        longitude: parseFloat(locFormLng) || 77.0908,
        description: locFormDescription.trim() || undefined,
        is_active: locFormIsActive,
      };

      let res;
      if (editingLocation) {
        res = await adminApi.updateLocation(editingLocation.id, payload);
      } else {
        res = await adminApi.createLocation(payload);
      }

      if (res.success) {
        showNotification(
          "success",
          `Campus location '${locFormName}' ${editingLocation ? "updated" : "created"} successfully.`
        );
        setLocationModalOpen(false);
        const locsRes = await adminApi.getLocations();
        if (locsRes.success && locsRes.data) setLocationsList(locsRes.data);
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.error?.message || "Failed to save location.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (locId: string, locName: string) => {
    if (!confirm(`Are you sure you want to deactivate/delete location '${locName}'?`)) return;
    try {
      const res = await adminApi.deleteLocation(locId);
      if (res.success) {
        showNotification("success", `Location '${locName}' updated.`);
        const locsRes = await adminApi.getLocations();
        if (locsRes.success && locsRes.data) setLocationsList(locsRes.data);
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.error?.message || "Failed to delete location.");
    }
  };

  // ------------------------------------------------------------------
  // Suspicious Activity Actions
  // ------------------------------------------------------------------
  const handleDismissSuspicious = async (itemId: string) => {
    try {
      const res = await adminApi.dismissSuspicious(itemId);
      if (res.success) {
        showNotification("success", "Suspicious finding dismissed.");
        const suspRes = await adminApi.getSuspiciousActivity();
        if (suspRes.success && suspRes.data) setSuspiciousList(suspRes.data);
        const statsRes = await adminApi.getStats();
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
      }
    } catch {
      showNotification("error", "Failed to dismiss flag.");
    }
  };

  // ------------------------------------------------------------------
  // Filtering Logic
  // ------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        !userSearch ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.student_id && u.student_id.toLowerCase().includes(userSearch.toLowerCase()));

      const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      const matchesStatus =
        userStatusFilter === "ALL" ||
        (userStatusFilter === "ACTIVE" ? u.is_active : !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, userSearch, userRoleFilter, userStatusFilter]);

  const filteredReports = useMemo(() => {
    return reportsList.filter((r) => {
      const matchesSearch =
        !reportSearch ||
        r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(reportSearch.toLowerCase()) ||
        (r.location_name && r.location_name.toLowerCase().includes(reportSearch.toLowerCase()));

      const matchesType = reportTypeFilter === "ALL" || r.type === reportTypeFilter;
      const matchesCategory = reportCategoryFilter === "ALL" || r.category === reportCategoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [reportsList, reportSearch, reportTypeFilter, reportCategoryFilter]);

  const filteredClaims = useMemo(() => {
    return claimsList.filter((c) => {
      return claimStatusFilter === "ALL" || c.status === claimStatusFilter;
    });
  }, [claimsList, claimStatusFilter]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-surface-400 font-mono text-sm animate-pulse">
          Loading Campus Recover administrative console...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            feedbackMessage.type === "success"
              ? "bg-accent-500/10 border-accent-500/30 text-accent-300"
              : "bg-danger-500/10 border-danger-500/30 text-danger-300"
          }`}
        >
          <div className="flex items-center gap-3 text-sm">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-accent-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-surface-900/40 backdrop-blur-xl border border-surface-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-glass">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                Campus Admin Console
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider bg-danger-500/10 text-danger-400 border border-danger-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                STRICT RBAC ENFORCED
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-800 text-surface-300 border border-surface-700">
                Rishihood University
              </span>
            </div>
            <p className="text-surface-400 text-sm">
              Signed in as <span className="text-white font-medium">{user?.name}</span> ({user?.email}) • Administrator Session
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={refreshing}
              className="flex items-center gap-2 border-surface-700 bg-surface-800/60 hover:bg-surface-700 text-surface-200"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary-400" : ""}`} />
              <span>Refresh Metrics</span>
            </Button>
            <Link to="/map">
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Live Campus Map</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Executive KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="bg-surface-900/60 border border-surface-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Users</span>
            <Users className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white">
            {stats?.total_users ?? 0}
          </div>
          <div className="text-[10px] text-surface-500 mt-1">Students & staff</div>
        </div>

        {/* Total Lost */}
        <div className="bg-surface-900/60 border border-surface-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Lost Reports</span>
            <Search className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-300">
            {stats?.total_lost_reports ?? 0}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-1">Missing belongings</div>
        </div>

        {/* Total Found */}
        <div className="bg-surface-900/60 border border-surface-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Found Reports</span>
            <PackageCheck className="w-4 h-4 text-accent-400" />
          </div>
          <div className="text-2xl font-display font-bold text-accent-300">
            {stats?.total_found_reports ?? 0}
          </div>
          <div className="text-[10px] text-accent-500/80 mt-1">Awaiting custody</div>
        </div>

        {/* Total Recovered */}
        <div className="bg-surface-900/60 border border-surface-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-300">
            {stats?.total_recovered_items ?? 0}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Reunited items</div>
        </div>

        {/* Recovery Rate */}
        <div className="bg-surface-900/60 border border-surface-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Recovery Rate</span>
            <Sparkles className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white flex items-baseline gap-1">
            <span>{stats?.recovery_rate ?? 0}%</span>
          </div>
          <div className="w-full bg-surface-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats?.recovery_rate ?? 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Pending Claims */}
        <div className="bg-surface-900/60 border border-surface-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Pending Claims</span>
            <Clock className="w-4 h-4 text-warning-400" />
          </div>
          <div className="text-2xl font-display font-bold text-warning-300">
            {stats?.pending_claims ?? 0}
          </div>
          <div className="text-[10px] text-warning-500/80 mt-1">Require mediation</div>
        </div>

        {/* Suspicious Reports */}
        <div className={`p-4 rounded-2xl flex flex-col justify-between border ${
          (stats?.suspicious_reports ?? 0) > 0
            ? "bg-danger-500/10 border-danger-500/30"
            : "bg-surface-900/60 border-surface-800"
        }`}>
          <div className="flex items-center justify-between text-surface-400 mb-2">
            <span className="text-xs font-medium">Suspicious</span>
            <AlertTriangle className={`w-4 h-4 ${(stats?.suspicious_reports ?? 0) > 0 ? "text-danger-400" : "text-surface-500"}`} />
          </div>
          <div className={`text-2xl font-display font-bold ${(stats?.suspicious_reports ?? 0) > 0 ? "text-danger-300" : "text-surface-300"}`}>
            {stats?.suspicious_reports ?? 0}
          </div>
          <div className="text-[10px] text-danger-400/80 mt-1">Flagged heuristics</div>
        </div>
      </div>

      {/* Tab Navigation Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-surface-800 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            activeTab === "analytics"
              ? "bg-primary-500/10 text-primary-300 border border-primary-500/30"
              : "text-surface-400 hover:text-white hover:bg-surface-800/50"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Telemetry & Charts</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            activeTab === "users"
              ? "bg-primary-500/10 text-primary-300 border border-primary-500/30"
              : "text-surface-400 hover:text-white hover:bg-surface-800/50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            activeTab === "reports"
              ? "bg-primary-500/10 text-primary-300 border border-primary-500/30"
              : "text-surface-400 hover:text-white hover:bg-surface-800/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reports Moderation ({reportsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            activeTab === "claims"
              ? "bg-primary-500/10 text-primary-300 border border-primary-500/30"
              : "text-surface-400 hover:text-white hover:bg-surface-800/50"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Claims Review ({claimsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("locations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            activeTab === "locations"
              ? "bg-primary-500/10 text-primary-300 border border-primary-500/30"
              : "text-surface-400 hover:text-white hover:bg-surface-800/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Campus Landmarks ({locationsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("suspicious")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            activeTab === "suspicious"
              ? "bg-danger-500/10 text-danger-300 border border-danger-500/30"
              : "text-surface-400 hover:text-white hover:bg-surface-800/50"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-danger-400" />
          <span>Suspicious Activity ({suspiciousList.length})</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* TAB 1: CHARTS & ANALYTICS TELEMETRY */}
      {/* ================================================================== */}
      {activeTab === "analytics" && charts && (
        <div className="space-y-6">
          {/* Row 1: Reports Volume Over Time (Area Chart) */}
          <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold font-display text-white">
                  Reports Over Time (Daily Influx)
                </h3>
                <p className="text-surface-400 text-xs mt-0.5">
                  14-day chronological distribution of lost vs found submissions
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Lost Reports
                </span>
                <span className="flex items-center gap-1.5 text-accent-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-400" /> Found Reports
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.reports_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                    labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="lost" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLost)" />
                  <Area type="monotone" dataKey="found" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorFound)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Lost vs Found Breakdown + Recovery Rate & Status Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Lost vs Found Split */}
            <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-3xl">
              <h3 className="text-lg font-bold font-display text-white mb-1">
                Lost vs Found Volume
              </h3>
              <p className="text-surface-400 text-xs mb-6">
                Comparative proportion of lost and found incident reports
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Lost Items", count: charts.lost_vs_found.lost, fill: "#f59e0b" },
                      { name: "Found Items", count: charts.lost_vs_found.found, fill: "#06b6d4" },
                      { name: "Recovered", count: charts.lost_vs_found.recovered, fill: "#10b981" },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                      labelStyle={{ color: "#f8fafc" }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Recovery Status Lifecycle Funnel */}
            <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold font-display text-white">
                  Resolution Lifecycle
                </h3>
                <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {charts.overall_recovery_rate}% Recovery
                </span>
              </div>
              <p className="text-surface-400 text-xs mb-6">
                Breakdown of items across active, matched, claimed, and recovered states
              </p>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.recovery_breakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                      label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {charts.recovery_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#38bdf8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Categories & Campus Locations Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Categories Breakdown */}
            <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-3xl">
              <h3 className="text-lg font-bold font-display text-white mb-1">
                Reports by Item Category
              </h3>
              <p className="text-surface-400 text-xs mb-6">
                Distribution of reported items across equipment, accessories, and essentials
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.categories} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="category"
                      stroke="#94a3b8"
                      fontSize={10}
                      angle={-30}
                      textAnchor="end"
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
                    <Bar dataKey="lost" name="Lost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="found" name="Found" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Campus Locations Hotspots */}
            <div className="bg-surface-900/50 backdrop-blur-xl border border-surface-800 p-6 rounded-3xl">
              <h3 className="text-lg font-bold font-display text-white mb-1">
                Campus Location Hotspots
              </h3>
              <p className="text-surface-400 text-xs mb-6">
                Top university buildings and landmarks with reported lost & found incidents
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={charts.campus_locations.slice(0, 7)}
                    margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      dataKey="location_name"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                    />
                    <Bar dataKey="total" name="Total Reports" fill="#818cf8" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: USER MANAGEMENT (SUSPEND / ACTIVATE) */}
      {/* ================================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-surface-900/50 border border-surface-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-surface-950/60 border border-surface-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-surface-950/60 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-200 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="STAFF">Campus Staff</option>
                <option value="ADMIN">Administrators</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-surface-950/60 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface-900/50 border border-surface-800 rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-surface-300">
                <thead className="bg-surface-950/80 text-xs uppercase font-mono text-surface-400 border-b border-surface-800">
                  <tr>
                    <th className="py-4 px-6">User / Account</th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4">ID Reference</th>
                    <th className="py-4 px-4">Reports</th>
                    <th className="py-4 px-4">Claims</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-surface-500">
                        No user accounts match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrentUser = u.id === user?.id;
                      return (
                        <tr key={u.id} className="hover:bg-surface-800/30 transition">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white">{u.name}</div>
                            <div className="text-xs text-surface-400 font-mono">{u.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant={
                                u.role === UserRole.ADMIN
                                  ? "danger"
                                  : u.role === UserRole.STAFF
                                  ? "warning"
                                  : "surface"
                              }
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs text-surface-400">
                            {u.student_id || "—"}
                          </td>
                          <td className="py-4 px-4 font-medium text-white">{u.items_count}</td>
                          <td className="py-4 px-4 font-medium text-white">{u.claims_count}</td>
                          <td className="py-4 px-4">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-500/10 text-danger-400 border border-danger-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger-400" /> Suspended
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {isCurrentUser ? (
                              <span className="text-xs text-surface-500 font-mono italic">Current Admin</span>
                            ) : u.is_active ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUserForSuspend(u)}
                                className="border-danger-500/30 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500 text-xs flex items-center gap-1.5"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUserForSuspend(u)}
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 text-xs flex items-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 3: REPORTS MODERATION & DELETION */}
      {/* ================================================================== */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-surface-900/50 border border-surface-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search reports by title, description, or location..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full bg-surface-950/60 border border-surface-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value)}
                className="bg-surface-950/60 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-200 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="LOST">Lost Reports</option>
                <option value="FOUND">Found Reports</option>
              </select>

              <select
                value={reportCategoryFilter}
                onChange={(e) => setReportCategoryFilter(e.target.value)}
                className="bg-surface-950/60 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-200 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {Object.values(ItemCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-surface-900/50 border border-surface-800 rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-surface-300">
                <thead className="bg-surface-950/80 text-xs uppercase font-mono text-surface-400 border-b border-surface-800">
                  <tr>
                    <th className="py-4 px-6">Item Title & Details</th>
                    <th className="py-4 px-4">Type / Cat</th>
                    <th className="py-4 px-4">Landmark Location</th>
                    <th className="py-4 px-4">Reporter</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Claims</th>
                    <th className="py-4 px-6 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-surface-500">
                        No reports match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-800/30 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            {r.image_url ? (
                              <img
                                src={r.image_url}
                                alt={r.title}
                                className="w-12 h-12 rounded-xl object-cover border border-surface-700 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center shrink-0 text-surface-400">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                <span>{r.title}</span>
                                {r.is_suspicious && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-danger-500/20 text-danger-300 border border-danger-500/30 font-mono">
                                    FLAGGED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-surface-400 line-clamp-1 max-w-xs mt-0.5">
                                {r.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <Badge variant={r.type === ItemType.LOST ? "warning" : "accent"}>
                              {r.type}
                            </Badge>
                            <div className="text-[11px] text-surface-400 font-mono">{r.category}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <div className="text-surface-200 font-medium">
                            {r.campus_location_name || r.location_name || "Unassigned"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <div className="text-surface-200">{r.user_name || "Anonymous"}</div>
                          <div className="text-surface-500 font-mono text-[10px]">{r.user_email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              r.status === ItemStatus.RECOVERED
                                ? "accent"
                                : r.status === ItemStatus.CLAIMED
                                ? "warning"
                                : "surface"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs">{r.claims_count}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/items/${r.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="p-2 border-surface-700 text-surface-300 hover:text-white">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedReportForDelete(r)}
                              className="p-2 border-danger-500/30 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 4: CLAIMS MODERATION & DISPUTE REVIEW */}
      {/* ================================================================== */}
      {activeTab === "claims" && (
        <div className="space-y-6">
          <div className="bg-surface-900/50 border border-surface-800 p-4 rounded-2xl flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Claims Moderation Queue</h3>
            <select
              value={claimStatusFilter}
              onChange={(e) => setClaimStatusFilter(e.target.value)}
              className="bg-surface-950/60 border border-surface-700/80 rounded-xl px-3 py-1.5 text-xs text-surface-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-surface-900/50 border border-surface-800 rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-surface-300">
                <thead className="bg-surface-950/80 text-xs uppercase font-mono text-surface-400 border-b border-surface-800">
                  <tr>
                    <th className="py-4 px-6">Claimed Item</th>
                    <th className="py-4 px-4">Claimant</th>
                    <th className="py-4 px-4">Submitted Verification Answer</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Submitted At</th>
                    <th className="py-4 px-6 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-surface-500">
                        No claims match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-800/30 transition">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-white">{c.item_title}</div>
                          <div className="text-xs text-surface-400 font-mono">
                            {c.item_type} • {c.item_category}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-surface-200 font-medium">{c.claimant_name}</div>
                          <div className="text-xs text-surface-400 font-mono">{c.claimant_email}</div>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          {c.verification_question && (
                            <div className="text-[11px] text-surface-400 italic mb-0.5">
                              Q: {c.verification_question}
                            </div>
                          )}
                          <div className="text-xs text-white bg-surface-950/60 p-2 rounded-lg font-mono border border-surface-800">
                            {c.submitted_answer}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              c.status === ClaimStatus.APPROVED
                                ? "accent"
                                : c.status === ClaimStatus.REJECTED
                                ? "danger"
                                : "warning"
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-surface-400">
                          {format(parseISO(c.created_at), "MMM d, HH:mm")}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedClaimForReview(c);
                              setClaimReviewNotes(c.admin_notes || "");
                            }}
                            className="text-xs"
                          >
                            Review & Decide
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 5: CAMPUS LANDMARKS & LOCATIONS MANAGEMENT */}
      {/* ================================================================== */}
      {activeTab === "locations" && (
        <div className="space-y-6">
          <div className="bg-surface-900/50 border border-surface-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Rishihood University Campus Landmarks</h3>
              <p className="text-xs text-surface-400 mt-0.5">
                Official landmarks, radar zones, and GPS coordinates used across the map picker
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => openLocationModal()}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Landmark</span>
            </Button>
          </div>

          <div className="bg-surface-900/50 border border-surface-800 rounded-3xl overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-surface-300">
                <thead className="bg-surface-950/80 text-xs uppercase font-mono text-surface-400 border-b border-surface-800">
                  <tr>
                    <th className="py-4 px-6">Landmark Name</th>
                    <th className="py-4 px-4">Building & Floor</th>
                    <th className="py-4 px-4">GPS Coordinates</th>
                    <th className="py-4 px-4">Reports Density</th>
                    <th className="py-4 px-4">Active</th>
                    <th className="py-4 px-6 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60">
                  {locationsList.map((loc) => (
                    <tr key={loc.id} className="hover:bg-surface-800/30 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                          <span>{loc.name}</span>
                        </div>
                        {loc.description && (
                          <div className="text-xs text-surface-400 mt-0.5 max-w-sm line-clamp-1">
                            {loc.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <div className="text-surface-200">{loc.building || "—"}</div>
                        <div className="text-surface-500 font-mono text-[11px]">{loc.floor || ""}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-surface-300">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </td>
                      <td className="py-4 px-4 font-medium text-white">{loc.items_count}</td>
                      <td className="py-4 px-4">
                        {loc.is_active ? (
                          <span className="text-xs text-emerald-400 font-medium">Active</span>
                        ) : (
                          <span className="text-xs text-surface-500 font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openLocationModal(loc)}
                            className="p-2 border-surface-700 text-surface-300 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLocation(loc.id, loc.name)}
                            className="p-2 border-danger-500/30 text-danger-400 hover:bg-danger-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 6: SUSPICIOUS ACTIVITY REVIEW */}
      {/* ================================================================== */}
      {activeTab === "suspicious" && (
        <div className="space-y-6">
          <div className="bg-surface-900/50 border border-surface-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Heuristic Fraud & Spam Detection</h3>
              <p className="text-xs text-surface-400 mt-0.5">
                Automated detection of spam patterns, repeated rejected claimants, and ownership disputes
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-danger-500/10 text-danger-400 border border-danger-500/20">
              {suspiciousList.length} Items Flagged
            </span>
          </div>

          {suspiciousList.length === 0 ? (
            <div className="bg-surface-900/40 border border-surface-800 rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-accent-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">All Clear on Campus</h3>
              <p className="text-surface-400 text-sm max-w-md mx-auto">
                No fraudulent submissions, repeat dispute claimants, or anomalous reports detected right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suspiciousList.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-900/60 border border-danger-500/30 p-5 rounded-2xl space-y-4 shadow-glass"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-danger-500/10 text-danger-400 border border-danger-500/20">
                        <AlertTriangle className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {item.item_title || item.user_name || "Flagged Activity"}
                        </h4>
                        <div className="text-xs text-surface-400 font-mono">
                          {item.user_email || "Anonymous"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={item.severity === "HIGH" ? "danger" : "warning"}>
                      {item.severity} SEVERITY
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-950/70 border border-surface-800/80 text-xs text-surface-300">
                    <span className="font-semibold text-danger-300">Trigger Reason: </span>
                    {item.reason}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissSuspicious(item.item_id ? item.item_id : item.id)}
                      className="text-xs border-surface-700 text-surface-300 hover:text-white"
                    >
                      Dismiss Flag
                    </Button>
                    {item.user_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const userSummary = usersList.find((u) => u.id === item.user_id);
                          if (userSummary) setSelectedUserForSuspend(userSummary);
                        }}
                        className="text-xs border-danger-500/40 text-danger-300 hover:bg-danger-500/10"
                      >
                        Suspend User
                      </Button>
                    )}
                    {item.item_id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const rep = reportsList.find((r) => r.id === item.item_id);
                          if (rep) setSelectedReportForDelete(rep);
                        }}
                        className="text-xs"
                      >
                        Delete Report
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: USER SUSPENSION CONFIRMATION */}
      {/* ================================================================== */}
      <Modal
        isOpen={Boolean(selectedUserForSuspend)}
        onClose={() => setSelectedUserForSuspend(null)}
        title={selectedUserForSuspend?.is_active ? "Suspend User Account" : "Reactivate User Account"}
        description={
          selectedUserForSuspend?.is_active
            ? `Suspending ${selectedUserForSuspend?.email} will invalidate active credentials and block reporting.`
            : `Reactivating ${selectedUserForSuspend?.email} will restore student lost & found access.`
        }
      >
        <div className="space-y-4 mt-2">
          {selectedUserForSuspend?.is_active && (
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">
                Suspension Reason (for audit log)
              </label>
              <Input
                placeholder="e.g. Repeated false claims, spamming reports..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUserForSuspend(null)}
              disabled={isSuspending}
            >
              Cancel
            </Button>
            <Button
              variant={selectedUserForSuspend?.is_active ? "danger" : "primary"}
              size="sm"
              onClick={handleToggleUserStatus}
              disabled={isSuspending}
            >
              {isSuspending
                ? "Processing..."
                : selectedUserForSuspend?.is_active
                ? "Confirm Suspension"
                : "Reactivate Account"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/* MODAL: REPORT DELETION CONFIRMATION */}
      {/* ================================================================== */}
      <Modal
        isOpen={Boolean(selectedReportForDelete)}
        onClose={() => setSelectedReportForDelete(null)}
        title="Permanently Delete Item Report"
        description={`Are you sure you want to delete report '${selectedReportForDelete?.title}'? All AI matches and claims will be removed.`}
      >
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1.5">
              Deletion Reason (audit notes)
            </label>
            <Input
              placeholder="e.g. Inappropriate item, spam test, duplicate report..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReportForDelete(null)}
              disabled={isDeletingReport}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteReport}
              disabled={isDeletingReport}
            >
              {isDeletingReport ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/* MODAL: CLAIM REVIEW & DECISION */}
      {/* ================================================================== */}
      <Modal
        isOpen={Boolean(selectedClaimForReview)}
        onClose={() => setSelectedClaimForReview(null)}
        title="Review Ownership Claim"
        description="Verify submitted proof against item characteristics and authorize pickup handover."
      >
        {selectedClaimForReview && (
          <div className="space-y-4 mt-2">
            <div className="bg-surface-950/70 p-4 rounded-2xl border border-surface-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-400">Claimed Item:</span>
                <span className="font-semibold text-white">{selectedClaimForReview.item_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Claimant:</span>
                <span className="text-white">
                  {selectedClaimForReview.claimant_name} ({selectedClaimForReview.claimant_email})
                </span>
              </div>
              {selectedClaimForReview.verification_question && (
                <div className="pt-2 border-t border-surface-800">
                  <span className="text-surface-400">Challenge Question:</span>
                  <p className="text-surface-200 mt-0.5 italic">
                    "{selectedClaimForReview.verification_question}"
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-surface-800">
                <span className="text-surface-400">Claimant Answer:</span>
                <p className="text-accent-300 font-mono mt-0.5 bg-surface-900 p-2 rounded-lg">
                  {selectedClaimForReview.submitted_answer}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">
                Administrator Notes / Handover Instructions
              </label>
              <Textarea
                rows={2}
                placeholder="Notes sent to claimant and item finder..."
                value={claimReviewNotes}
                onChange={(e) => setClaimReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClaimForReview(null)}
                disabled={isProcessingClaim}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReviewClaimAction("REJECT")}
                disabled={isProcessingClaim}
              >
                Reject Claim
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReviewClaimAction("APPROVE")}
                disabled={isProcessingClaim}
              >
                Approve & Unlock Handover
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================================================================== */}
      {/* MODAL: CAMPUS LOCATION CREATE / EDIT */}
      {/* ================================================================== */}
      <Modal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title={editingLocation ? "Edit Campus Landmark" : "Add New Campus Landmark"}
        description="Configure university building coordinates for campus map radar and report pinning."
      >
        <form onSubmit={handleSaveLocation} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">
              Landmark Name *
            </label>
            <Input
              required
              placeholder="e.g. Ashok Goyal Central Library"
              value={locFormName}
              onChange={(e) => setLocFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">Building</label>
              <Input
                placeholder="e.g. Block A"
                value={locFormBuilding}
                onChange={(e) => setLocFormBuilding(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">Floor / Area</label>
              <Input
                placeholder="e.g. 2nd Floor Labs"
                value={locFormFloor}
                onChange={(e) => setLocFormFloor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">Latitude *</label>
              <Input
                required
                type="number"
                step="any"
                value={locFormLat}
                onChange={(e) => setLocFormLat(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1">Longitude *</label>
              <Input
                required
                type="number"
                step="any"
                value={locFormLng}
                onChange={(e) => setLocFormLng(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-300 mb-1">Description</label>
            <Textarea
              rows={2}
              placeholder="Notable landmarks, study areas, or entry gates..."
              value={locFormDescription}
              onChange={(e) => setLocFormDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="locActiveToggle"
              checked={locFormIsActive}
              onChange={(e) => setLocFormIsActive(e.target.checked)}
              className="rounded bg-surface-950 border-surface-700 text-primary-500 focus:ring-0"
            />
            <label htmlFor="locActiveToggle" className="text-xs text-surface-300">
              Active (Visible in report drop-downs and map filters)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocationModalOpen(false)}
              disabled={isSavingLocation}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSavingLocation}>
              {isSavingLocation ? "Saving..." : editingLocation ? "Update Landmark" : "Create Landmark"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
