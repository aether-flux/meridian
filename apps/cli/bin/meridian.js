#!/usr/bin/env node

const { program } = require("commander");
const { loginAction, logoutAction } = require("../src/commands/auth");
const { workspaceAction, projectAction, contextAction } = require("../src/commands/context");
const { listAction, createAction, editAction } = require("../src/commands/projects");
const {
  listAction: listTasksAction,
  createAction: createTaskAction,
  viewAction: viewTaskAction,
  updateAction: updateTaskAction,
  assignAction: assignTaskAction,
  commentAction: commentTaskAction,
} = require("../src/commands/tasks");

program
  .name("meridian")
  .description("CLI tool for Meridian platform.")
  .version("0.1.0");

program
  .command("login")
  .description("Login to Meridian")
  .action(loginAction);

program
  .command("logout")
  .description("Clear the saved Meridian session")
  .action(logoutAction);

program
  .command("workspace")
  .description("Select the active workspace")
  .action(workspaceAction);

const project = program
  .command("project")
  .description("List, create, update, and select projects")
  .action(projectAction);

project
  .command("list")
  .description("List projects in the active workspace")
  .option("-w, --workspace <slug>", "List projects in this workspace")
  .action(listAction);

project
  .command("create")
  .description("Create a project in the active workspace")
  .requiredOption("-n, --name <name>", "Project name")
  .option("-d, --description <text>", "Project description")
  .option("-i, --icon <icon>", "Project icon")
  .option("--identifier <identifier>", "Project identifier (generated if omitted)")
  .option("-w, --workspace <slug>", "Create in this workspace")
  .action(createAction);

project
  .command("edit [reference]")
  .aliases(["update", "mod"])
  .description("Update a project by ID or identifier")
  .option("-i, --id <reference>", "Project ID or identifier")
  .option("-n, --name <name>", "New project name")
  .option("-d, --description <text>", "New project description")
  .option("-I, --icon <icon>", "New project icon")
  .option("-c, --clear-description", "Remove the project description")
  .option("-C, --clear-icon", "Remove the project icon")
  .option("-w, --workspace <slug>", "Resolve the project within this workspace")
  .action(editAction);

project
  .command("use")
  .description("Set the active project")
  .action(projectAction);

const task = program
  .command("task")
  .description("List, create, view, update, assign, and comment on tasks");

task
  .command("list")
  .description("List tasks in a project")
  .option("-p, --project <id>", "Project ID or identifier (defaults to active project)")
  .option("-s, --status <status>", "Filter by task status")
  .option("-a, --assignee <user>", "Filter by workspace member name, username, email, or ID")
  .action(listTasksAction);

task
  .command("create")
  .description("Create a task")
  .requiredOption("-t, --title <title>", "Task title")
  .option("-p, --project <id>", "Project ID or identifier")
  .option("-P, --priority <priority>", "Task priority")
  .option("-d, --description <text>", "Task description")
  .option("-D, --due-date <date>", "Due date (for example 2026-12-31)")
  .option("--parent <task-id>", "Create as a subtask of this task ID or key")
  .action(createTaskAction);

task
  .command("view <task-id>")
  .description("Show task details by UUID or key such as PROJ-42")
  .option("-p, --project <id>", "Project ID or identifier for task-key lookup")
  .action(viewTaskAction);

task
  .command("update <task-id>")
  .description("Update task status and/or priority")
  .option("-s, --status <status>", "New task status")
  .option("-P, --priority <priority>", "New task priority")
  .option("-d, --description <text>", "Replace the task description")
  .option("-c, --clear-description", "Remove the task description")
  .option("--due-date <date>", "Set due date (for example 2026-12-31)")
  .option("--clear-due-date", "Remove the task due date")
  .option("-p, --project <id>", "Project ID or identifier for task-key lookup")
  .action(updateTaskAction);

task
  .command("assign <task-id> <username>")
  .description("Assign a workspace member to a task")
  .option("-p, --project <id>", "Project ID or identifier for task-key lookup")
  .action(assignTaskAction);

task
  .command("comment <task-id>")
  .description("Add a comment to a task")
  .requiredOption("-b, --body <text>", "Comment text")
  .option("-p, --project <id>", "Project ID or identifier for task-key lookup")
  .action(commentTaskAction);

program
  .command("context")
  .aliases(["ctx", "whoami"])
  .description("Show the active account, workspace, and project")
  .action(contextAction);

program.parse(process.argv);
