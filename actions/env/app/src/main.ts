import { $ } from 'zx';
import core from '@actions/core';

try {
  console.log(328793292839);
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
} catch (error) {
  core.setFailed(error.message);
}
