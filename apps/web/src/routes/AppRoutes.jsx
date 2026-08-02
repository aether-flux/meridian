import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../ui/layout/AppLayout.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import ProjectListPage from "../pages/projects/ProjectListPage.jsx";
import KanbanBoardPage from "../pages/kanban/KanbanBoardPage.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* App Shell Routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="kanban" element={<KanbanBoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
