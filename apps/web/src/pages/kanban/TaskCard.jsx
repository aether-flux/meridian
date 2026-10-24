import { CheckSquare, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { PriorityBadge, Tag } from "../../ui/components/Badge.jsx";
import { Avatar } from "../../ui/components/Avatar.jsx";
import { useState } from "react";
import { useAppStore } from "../../store/useAppStore.js";

export default function TaskCard({ task }) {
  const [statusError, setStatusError] = useState("");
  const setSelectedTaskId = useAppStore((state) => state.setSelectedTaskId);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);

  const completedSubtasks =
    task.subTasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subTasks?.length || 0;

  const statusOrder = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
  const currentIndex = statusOrder.indexOf(task.status);

  const changeStatus = async (status) => {
    setStatusError("");
    try {
      await updateTaskStatus(task.id, status);
    } catch (error) {
      setStatusError(error.message || "Unable to update task status.");
    }
  };

  const handleMovePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      changeStatus(statusOrder[currentIndex - 1]);
    }
  };

  const handleMoveNext = (e) => {
    e.stopPropagation();
    if (currentIndex < statusOrder.length - 1) {
      changeStatus(statusOrder[currentIndex + 1]);
    }
  };

  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
      onClick={() => setSelectedTaskId(task.id)}
      className="p-3.5 rounded-xl bg-white border border-[#e8e5e0] hover:bg-[#f5f2ef] cursor-pointer transition-all shadow-sm space-y-3 group"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-[#1a1a1a] bg-[#f5f2ef] px-2 py-0.5 rounded border border-[#e8e5e0]">
          {task.identifier}
        </span>
        <PriorityBadge priority={task.priority} showLabel={false} />
      </div>

      <h4 className="text-xs font-medium text-[#1a1a1a] leading-snug line-clamp-2">
        {task.title}
      </h4>

      {statusError && (
        <p role="alert" className="text-[10px] text-red-600">{statusError}</p>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 2).map((label, idx) => (
            <Tag key={idx} label={label} />
          ))}
          {task.labels.length > 2 && (
            <span className="text-[10px] text-[#aaa] font-mono">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-[#e8e5e0] flex items-center justify-between text-xs text-[#888]">
        <div className="flex items-center gap-2">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-[#888]">
              <CheckSquare className="w-3 h-3 text-[#aaa]" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-[10px] text-[#888]">
              <Calendar className="w-3 h-3 text-[#aaa]" />
              <span>{task.dueDate.slice(5)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mr-1">
            {currentIndex > 0 && (
              <button
                onClick={handleMovePrev}
                className="p-1 rounded-lg hover:bg-[#e8e5e0] text-[#888] hover:text-[#1a1a1a]"
                title="Move left"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
            {currentIndex < statusOrder.length - 1 && (
              <button
                onClick={handleMoveNext}
                className="p-1 rounded-lg hover:bg-[#e8e5e0] text-[#888] hover:text-[#1a1a1a]"
                title="Move right"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <Avatar
            src={task.assignee?.avatarUrl}
            name={task.assignee?.displayName || "Unassigned"}
            size="xs"
          />
        </div>
      </div>
    </div>
  );
}
