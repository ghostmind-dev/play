#!/usr/bin/env node
import core from '@actions/core';
import { $, cd } from 'zx';

async function play() {
  const version = core.getInput('version');

  const TERRAFORM_VERSION = version || process.env.TERRAFORM_VERSION;

  $.verbose = true;

  let TARGETARCH = '';

  if (process.env.RUNNER_ARCH === 'X64') {
    TARGETARCH = 'amd64';
  } else if (process.env.RUNNER_ARCH === 'ARM64') {
    TARGETARCH = 'arm64';
  }

  cd('/tmp');
  await $`wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${TARGETARCH}.zip`;
  await $`unzip terraform_${TERRAFORM_VERSION}_linux_${TARGETARCH}.zip -d /usr/bin`;
}

play();
