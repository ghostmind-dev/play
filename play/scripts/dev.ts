import { $, cd } from 'npm:zx';

export default async function (arg: CustomArgs, opts: CustomOptions) {
  const { utils, currentPath } = opts;

  $.verbose = true;

  const { start } = utils;

  cd(`${currentPath}/action`);

  const action = 'run action local test';

  const config = {
    commands: {
      act: `nodemon --watch ./dist --exec ${action}`,
      watch: `bun build ./src/main.ts --outdir ./dist --target node --watch`,
    },
  };

  await start(config);
}
