import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";
import TaskDetailModal from "../../pages/tasks/TaskDetailModal.jsx";
import CreateTaskModal from "../../pages/tasks/CreateTaskModal.jsx";
import { CliTipsModal } from "../components/CliTipsModal.jsx";
import { useAppStore } from "../../store/useAppStore.js";
import { api } from "../../services/api.js";

export default function AppLayout() {
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const isCliModalOpen = useAppStore((state) => state.isCliModalOpen);
  const setIsCliModalOpen = useAppStore((state) => state.setIsCliModalOpen);
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadWorkspaces = async () => {
      if (!localStorage.getItem("meridian_token")) {
        setWorkspacesLoaded(true);
        return;
      }

      try {
        const response = await api.get("/workspaces");
        if (!isCurrent) return;

        const workspaces = response.workspaces || [];
        const savedWorkspaceId = localStorage.getItem("meridian_workspace_id");
        const savedWorkspaceSlug = localStorage.getItem("meridian_workspace_slug");
        const activeWorkspace =
          workspaces.find(
            (workspace) =>
              workspace.id === savedWorkspaceId ||
              workspace.slug === savedWorkspaceSlug,
          ) || workspaces[0] || null;

        useAppStore.setState({ workspaces, activeWorkspace });
        if (activeWorkspace) {
          localStorage.setItem("meridian_workspace_id", activeWorkspace.id);
          localStorage.setItem("meridian_workspace_slug", activeWorkspace.slug);
          localStorage.setItem(
            "meridian_active_workspace",
            JSON.stringify(activeWorkspace),
          );
        } else {
          localStorage.removeItem("meridian_workspace_id");
          localStorage.removeItem("meridian_workspace_slug");
          localStorage.removeItem("meridian_active_workspace");
        }
      } catch (error) {
        if (isCurrent) {
          useAppStore.setState({ workspaces: [], activeWorkspace: null });
          console.error("Unable to load workspaces:", error);
        }
      } finally {
        if (isCurrent) setWorkspacesLoaded(true);
      }
    };

    loadWorkspaces();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadProjects = async () => {
      if (!workspacesLoaded) return;
      if (!activeWorkspace?.slug) {
        useAppStore.setState({ projects: [] });
        return;
      }

      try {
        const response = await api.get(
          `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects`,
        );
        if (isCurrent) useAppStore.setState({ projects: response.projects || [] });
      } catch (error) {
        if (isCurrent) {
          useAppStore.setState({ projects: [] });
          console.error("Unable to load workspace projects:", error);
        }
      }
    };

    loadProjects();
    return () => {
      isCurrent = false;
    };
  }, [activeWorkspace?.slug, workspacesLoaded]);

  // Global keyboard shortcuts (C for new task, ` for CLI tips)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input or textarea
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setIsCreateTaskOpen(true);
      } else if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        setIsCliModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsCreateTaskOpen, setIsCliModalOpen]);

  return (
    <div className="flex h-screen bg-[#f8f6f3] text-[#1a1a1a] overflow-hidden font-sans">
      {/* Left persistent Sidebar */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Slide-overs and Modals */}
      <TaskDetailModal />
      <CreateTaskModal />
      <CliTipsModal
        isOpen={isCliModalOpen}
        onClose={() => setIsCliModalOpen(false)}
      />
    </div>
  );
}
