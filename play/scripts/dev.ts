import { $, cd } from 'npm:zx';
import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  const { utils } = opts;

  $.verbose = true;

  const { start } = utils;

  await start({
    commands: {
      act: {
        command: 'nodemon --watch ./dist --exec ${action}',
        variables: {
          action: `run action local test`,
        },
      },
      watch: `bun build ./src/main.ts --outdir ./dist --target node --watch`,
      trampoline: {
        fonction: async (options: any) => {
          await $`echo "trampoline"`;
          console.log('trampoline', options);
        },
        options: {
          watch: true,
        },
      },
      path: 'cat meta.json',
    },
  });
}
