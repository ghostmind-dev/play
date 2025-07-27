import { cd, $ } from 'npm:zx';
import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';

export default async function (arg: CustomArgs, opts: CustomOptions) {
  const { start, currentPath } = opts;

  $.verbose = true;

  cd(`${currentPath}/app`);

  let job = arg[0] || 'secrets';

  await $`bun build ${currentPath}/app/src/main.ts --outdir ./dist --target node`;

  await start({
    act: {
      command:
        'nodemon --watch ./dist --watch $workflows --ext yaml,js  --exec $action',
      variables: {
        action: `run action local ${job} -W --no-reuse --no-secure`,
        workflows: `${Deno.env.get('SRC')}/.github/workflows`,
      },
    },
    watch: `bun build ${currentPath}/app/src/main.ts --outdir ./dist --target node --watch`,
  });
}
