# Amber

Archived Moments, Browsable Every Revision.

Amber captures visual snapshots of a project over time and plays them back as a timelapse. It is a visual history that sits alongside git's code history: git remembers what the code said, Amber remembers what the project looked like.

## How it works

You give Amber a small config listing the pages to photograph. Each `amber capture` shoots every page headlessly, stamps the frame with the current time and git commit, and appends it to a JSON manifest. The bundled viewer lets you scrub through the frames, and `amber export` renders a page's history to GIF or MP4.

## Setup

Requires Node 18+ and, for export only, ffmpeg on PATH.

```
npm install
npx playwright install chromium
```

Link the CLI if you want `amber` available globally:

```
npm link
```

## Usage

In the project you want to record:

```
amber init
```

Edit the generated `amber.config.json`:

```json
{
  "project": "My Website",
  "outDir": ".amber",
  "viewport": { "width": 1440, "height": 900 },
  "pages": [
    { "id": "home", "url": "http://localhost:3000/", "waitFor": "networkidle" },
    { "id": "dashboard", "url": "http://localhost:3000/dashboard", "viewport": { "width": 390, "height": 844 } }
  ]
}
```

The top-level `viewport` sets the capture size for every page; a page can override it with its own `viewport`. Other page options: `waitFor` (Playwright wait state, default `networkidle`), `delayMs` (extra settle time after load), `fullPage` (capture the full scroll height).

Then, whenever the project is worth remembering:

```
amber capture
```

Browse the history:

```
amber view
```

Render a page's frames to a shareable clip:

```
amber export --page home --format gif --fps 2
```

## Output layout

Everything lands under `outDir` (default `.amber`):

```
.amber/
  manifest.json
  frames/
    home/
      20260904T120000Z-abc1234.png
```

Each manifest frame records `ts`, `commit`, `branch`, `pageId`, and the relative `file` path. Add `.amber/` to the consumer project's `.gitignore` unless you want the frames versioned.

## Deliberately not in v1

Diffing between frames, annotations, hosting, and an automatic git-hook installer. Capture is a manual, intentional act for now.
