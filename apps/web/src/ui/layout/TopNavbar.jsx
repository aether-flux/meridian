import { useState } from "react";
import { Search, Plus, Bell, Terminal, X } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { RoleBadge } from "../components/Badge.jsx";
import { useAppStore } from "../../store/useAppStore.js";

export default function TopNavbar() {
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const user = useAppStore((state) => state.user);
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);
  const setIsCliModalOpen = useAppStore((state) => state.setIsCliModalOpen);
  const tasks = useAppStore((state) => state.tasks);
  const setSelectedTaskId = useAppStore((state) => state.setSelectedTaskId);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const filteredTasks = searchQuery.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.identifier.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const handleSelectTask = (taskId) => {
    setSelectedTaskId(taskId);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="h-12 border-b border-[#e8e5e0] bg-[#f8f6f3] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Breadcrumb / Search trigger */}
      <div className="relative flex-1 max-w-md">
        <div
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#f0ede8] text-xs text-[#888] cursor-pointer transition-colors"
        >
          <span className="text-[#888]">{activeWorkspace?.name || "Meridian"}</span>
          <span className="text-[#aaa]">/</span>
          <span className="text-[#1a1a1a] font-medium">Dashboard</span>
          <kbd className="ml-auto font-mono text-[10px] bg-white text-[#888] px-1.5 py-0.5 rounded border border-[#e8e5e0] hidden sm:inline-block">
            ⌘K
          </kbd>
        </div>

        {/* Global Quick Search Dropdown */}
        {isSearchOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsSearchOpen(false)}
            />
            <div className="absolute top-10 left-0 right-0 bg-white border border-[#e8e5e0] rounded-xl shadow-lg p-2 z-50">
              <div className="flex items-center px-3 py-2 border-b border-[#e8e5e0]">
                <Search className="w-4 h-4 text-[#888] mr-2 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type task title or ID (e.g. ENG-42)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#1a1a1a] placeholder-[#aaa] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[#aaa] hover:text-[#555]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto p-1 mt-1 space-y-1">
                {searchQuery.trim() === "" ? (
                  <div className="p-3 text-center text-xs text-[#888]">
                    Search across all projects in{" "}
                    {activeWorkspace?.name || "workspace"}.
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#888]">
                    No tasks found matching &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  filteredTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTask(t.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f5f2ef] text-left text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] text-[#1a1a1a] font-semibold">
                          {t.identifier}
                        </span>
                        <span className="text-[#555] truncate">
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#888] uppercase">
                        {t.status.replace("_", " ")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <div className="hidden sm:inline-flex">
          <RoleBadge role={user?.role || activeWorkspace?.role || "OWNER"} />
        </div>

        {/* CLI Helper Modal Button */}
        <button
          onClick={() => setIsCliModalOpen(true)}
          className="p-1.5 rounded-lg hover:bg-[#f0ede8] text-[#888] hover:text-[#555] transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Terminal CLI Reference"
        >
          <Terminal className="w-3.5 h-3.5 text-[#555]" />
          <span className="hidden md:inline text-[11px]">CLI</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 rounded-lg text-[#888] hover:text-[#1a1a1a] hover:bg-[#f0ede8] transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-10 w-80 bg-white border border-[#e8e5e0] rounded-xl shadow-lg p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#e8e5e0] text-xs font-semibold text-[#1a1a1a]">
                  <span>Notifications</span>
                  <span className="text-[10px] font-mono text-[#888]">
                    2 new
                  </span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#f8f6f3] border border-[#e8e5e0]">
                    <p className="text-[#1a1a1a] font-medium">
                      Sprint 24 active
                    </p>
                    <p className="text-[11px] text-[#888] mt-0.5">
                      65% of cycle tasks completed. 6 days remaining.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#f8f6f3] border border-[#e8e5e0]">
                    <p className="text-[#1a1a1a] font-medium">
                      Token invite generated
                    </p>
                    <p className="text-[11px] text-[#888] mt-0.5">
                      Share link with teammate to invite without SMTP.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* + Task Quick CTA */}
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateTaskOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Task</span>
        </Button>
      </div>
    </header>
  );
}
