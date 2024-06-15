import { $, cd } from 'npm:zx';
import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  const { utils, currentPath } = opts;

  cd(`${currentPath}/app`);

  const { cmd } = utils;

  await $`bun install`;

  const build = cmd`bun build ./src/main.ts --outdir ./dist --target node`;

  await $`${build}`;
}
