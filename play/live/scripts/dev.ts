import { $ } from 'npm:zx';

export default async function (arg: CustomArgs, opts: CustomOptions) {
  await $`bun build ./app/src/main.ts --outdir ./dist --target node --watch `;
}
