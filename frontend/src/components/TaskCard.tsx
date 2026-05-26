import { Task, TaskOwner } from "@/types";

interface TaskCardProps {
  task: Task;
  showOwner?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export default function TaskCard({
  task,
  showOwner,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const owner =
    task.userId && typeof task.userId === "object"
      ? (task.userId as TaskOwner)
      : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900 text-sm leading-snug">
          {task.title}
        </h3>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center flex-wrap gap-2 mt-1">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>

        {showOwner && owner && (
          <span className="text-xs text-gray-400 ml-auto">{owner.name}</span>
        )}
      </div>
    </div>
  );
}
