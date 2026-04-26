# TRD - Song Geometry Mapper (Geekatplay Studio)

## 1. Architecture Overview

Primary local components:

- Python analyzer (`python/bgm`) for deterministic descriptor extraction
- Web viewer (`web/`) for interactive 3D rendering and export
- TouchDesigner workflow (`touchdesigner/README.md`) for advanced scene construction

### 1.1 Preservation and Extension Policy

The current system is the technical baseline.

Future work should extend it additively unless an explicit migration decision is made.

Preserve these top-level pathways:
- classic browser analysis path
- backend analysis path through the local Python API
- TouchDesigner ingest path
- current script entrypoints and export formats

Detailed baseline reference:
- `docs/PRESERVATION.md`

Data flow variants:

1. Classic browser path:
- Audio -> browser descriptor extraction -> 3D mapping -> render/export

2. Backend path:
- Audio -> Python analyzer -> `features.json` -> web voice mode ingest -> render/export

3. TouchDesigner path:
- Audio -> Python analyzer -> `features.csv` (+ optional `edges.csv`) -> TouchDesigner

## 2. Python Technical Design

### 2.1 Modules

- `bgm/features.py`
  - audio loading (mono, target SR)
  - STFT magnitude generation
  - frame descriptor extraction
  - temporal/kNN edge building
- `bgm/normalize.py`
  - moving average smoothing
  - `none`/`minmax`/`zscore` normalization
- `bgm/schema.py`
  - required-column and integrity validation
  - numeric min/max summaries
- `bgm/separate.py`
  - Demucs stem separation orchestration
- `bgm/analyze.py`
  - CLI parsing and pipeline orchestration
  - output writing and metadata assembly

### 2.2 CLI Contract

Command:

```bash
python -m bgm.analyze --input <audio> --outdir <dir> [options]
```

Options:
- `--sr`
- `--n_fft`
- `--hop`
- `--smooth`
- `--norm`
- `--edge-mode`
- `--knn-n`
- `--knn-columns`
- `--separate` (if Demucs available)

### 2.3 Output Schemas

`features.csv` and `features.json`:
- `t_seconds`
- `rms`
- `spectral_centroid_hz`
- `spectral_spread_hz`
- `spectral_spread_khz`
- `spectral_rolloff_hz`
- `spectral_flatness`
- `zcr`
- `peak_hz`
- `frame_index`

`metadata.json`:
- generation timestamp
- input path
- settings
- audio summary (`sample_rate`, `duration_seconds`, etc.)
- per-column min/max map
- edge summary

Optional `edges.csv`:
- `i`
- `j`
- `weight`
- `mode`

## 3. Web Technical Design

Main implementation: `web/app.js`

### 3.1 Ingestion Modes

- `Classic (Browser)`
  - decodes audio in browser
  - computes descriptors and mapping locally

- `Voice / Deep (Backend)`
  - loads precomputed JSON descriptors
  - optionally preserves precomputed positions/edges
  - uses audio element for playback synchronization

### 3.2 Geometry and Rendering

- descriptor normalization and frame feature vectors
- mapping modes:
  - PCA manifold projection
  - time spine weighted projection
- edge systems:
  - temporal
  - kNN similarity
- connection styles:
  - straight
  - playback-synced wave

### 3.3 Exports

- analysis JSON
- PNG still
- WebM recording
- visible 3D graph OBJ

## 4. TouchDesigner Integration

- `features.csv` is the baseline ingest format.
- optional `edges.csv` for temporal/similarity lines.
- channel mapping and visual logic defined in `touchdesigner/README.md`.

## 5. Testing Strategy

Automated tests validate:
- schema integrity and error handling
- normalization/smoothing behavior
- edge generation behavior
- analyzer output generation
- web utility logic

Commands:

```bash
# Python
cd python
python -m pytest -q

# Web
node --test web/tests/*.test.js
```

## 6. Environment and Isolation

### 6.1 Docker

`docker-compose.yml` services:
- `analyzer`
- `test`
- `web`

### 6.2 Local Fallback

- Python virtual env at `python/.venv`
- static web served via `python3 -m http.server 5173`

## 7. Risks and Mitigations

- Large files reduce interactivity
  - mitigation: decimation, edge toggles, performance control settings
- Dense kNN links can clutter scenes
  - mitigation: neighbor count and edge visibility controls
- Platform/runtime differences
  - mitigation: Docker-first setup and script-based fallback
