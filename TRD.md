# TRD - Song Geometry Mapper (Geekatplay Studio)

## 1. Architecture Overview

The system has two primary local components:

- Python analyzer (`python/bgm`) for deterministic feature extraction and export.
- TouchDesigner project workflow (`touchdesigner/README.md`) for interactive rendering.
- Web preview studio (`web/`) for fast visual iteration and local export.

Data flow:

1. Input audio file -> Python analyzer.
2. Analyzer -> `features.csv`, `features.json`, `metadata.json`, optional `edges.csv`.
3. TouchDesigner reads `features.csv` (+ optional `edges.csv`) and renders 3D scene.

## 2. Python Technical Design

### 2.1 Modules

- `bgm/features.py`
  - Audio loading (mono, target SR).
  - STFT magnitude generation.
  - Frame descriptor extraction.
  - Edge generation (temporal and kNN).
- `bgm/normalize.py`
  - `none`, `minmax`, `zscore` normalization.
  - Moving-average smoothing.
- `bgm/schema.py`
  - Required-column and integrity validation.
  - Numeric column min/max summary.
- `bgm/analyze.py`
  - CLI argument parsing and orchestration.
  - Output writing and metadata assembly.

### 2.2 CLI Contract

Command:

```bash
python -m bgm.analyze --input <audio> --outdir <dir> [options]
```

Supported options:

- `--sr`
- `--n_fft`
- `--hop`
- `--smooth`
- `--norm`
- `--edge-mode`
- `--knn-n`
- `--knn-columns`

### 2.3 Output Schemas

`features.csv` and `features.json` rows include:

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

`metadata.json` includes:

- Generation timestamp.
- Input path and settings.
- Audio summary (`sample_rate`, `duration_seconds`, `num_samples`, `num_frames`, etc.).
- Per-column min/max map.
- Edge output summary.

Optional `edges.csv` includes:

- `i`
- `j`
- `weight`
- `mode`

## 3. Visualization Technical Design (TouchDesigner)

### 3.1 Data Ingestion

- `File In DAT` loads `features.csv`.
- `DAT to CHOP` converts columns to channels.
- CHOP network maps selected channels to instancing attributes.

### 3.2 Scene

- Instanced spheres or points as primary geometry.
- Optional edges from `edges.csv` (temporal or kNN).
- Camera orbit and reset control.

### 3.3 Visual Pipeline

- Gradient mapping from `spectral_spread_khz`.
- Legend panel with title `Spectral Spread (kHz)`.
- Motion/displacement driven by audio-derived channels.
- TOP feedback trails.
- Post FX: bloom, fog, depth-of-field, color grade.

## 4. Testing Strategy

Automated tests validate:

- Schema integrity and failure cases.
- Normalization and smoothing behavior.
- Edge generation correctness.
- End-to-end analyzer output creation.
- Metadata consistency.
- Deterministic output for identical inputs/settings.

Execution path:

- Preferred isolated run: `docker compose run --rm test`.

## 5. Environment and Isolation

### 5.1 Docker

- `python/Dockerfile` builds analyzer image with dependencies.
- `docker-compose.yml` defines:
  - `analyzer` service for CLI runs.
  - `test` service for pytest.

### 5.2 Local venv fallback

- Project-local `.venv` in `python/.venv`.
- No global package installation required.

## 6. Risks and Mitigations

- Risk: Large audio can reduce interactivity in TD.
  - Mitigation: decimation, reduced preview resolution, optional edges off.
- Risk: kNN edge density can overwhelm scene.
  - Mitigation: limit `knn_n`, expose UI toggles.
- Risk: library/version differences across machines.
  - Mitigation: Dockerized default workflow.
