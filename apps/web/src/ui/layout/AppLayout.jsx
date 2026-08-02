import { Outlet, Link } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-indigo-600">Meridian</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/projects" className="p-2 hover:bg-gray-100 rounded">
            Projects (T2)
          </Link>
          <Link to="/kanban" className="p-2 hover:bg-gray-100 rounded">
            Kanban (T3)
          </Link>
          <Link
            to="/login"
            className="p-2 hover:bg-gray-100 rounded text-sm text-gray-500 mt-auto"
          >
            Login (T1)
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
