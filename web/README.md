# Web Viewer (`web/`)

The web app is the interactive renderer for Song Geometry Mapper.

It can analyze audio in-browser or load backend-generated features for playback-synced visualization.

## Modes

### 1. Classic (Browser)
- Load an audio file.
- Browser computes descriptors and geometry locally.
- Fast iteration, no external pipeline required.

### 2. Voice / Deep (Backend)
- Load `features.json` generated externally (typically Python analyzer).
- Load matching audio for playback sync.
- Useful for stem-focused visualizations (vocals, drums, bass, other).

## Core Rendering Features

- fullscreen canvas stage with tabbed control drawer
- mapping modes:
  - `Manifold (PCA)`
  - `Time Spine`
- temporal and kNN connectivity
- edge styles:
  - `Wave` (playback/frequency-synced)
  - `Straight`
- reactive trails, glow, fog, pulse, and flow particles
- camera presets plus manual orbit/pan/zoom
- palette system with built-in and custom JSON palettes

## What Defines a Node

Each node represents one audio frame and includes:
- frame time
- spectral descriptors (centroid/spread/rolloff/flatness/zcr/peak/flux/rms)
- 3D position (mapped from normalized descriptors)
- visual properties (size, color)

Detailed formulas: `../docs/ALGORITHMS.md`

## Connection and Wave Behavior

- temporal edges connect neighboring frames in time
- kNN edges connect descriptor-nearest frames
- wave connections are synchronized to playback time (`player.currentTime`)
- wave frequency blends edge-local descriptor frequency and current active playback frame
- wave endpoints are pinned to node positions

## Exports

From `Post FX & Export`:
- `Export Analysis JSON`
- `Export 3D OBJ` (currently visible nodes + visible links)
- `Capture Still` (PNG)
- `Start/Stop Video` (WebM)

## Run

### Docker

From repo root:
```bash
docker compose up web
```

Open:
- `http://localhost:5173`

### No Docker

From repo root:
```bash
cd web
python3 -m http.server 5173
```

Open:
- `http://localhost:5173`

## Tests

```bash
node --test web/tests/*.test.js
```

## Typical Usage

1. Choose `Classic` or `Voice / Deep` mode.
2. Load source data:
   - Classic: audio
   - Voice/Deep: `features.json` plus audio
3. Wait for `Ready`.
4. Press `Play`.
5. Tune mapping/visual/FX controls.
6. Export analysis, media, or OBJ.

## Related Docs

- front page: `../README.md`
- installation: `../docs/INSTALL.md`
- algorithms: `../docs/ALGORITHMS.md`
