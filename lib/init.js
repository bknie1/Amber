import { writeFile, access } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_CONFIG_NAME } from "./config.js";

const starter = {
  project: "My Project",
  outDir: ".amber",
  viewport: { width: 1440, height: 900 },
  pages: [
    { id: "home", url: "http://localhost:8080/", waitFor: "networkidle" },
  ],
};

// Writes a starter config in the current directory, refusing to overwrite.
export async function init(opts = {}) {
  const configPath = path.resolve(opts.config || DEFAULT_CONFIG_NAME);
  try {
    await access(configPath);
    throw new Error(`${configPath} already exists`);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  await writeFile(configPath, JSON.stringify(starter, null, 2) + "\n");
  console.log(`wrote ${configPath}; edit pages, then run "amber capture"`);
  console.log(`tip: add ${starter.outDir}/ to your .gitignore unless you want frames in git`);
}
