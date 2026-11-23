import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Columns3, List, Plus, Search, Settings2 } from "lucide-react";
import { api } from "../../services/api.js";
import { useAppStore } from "../../store/useAppStore.js";
import { Button } from "../../ui/components/Button.jsx";
import KanbanColumn from "../kanban/KanbanColumn.jsx";
import ProjectSettingsModal from "../projects/ProjectSettingsModal.jsx";

const columns = [
  { status: "TODO", title: "Todo", colorClass: "bg-[#888888]" },
  { status: "IN_PROGRESS", title: "In Progress", colorClass: "bg-amber-500" },
  { status: "IN_REVIEW", title: "In Review", colorClass: "bg-indigo-500" },
  { status: "DONE", title: "Done", colorClass: "bg-emerald-500" },
  { status: "CANCELLED", title: "Cancelled", colorClass: "bg-[#aaaaaa]" },
];
const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];
const filterSelectClass = "flex items-center bg-white border border-[#e8e5e0] rounded-lg px-2.5 py-1.5 text-xs";

const normalizeTask = (task) => ({
  ...task,
  identifier: task.identifier || task.key || task.formattedIdentifier,
  assignee: task.assignee || task.assignees?.[0]?.user || null,
  subTasks: task.subTasks || [],
  labels: task.labels || [],
});

