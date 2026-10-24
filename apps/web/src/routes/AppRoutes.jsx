import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../ui/layout/AppLayout.jsx";
import LandingPage from "../pages/landing/LandingPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import WorkspaceSetupPage from "../pages/onboarding/WorkspaceSetupPage.jsx";
import InviteMembersPage from "../pages/onboarding/InviteMembersPage.jsx";
import InviteAcceptPage from "../pages/onboarding/InviteAcceptPage.jsx";
import DashboardPage from "../pages/dashboard/DashboardPage.jsx";
import ProjectListPage from "../pages/projects/ProjectListPage.jsx";
import TasksPage from "../pages/tasks/TasksPage.jsx";
import SprintManagementPage from "../pages/sprints/SprintManagementPage.jsx";
import TeamSettingsPage from "../pages/settings/TeamSettingsPage.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Phase 1: Unauthenticated Shell & Auth Flow */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Phase 2: Workspace Setup Flow (Post-Registration) & Token Invite Acceptance */}
        <Route path="/onboarding/workspace" element={<WorkspaceSetupPage />} />
        <Route path="/onboarding/invite" element={<InviteMembersPage />} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />

        {/* Phase 3: Authenticated App Shell & Core Views */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/app/projects/:projectId" element={<TasksPage />} />
          <Route path="/projects/:projectId/tasks" element={<TasksPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/kanban" element={<Navigate to="/tasks" replace />} />
          <Route path="/sprints" element={<SprintManagementPage />} />
          <Route
            path="/settings"
            element={<Navigate to="/settings/team" replace />}
          />
          <Route path="/settings/team" element={<TeamSettingsPage />} />
          <Route
            path="/my-tasks"
            element={<Navigate to="/dashboard" replace />}
          />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
