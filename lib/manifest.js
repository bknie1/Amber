import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Reads the manifest, returning a fresh one if none exists yet.
export async function loadManifest(outDir, projectName) {
  const manifestPath = path.join(outDir, "manifest.json");
  try {
    const raw = await readFile(manifestPath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return { project: projectName, frames: [] };
  }
}

export async function saveManifest(outDir, manifest) {
  await mkdir(outDir, { recursive: true });
  const manifestPath = path.join(outDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}
