# Development Workflow

This document is for contributors and maintainers.

## Core Principles

- Keep analysis deterministic for same input and settings.
- Preserve local-first operation (no cloud dependency).
- Treat new implementation as additive by default; do not remove or replace working flows without explicit approval.
- Keep docs synchronized with CLI/schema/control changes.
- Add tests when behavior/math changes.

## Preservation Baseline

Before changing behavior, review `docs/PRESERVATION.md`.

Default expectation:
- new visuals are added as modes, presets, overlays, or optional layouts
- current scripts, analyzer paths, web ingestion modes, and export flows remain available
- if a migration or removal is intentional, document it before implementation

## Project Components

- Analyzer package: `python/bgm`
- Browser visualization app: `web/`
- Script entrypoints: repo root (`setup_*`, `analyze_song.*`, `start_web.*`)

## Analyzer Pipeline (Python)

Main entrypoint: `python/bgm/analyze.py`

Pipeline stages:
1. parse args
2. optional Demucs stem separation
3. frame feature extraction (`features.py`)
4. smoothing/normalization (`normalize.py`)
5. schema validation (`schema.py`)
6. optional edge export
7. write csv/json/metadata

Local API entrypoint:
- `python -m bgm.web_api` exposes `/api/voice/analyze` for one-step web voice mode uploads.

### CLI Arguments to Keep Stable

- frame analysis: `--sr`, `--n_fft`, `--hop`
- post-processing: `--smooth`, `--norm`
- edge generation: `--edge-mode`, `--knn-n`, `--knn-columns`
- stems: `--separate`

If you change defaults or semantics, update:
- `README.md`
- `python/README.md`
- `docs/INSTALL.md`

## Browser Pipeline (Web)

Entrypoint:
- `web/app.js` (composition + event wiring)

Core modules:
- `web/app/runtime.js` (DOM/runtime state + shared helpers)
- `web/app/analysis-module.js` (analysis, mapping, palettes, presets)
- `web/app/render-module.js` (camera, projection, draw pipeline)
- `web/app/workflow-module.js` (voice upload flow, import/export, recording)

Primary flows:
- classic mode: audio decode + in-browser feature extraction
- voice mode: audio upload -> local API analysis -> payload import + playback sync

Key functional areas:
- descriptor extraction (`computeFrameDescriptor`)
- mapping (`applyMapping`)
- edges (`buildTemporalEdges`, `buildKnnEdges`, `drawEdges`)
- rendering (`drawMap`, `drawTrail`, `drawPoints`)
- export (`exportAnalysisJson`, `exportVisible3dObj`, still/video)

## Data Contracts

Required frame fields for compatibility:
- `t_seconds`/`t`
- `rms`
- centroid/spread/rolloff/flatness/zcr/peak
- `frame_index` (or implicit index)

Web JSON import accepts:
1. raw frame array
2. exported analysis object containing `frames` (and optional `ranges`, `edges`, `track`)

## Testing

### Python tests

```bash
cd python
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m pytest -q
```

### Web unit tests

```bash
node --test web/tests/*.test.js
```

### JS syntax check

```bash
node --check web/app.js
node --check web/app/runtime.js
node --check web/app/analysis-module.js
node --check web/app/render-module.js
node --check web/app/workflow-module.js
```

## Release Checklist

1. tests pass (python + web)
2. schema and output format reviewed
3. docs updated (root + component docs)
4. preservation baseline reviewed for touched surfaces
5. setup scripts validated on target platforms
6. exports verified (JSON, OBJ, PNG/WebM)

## Recommended Contribution Flow

1. open issue or task with expected behavior
2. confirm whether the change is additive or intentionally migratory
3. implement smallest coherent change
4. keep existing workflows available while introducing the new path
5. run tests
6. update docs in same PR
7. include migration notes if schema changed or any existing surface changed intentionally

## Deep Technical References

- preservation baseline: `docs/PRESERVATION.md`
- manual regression checklist: `docs/REGRESSION_CHECKLIST.md`
- algorithms: `docs/ALGORITHMS.md`
- research links: `docs/RESEARCH.md`
