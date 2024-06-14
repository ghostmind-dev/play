#!/usr/bin/env node
import core from '@actions/core';
import { $ } from 'zx';

async function play() {
  const run_install = core.getInput('run_install');
  const live_install = core.getInput('live_install');
  const vault_install = core.getInput('vault_install');
  const vault_login = core.getInput('vault_login');
  const gcloud_install = core.getInput('gcloud_install');

  const HOME = process.env.HOME;

  $.verbose = true;

  // await $`rm -rf ${HOME}/run`;

  if (live_install === 'true') {
    await $`deno install --allow-all --force --name run dev/run/bin/cmd.ts`;
    await $`rm -rf ${HOME}/run`;
    await $`cp dev ${HOME}/run -r`;
    await $`echo "${HOME}/.deno/bin" >> $GITHUB_PATH`;
  }

  if (run_install === 'true') {
    await $`rm -rf ${HOME}/run`;
    await $`git clone https://github.com/ghostmind-dev/run.git ${HOME}/run`;
    await $`deno install --allow-all --force --global --name run ${HOME}/run/run/bin/cmd.ts`;
    await $`echo "${HOME}/.deno/bin" >> $GITHUB_PATH`;
  }

  if (vault_install === 'true') {
    await $`apt install -y gpg`;
    await $`wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg >/dev/null`;
    await $`gpg --no-default-keyring --keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg --fingerprint`;
    await $`echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" |  tee /etc/apt/sources.list.d/hashicorp.list`;
    await $`apt update`;
    await $`apt-get install --reinstall -y vault`;
    await $`chown root:root /usr/bin/vault`;

    core.addPath('/usr/bin/vault');
  }

  if (gcloud_install === 'true') {
    await $`apt-get update`;
    await $`curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg`;
    await $`echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`;
    await $`apt-get update && apt-get install -y google-cloud-cli`;
  }
}

play();