export default function TasksPage() {
  const { projectId } = useParams();
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const projects = useAppStore((state) => state.projects);
  const storedTasks = useAppStore((state) => state.tasks);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const updateTaskPriority = useAppStore((state) => state.updateTaskPriority);
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);
  const [scopeProjectIds, setScopeProjectIds] = useState([]);
  const [project, setProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => localStorage.getItem("meridian_tasks_view") || "kanban");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      if (!activeWorkspace?.slug) throw new Error("Select a workspace to load tasks.");

      if (projectId) {
        const response = await api.get(`/projects/${encodeURIComponent(projectId)}`);
        const loadedProject = response.project;
        const workspaceSlug = loadedProject.workspace?.slug || activeWorkspace.slug;
        const tasksResponse = await api.get(
          `/workspaces/${encodeURIComponent(workspaceSlug)}/projects/${encodeURIComponent(projectId)}/tasks`,
        );
        if (!isCurrent) return;
        const loadedTasks = (tasksResponse.tasks || []).map(normalizeTask);
        setProject(loadedProject);
        setScopeProjectIds([loadedProject.id]);
        useAppStore.setState((state) => ({
          projects: [loadedProject, ...state.projects.filter((item) => item.id !== loadedProject.id)],
          tasks: [...state.tasks.filter((task) => task.projectId !== loadedProject.id), ...loadedTasks],
        }));
        return;
      }

      const projectsResponse = await api.get(
        `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects`,
      );
      setSelectedProject("ALL");
      const workspaceProjects = projectsResponse.projects || [];
      const responses = await Promise.all(workspaceProjects.map((workspaceProject) =>
        api.get(`/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects/${encodeURIComponent(workspaceProject.id)}/tasks`),
      ));
      if (!isCurrent) return;
      const loadedTasks = responses.flatMap((response) => response.tasks || []).map(normalizeTask);
      const projectIds = new Set(workspaceProjects.map((item) => item.id));
      setProject(null);
      setScopeProjectIds([...projectIds]);
      useAppStore.setState((state) => ({
        projects: [...state.projects.filter((item) => item.workspaceId !== activeWorkspace.id), ...workspaceProjects],
        tasks: [...state.tasks.filter((task) => !projectIds.has(task.projectId)), ...loadedTasks],
      }));
    };

    setIsLoading(true);
    setError("");
    load()
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || "Unable to load tasks.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [projectId, activeWorkspace?.id, activeWorkspace?.slug]);

  const filteredTasks = useMemo(() => storedTasks.filter((task) => {
    if (!scopeProjectIds.includes(task.projectId)) return false;
    const matchesProject = projectId || selectedProject === "ALL" || task.projectId === selectedProject;
    const matchesPriority = priority === "ALL" || task.priority === priority;
    const search = query.trim().toLowerCase();
    const matchesQuery = !search || task.title.toLowerCase().includes(search) || task.identifier?.toLowerCase().includes(search);
    return matchesProject && matchesPriority && matchesQuery;
  }), [storedTasks, scopeProjectIds, projectId, selectedProject, priority, query]);

  const changeStatus = async (taskId, status) => {
    setError("");
    try {
      await updateTaskStatus(taskId, status);
    } catch (requestError) {
      setError(requestError.message || "Unable to update task status.");
    }
  };

  const changePriority = async (taskId, nextPriority) => {
    setError("");
    try {
      await updateTaskPriority(taskId, nextPriority);
    } catch (requestError) {
      setError(requestError.message || "Unable to update task priority.");
    }
  };

  const changeView = (nextView) => {
    setView(nextView);
    localStorage.setItem("meridian_tasks_view", nextView);
  };

  return (
    <section className="h-full flex flex-col gap-4 animate-in fade-in duration-200">
      <header className="flex flex-col gap-3 border-b border-[#e8e5e0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {project?.icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e5e0] bg-white text-xl" aria-hidden="true">{project.icon}</span>
            ) : null}
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1a]">{project?.name || "Tasks"}</h1>
          <p className="mt-1 text-xs text-[#888]">
            {isLoading ? "Loading tasks..." : `${filteredTasks.length} tasks${project ? ` in ${project.name}` : " in this workspace"}`}
          </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project && <Button size="sm" variant="secondary" onClick={() => setIsSettingsOpen(true)} title="Project settings"><Settings2 className="h-3.5 w-3.5" />Settings</Button>}
          {!projectId && (
            <label className={filterSelectClass}>
              <span className="mr-2 text-[11px] font-medium text-[#888]">Project</span>
              <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} className="cursor-pointer bg-transparent text-[#1a1a1a] focus:outline-none">
                <option value="ALL">All projects</option>
                {projects.filter((item) => item.workspaceId === activeWorkspace?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <label className={filterSelectClass}>
            <span className="mr-2 text-[11px] font-medium text-[#888]">Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className="cursor-pointer bg-transparent text-[#1a1a1a] focus:outline-none">
              <option value="ALL">All priorities</option>
              {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#aaa]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." className="w-36 rounded-lg border border-[#e8e5e0] bg-white py-1.5 pl-8 pr-3 text-xs text-[#1a1a1a] placeholder-[#aaa] focus:border-[#1a1a1a] focus:outline-none sm:w-44" />
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsCreateTaskOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" />New Task</Button>
        </div>
      </header>

      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-[#e8e5e0] bg-white p-1" role="group" aria-label="Task view">
          <button type="button" onClick={() => changeView("kanban")} aria-pressed={view === "kanban"} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === "kanban" ? "bg-[#1a1a1a] text-white" : "text-[#555] hover:bg-[#f5f2ef]"}`}><Columns3 className="h-3.5 w-3.5" />Kanban View</button>
          <button type="button" onClick={() => changeView("list")} aria-pressed={view === "list"} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${view === "list" ? "bg-[#1a1a1a] text-white" : "text-[#555] hover:bg-[#f5f2ef]"}`}><List className="h-3.5 w-3.5" />List View</button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {isLoading ? (
        <div className="flex-1 rounded-lg border border-[#e8e5e0] bg-white p-8 text-center text-sm text-[#888]">Loading tasks...</div>
      ) : view === "list" ? (
        <div className="flex-1 overflow-auto rounded-lg border border-[#e8e5e0] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#f5f2ef] text-[#777]"><tr><th className="px-4 py-3 font-medium">Task</th>{!projectId && <th className="px-4 py-3 font-medium">Project</th>}<th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Priority</th><th className="px-4 py-3 font-medium">Due date</th></tr></thead>
            <tbody className="divide-y divide-[#eeeae5]">
              {filteredTasks.map((task) => <tr key={task.id} className="hover:bg-[#faf9f7]">
                <td className="px-4 py-3"><button type="button" onClick={() => useAppStore.getState().setSelectedTaskId(task.id)} className="text-left"><span className="mr-2 font-mono text-[#888]">{task.identifier}</span><span className="font-medium text-[#1a1a1a]">{task.title}</span></button></td>
                {!projectId && <td className="px-4 py-3 text-[#666]">{projects.find((item) => item.id === task.projectId)?.name || "Project"}</td>}
                <td className="px-4 py-3"><select aria-label={`Status for ${task.identifier}`} value={task.status} onChange={(event) => changeStatus(task.id, event.target.value)} className={filterSelectClass}>{columns.map((item) => <option key={item.status} value={item.status}>{item.title}</option>)}</select></td>
                <td className="px-4 py-3"><select aria-label={`Priority for ${task.identifier}`} value={task.priority} onChange={(event) => changePriority(task.id, event.target.value)} className={filterSelectClass}>{priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></td>
                <td className="px-4 py-3 text-[#666]">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}</td>
              </tr>)}
              {!filteredTasks.length && <tr><td colSpan={projectId ? 4 : 5} className="px-4 py-10 text-center text-[#888]">No tasks match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4"><div className="flex h-full min-w-max gap-4">
          {columns.map((column) => <KanbanColumn key={column.status} status={column.status} title={column.title} colorClass={column.colorClass} tasks={filteredTasks.filter((task) => task.status === column.status)} onTaskDrop={changeStatus} />)}
        </div></div>
      )}
      <ProjectSettingsModal
        project={isSettingsOpen ? project : null}
        onClose={() => setIsSettingsOpen(false)}
        onUpdated={(updatedProject) => {
          setProject(updatedProject);
          useAppStore.setState((state) => ({
            projects: state.projects.map((item) => item.id === updatedProject.id ? { ...item, ...updatedProject } : item),
          }));
        }}
      />
    </section>
  );
}
