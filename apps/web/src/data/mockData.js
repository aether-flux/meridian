// Pure JavaScript Mock Data for Meridian

export const MOCK_USERS = [
  {
    id: "user_1",
    email: "alex@meridian.dev",
    displayName: "Alex Rivera",
    role: "OWNER",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80",
    initials: "AR",
    status: "active",
  },
  {
    id: "user_2",
    email: "sarah.c@meridian.dev",
    displayName: "Sarah Chen",
    role: "ADMIN",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&auto=format&fit=crop&q=80",
    initials: "SC",
    status: "active",
  },
  {
    id: "user_3",
    email: "marcus.v@meridian.dev",
    displayName: "Marcus Vance",
    role: "MEMBER",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80",
    initials: "MV",
    status: "active",
  },
  {
    id: "user_4",
    email: "elena.r@meridian.dev",
    displayName: "Elena Rostova",
    role: "VIEWER",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&auto=format&fit=crop&q=80",
    initials: "ER",
    status: "active",
  },
];

export const MOCK_WORKSPACES = [
  {
    id: "ws_meridian",
    name: "Meridian Core",
    slug: "meridian-core",
    ownerId: "user_1",
    role: "OWNER",
    memberCount: 4,
    createdAt: "2026-09-01T10:00:00Z",
    description:
      "Core engineering team developing Meridian web, CLI, and APIs.",
  },
  {
    id: "ws_acme",
    name: "Acme Labs",
    slug: "acme-labs",
    ownerId: "user_2",
    role: "ADMIN",
    memberCount: 12,
    createdAt: "2026-09-15T14:30:00Z",
    description: "Product incubator exploring developer tools and automation.",
  },
];

export const MOCK_PROJECTS = [
  {
    id: "proj_eng",
    workspaceId: "ws_meridian",
    name: "Core Web Platform",
    identifier: "ENG",
    icon: "⚡",
    description: "Main React single-page app and REST API backend.",
    status: "ACTIVE",
    taskCount: 18,
    completedTaskCount: 12,
    lead: "Alex Rivera",
  },
  {
    id: "proj_cli",
    workspaceId: "ws_meridian",
    name: "Terminal CLI Tool",
    identifier: "CLI",
    icon: "⌨️",
    description:
      "First-class Node.js/Go CLI binary connecting terminal to Meridian API.",
    status: "ACTIVE",
    taskCount: 14,
    completedTaskCount: 9,
    lead: "Marcus Vance",
  },
  {
    id: "proj_docs",
    workspaceId: "ws_meridian",
    name: "Developer Docs & API",
    identifier: "DOC",
    icon: "📚",
    description:
      "OpenAPI specs, interactive CLI cheat-sheets, and contributor guide.",
    status: "ACTIVE",
    taskCount: 8,
    completedTaskCount: 6,
    lead: "Elena Rostova",
  },
];

export const MOCK_SPRINTS = [
  {
    id: "sprint_24",
    projectId: "proj_eng",
    name: "Sprint 24 — Auth & Setup Flow",
    startDate: "2026-10-16",
    endDate: "2026-10-30",
    status: "ACTIVE",
    goal: "Ship unauthenticated landing, register flow, workspace auto-slug creation, and token invites.",
    totalPoints: 34,
    completedPoints: 22,
  },
  {
    id: "sprint_25",
    projectId: "proj_eng",
    name: "Sprint 25 — Real-time Webhooks & CLI Parity",
    startDate: "2026-10-31",
    endDate: "2026-11-14",
    status: "PLANNED",
    goal: "WebSocket push updates between CLI commands and browser board.",
    totalPoints: 28,
    completedPoints: 0,
  },
];

