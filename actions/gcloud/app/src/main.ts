import core from '@actions/core';
import { $ } from 'zx';
import { writeFileSync } from 'fs';

try {
  const login = core.getInput('login');
  const service_account_key = core.getInput('service_account_key');
  const docker_auth = core.getInput('docker_auth');
  const gcp_project_name = core.getInput('gcp_project_name');

  const HOME = process.env.HOME;
  const SRC = process.env.SRC;

  $.verbose = true;

  await $`sudo apt-get update`;
  await $`curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg`;
  await $`echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`;
  await $`sudo apt-get update && sudo apt-get install -y google-cloud-cli`;

  if (login === 'true') {
    const GCP_SERVICE_ACCOUNT_JSON =
      service_account_key || process.env.GCP_SERVICE_ACCOUNT_JSON;
    const GCP_PROJECT_NAME = gcp_project_name || process.env.GCP_PROJECT_NAME;

    // Clean up the service account JSON - remove any surrounding quotes
    let cleanedServiceAccountJson = GCP_SERVICE_ACCOUNT_JSON?.trim();
    if (
      cleanedServiceAccountJson?.startsWith("'") &&
      cleanedServiceAccountJson?.endsWith("'")
    ) {
      cleanedServiceAccountJson = cleanedServiceAccountJson.slice(1, -1);
    }
    if (
      cleanedServiceAccountJson?.startsWith('"') &&
      cleanedServiceAccountJson?.endsWith('"')
    ) {
      cleanedServiceAccountJson = cleanedServiceAccountJson.slice(1, -1);
    }

    // Validate it's proper JSON
    try {
      JSON.parse(cleanedServiceAccountJson);
    } catch (e) {
      throw new Error(`Invalid service account JSON: ${e.message}`);
    }

    // Use Node.js fs to write sensitive data instead of shell command to prevent logging
    console.log('Writing service account key to file...');
    writeFileSync('/tmp/gsa_key.json', cleanedServiceAccountJson);

    // Temporarily disable verbose for sensitive gcloud commands
    $.verbose = false;
    await $`gcloud auth activate-service-account --key-file="/tmp/gsa_key.json"`;
    $.verbose = true;

    await $`gcloud config set project ${GCP_PROJECT_NAME}`;
    await $`gcloud config set compute/zone us-central1-b`;
    await $`gcloud auth configure-docker gcr.io --quiet`;
  }
} catch (error) {
  core.setFailed(error.message);
}
