#!/usr/bin/env node
import core from '@actions/core';
import { $ } from 'zx';

async function run() {
  const devMode = core.getInput('dev');

  $.verbose = true;

  console.log('devMode:', devMode);

  if (devMode === 'true') {
    console.log('Running in dev mode');
    return;
  }

  await $`echo "Hello World"`;

  await $`echo $HOME`;

  console.log('HOME', process.env.HOME);

  core.debug(process.env.HOME);
}

run();
