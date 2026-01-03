import { parseArgs } from "util";

export const readArgs = () =>
  parseArgs({
    args: Bun.argv,
    options: {
      "12h": {
        type: "boolean",
      },
    },
    allowPositionals: true,
  });
