# PRD - Song Geometry Mapper (Geekatplay Studio)

## 1. Product Summary

Song Geometry Mapper is a local-first toolchain by Geekatplay Studio that converts an audio recording into a 3D geometric visualization of frame-by-frame spectral behavior. It pairs deterministic Python analysis outputs with interactive web and TouchDesigner scenes.

## 2. Problem Statement

Creative coders, educators, and researchers can analyze audio numerically but often lack an intuitive visual representation of how timbre and spectral structure evolve over time. Existing workflows are fragmented and frequently non-reproducible.

## 3. Goals (MVP)

- Import WAV, MP3, and FLAC audio files.
- Generate per-frame descriptors as `features.csv` and `features.json`.
- Provide metadata and range summaries for visualization normalization.
- Visualize data in TouchDesigner as a 3D point cloud with optional edges.
- Provide a spectral spread legend labeled in kHz.
- Support local isolated execution on macOS and Windows.

## 4. Non-goals (MVP)

- No species classification or labeling.
- No cloud processing or hosted backend.
- No proprietary style replication.
- No guaranteed real-time live microphone mode.

## 5. Target Users

- Creative coders / TouchDesigner artists.
- Media arts educators and students.
- Audio visualization researchers.

## 6. User Journey

1. User places an audio file in a local folder.
2. User runs analyzer CLI to produce feature outputs.
3. User opens TouchDesigner project and points it to `features.csv`.
4. User adjusts axis mapping, color, size, decimation, and edge mode.
5. User exports stills/video.

## 7. Functional Requirements

### 7.1 Python Analysis

- Configurable sample rate, FFT size, hop size, smoothing, and normalization.
- Per-frame output columns:
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
- Validation: required columns, no NaNs, monotonic time/index.
- Optional edge export:
  - Temporal (`i -> i+1`)
  - kNN (`i, j, weight`)

### 7.2 Visualization (TouchDesigner)

- Load `features.csv` (single source of truth).
- Render instanced points in 3D.
- Default mapping:
  - X = `t_seconds`
  - Y = `peak_hz`
  - Z = `spectral_spread_hz`
  - Size = `rms`
  - Color = `spectral_spread_khz`
- UI controls for axis source/scale, decimation, edge mode, and visual style.
- Sci-fi style pass with trails, bloom, DOF, and fog.

## 8. Non-functional Requirements

- Runs fully local on macOS and Windows.
- No global Python dependency required when using Docker workflow.
- Handles at least 10 minutes of audio with decimation available for interactivity.

## 9. Success Criteria

- Analyzer produces valid outputs for supported formats.
- Tests pass in isolated environment.
- TouchDesigner setup reproducibly renders point cloud and legend.
- End users can export still/video outputs without external services.

## 10. Release Scope

MVP release includes Python package, tests, Docker/local setup, TouchDesigner setup instructions, and documentation.
