import core from '@actions/core';
import { $ } from 'zx';

try {
  await $`curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash`;
  console.log('Hasura CLI installed successfully');
} catch (error) {
  core.setFailed(error.message);
}

$.verbose = true;
