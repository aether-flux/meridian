#!/usr/bin/env node

const { program } = require("commander");
const { loginAction, logoutAction } = require("../src/commands/auth");
const { workspaceAction, projectAction, contextAction } = require("../src/commands/context");
const { listAction, createAction, editAction } = require("../src/commands/projects");

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

program
  .command("context")
  .alias("whoami")
  .description("Show the active account, workspace, and project")
  .action(contextAction);

program.parse(process.argv);
