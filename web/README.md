# Web Viewer (`web/`)

The web app is the interactive renderer for Song Geometry Mapper.

It can analyze audio in-browser or load backend-generated features for playback-synced visualization.

## Modes

### 1. Classic (Browser)
- Load an audio file.
- Browser computes descriptors and geometry locally.
- Fast iteration, no external pipeline required.

### 2. Voice / Deep (Backend)
- Upload one audio file.
- Local voice backend (`bgm.web_api`) runs analyzer automatically and returns JSON payload.
- Web app auto-loads generated geometry and binds playback from the same file.
- `Voice Focus` lets you request a stem target (`vocals`, `drums`, `bass`, `other`, or full mix).
- Backend persists `{song-name}.analysis.json` in cache (tmp by default), and reuses it for same file+settings.
- Optional custom cache directory can be set directly in Session → Voice options (`Cache Folder`).
- It stores to `localStorage` key `sgm.voice-cache-dir` and is sent as `cache_dir` on backend requests.
- Manual `features.json` loading is still supported.

## Code Structure

- `app.js`: thin entry module that wires runtime, modules, and UI events.
- `app/runtime.js`: DOM/runtime setup, shared constants, and base utility helpers.
- `app/analysis-module.js`: audio analysis, mapping math, palettes, and preset workflows.
- `app/render-module.js`: camera, projection, and all rendering/drawing passes.
- `app/workflow-module.js`: imports/exports, playback workflows, voice API bridge, and recording.
- `visual_utils.js`: pure visual helper utilities.
- `preset_utils.js`: pure preset utility helpers.

## Core Rendering Features

- fullscreen canvas stage with tabbed control drawer
- mapping modes:
  - `Manifold (PCA)`
  - `Time Spine`
- temporal and kNN connectivity
- edge styles:
  - `Wave` (playback/frequency-synced)
  - `Straight`
  - `Ribbon` (fluid strip + traveling light wave)
- reactive trails, glow, fog, pulse, and flow particles
- `Wave Amplification` control boosts wave-edge amplitude when motion is too subtle
- lower-right `H/S` focus toggle hides/restores all overlay windows for fullscreen display mode
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
- connection color now reflects usage during playback (rare use = low-frequency blue, frequent use = active color)
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
docker compose up web voice-api
```

Open:
- `http://localhost:5173`

### No Docker

From repo root:
```bash
./start_web.sh
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
   - Voice/Deep: single audio upload (backend auto-analysis)
3. Wait for `Ready`.
4. Press `Play`.
5. Tune mapping/visual/FX controls.
6. Export analysis, media, or OBJ.

## Related Docs

- front page: `../README.md`
- installation: `../docs/INSTALL.md`
- algorithms: `../docs/ALGORITHMS.md`
- license: `../LICENSE`
