#!/usr/bin/env node
import core from '@actions/core';
import { $ } from 'zx';

async function play() {
  const login = core.getInput('login');

  const HOME = process.env.HOME;
  const SRC = process.env.SRC;

  $.verbose = true;

  await $`apt-get update`;
  await $`curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg`;
  await $`echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`;
  await $`apt-get update && apt-get install -y google-cloud-cli`;
}

play();
