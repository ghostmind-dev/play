#!/usr/bin/env node

import { $ } from 'zx';
import core from '@actions/core';

async function play() {
  const target = core.getInput('target');

  let environement = '';

  const currentBranchRaw = await $`git branch --show-current`;
  // trim the trailing newline
  const currentBranch = currentBranchRaw.stdout.trim();

  if (target) {
    environement = target;
  } else if (currentBranch === 'main') {
    environement = 'prod';
  } else {
    environement = currentBranch;
  }

  process.env.ENV = environement;

  const gitEnvPathRaw = await $`echo $GITHUB_ENV`;

  const gitEnvPath = `${gitEnvPathRaw}`.replace(/(\r\n|\n|\r)/gm, '');

  core.setOutput('ENV', environement);
  await $`echo ENV=${environement} >> ${gitEnvPath}`;
}

/**
 *
 * Set environment variables for all the next action steps
 * Only use within a github action step
 *
 */

play();
