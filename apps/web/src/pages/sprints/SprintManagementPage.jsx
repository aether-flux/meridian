import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Plus, Target, Zap } from "lucide-react";
import { api } from "../../services/api.js";
import { useAppStore } from "../../store/useAppStore.js";
import { PriorityBadge, StatusBadge } from "../../ui/components/Badge.jsx";
import { Avatar } from "../../ui/components/Avatar.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { Input } from "../../ui/components/Input.jsx";

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSprintPhase(sprint) {
  const now = new Date();
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  if (now < start) return "UPCOMING";
  if (now > end) return "COMPLETED";
  return "ACTIVE";
}

function normalizeTask(task) {
  return {
    ...task,
    identifier: task.identifier || task.key || task.formattedIdentifier,
    assignee: task.assignee || task.assignees?.[0]?.user || null,
  };
}

const selectClass =
  "h-[42px] px-3 rounded-lg border border-[#e8e5e0] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20";

export default function SprintManagementPage() {
  const projects = useAppStore((state) => state.projects);
  const allTasks = useAppStore((state) => state.tasks);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const setSelectedTaskId = useAppStore((state) => state.setSelectedTaskId);
  const [projectId, setProjectId] = useState("");
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [sprintTasks, setSprintTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [taskToAdd, setTaskToAdd] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [error, setError] = useState("");

  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedSprint = sprints.find((sprint) => sprint.id === selectedSprintId);
  const currentSprintTasks = sprintTasks.map(
    (task) => allTasks.find((item) => item.id === task.id) || task,
  );
  const completedCount = currentSprintTasks.filter(
    (task) => task.status === "DONE",
  ).length;
  const progressPercent = sprintTasks.length
    ? Math.round((completedCount / sprintTasks.length) * 100)
    : 0;
  const unassignedTasks = useMemo(
    () => availableTasks.filter((task) => !sprintTasks.some((item) => item.id === task.id)),
    [availableTasks, sprintTasks],
  );

  useEffect(() => {
    if (!projects.length) {
      setProjectId("");
      return;
    }
    if (!projects.some((project) => project.id === projectId)) {
      const workspaceProject = projects.find(
        (project) => project.workspaceId === activeWorkspace?.id,
      );
      setProjectId(workspaceProject?.id || projects[0].id);
    }
  }, [projects, projectId, activeWorkspace?.id]);

  useEffect(() => {
    if (!projectId || !activeWorkspace?.slug) {
      setSprints([]);
      setAvailableTasks([]);
      setSelectedSprintId("");
      setSprintTasks([]);
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError("");
    setSelectedSprintId("");
    setSprintTasks([]);

    Promise.all([
      api.get(
        `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects/${encodeURIComponent(projectId)}/sprints`,
      ),
      api.get(
        `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects/${encodeURIComponent(projectId)}/tasks`,
      ),
    ])
      .then(([sprintResponse, taskResponse]) => {
        if (!isCurrent) return;
        const loadedSprints = sprintResponse.sprints || [];
        setSprints(loadedSprints);
        setSelectedSprintId(loadedSprints[0]?.id || "");
        setAvailableTasks((taskResponse.tasks || []).map(normalizeTask));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || "Unable to load sprint data.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, activeWorkspace?.slug]);

  useEffect(() => {
    if (!selectedSprintId) {
      setSprintTasks([]);
      return undefined;
    }

    let isCurrent = true;
    setError("");
    api
      .get(`/sprints/${encodeURIComponent(selectedSprintId)}/tasks`)
      .then((response) => {
        if (!isCurrent) return;
        const loadedTasks = (response.tasks || []).map(normalizeTask);
        setSprintTasks(loadedTasks);
        useAppStore.setState((state) => ({
          tasks: [
            ...state.tasks.filter(
              (task) => !loadedTasks.some((loaded) => loaded.id === task.id),
            ),
            ...loadedTasks,
          ],
        }));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || "Unable to load sprint tasks.");
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedSprintId]);

  const handleCreateSprint = async (event) => {
    event.preventDefault();
    if (!selectedProject || !activeWorkspace?.slug) return;
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after the start date.");
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      const response = await api.post(
        `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects/${encodeURIComponent(selectedProject.id)}/sprints`,
        { name: sprintName.trim(), startDate, endDate },
      );
      setSprints((current) =>
        [...current, response.sprint].sort(
          (left, right) => new Date(left.startDate) - new Date(right.startDate),
        ),
      );
      setSelectedSprintId(response.sprint.id);
      setSprintName("");
      setStartDate("");
      setEndDate("");
      setIsCreateOpen(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to create sprint.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (!selectedSprintId || !taskToAdd) return;

    setIsAddingTask(true);
    setError("");
    try {
      const response = await api.post(
        `/sprints/${encodeURIComponent(selectedSprintId)}/tasks`,
        { taskId: taskToAdd },
      );
      const task = normalizeTask(response.sprintTask.task);
      setSprintTasks((current) => [...current, task]);
      setSprints((current) =>
        current.map((sprint) =>
          sprint.id === selectedSprintId
            ? { ...sprint, _count: { tasks: (sprint._count?.tasks || 0) + 1 } }
            : sprint,
        ),
      );
      setTaskToAdd("");
    } catch (requestError) {
      setError(requestError.message || "Unable to add task to this sprint.");
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#e8e5e0]">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#555]" /> Sprints & Velocity
          </h1>
          <p className="text-xs text-[#888] mt-1">
            Manage project cycles and track completed work.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-[#555]">
            Project
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className={`${selectClass} min-w-48`}
              disabled={!projects.length}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.identifier})
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateOpen((open) => !open)}
            disabled={!selectedProject}
          >
            <Plus className="w-4 h-4" /> New Sprint
          </Button>
        </div>
      </header>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {isCreateOpen && (
        <form
          onSubmit={handleCreateSprint}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-end border-b border-[#e8e5e0] pb-5"
        >
          <Input
            id="sprintName"
            label="Sprint Name"
            placeholder="Sprint 12"
            value={sprintName}
            onChange={(event) => setSprintName(event.target.value)}
            required
          />
          <Input
            id="sprintStartDate"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          <Input
            id="sprintEndDate"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
          <Button type="submit" disabled={isCreating || !selectedProject}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </form>
      )}

      {!projects.length ? (
        <p className="py-12 text-center text-sm text-[#888]">
          Create a project before setting up sprints.
        </p>
      ) : isLoading ? (
        <p className="py-12 text-center text-sm text-[#888]">Loading sprints...</p>
      ) : !sprints.length ? (
        <div className="py-12 text-center border-y border-[#e8e5e0]">
          <p className="text-sm font-medium text-[#1a1a1a]">No sprints for this project</p>
          <p className="text-xs text-[#888] mt-1">Create a sprint to plan this project’s work.</p>
        </div>
      ) : (
        <>
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Project sprints">
            {sprints.map((sprint) => {
              const phase = getSprintPhase(sprint);
              const selected = sprint.id === selectedSprintId;
              return (
                <button
                  key={sprint.id}
                  type="button"
                  onClick={() => setSelectedSprintId(sprint.id)}
                  className={`min-w-44 text-left p-3 border transition-colors ${selected ? "border-[#1a1a1a] bg-[#f5f2ef]" : "border-[#e8e5e0] bg-white hover:bg-[#f8f6f3]"}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#1a1a1a] truncate">{sprint.name}</span>
                    <span className={`text-[9px] font-medium uppercase ${phase === "ACTIVE" ? "text-emerald-700" : "text-[#888]"}`}>
                      {phase}
                    </span>
                  </span>
                  <span className="block mt-1 text-[10px] text-[#888]">
                    {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                  </span>
                </button>
              );
            })}
          </nav>

          {selectedSprint && (
            <>
              <section className="border-y border-[#e8e5e0] py-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#888]">
                      <span className="font-mono uppercase text-[#555]">{getSprintPhase(selectedSprint)} Cycle</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(selectedSprint.startDate)} – {formatDate(selectedSprint.endDate)}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-[#1a1a1a]">{selectedSprint.name}</h2>
                  </div>
                  <div className="sm:text-right">
                    <div className="font-mono text-xl font-bold text-emerald-700">{progressPercent}%</div>
                    <div className="text-xs text-[#888]">{completedCount} of {sprintTasks.length} tasks completed</div>
                  </div>
                </div>
                <div className="h-2 overflow-hidden bg-[#e8e5e0]">
                  <div className="h-full bg-emerald-600 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#555]">
                  <Target className="w-4 h-4" />
                  <span>{selectedProject?.name} sprint cycle</span>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase text-[#777]">
                    Committed Tasks ({sprintTasks.length})
                  </h3>
                  <form onSubmit={handleAddTask} className="flex gap-2">
                    <select
                      aria-label="Select project task to add to sprint"
                      value={taskToAdd}
                      onChange={(event) => setTaskToAdd(event.target.value)}
                      className={`${selectClass} min-w-52`}
                      disabled={!unassignedTasks.length}
                    >
                      <option value="">{unassignedTasks.length ? "Select a task" : "No unassigned tasks"}</option>
                      {unassignedTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.identifier} · {task.title}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" disabled={!taskToAdd || isAddingTask}>
                      {isAddingTask ? "Adding..." : "Add Task"}
                    </Button>
                  </form>
                </div>

                {sprintTasks.length ? (
                  <div className="divide-y divide-[#e8e5e0] border-y border-[#e8e5e0]">
                    {currentSprintTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setSelectedTaskId(task.id)}
                        className="w-full p-3 text-left hover:bg-[#f8f6f3] flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-[#333]">{task.identifier}</span>
                          <span className="truncate text-xs font-medium text-[#1a1a1a]">{task.title}</span>
                        </span>
                        <span className="flex items-center gap-2.5 shrink-0">
                          <PriorityBadge priority={task.priority} showLabel={false} />
                          <StatusBadge status={task.status} />
                          {task.status === "DONE" && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                          <Avatar src={task.assignee?.avatarUrl} name={task.assignee?.displayName || "Unassigned"} size="xs" />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-[#888] border-y border-[#e8e5e0]">
                    No tasks committed to this sprint yet.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}