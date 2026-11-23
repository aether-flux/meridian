import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  KeyRound,
  Terminal,
  ArrowRight,
  TrendingUp,
  Activity,
  FolderGit2,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore.js";
import { api } from "../../services/api.js";
import { Button } from "../../ui/components/Button.jsx";
import { PriorityBadge, StatusBadge } from "../../ui/components/Badge.jsx";

export default function DashboardPage() {
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const user = useAppStore((state) => state.user);
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);
  const setSelectedTaskId = useAppStore((state) => state.setSelectedTaskId);
  const setIsCliModalOpen = useAppStore((state) => state.setIsCliModalOpen);

  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    if (!activeWorkspace?.slug) {
      setDashboard(null);
      setIsLoading(false);
      setError("");
      return undefined;
    }

    setIsLoading(true);
    setError("");
    api
      .get(`/workspaces/${encodeURIComponent(activeWorkspace.slug)}/dashboard`)
      .then((response) => {
        if (isCurrent) setDashboard(response);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || "Unable to load dashboard data.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeWorkspace?.slug]);

  const summary = dashboard?.summary;
  const myTasks = dashboard?.assignedTasks || [];
  const activeSprint = dashboard?.activeSprint;
  const activities = dashboard?.activities || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-white border border-[#e8e5e0] shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              Welcome, {user?.displayName || "Alex"}
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#f5f2ef] border border-[#e8e5e0] text-[#555] font-mono">
              {activeWorkspace?.name || "Meridian Core"}
            </span>
          </div>
          <p className="text-sm text-[#555] max-w-xl">
            Overview of your team&apos;s sprint velocity, recent tasks, and
            active work across web and terminal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsCliModalOpen(true)}
            className="font-mono text-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-[#555] mr-1.5" />
            CLI Shortcuts
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateTaskOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Task
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#e8e5e0] shadow-sm hover:bg-[#f5f2ef] transition-colors">
          <div className="flex items-center justify-between text-[#888] text-xs mb-2">
            <span>Total Tasks</span>
            <FolderGit2 className="w-4 h-4 text-[#aaa]" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a] font-mono">
            {isLoading ? "..." : summary?.totalTasks ?? 0}
          </div>
          <div className="text-[11px] text-[#888] mt-1">
            Across {isLoading ? "..." : summary?.projectCount ?? 0} projects
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e5e0] shadow-sm hover:bg-[#f5f2ef] transition-colors">
          <div className="flex items-center justify-between text-[#888] text-xs mb-2">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {isLoading ? "..." : summary?.inProgressTasks ?? 0}
          </div>
          <div className="text-[11px] text-[#888] mt-1">
            Currently being worked on
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e5e0] shadow-sm hover:bg-[#f5f2ef] transition-colors">
          <div className="flex items-center justify-between text-[#888] text-xs mb-2">
            <span>Urgent Tasks</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {isLoading ? "..." : summary?.urgentTasks ?? 0}
          </div>
          <div className="text-[11px] text-red-500/80 mt-1">
            Requires immediate review
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e8e5e0] shadow-sm hover:bg-[#f5f2ef] transition-colors">
          <div className="flex items-center justify-between text-[#888] text-xs mb-2">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {isLoading ? "..." : summary?.completedTasks ?? 0}
          </div>
          <div className="text-[11px] text-[#888] mt-1">
            Closed this cycle
          </div>
        </div>
      </div>

      {/* Main Grid: Sprint Progress + Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#888]">
              Assigned to You ({isLoading ? "..." : myTasks.length})
            </h3>
            <Link
              to="/tasks"
              className="text-xs text-[#555] hover:text-[#1a1a1a] font-medium flex items-center gap-1 transition-colors"
            >
              View Full Board
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] text-center text-xs text-[#888]">
                Loading assigned tasks...
              </div>
            ) : myTasks.length === 0 ? (
              <div className="p-6 rounded-xl bg-white border border-[#e8e5e0] text-center text-xs text-[#888]">
                You have no tasks assigned in this workspace.
              </div>
            ) : (
              myTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className="p-3.5 rounded-xl bg-white border border-[#e8e5e0] hover:bg-[#f5f2ef] cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-semibold text-[#1a1a1a] bg-[#f5f2ef] px-2 py-0.5 rounded border border-[#e8e5e0] flex-shrink-0">
                      {t.key}
                    </span>
                    <span className="text-xs font-medium text-[#1a1a1a] truncate">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={t.priority} showLabel={false} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#e8e5e0] shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#555]" />
                Token-Based Team Invites
              </div>
              <p className="text-[11px] text-[#888]">
                Generate shareable invitation links with custom roles without
                configuring an email server.
              </p>
            </div>
            <Link to="/settings/team">
              <Button size="sm" variant="secondary" className="flex-shrink-0">
                Manage Invites
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {activeSprint ? (
            <div className="p-5 rounded-xl bg-white border border-[#e8e5e0] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wider text-[#888] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#555]" />
                  Active Sprint
                </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeSprint.progressPercent}% Complete
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1a1a1a]">
                  {activeSprint.name}
                </h4>
                <p className="text-xs text-[#555] mt-1">{activeSprint.project.name}</p>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-[#f0ede8] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#1a1a1a] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${activeSprint.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#888] font-mono">
                  <span>{activeSprint.completedTasks} tasks done</span>
                  <span>{activeSprint.totalTasks} total tasks</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e8e5e0] flex items-center justify-between text-xs text-[#888]">
                <span>Ends {new Date(activeSprint.endDate).toLocaleDateString()}</span>
                <Link
                  to="/sprints"
                  className="text-[#555] hover:text-[#1a1a1a] font-medium transition-colors"
                >
                  View Sprint →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-white border border-[#e8e5e0] text-xs text-[#888]">
              {isLoading ? "Loading sprint details..." : "No active sprint in this workspace."}
            </div>
          )}

          <div className="p-5 rounded-xl bg-white border border-[#e8e5e0] shadow-sm space-y-4">
            <div className="text-xs font-medium uppercase tracking-wider text-[#888] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#555]" />
              Recent Activity
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <p className="text-xs text-[#888]">Loading recent activity...</p>
              ) : activities.length === 0 ? (
                <p className="text-xs text-[#888]">No recent activity.</p>
              ) : activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="text-xs space-y-1 border-b border-[#e8e5e0] pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-[#888]">
                    <span className="font-medium text-[#1a1a1a]">
                      {act.actor || "Workspace"}
                    </span>
                    <span className="text-[10px] text-[#aaa]">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#555] text-[11px]">
                    <span className="text-[#888]">{act.action}</span>{" "}
                    <span className="font-mono text-[#1a1a1a] font-medium">
                      {act.target}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
