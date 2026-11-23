import { Plus } from "lucide-react";
import TaskCard from "./TaskCard.jsx";
import { useAppStore } from "../../store/useAppStore.js";

export default function KanbanColumn({
  status,
  title,
  colorClass,
  tasks = [],
  onTaskDrop,
}) {
  const setIsCreateTaskOpen = useAppStore((state) => state.setIsCreateTaskOpen);

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/task-id");
        if (taskId) onTaskDrop?.(taskId, status);
      }}
      className="flex flex-col flex-1 min-w-[280px] max-w-[340px] bg-[#f0ede8]/60 rounded-xl border border-[#e8e5e0] p-3 h-full"
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colorClass}`} />
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#555]">
            {title}
          </h3>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-[#888] border border-[#e8e5e0]">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsCreateTaskOpen(true)}
          className="p-1 rounded-lg text-[#888] hover:text-[#1a1a1a] hover:bg-[#e8e5e0] transition-colors"
          title="Add task to this column"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-[300px]">
        {tasks.length === 0 ? (
          <div className="h-32 rounded-xl border border-dashed border-[#e8e5e0] flex flex-col items-center justify-center text-xs text-[#888] p-4 text-center bg-white/50">
            <span>No {title.toLowerCase()} tasks</span>
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
