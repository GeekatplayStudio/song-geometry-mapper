# PRD - Song Geometry Mapper (Geekatplay Studio)

## 1. Product Summary

Song Geometry Mapper is a local-first toolchain that converts audio into a 3D geometric representation of frame-wise spectral behavior.

It includes:
- Python analyzer for reproducible feature extraction
- Web viewer for interactive playback-synced rendering and export
- TouchDesigner handoff path for advanced scene pipelines

## 2. Problem Statement

Audio analysis data is typically numerical and hard to interpret visually over full-track timescales. Artists and researchers need a deterministic way to transform time-varying timbre into explorable spatial structure.

## 3. Product Goals

- Analyze WAV/MP3/FLAC into frame descriptors.
- Support both full mix and stem-focused analysis.
- Provide browser-native and backend-driven visualization modes.
- Preserve deterministic outputs for same inputs/settings.
- Export data and media for downstream tools.

## 4. Non-goals

- No cloud dependency.
- No classification/genre/species labeling model.
- No real-time live microphone guarantee.
- No proprietary style cloning.

## 5. Target Users

- Creative coders and audiovisual artists
- Educators and students in DSP/media arts
- Researchers exploring timbral structure over time

## 6. User Journeys

### Journey A: Fast Browser Analysis

1. User opens web app.
2. User chooses `Classic (Browser)` mode.
3. User drops audio file.
4. User explores geometry, links, and playback-reactive effects.
5. User exports PNG/WebM/JSON/OBJ.

### Journey B: Backend/Stem Workflow

1. User runs Python analyzer (optional `--separate`).
2. User opens web app and chooses `Voice / Deep (Backend)`.
3. User loads analyzer `features.json` and matching audio.
4. User explores stem-specific geometry and exports.

### Journey C: TouchDesigner Pipeline

1. User runs analyzer and creates `features.csv` (+ optional `edges.csv`).
2. User loads data into TouchDesigner graph.
3. User builds final render stack and output.

## 7. Functional Requirements

### 7.1 Python Analyzer

- Configurable SR/FFT/hop/smoothing/normalization.
- Required frame columns:
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
- Validation: required columns, no NaN, monotonic time/index.
- Optional edges: temporal and kNN.
- Optional stem separation via Demucs.

### 7.2 Web Viewer

- Two analysis ingestion modes:
  - `Classic (Browser)` audio analysis
  - `Voice / Deep (Backend)` JSON + audio ingest
- Mapping modes:
  - `Manifold (PCA)`
  - `Time Spine`
- Connectivity:
  - temporal edges
  - kNN edges
  - styles: `Wave` and `Straight`
- Visual controls:
  - camera, glow, fog, pulse, trail, decimation, labels
- Exports:
  - analysis JSON
  - PNG still
  - WebM recording
  - visible graph OBJ

### 7.3 TouchDesigner Path

- Data contract compatibility with analyzer outputs.
- Configurable 3D instancing and optional edge rendering.
- Legend and post FX alignment with descriptor ranges.

## 8. Non-functional Requirements

- Fully local operation on macOS and Windows.
- Docker-first reproducibility, local venv fallback.
- Handle long tracks with decimation/performance controls.

## 9. Success Criteria

- Analyzer outputs valid deterministic descriptors.
- Browser and backend modes both render and sync correctly.
- Export formats open successfully in downstream tools.
- Core tests pass in CI/local runs.

## 10. Release Scope

Current scope includes Python analyzer, script-based setup, web viewer with exports, docs, and TouchDesigner integration path.
