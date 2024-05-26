#!/usr/bin/env node
import core from '@actions/core';
import { $ } from 'zx';

async function run() {
  const devMode = core.getInput('dev');

  const HOME = process.env.HOME;

  $.verbose = true;

  await $`rm -rf ${HOME}/run`;

  if (devMode === 'true') {
    await $`deno install --allow-all --force --name run dev/run/bin/cmd.ts`;
    // symlink tp dev/run to $HOME/run
    await $`rm -rf ${HOME}/run`;
    await $`cp dev ${HOME}/run -r`;
  } else {
    await $`deno install --allow-all  --force --global --name run jsr:@ghostmind/run/cmd`;
  }

  await $`echo "${HOME}/.deno/bin" >> $GITHUB_PATH`;
}

run();
