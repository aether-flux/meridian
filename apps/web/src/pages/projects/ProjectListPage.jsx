import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderGit2, Plus, ArrowRight } from "lucide-react";
import { useAppStore } from "../../store/useAppStore.js";
import { Button } from "../../ui/components/Button.jsx";
import { Modal } from "../../ui/components/Modal.jsx";
import { Input } from "../../ui/components/Input.jsx";
import { api } from "../../services/api.js";
import ProjectEmojiPicker from "./ProjectEmojiPicker.jsx";

export default function ProjectListPage() {
  const projects = useAppStore((state) => state.projects);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⚡");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadProjects = async () => {
      if (!activeWorkspace?.slug) {
        useAppStore.setState({ projects: [] });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await api.get(
          `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects`,
        );
        if (isCurrent) useAppStore.setState({ projects: response.projects || [] });
      } catch (requestError) {
        if (isCurrent) setError(requestError.message || "Unable to load projects.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadProjects();
    return () => {
      isCurrent = false;
    };
  }, [activeWorkspace?.slug]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (!identifier) {
      const suggestion = newName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4);
      setIdentifier(suggestion);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!activeWorkspace?.slug) {
      setError("Select a workspace before creating a project.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post(
        `/workspaces/${encodeURIComponent(activeWorkspace.slug)}/projects`,
        {
          name: name.trim(),
          identifier: identifier.trim(),
          description: description.trim(),
          icon,
        },
      );
      useAppStore.setState((state) => ({
        projects: [response.project, ...state.projects.filter((project) => project.id !== response.project.id)],
      }));
      setName("");
      setIdentifier("");
      setDescription("");
      setIsNewProjectModalOpen(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e5e0]">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#555]" />
            Projects in {activeWorkspace?.name || "Workspace"}
          </h1>
          <p className="text-xs text-[#888] mt-1">
            Projects group tasks and sprints under a human-readable identifier
            prefix (e.g. ENG-42).
          </p>
        </div>

        <Button
          onClick={() => setIsNewProjectModalOpen(true)}
          variant="primary"
          size="sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Create Project
        </Button>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-[#888]">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center border-y border-[#e8e5e0]">
          <p className="text-sm font-medium text-[#1a1a1a]">No projects in this workspace yet</p>
          <p className="text-xs text-[#888] mt-1">Create a project to start organizing tasks.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => {
          const totalCount = proj._count?.tasks ?? 0;
          const completedCount = proj.completedTaskCount ?? 0;
          const progressPercent = totalCount > 0
            ? Math.min(100, Math.round((completedCount / totalCount) * 100))
            : 0;

          return (
            <Link
              key={proj.id}
              to={`/projects/${proj.id}/tasks`}
              className="p-5 rounded-xl bg-white border border-[#e8e5e0] shadow-sm hover:bg-[#f5f2ef] transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-lg bg-[#f5f2ef] border border-[#e8e5e0]">
                      {proj.icon || "📁"}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1a1a1a]">
                        {proj.name}
                      </h3>
                      <span className="font-mono text-xs text-[#555]">
                        Prefix: {proj.identifier}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-[#555] line-clamp-2 leading-relaxed">
                  {proj.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#e8e5e0]">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#888]">
                    <span>Progress</span>
                    <span className="font-mono text-[#555]">
                      {completedCount}/{totalCount} tasks ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#f0ede8] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#1a1a1a] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#888] pt-1">
                  <span>Lead: {proj.lead || "Unassigned"}</span>

                  <span
                    className="text-xs text-[#555] hover:text-[#1a1a1a] font-medium flex items-center gap-1 transition-colors"
                  >
                    Tasks
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      )}

      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Create New Project"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
          <Input
            id="projName"
            label="Project Name"
            placeholder="e.g. Mobile CLI Companion"
            value={name}
            onChange={handleNameChange}
            required
          />

          <Input
            id="projId"
            label="Short Identifier (Prefix for tasks)"
            placeholder="e.g. MOB"
            value={identifier}
            onChange={(e) =>
              setIdentifier(e.target.value.toUpperCase().slice(0, 5))
            }
            mono
            required
            helperText="Used in task IDs like MOB-1, MOB-2 and Git branch names."
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#555]">
              Project Icon Emoji
            </label>
            <ProjectEmojiPicker value={icon} onChange={setIcon} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#555]">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="What is this project responsible for?"
              className="w-full bg-white border border-[#e8e5e0] hover:border-[#d5d2cd] rounded-lg p-2.5 text-sm text-[#1a1a1a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e8e5e0]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNewProjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
