import core from '@actions/core';
import { $, cd } from 'zx';

try {
  // Get inputs from action.yaml
  const command = core.getInput('command');
  const tokenInput = core.getInput('token');
  const project_id = core.getInput('project_id');
  const region = core.getInput('region');
  const dir = core.getInput('dir');

  console.log('🔥 Starting Firebase deployment...');

  // Enable verbose output for debugging
  $.verbose = true;

  // Install Firebase CLI via npm
  console.log('📦 Installing Firebase CLI...');
  await $`npm install -g firebase-tools`;

  // Change to the specified directory if provided
  if (dir && dir !== '.') {
    console.log(`📁 Changing to directory: ${dir}`);
    cd(dir);
  }

  await $`mkdir -p public`;

  // Handle Firebase token - use input if provided, otherwise check environment variable
  const existingToken = process.env.FIREBASE_TOKEN;
  const token = tokenInput || existingToken;

  if (!token) {
    throw new Error(
      'Firebase token is required. Either provide it as input or set FIREBASE_TOKEN environment variable.'
    );
  }

  // Set Firebase token for authentication
  console.log('🔐 Authenticating with Firebase...');
  if (tokenInput) {
    console.log('Using token from action input');
    process.env.FIREBASE_TOKEN = token;
  } else {
    console.log('Using token from environment variable');
  }

  // Set project if provided
  if (project_id) {
    console.log(`🎯 Setting Firebase project: ${project_id}`);
    await $`firebase use ${project_id}`;
  }

  // Split command using space as the delimiter
  const splitCommands = command.split(' ');

  // Run the Firebase command
  console.log(`🚀 Running Firebase command: ${command}`);
  await $`firebase ${[...splitCommands]}`;

  console.log('✅ Firebase deployment completed successfully!');
} catch (error: any) {
  console.error('❌ Firebase deployment failed:', error.message);
  core.setFailed(error.message);
}
