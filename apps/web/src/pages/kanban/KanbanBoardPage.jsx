import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Search, Plus, Kanban as KanbanIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore.js";
import KanbanColumn from "./KanbanColumn.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { api } from "../../services/api.js";

export default function KanbanBoardPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProject = projectId || searchParams.get("project") || "ALL";

  const tasks = useAppStore((state) => state.tasks);
  const projects = useAppStore((state) => state.projects);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);

  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [boardProject, setBoardProject] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [loadError, setLoadError] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!projectId) {
      setBoardProject(null);
      setSelectedProject(searchParams.get("project") || "ALL");
      return undefined;
    }

    let isCurrent = true;
    setSelectedProject(projectId);
    setIsLoading(true);
    setLoadError("");

    api.get(`/projects/${encodeURIComponent(projectId)}`)
      .then(async (projectResponse) => {
        if (!isCurrent) return;
        const project = projectResponse.project;
        const workspaceSlug = project.workspace?.slug || activeWorkspace?.slug;
        if (!workspaceSlug) throw new Error("The project workspace could not be determined.");
        const tasksResponse = await api.get(
          `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectId)}/tasks`,
        );
        if (!isCurrent) return;
        const loadedTasks = (tasksResponse.tasks || []).map((task) => ({
          ...task,
          identifier: task.identifier || task.key,
          assignee: task.assignees?.[0]?.user || null,
          subTasks: task.subTasks || [],
          labels: task.labels || [],
        }));
        setBoardProject(project);
        useAppStore.setState((state) => ({
          projects: [project, ...state.projects.filter((item) => item.id !== project.id)],
          tasks: [
            ...state.tasks.filter((task) => task.projectId !== project.id),
            ...loadedTasks,
          ],
        }));
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message || "Unable to load this project.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, searchParams, activeWorkspace?.slug]);

  useEffect(() => {
    if (projectId || selectedProject === "ALL") return undefined;

    const project = projects.find((item) => item.id === selectedProject);
    const workspaceSlug = project?.workspace?.slug || activeWorkspace?.slug;
    if (!workspaceSlug) return undefined;

    let isCurrent = true;
    setIsLoading(true);
    setLoadError("");
    api.get(
      `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(selectedProject)}/tasks`,
    )
      .then((response) => {
        if (!isCurrent) return;
        const loadedTasks = (response.tasks || []).map((task) => ({
          ...task,
          identifier: task.identifier || task.key,
          assignee: task.assignees?.[0]?.user || null,
          subTasks: task.subTasks || [],
          labels: task.labels || [],
        }));
        useAppStore.setState((state) => ({
          tasks: [
            ...state.tasks.filter((task) => task.projectId !== selectedProject),
            ...loadedTasks,
          ],
        }));
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message || "Unable to load project tasks.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, selectedProject, projects, activeWorkspace?.slug]);

  const handleTaskDrop = async (taskId, status) => {
    setLoadError("");
    try {
      await updateTaskStatus(taskId, status);
    } catch (error) {
      setLoadError(error.message || "Unable to update task status.");
    }
  };

  const handleProjectFilterChange = (projId) => {
    setSelectedProject(projId);
    if (projId === "ALL") {
      searchParams.delete("project");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ project: projId });
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchProject =
        selectedProject === "ALL" || t.projectId === selectedProject;

      const matchPriority =
        selectedPriority === "ALL" || t.priority === selectedPriority;

      const matchQuery =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.identifier.toLowerCase().includes(searchQuery.toLowerCase());

      return matchProject && matchPriority && matchQuery;
    });
  }, [tasks, selectedProject, selectedPriority, searchQuery]);

  const columns = [
    { status: "TODO", title: "Todo", colorClass: "bg-[#888888]" },
    { status: "IN_PROGRESS", title: "In Progress", colorClass: "bg-amber-500" },
    { status: "IN_REVIEW", title: "In Review", colorClass: "bg-indigo-500" },
    { status: "DONE", title: "Done", colorClass: "bg-emerald-500" },
    { status: "CANCELLED", title: "Cancelled", colorClass: "bg-[#aaaaaa]" },
  ];

  const filterSelectClass =
    "flex items-center bg-white border border-[#e8e5e0] rounded-lg px-2.5 py-1.5 text-xs";

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e8e5e0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f5f2ef] border border-[#e8e5e0] flex items-center justify-center text-[#555]">
            <KanbanIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1a1a1a] tracking-tight">
              {boardProject?.name || "Tasks"}
            </h1>
            <p className="text-xs text-[#888]">
              {isLoading
                ? "Loading project tasks..."
                : `Showing ${filteredTasks.length} tasks across status columns`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!projectId && (
            <div className={filterSelectClass}>
              <span className="text-[#888] mr-2 text-[11px] font-medium">
                Project:
              </span>
              <select
                value={selectedProject}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
                className="bg-transparent text-[#1a1a1a] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.identifier})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={filterSelectClass}>
            <span className="text-[#888] mr-2 text-[11px] font-medium">
              Priority:
            </span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent text-[#1a1a1a] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#aaa] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#e8e5e0] rounded-lg text-xs text-[#1a1a1a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] w-36 sm:w-44"
            />
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateTaskOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {loadError}
        </div>
      )}

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              colorClass={col.colorClass}
              tasks={filteredTasks.filter((t) => t.status === col.status)}
              onTaskDrop={handleTaskDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
