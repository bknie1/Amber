#!/usr/bin/env node
import { init } from "../lib/init.js";
import { capture } from "../lib/capture.js";
import { view } from "../lib/view.js";
import { exportFrames } from "../lib/export.js";

const [, , command, ...rest] = process.argv;

// Parses --key value and --flag style arguments into an object.
function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      opts[key] = next;
      i++;
    } else {
      opts[key] = true;
    }
  }
  return opts;
}

const opts = parseArgs(rest);

const usage = `amber - visual timelapse history for your projects

Usage:
  amber init                     Write a starter amber.config.json here
  amber capture                  Screenshot all configured pages, append to manifest
  amber view                     Open the scrubbable viewer in your browser
  amber export --page <id>       Render a page's frames to GIF or MP4

Options:
  --config <path>   Config file (default: amber.config.json in cwd)
  --page <id>       Page id from config (export; capture may also filter by it)
  --format <fmt>    gif or mp4 (default: gif)
  --fps <n>         Frames per second for export (default: 2)
  --out <path>      Output file for export
  --port <n>        Viewer port (default: 4680)
`;

try {
  switch (command) {
    case "init":
      await init(opts);
      break;
    case "capture":
      await capture(opts);
      break;
    case "view":
      await view(opts);
      break;
    case "export":
      await exportFrames(opts);
      break;
    default:
      console.log(usage);
      process.exitCode = command ? 1 : 0;
  }
} catch (err) {
  console.error(`amber: ${err.message}`);
  process.exitCode = 1;
}
