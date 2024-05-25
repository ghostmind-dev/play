import { $, cd } from 'npm:zx';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  const { utils, currentPath } = opts;

  cd(`${currentPath}/action`);

  const { cmd } = utils;

  const build = cmd`bun build ./src/main.ts --outdir ./dist --target node`;

  await $`${build}`;
}
