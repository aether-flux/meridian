import { useState } from "react";
import { useParams } from "react-router-dom";
import { Modal } from "../../ui/components/Modal.jsx";
import { Input } from "../../ui/components/Input.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { useAppStore } from "../../store/useAppStore.js";

const selectClass =
  "h-[42px] px-3 rounded-lg border border-[#e8e5e0] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 focus:border-[#1a1a1a]";

export default function CreateTaskModal() {
  const { projectId: routeProjectId } = useParams();
  const isCreateTaskOpen = useAppStore((state) => state.isCreateTaskOpen);
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);
  const projects = useAppStore((state) => state.projects);
  const createTask = useAppStore((state) => state.createTask);

  const [projectId, setProjectId] = useState(routeProjectId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdIdentifier, setCreatedIdentifier] = useState("");

  const selectedProjectId = routeProjectId || projectId || projects[0]?.id || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCreatedIdentifier("");
    if (!selectedProjectId) {
      setError("Select a project before creating a task.");
      return;
    }

    setIsSubmitting(true);
    try {
      const task = await createTask({
        projectId: selectedProjectId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
      });
      setCreatedIdentifier(task.identifier);
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (requestError) {
      setError(requestError.message || "Unable to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateTaskOpen}
      onClose={() => setIsCreateTaskOpen(false)}
      title="Create New Task"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
        {createdIdentifier && (
          <div role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            Task created: <span className="font-mono font-semibold">{createdIdentifier}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#555]">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={Boolean(routeProjectId)}
              className={selectClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name} ({p.identifier})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#555]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={selectClass}
            >
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="NONE">None</option>
            </select>
          </div>
        </div>

        <Input
          id="taskTitle"
          label="Title"
          placeholder="e.g. Implement webhook dispatch for CLI status updates"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#555]">
            Description (Markdown supported)
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, acceptance criteria, or code blocks..."
            className="w-full bg-white border border-[#e8e5e0] hover:border-[#d5d2cd] rounded-lg p-3 text-sm text-[#1a1a1a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="dueDate"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e8e5e0]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsCreateTaskOpen(false);
              setCreatedIdentifier("");
            }}
          >
            {createdIdentifier ? "Done" : "Cancel"}
          </Button>
          {!createdIdentifier && (
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
