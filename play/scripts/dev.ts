import { $, cd } from 'npm:zx';

export default async function (arg: CustomArgs, opts: CustomOptions) {
  const { utils, currentPath } = opts;

  $.verbose = true;

  const { has, cmd } = utils;

  cd(`${currentPath}/action`);

  const watch = cmd`bun build ./src/main.ts --outdir ./dist --target node --watch`;
  const instructions = 'run action local test';
  const act = cmd`nodemon --watch ./dist --exec ${instructions}`;
  const install = cmd`bun install`;

  if (has('install')) await $`${install}`;

  if (has('watch')) await $`${watch}`;

  if (has('act')) await $`${act}`;

  if (has('all')) {
    await await Promise.all([$`${watch}`, $`${act}`]);
  }
}
