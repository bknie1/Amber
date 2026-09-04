import { readFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_CONFIG_NAME = "amber.config.json";

// Loads and validates the config. Returns { config, configDir }.
export async function loadConfig(opts = {}) {
  const configPath = path.resolve(opts.config || DEFAULT_CONFIG_NAME);
  let raw;
  try {
    raw = await readFile(configPath, "utf8");
  } catch {
    throw new Error(
      `no config found at ${configPath}; run "amber init" to create one`
    );
  }
  const config = JSON.parse(raw.replace(/^\uFEFF/, ""));
  if (!config.project) throw new Error("config is missing \"project\"");
  if (!Array.isArray(config.pages) || config.pages.length === 0) {
    throw new Error("config needs a non-empty \"pages\" array");
  }
  for (const page of config.pages) {
    if (!page.id || !page.url) {
      throw new Error("each page needs an \"id\" and a \"url\"");
    }
  }
  config.outDir = config.outDir || ".amber";
  config.viewport = config.viewport || { width: 1440, height: 900 };
  const configDir = path.dirname(configPath);
  return { config, configDir, outDir: path.resolve(configDir, config.outDir) };
}
