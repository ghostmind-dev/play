import core from '@actions/core';
import { $ } from 'zx';

try {
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
    await $`rm -rf ${HOME}/run`;
    await $`git clone https://github.com/ghostmind-dev/run.git ${HOME}/run`;
    await $`deno install --allow-all --force --global --name run ${HOME}/run/run/bin/cmd.ts`;
  }

  await $`echo "${HOME}/.deno/bin" >> $GITHUB_PATH`;
} catch (error) {
  core.setFailed(error.message);
}
