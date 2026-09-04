import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { loadConfig } from "./config.js";
import { loadManifest, saveManifest } from "./manifest.js";
import { gitInfo } from "./git.js";

// Timestamp safe for filenames: 20260904T120000Z.
function fileStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

export async function capture(opts = {}) {
  const { config, configDir, outDir } = await loadConfig(opts);
  const pages = opts.page
    ? config.pages.filter((p) => p.id === opts.page)
    : config.pages;
  if (pages.length === 0) throw new Error(`no page with id "${opts.page}"`);

  const now = new Date();
  const { commit, branch } = await gitInfo(configDir);
  const manifest = await loadManifest(outDir, config.project);

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: config.viewport });
    for (const pageConfig of pages) {
      const page = await context.newPage();
      if (pageConfig.viewport) await page.setViewportSize(pageConfig.viewport);
      await page.goto(pageConfig.url, {
        waitUntil: pageConfig.waitFor || "networkidle",
        timeout: 30000,
      });
      if (pageConfig.delayMs) await page.waitForTimeout(pageConfig.delayMs);

      const frameDir = path.join(outDir, "frames", pageConfig.id);
      await mkdir(frameDir, { recursive: true });
      const name = `${fileStamp(now)}${commit ? "-" + commit : ""}.png`;
      const filePath = path.join(frameDir, name);
      await page.screenshot({
        path: filePath,
        fullPage: pageConfig.fullPage === true,
      });
      await page.close();

      manifest.frames.push({
        ts: now.toISOString(),
        commit,
        branch,
        pageId: pageConfig.id,
        file: path
          .relative(outDir, filePath)
          .split(path.sep)
          .join("/"),
      });
      console.log(`captured ${pageConfig.id} -> ${path.relative(configDir, filePath)}`);
    }
  } finally {
    await browser.close();
  }

  await saveManifest(outDir, manifest);
  console.log(`${pages.length} frame(s) added; manifest now has ${manifest.frames.length}`);
}
