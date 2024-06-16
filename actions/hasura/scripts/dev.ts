import { cd } from 'npm:zx';
import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  const { start, currentPath } = opts;

  cd(`${currentPath}/app`);

  await start({
    act: {
      command:
        'nodemon --watch ./dist --watch $workflows --ext yaml,js  --exec $action',
      variables: {
        action: `run action local hasura -W --no-reuse`,
        workflows: `${Deno.env.get('SRC')}/.github/workflows`,
      },
    },
    watch: `bun build ./src/main.ts --outdir ./dist --target node --watch`,
  });
}
