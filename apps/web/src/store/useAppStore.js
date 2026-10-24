import { create } from "zustand";
import {
  MOCK_USERS,
  MOCK_WORKSPACES,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_SPRINTS,
  MOCK_INVITES,
  MOCK_ACTIVITIES,
} from "../data/mockData.js";
import { api } from "../services/api.js";

const normalizeTask = (task) => ({
  ...task,
  identifier: task.identifier || task.key || task.formattedIdentifier,
  assignee: task.assignee || task.assignees?.[0]?.user || null,
  subTasks: task.subTasks || [],
  labels: task.labels || [],
  comments: task.comments || [],
  dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
});

export const useAppStore = create((set, get) => ({
  // Auth state
  user: null,
  workspaces: MOCK_WORKSPACES,
  activeWorkspace: MOCK_WORKSPACES[0],
  projects: MOCK_PROJECTS,
  tasks: MOCK_TASKS,
  sprints: MOCK_SPRINTS,
  invites: MOCK_INVITES,
  activities: MOCK_ACTIVITIES,
  selectedTaskId: null,
  isCreateTaskOpen: false,
  isCliModalOpen: false,

  // Auth actions
  login: (email, _password) => {
    const existing = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    const userToSet = existing || {
      id: `user_${Date.now()}`,
      email,
      displayName: email.split("@")[0],
      role: "MEMBER",
      initials: email.slice(0, 2).toUpperCase(),
    };
    set({
      user: userToSet,
      activeWorkspace: get().workspaces[0] || null,
    });
    return userToSet;
  },

  register: ({ email, displayName }) => {
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newUser = {
      id: `user_${Date.now()}`,
      email,
      displayName,
      role: "OWNER",
      initials: initials || "U",
    };

    set({
      user: newUser,
    });
    return newUser;
  },

  logout: () => {
    set({
      user: null,
      activeWorkspace: null,
    });
  },

  // Workspace actions
  setActiveWorkspace: (workspaceId) => {
    const ws = get().workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      set({ activeWorkspace: ws });
    }
  },

  createWorkspace: ({ name, slug }) => {
    const currentUser = get().user;
    const newWs = {
      id: `ws_${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      ownerId: currentUser?.id || "user_1",
      role: "OWNER",
      memberCount: 1,
      createdAt: new Date().toISOString(),
      description: `${name} workspace`,
    };

    // Default starter project for the new workspace
    const newProject = {
      id: `proj_${Date.now()}`,
      workspaceId: newWs.id,
      name: "Main Project",
      identifier: "PROJ",
      icon: "🚀",
      description: "Default starter project for tracking tasks and sprints.",
      status: "ACTIVE",
      taskCount: 1,
      completedTaskCount: 0,
      lead: currentUser?.displayName || "You",
    };

    // Starter task
    const starterTask = {
      id: `task_${Date.now()}`,
      projectId: newProject.id,
      projectIdentifier: "PROJ",
      number: 1,
      identifier: "PROJ-1",
      title: "Set up team workflows and invite members",
      description:
        "Welcome to Meridian! Explore board views, sprints, and terminal CLI integration.",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      createdById: currentUser?.id || "user_1",
      assignee: currentUser,
      labels: ["welcome", "onboarding"],
      subTasks: [
        { id: "st_1", title: "Generate an invite link", completed: false },
        { id: "st_2", title: "Create your first project", completed: false },
        { id: "st_3", title: "Install meridian CLI", completed: false },
      ],
      comments: [],
    };

    set((state) => ({
      workspaces: [...state.workspaces, newWs],
      activeWorkspace: newWs,
      projects: [...state.projects, newProject],
      tasks: [...state.tasks, starterTask],
      activities: [
        {
          id: `act_${Date.now()}`,
          user: currentUser,
          action: "created workspace",
          target: newWs.name,
          timestamp: "Just now",
          icon: "building",
        },
        ...state.activities,
      ],
    }));

    return newWs;
  },

  // Token-based invite actions
  createInvite: ({ email, role = "MEMBER" }) => {
    const ws = get().activeWorkspace;
    const randToken = `tok_${Math.random().toString(36).substring(2, 9)}${Math.random().toString(36).substring(2, 6)}`;
    const newInvite = {
      id: `inv_${Date.now()}`,
      workspaceId: ws?.id || "ws_default",
      workspaceName: ws?.name || "Meridian",
      email: email.trim(),
      role,
      token: randToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    set((state) => ({
      invites: [newInvite, ...state.invites],
      activities: [
        {
          id: `act_${Date.now()}`,
          user: state.user,
          action: `generated ${role.toLowerCase()} invite link`,
          target: email,
          timestamp: "Just now",
          icon: "key",
        },
        ...state.activities,
      ],
    }));

    return newInvite;
  },

  deleteInvite: (inviteId) => {
    set((state) => ({
      invites: state.invites.filter((inv) => inv.id !== inviteId),
    }));
  },

  // Task actions
  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
  setIsCreateTaskOpen: (isOpen) => set({ isCreateTaskOpen: isOpen }),
  setIsCliModalOpen: (isOpen) => set({ isCliModalOpen: isOpen }),

  updateTaskStatus: async (taskId, newStatus) => {
    const previousTask = get().tasks.find((task) => task.id === taskId);
    if (!previousTask || previousTask.status === newStatus) return previousTask;

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    }));

    try {
      const response = await api.patch(`/tasks/${encodeURIComponent(taskId)}`, {
        status: newStatus,
      });
      const updatedTask = normalizeTask(response.task);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task,
        ),
      }));
      return updatedTask;
    } catch (error) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? previousTask : task,
        ),
      }));
      throw error;
    }
  },

  updateTaskPriority: async (taskId, newPriority) => {
    const previousTask = get().tasks.find((task) => task.id === taskId);
    if (!previousTask || previousTask.priority === newPriority) return previousTask;

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, priority: newPriority } : task,
      ),
    }));

    try {
      const response = await api.patch(`/tasks/${encodeURIComponent(taskId)}`, {
        priority: newPriority,
      });
      const updatedTask = normalizeTask(response.task);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task,
        ),
      }));
      return updatedTask;
    } catch (error) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? previousTask : task,
        ),
      }));
      throw error;
    }
  },

  toggleSubTask: (taskId, subTaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subTasks: t.subTasks.map((st) =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st,
          ),
        };
      }),
    }));
  },

  addComment: (taskId, body) => {
    const user = get().user;
    if (!body?.trim() || !user) return;

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [
            ...t.comments,
            {
              id: `c_${Date.now()}`,
              author: user,
              body,
              createdAt: "Just now",
            },
          ],
        };
      }),
    }));
  },

  createTask: async ({
    projectId,
    title,
    description,
    priority = "NONE",
    dueDate,
  }) => {
    const state = get();
    const project = state.projects.find((item) => item.id === projectId);
    const workspace = state.workspaces.find(
      (item) => item.id === project?.workspaceId,
    ) || state.activeWorkspace;

    if (!project?.id || !workspace?.slug) {
      throw new Error("Select a project in an active workspace to create a task.");
    }

    const response = await api.post(
      `/workspaces/${encodeURIComponent(workspace.slug)}/projects/${encodeURIComponent(project.id)}/tasks`,
      {
        title,
        description: description || null,
        priority,
        dueDate: dueDate || null,
      },
    );
    const newTask = normalizeTask(response.task);

    set((current) => ({
      tasks: [newTask, ...current.tasks.filter((task) => task.id !== newTask.id)],
    }));
    return newTask;
  },

  createProject: ({ name, identifier, description, icon = "📁" }) => {
    const ws = get().activeWorkspace;
    const cleanId = identifier.trim().toUpperCase().slice(0, 5) || "PROJ";
    const newProj = {
      id: `proj_${Date.now()}`,
      workspaceId: ws?.id || "ws_meridian",
      name,
      identifier: cleanId,
      icon,
      description: description || "",
      status: "ACTIVE",
      taskCount: 0,
      completedTaskCount: 0,
      lead: get().user?.displayName || "You",
    };

    set((state) => ({
      projects: [...state.projects, newProj],
      activities: [
        {
          id: `act_${Date.now()}`,
          user: state.user,
          action: "created project",
          target: `${cleanId} (${name})`,
          timestamp: "Just now",
          icon: "folder",
        },
        ...state.activities,
      ],
    }));

    return newProj;
  },
}));
