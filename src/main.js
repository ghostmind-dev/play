#!/usr/bin/env node
import core from "@actions/core";

async function run() {
  const commitMessage = core.getInput("commit-message");

  console.log(commitMessage);
}

run();
