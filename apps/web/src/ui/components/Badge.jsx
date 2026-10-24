import {
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react";

export function RoleBadge({ role }) {
  const normalized = (role || "MEMBER").toUpperCase();

  const styles = {
    OWNER: "bg-amber-50 text-amber-700 border-amber-200",
    ADMIN: "bg-[#f5f2ef] text-[#1a1a1a] border-[#e8e5e0]",
    MEMBER: "bg-emerald-50 text-emerald-700 border-emerald-200",
    VIEWER: "bg-[#f0ede8] text-[#888] border-[#e8e5e0]",
  };

  const icons = {
    OWNER: <ShieldAlert className="w-3 h-3" />,
    ADMIN: <Shield className="w-3 h-3" />,
    MEMBER: <User className="w-3 h-3" />,
    VIEWER: <Eye className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
        styles[normalized] || styles.MEMBER
      }`}
    >
      {icons[normalized]}
      {normalized}
    </span>
  );
}

export function StatusBadge({ status }) {
  const normalized = (status || "TODO").toUpperCase();

  const config = {
    TODO: { label: "Todo", dotColor: "bg-[#888888]" },
    IN_PROGRESS: { label: "In Progress", dotColor: "bg-amber-500" },
    IN_REVIEW: { label: "In Review", dotColor: "bg-indigo-500" },
    DONE: { label: "Done", dotColor: "bg-emerald-500" },
    CANCELLED: { label: "Cancelled", dotColor: "bg-[#aaaaaa]" },
  };

  const item = config[normalized] || config.TODO;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#555]">
      <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
      {item.label}
    </span>
  );
}

export function PriorityBadge({ priority, showLabel = true }) {
  const normalized = (priority || "NONE").toUpperCase();

  const config = {
    URGENT: {
      label: "Urgent",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    HIGH: {
      label: "High",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <ArrowUp className="w-3 h-3" />,
    },
    MEDIUM: {
      label: "Medium",
      color: "bg-[#f5f2ef] text-[#555] border-[#e8e5e0]",
      icon: <Minus className="w-3 h-3" />,
    },
    LOW: {
      label: "Low",
      color: "bg-[#f0ede8] text-[#888] border-[#e8e5e0]",
      icon: <ArrowDown className="w-3 h-3" />,
    },
    NONE: {
      label: "None",
      color: "bg-[#f8f6f3] text-[#aaa] border-[#e8e5e0]",
      icon: <Minus className="w-3 h-3" />,
    },
  };

  const item = config[normalized] || config.NONE;

  return (
    <span
      title={`Priority: ${item.label}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${item.color}`}
    >
      {item.icon}
      {showLabel && <span>{item.label}</span>}
    </span>
  );
}

export function Tag({ label }) {
  const colorMap = {
    auth: "bg-orange-100 text-orange-700",
    security: "bg-orange-100 text-orange-700",
    invites: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
    frontend: "bg-green-100 text-green-700",
    ui: "bg-green-100 text-green-700",
    kanban: "bg-green-100 text-green-700",
    backend: "bg-purple-100 text-purple-700",
    rbac: "bg-purple-100 text-purple-700",
    cli: "bg-cyan-100 text-cyan-700",
    terminal: "bg-cyan-100 text-cyan-700",
    api: "bg-blue-100 text-blue-700",
    tests: "bg-teal-100 text-teal-700",
    documentation: "bg-[#f0ede8] text-[#555]",
    onboarding: "bg-amber-100 text-amber-700",
    ux: "bg-amber-100 text-amber-700",
    deprecated: "bg-[#f0ede8] text-[#888]",
    welcome: "bg-emerald-100 text-emerald-700",
    general: "bg-[#f0ede8] text-[#555]",
  };

  const normalized = (label || "").toLowerCase();
  const colors = colorMap[normalized] || "bg-[#f0ede8] text-[#555]";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colors}`}
    >
      {label}
    </span>
  );
}
