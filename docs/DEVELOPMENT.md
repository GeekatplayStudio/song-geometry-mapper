# Development Workflow

This document is for contributors and maintainers.

## Core Principles

- Keep analysis deterministic for same input and settings.
- Preserve local-first operation (no cloud dependency).
- Keep docs synchronized with CLI/schema/control changes.
- Add tests when behavior/math changes.

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

Main file: `web/app.js`

Primary flows:
- classic mode: audio decode + in-browser feature extraction
- voice mode: JSON import + optional audio playback sync

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
```

## Release Checklist

1. tests pass (python + web)
2. schema and output format reviewed
3. docs updated (root + component docs)
4. setup scripts validated on target platforms
5. exports verified (JSON, OBJ, PNG/WebM)

## Recommended Contribution Flow

1. open issue or task with expected behavior
2. implement smallest coherent change
3. run tests
4. update docs in same PR
5. include migration notes if schema changed

## Deep Technical References

- algorithms: `docs/ALGORITHMS.md`
- research links: `docs/RESEARCH.md`
