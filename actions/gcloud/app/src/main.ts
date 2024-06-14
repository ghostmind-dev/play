#!/usr/bin/env node
import core from '@actions/core';
import { $ } from 'zx';

async function play() {
  const login = core.getInput('login');
  const service_account_key = core.getInput('service_account_key');
  const docker_auth = core.getInput('docker_auth');
  const gcp_project_name = core.getInput('gcp_project_name');

  const HOME = process.env.HOME;
  const SRC = process.env.SRC;

  $.verbose = true;

  await $`apt-get update`;
  await $`curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg`;
  await $`echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`;
  await $`apt-get update && apt-get install -y google-cloud-cli`;

  if (login === 'true') {
    const GCP_SERVICE_ACCOUNT_ADMIN =
      service_account_key || process.env.GCP_SERVICE_ACCOUNT_ADMIN;
    const GCP_PROJECT_NAME = gcp_project_name || process.env.GCP_PROJECT_NAME;

    await $`echo ${GCP_SERVICE_ACCOUNT_ADMIN} | base64 -di -w 0 >/tmp/gsa_key.json`;
    await $`gcloud auth activate-service-account --key-file="/tmp/gsa_key.json"`;
    await $`gcloud config set project ${GCP_PROJECT_NAME}`;
    await $`gcloud config set compute/zone us-central1-b`;
    await $`gcloud auth configure-docker gcr.io --quiet`;
  }
}

play();
