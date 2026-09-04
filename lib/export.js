import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadConfig } from "./config.js";
import { loadManifest } from "./manifest.js";

const run = promisify(execFile);

// Prefers ffmpeg on PATH, falling back to the ffmpeg-static package.
async function resolveFfmpeg() {
  try {
    await run("ffmpeg", ["-version"]);
    return "ffmpeg";
  } catch {
    // fall through to ffmpeg-static
  }
  try {
    const { default: staticPath } = await import("ffmpeg-static");
    if (staticPath) {
      await run(staticPath, ["-version"]);
      return staticPath;
    }
  } catch {
    // fall through to the error below
  }
  throw new Error("ffmpeg not found; install it on PATH or run npm install in the amber repo");
}

// Renders a page's frame sequence to GIF or MP4 via ffmpeg's concat demuxer.
export async function exportFrames(opts = {}) {
  if (!opts.page) throw new Error("export needs --page <id>");
  const format = opts.format || "gif";
  if (!["gif", "mp4"].includes(format)) throw new Error("--format must be gif or mp4");
  const fps = Number(opts.fps) || 2;

  const { config, outDir } = await loadConfig(opts);
  const manifest = await loadManifest(outDir, config.project);
  const frames = manifest.frames
    .filter((f) => f.pageId === opts.page)
    .sort((a, b) => a.ts.localeCompare(b.ts));
  if (frames.length === 0) throw new Error(`no frames for page "${opts.page}"`);

  const ffmpeg = await resolveFfmpeg();

  const outFile = path.resolve(
    opts.out || path.join(outDir, `${opts.page}.${format}`)
  );
  const duration = (1 / fps).toFixed(4);
  const listBody = frames
    .map((f) => {
      const abs = path.resolve(outDir, f.file).split(path.sep).join("/");
      return `file '${abs}'\nduration ${duration}`;
    })
    .join("\n");
  // Concat demuxer ignores the last duration unless the final file repeats.
  const lastAbs = path
    .resolve(outDir, frames[frames.length - 1].file)
    .split(path.sep)
    .join("/");
  const listContent = `${listBody}\nfile '${lastAbs}'\n`;

  const tempDir = await mkdtemp(path.join(tmpdir(), "amber-"));
  const listFile = path.join(tempDir, "frames.txt");
  await writeFile(listFile, listContent);

  try {
    if (format === "mp4") {
      await run(ffmpeg, [
        "-y", "-f", "concat", "-safe", "0", "-i", listFile,
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
        "-c:v", "libx264", "-r", String(Math.max(fps, 10)),
        outFile,
      ]);
    } else {
      const palette = path.join(tempDir, "palette.png");
      await run(ffmpeg, [
        "-y", "-f", "concat", "-safe", "0", "-i", listFile,
        "-vf", "palettegen", palette,
      ]);
      await run(ffmpeg, [
        "-y", "-f", "concat", "-safe", "0", "-i", listFile,
        "-i", palette,
        "-lavfi", "paletteuse", outFile,
      ]);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  console.log(`exported ${frames.length} frame(s) to ${outFile}`);
}
