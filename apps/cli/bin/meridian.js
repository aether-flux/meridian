#!/usr/bin/env node

const { program } = require("commander");

program
  .name("meridian")
  .description("CLI tool for Meridian platform.")
  .version("0.1.0");

program
  .command("status")
  .description("Check CLI and API status")
  .action(() => {
    console.log("Meridian is working!");
  });

program.parse(process.argv);
