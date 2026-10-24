import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListTodo,
  FolderGit2,
  Zap,
  Users,
  Plus,
  ChevronDown,
  LogOut,
  Terminal,
  Check,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Avatar } from "../components/Avatar.jsx";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const workspaces = useAppStore((state) => state.workspaces);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const setActiveWorkspace = useAppStore((state) => state.setActiveWorkspace);
  const projects = useAppStore((state) => state.projects);
  const { logout } = useAuth();
  const setIsCliModalOpen = useAppStore((state) => state.setIsCliModalOpen);

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const handleSelectWorkspace = (wsId) => {
    setActiveWorkspace(wsId);
    const workspace = workspaces.find((item) => item.id === wsId);
    if (workspace) {
      localStorage.setItem("meridian_workspace_id", workspace.id);
      localStorage.setItem("meridian_workspace_slug", workspace.slug);
      localStorage.setItem("meridian_active_workspace", JSON.stringify(workspace));
    }
    setIsWorkspaceMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Tasks", to: "/tasks", icon: ListTodo },
    { label: "Projects", to: "/projects", icon: FolderGit2 },
    { label: "Sprints & Cycles", to: "/sprints", icon: Zap },
    { label: "Team & Invites", to: "/settings/team", icon: Users },
  ];

  return (
    <aside className="w-56 bg-[#f0ede8] border-r border-[#e8e5e0] flex flex-col h-screen select-none relative z-30">
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-[#e8e5e0] relative">
        <button
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#e8e5e0] transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center font-mono font-bold text-xs text-white flex-shrink-0">
              {activeWorkspace?.name
                ? activeWorkspace.name.slice(0, 1).toUpperCase()
                : "M"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#1a1a1a] truncate">
                {activeWorkspace?.name || "Meridian Core"}
              </div>
              <div className="text-[10px] text-[#888] truncate">
                {activeWorkspace?._count?.members ?? activeWorkspace?.memberCount ?? 1} members
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#888] group-hover:text-[#555] transition-transform" />
        </button>

        {/* Workspace Switcher Dropdown */}
        {isWorkspaceMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsWorkspaceMenuOpen(false)}
            />
            <div className="absolute top-16 left-3 right-3 bg-white border border-[#e8e5e0] rounded-xl shadow-lg p-2 z-50">
              <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#888]">
                Workspaces ({workspaces.length})
              </div>

              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                      ws.id === activeWorkspace?.id
                        ? "bg-[#f5f2ef] text-[#1a1a1a] font-medium"
                        : "text-[#555] hover:bg-[#f5f2ef]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded bg-[#e8e5e0] flex items-center justify-center text-[10px] font-mono text-[#555]">
                        {ws.name.slice(0, 1)}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {ws.id === activeWorkspace?.id && (
                      <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-[#e8e5e0]">
                <Link
                  to="/onboarding/workspace"
                  onClick={() => setIsWorkspaceMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#555] hover:text-[#1a1a1a] hover:bg-[#f5f2ef] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Workspace
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-medium uppercase tracking-wider text-[#888]">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#e8e5e0] text-[#1a1a1a]"
                      : "text-[#555] hover:text-[#1a1a1a] hover:bg-[#eeedea]"
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Projects List Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-medium uppercase tracking-wider text-[#888]">
            <span>Projects</span>
            <Link
              to="/projects"
              className="hover:text-[#555] transition-colors"
              title="Add Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-0.5">
            {projects.map((proj) => (
              <NavLink
                key={proj.id}
                to={`/projects/${proj.id}/tasks`}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors group ${
                    isActive
                      ? "bg-[#e8e5e0] text-[#1a1a1a]"
                      : "text-[#555] hover:text-[#1a1a1a] hover:bg-[#eeedea]"
                  }`
                }
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs">{proj.icon || "📁"}</span>
                  <span className="truncate">{proj.name}</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#e8e5e0] text-[#888] group-hover:text-[#555]">
                  {proj.identifier}
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* CLI Terminal Parity Widget */}
        <div className="p-3 rounded-xl bg-[#1a1a1a] text-xs border border-[#333]">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#555]" />
            <div className="w-2 h-2 rounded-full bg-[#555]" />
            <div className="w-2 h-2 rounded-full bg-[#555]" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[#e8e5e0] flex items-center gap-1.5 text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Meridian CLI
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Ready
            </span>
          </div>
          <p className="text-[11px] text-[#888] mb-2 leading-tight">
            Run commands directly from your local terminal.
          </p>
          <button
            onClick={() => setIsCliModalOpen(true)}
            className="w-full py-1 px-2 rounded bg-[#333] hover:bg-[#444] text-[#e8e5e0] text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View CLI shortcuts</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#e8e5e0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={user?.avatarUrl}
              name={user?.displayName || "Alex Rivera"}
              initials={user?.initials || "AR"}
              size="sm"
            />
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#1a1a1a] truncate">
                {user?.displayName || "Alex Rivera"}
              </div>
              <div className="text-[10px] text-[#888] truncate">
                {user?.email || "alex@meridian.dev"}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#888] hover:text-rose-500 hover:bg-[#e8e5e0] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