export const MOCK_TASKS = [
  {
    id: "task_1",
    projectId: "proj_eng",
    projectIdentifier: "ENG",
    number: 42,
    identifier: "ENG-42",
    title: "Implement token-based invite link generator",
    description:
      "Allow workspace admins to generate cryptographic invite tokens (e.g. `tok_invite_x89f`) with custom roles (Admin, Member, Viewer). Eliminates external SMTP dependency during self-hosting.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    dueDate: "2026-10-25",
    createdById: "user_1",
    assignee: MOCK_USERS[0], // Alex Rivera
    labels: ["auth", "security", "invites"],
    subTasks: [
      { id: "sub_1", title: "Generate unique token hash", completed: true },
      {
        id: "sub_2",
        title: "Add copy link button with confirmation",
        completed: true,
      },
      {
        id: "sub_3",
        title: "Build invite acceptance landing screen",
        completed: false,
      },
    ],
    comments: [
      {
        id: "c_1",
        author: MOCK_USERS[1],
        body: "Make sure tokens have configurable expiry (default 7 days).",
        createdAt: "2 hours ago",
      },
    ],
  },
  {
    id: "task_2",
    projectId: "proj_eng",
    projectIdentifier: "ENG",
    number: 43,
    identifier: "ENG-43",
    title: "Real-time URL slug auto-generation from Workspace Name",
    description:
      "When a user types 'Engineering Team', the slug should instantly populate as 'engineering-team' with sanitize regex while keeping the input fully user-editable.",
    status: "DONE",
    priority: "HIGH",
    dueDate: "2026-10-24",
    createdById: "user_2",
    assignee: MOCK_USERS[1], // Sarah Chen
    labels: ["onboarding", "ux"],
    subTasks: [
      {
        id: "sub_4",
        title: "Regex for lowercase and hyphens",
        completed: true,
      },
      { id: "sub_5", title: "Debounced availability check", completed: true },
    ],
    comments: [],
  },
  {
    id: "task_3",
    projectId: "proj_cli",
    projectIdentifier: "CLI",
    number: 12,
    identifier: "CLI-12",
    title: "Support `meridian task move --status IN_REVIEW` in terminal",
    description:
      "Terminal users should be able to update status using human-readable identifier: `meridian task move CLI-12 --status DONE`.",
    status: "IN_REVIEW",
    priority: "HIGH",
    dueDate: "2026-10-27",
    createdById: "user_3",
    assignee: MOCK_USERS[2], // Marcus Vance
    labels: ["cli", "terminal"],
    subTasks: [
      { id: "sub_6", title: "Parser for shorthand flags", completed: true },
      { id: "sub_7", title: "API patch request handler", completed: true },
      { id: "sub_8", title: "Terminal output colorizer", completed: false },
    ],
    comments: [
      {
        id: "c_2",
        author: MOCK_USERS[0],
        body: "Tested locally on macOS & Arch Linux, works smoothly!",
        createdAt: "4 hours ago",
      },
    ],
  },
  {
    id: "task_4",
    projectId: "proj_eng",
    projectIdentifier: "ENG",
    number: 44,
    identifier: "ENG-44",
    title: "Role hierarchy permission gates for Owner vs Admin",
    description:
      "Ensure only Owners can delete workspaces or transfer ownership. Admins can manage projects and invite teammates.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "2026-10-28",
    createdById: "user_1",
    assignee: MOCK_USERS[0],
    labels: ["backend", "rbac"],
    subTasks: [
      {
        id: "sub_9",
        title: "Middleware check for OWNER role",
        completed: false,
      },
      {
        id: "sub_10",
        title: "UI disabled state for non-owners",
        completed: false,
      },
    ],
    comments: [],
  },
  {
    id: "task_5",
    projectId: "proj_eng",
    projectIdentifier: "ENG",
    number: 45,
    identifier: "ENG-45",
    title: "Task status columns with interactive task drawers",
    description:
      "Build sleek columns for Todo, In Progress, In Review, Done, and Cancelled. Clicking any card slides open a deep inspection panel with subtasks and markdown details.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    dueDate: "2026-10-26",
    createdById: "user_1",
    assignee: MOCK_USERS[1],
    labels: ["kanban", "frontend", "ui"],
    subTasks: [
      {
        id: "sub_11",
        title: "Column component with task count pills",
        completed: true,
      },
      { id: "sub_12", title: "Slide-over detail drawer", completed: true },
      { id: "sub_13", title: "Quick status toggle action", completed: true },
    ],
    comments: [],
  },
  {
    id: "task_6",
    projectId: "proj_docs",
    projectIdentifier: "DOC",
    number: 8,
    identifier: "DOC-8",
    title: "CLI quickstart cheat-sheet & keyboard shortcuts guide",
    description:
      "Document standard keyboard combinations (⌘K search, C create task, ~ terminal helper) and CLI equivalents.",
    status: "TODO",
    priority: "LOW",
    dueDate: "2026-11-02",
    createdById: "user_4",
    assignee: MOCK_USERS[3],
    labels: ["documentation"],
    subTasks: [],
    comments: [],
  },
  {
    id: "task_7",
    projectId: "proj_cli",
    projectIdentifier: "CLI",
    number: 14,
    identifier: "CLI-14",
    title: "Legacy curses interface experiment",
    description:
      "Deprecate curses terminal UI in favor of clean structured stdout JSON/tables.",
    status: "CANCELLED",
    priority: "NONE",
    dueDate: "2026-10-20",
    createdById: "user_3",
    assignee: MOCK_USERS[2],
    labels: ["cli", "deprecated"],
    subTasks: [],
    comments: [],
  },
];

export const MOCK_INVITES = [
  {
    id: "inv_1",
    workspaceId: "ws_meridian",
    email: "devrel@company.com",
    role: "MEMBER",
    token: "tok_mrd_9f82a1b",
    createdAt: "2026-10-22T08:00:00Z",
    expiresAt: "2026-10-29T08:00:00Z",
  },
  {
    id: "inv_2",
    workspaceId: "ws_meridian",
    email: "security.lead@partner.io",
    role: "ADMIN",
    token: "tok_mrd_43c8d19",
    createdAt: "2026-10-21T12:00:00Z",
    expiresAt: "2026-10-28T12:00:00Z",
  },
];

export const MOCK_ACTIVITIES = [
  {
    id: "act_1",
    user: MOCK_USERS[0],
    action: "completed task",
    target: "ENG-43 (Slug auto-generator)",
    timestamp: "12 minutes ago",
    icon: "check",
  },
  {
    id: "act_2",
    user: MOCK_USERS[1],
    action: "moved to In Progress",
    target: "ENG-45 (Tasks view & drawers)",
    timestamp: "45 minutes ago",
    icon: "play",
  },
  {
    id: "act_3",
    user: MOCK_USERS[2],
    action: "executed via CLI",
    target: "meridian task create CLI-12",
    timestamp: "2 hours ago",
    icon: "terminal",
  },
  {
    id: "act_4",
    user: MOCK_USERS[0],
    action: "generated token invite",
    target: "tok_mrd_9f82a1b for devrel@company.com",
    timestamp: "5 hours ago",
    icon: "key",
  },
];
