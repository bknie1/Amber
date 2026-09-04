import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { loadConfig } from "./config.js";

const viewerDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "viewer"
);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
};

// Serves the viewer at / and the capture output (manifest, frames) beneath it.
export async function view(opts = {}) {
  const { outDir } = await loadConfig(opts);
  const port = Number(opts.port) || 4680;

  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let filePath;
    if (urlPath === "/" || urlPath === "/index.html") {
      filePath = path.join(viewerDir, "index.html");
    } else {
      filePath = path.join(outDir, urlPath);
    }
    // Keep requests inside the two roots.
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(viewerDir)) &&
        !resolved.startsWith(path.resolve(outDir))) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(resolved);
      const type = MIME[path.extname(resolved).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type }).end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}/`;
    console.log(`amber viewer at ${url} (ctrl+c to stop)`);
    const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    exec(`${opener} ${url}`, { shell: true });
  });
}
