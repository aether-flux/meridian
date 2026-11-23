#!/usr/bin/env node

const { program } = require("commander");
const { loginAction } = require("../src/commands/auth");
const { workspaceAction, projectAction, contextAction } = require("../src/commands/context");

program
  .name("meridian")
  .description("CLI tool for Meridian platform.")
  .version("0.1.0");

program
  .command("login")
  .description("Login to Meridian")
  .action(loginAction);

program
  .command("workspace")
  .description("Select the active workspace")
  .action(workspaceAction);

program
  .command("project")
  .description("Select the active project")
  .action(projectAction);

program
  .command("context")
  .description("Show the active account, workspace, and project")
  .action(contextAction);

program.parse(process.argv);
