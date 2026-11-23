import { useEffect, useState } from "react";
import { X, Calendar, MessageSquare, Terminal, Send, Plus, Save, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "../../store/useAppStore.js";
import { Avatar } from "../../ui/components/Avatar.jsx";
import { Tag } from "../../ui/components/Badge.jsx";
import { Button } from "../../ui/components/Button.jsx";
import { api } from "../../services/api.js";

const selectClass =
  "bg-white border border-[#e8e5e0] rounded-lg px-2.5 py-1 text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]";

export default function TaskDetailModal() {
  const selectedTaskId = useAppStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useAppStore((state) => state.setSelectedTaskId);
  const tasks = useAppStore((state) => state.tasks);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const updateTaskPriority = useAppStore((state) => state.updateTaskPriority);

  const [commentText, setCommentText] = useState("");
  const [copiedCli, setCopiedCli] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [dueDateDraft, setDueDateDraft] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [isCreatingSubTask, setIsCreatingSubTask] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [isSavingAssignees, setIsSavingAssignees] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);

  const task = tasks.find((t) => t.id === selectedTaskId);

  useEffect(() => {
    if (!selectedTaskId) return undefined;
    let isCurrent = true;
    setIsLoadingDetails(true);
    setStatusError("");

    Promise.all([
      api.get(`/tasks/${encodeURIComponent(selectedTaskId)}`),
      api.get(`/tasks/${encodeURIComponent(selectedTaskId)}/comments`),
    ])
      .then(async ([taskResponse, commentsResponse]) => {
        const loadedTask = {
          ...taskResponse.task,
          identifier: taskResponse.task.identifier || taskResponse.task.key,
          assignee: taskResponse.task.assignees?.[0]?.user || null,
          comments: commentsResponse.comments || [],
          subTasks: taskResponse.task.subTasks || [],
        };
        const workspaceSlug = loadedTask.project?.workspace?.slug;
        const workspaceResponse = workspaceSlug
          ? await api.get(`/workspaces/${encodeURIComponent(workspaceSlug)}`)
          : null;
        if (!isCurrent) return;
        setTitleDraft(loadedTask.title);
        setDescriptionDraft(loadedTask.description || "");
        setDueDateDraft(loadedTask.dueDate ? new Date(loadedTask.dueDate).toISOString().slice(0, 10) : "");
        setSelectedAssigneeIds(loadedTask.assignees?.map(({ userId }) => userId) || []);
        setMembers(workspaceResponse?.workspace?.members?.map((member) => member.user) || []);
        useAppStore.setState((state) => ({
          tasks: state.tasks.map((item) => item.id === loadedTask.id ? { ...item, ...loadedTask } : item),
        }));
      })
      .catch((error) => {
        if (isCurrent) setStatusError(error.message || "Unable to load task details.");
      })
      .finally(() => {
        if (isCurrent) setIsLoadingDetails(false);
      });

    return () => { isCurrent = false; };
  }, [selectedTaskId]);

  if (!task) return null;

  const cliCommand = `meridian task view ${task.identifier}`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSavingComment) return;
    setIsSavingComment(true);
    setStatusError("");
    try {
      const response = await api.post(`/tasks/${encodeURIComponent(task.id)}/comments`, { body: commentText.trim() });
      useAppStore.setState((state) => ({
        tasks: state.tasks.map((item) => item.id === task.id ? { ...item, comments: [...(item.comments || []), response.comment] } : item),
      }));
      setCommentText("");
    } catch (error) {
      setStatusError(error.message || "Unable to save comment.");
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setStatusError("");
    try {
      const response = await api.patch(`/tasks/${encodeURIComponent(task.id)}`, {
        title: titleDraft,
        description: descriptionDraft,
        dueDate: dueDateDraft || null,
      });
      useAppStore.setState((state) => ({
        tasks: state.tasks.map((item) => item.id === task.id ? { ...item, ...response.task } : item),
      }));
      setIsEditingDescription(false);
    } catch (error) {
      setStatusError(error.message || "Unable to save task details.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCreateSubTask = async (event) => {
    event.preventDefault();
    if (!subTaskTitle.trim() || isCreatingSubTask) return;
    setIsCreatingSubTask(true);
    setStatusError("");
    try {
      const response = await api.post(`/tasks/${encodeURIComponent(task.id)}/subtasks`, { title: subTaskTitle.trim() });
      useAppStore.setState((state) => ({
        tasks: state.tasks.map((item) => item.id === task.id ? { ...item, subTasks: [...(item.subTasks || []), response.subTask] } : item),
      }));
      setSubTaskTitle("");
    } catch (error) {
      setStatusError(error.message || "Unable to create sub-task.");
    } finally {
      setIsCreatingSubTask(false);
    }
  };

  const handleAssigneeChange = async (event) => {
    const nextIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedAssigneeIds(nextIds);
    setIsSavingAssignees(true);
    setStatusError("");
    try {
      const response = await api.patch(`/tasks/${encodeURIComponent(task.id)}`, { assigneeIds: nextIds });
      useAppStore.setState((state) => ({
        tasks: state.tasks.map((item) => item.id === task.id ? { ...item, ...response.task, assignee: response.task.assignees?.[0]?.user || null } : item),
      }));
    } catch (error) {
      setSelectedAssigneeIds(task.assignees?.map(({ userId }) => userId) || []);
      setStatusError(error.message || "Unable to update assignees.");
    } finally {
      setIsSavingAssignees(false);
    }
  };

  const handleSubTaskStatusChange = async (subTaskId, status) => {
    setStatusError("");
    try {
      const response = await api.patch(`/tasks/${encodeURIComponent(subTaskId)}`, { status });
      useAppStore.setState((state) => ({
        tasks: state.tasks.map((item) => item.id === task.id
          ? { ...item, subTasks: (item.subTasks || []).map((subTask) => subTask.id === subTaskId ? { ...subTask, ...response.task } : subTask) }
          : item),
      }));
    } catch (error) {
      setStatusError(error.message || "Unable to update sub-task.");
    }
  };

  const handleStatusChange = async (status) => {
    setStatusError("");
    try {
      await updateTaskStatus(task.id, status);
    } catch (error) {
      setStatusError(error.message || "Unable to update task status.");
    }
  };

  const handlePriorityChange = async (priority) => {
    setStatusError("");
    try {
      await updateTaskPriority(task.id, priority);
    } catch (error) {
      setStatusError(error.message || "Unable to update task priority.");
    }
  };

  const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
  const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={() => setSelectedTaskId(null)}
      />

      <div className="relative w-full max-w-2xl bg-white border-l border-[#e8e5e0] shadow-lg h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#e8e5e0] flex items-center justify-between bg-[#f8f6f3]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-[#1a1a1a] bg-[#f5f2ef] px-2 py-0.5 rounded border border-[#e8e5e0]">
              {task.identifier}
            </span>
            <button
              onClick={handleCopyCli}
              className="text-[#888] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#f0ede8] text-xs flex items-center gap-1 font-mono transition-colors"
              title="Copy CLI command"
            >
              <Terminal className="w-3.5 h-3.5 text-[#555]" />
              {copiedCli ? (
                <span className="text-emerald-600 text-[11px]">Copied CLI</span>
              ) : (
                <span className="text-[11px] text-[#888]">CLI command</span>
              )}
            </button>
          </div>

          <button
            onClick={() => setSelectedTaskId(null)}
            className="p-1.5 rounded-lg text-[#888] hover:text-[#1a1a1a] hover:bg-[#f0ede8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#f5f2ef] border border-[#e8e5e0]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888] font-medium">Status:</span>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={selectClass}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888] font-medium">Priority:</span>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className={selectClass}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {statusError && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {statusError}
            </div>
          )}

          {isLoadingDetails && <p className="text-xs text-[#888]">Refreshing task details...</p>}

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#888]" htmlFor="task-title-edit">Title</label>
            <input
              id="task-title-edit"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              className="w-full rounded-lg border border-[#e8e5e0] bg-white px-3 py-2 text-xl font-bold leading-snug text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase tracking-wider text-[#888]">Description · Markdown</h4>
              <button type="button" onClick={() => setIsEditingDescription((editing) => !editing)} className="inline-flex items-center gap-1 text-xs text-[#555] hover:text-[#1a1a1a]">
                {isEditingDescription ? <><Eye className="h-3.5 w-3.5" /> Preview</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
              </button>
            </div>
            {isEditingDescription ? (
              <textarea value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} rows={8} maxLength={10000} placeholder="Describe the task using Markdown..." className="w-full resize-y rounded-lg border border-[#e8e5e0] bg-white p-3 text-sm leading-relaxed text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none" />
            ) : (
              <div className="prose prose-sm max-w-none rounded-xl border border-[#e8e5e0] bg-[#f8f6f3] p-4 text-sm text-[#555] [&_a]:text-blue-700 [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-white [&_pre]:p-2 [&_ul]:list-disc [&_ol]:list-decimal">
                {descriptionDraft.trim() ? <ReactMarkdown>{descriptionDraft}</ReactMarkdown> : <p className="m-0">No description provided.</p>}
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveDetails} disabled={isSavingDetails || !titleDraft.trim()}>
                <Save className="mr-1 h-3.5 w-3.5" />{isSavingDetails ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase tracking-wider text-[#888]">
                Sub-tasks (
                {task.subTasks?.filter((st) => st.status === "DONE" || st.completed).length || 0}/
                {task.subTasks?.length || 0})
              </h4>
            </div>

            <div className="space-y-2">
              {task.subTasks && task.subTasks.length > 0 ? (
                task.subTasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#f8f6f3] border border-[#e8e5e0]">
                    <span className="min-w-0 text-xs text-[#1a1a1a]">{st.title}</span>
                    <select aria-label={`Status for sub-task ${st.title}`} value={st.status || "TODO"} onChange={(event) => handleSubTaskStatusChange(st.id, event.target.value)} className={selectClass}>
                      {statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                    </select>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#888] italic">No sub-tasks.</div>
              )}
            </div>
            <form onSubmit={handleCreateSubTask} className="flex gap-2">
              <input value={subTaskTitle} onChange={(event) => setSubTaskTitle(event.target.value)} placeholder="Add a sub-task" maxLength={255} className="min-w-0 flex-1 rounded-lg border border-[#e8e5e0] bg-white px-3 py-2 text-xs focus:border-[#1a1a1a] focus:outline-none" />
              <Button type="submit" size="sm" variant="secondary" disabled={isCreatingSubTask || !subTaskTitle.trim()}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#f8f6f3] border border-[#e8e5e0] text-xs">
            <div>
              <span className="text-[#888] block mb-1">Assignee</span>
              <div className="flex items-center gap-2">
                <Avatar
                  src={task.assignee?.avatarUrl}
                  name={task.assignee?.displayName || "Unassigned"}
                  size="xs"
                />
                <select multiple value={selectedAssigneeIds} onChange={handleAssigneeChange} aria-label="Assign workspace members" className={`${selectClass} min-w-40`} disabled={isSavingAssignees}>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.displayName} ({member.email})</option>)}
                </select>
              </div>
              <span className="mt-1 block text-[10px] text-[#888]">{isSavingAssignees ? "Saving assignments..." : "Use Ctrl or Cmd to select multiple"}</span>
            </div>

            <div>
              <span className="text-[#888] block mb-1">Due Date</span>
              <div className="flex items-center gap-1.5 text-[#555]">
                <Calendar className="w-3.5 h-3.5 text-[#888]" />
                <input type="date" value={dueDateDraft} onChange={(event) => setDueDateDraft(event.target.value)} aria-label="Task due date" className={selectClass} />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-[#888] block mb-1.5">Labels</span>
              <div className="flex flex-wrap gap-1.5">
                {task.labels?.map((label, idx) => (
                  <Tag key={idx} label={label} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e8e5e0]">
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#888] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#555]" />
              Activity & Comments ({task.comments?.length || 0})
            </h4>

            <div className="space-y-3">
              {task.comments?.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-[#f8f6f3] border border-[#e8e5e0] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between text-[#888]">
                    <div className="flex items-center gap-1.5 font-medium text-[#1a1a1a]">
                      <Avatar
                        src={c.author?.avatarUrl}
                        name={c.author?.displayName}
                        size="xs"
                      />
                      <span>{c.author?.displayName}</span>
                    </div>
                    <span className="text-[11px] text-[#aaa]">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#555] pl-6">{c.body}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Leave a comment or note..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSavingComment}
                className="flex-1 bg-white border border-[#e8e5e0] rounded-lg px-3 py-2 text-xs text-[#1a1a1a] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]"
              />
              <Button type="submit" size="sm" variant="secondary">
                <Send className="w-3.5 h-3.5 mr-1" />
                {isSavingComment ? "Sending..." : "Comment"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
