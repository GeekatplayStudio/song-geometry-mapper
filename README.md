# Song Geometry Mapper

Song Geometry Mapper is a local-first audio analysis and 3D visualization toolkit by Geekatplay Studio.

It turns a song into a time-indexed geometric structure:
- nodes = short audio frames
- node position = spectral behavior over time
- node size/color = energy and frequency descriptors
- edges = temporal flow and timbral similarity

The project includes:
- Python analyzer pipeline (`python/bgm`) for reproducible offline extraction
- Browser analyzer and cinematic renderer (`web/app.js` + `web/app/*`) for interactive exploration
- optional stem separation (Demucs) for voice/instrument focused maps
- JSON/PNG/WebM/OBJ exports

## What It Does

Given an input track, the system:
1. splits audio into overlapping frames
2. extracts spectral descriptors per frame
3. normalizes/optionally smooths descriptors
4. maps frames into a 3D point cloud
5. builds temporal and/or similarity edges
6. renders a reactive visual scene synchronized to playback

## Analyzer Modes

The web app has two ingestion modes in `Session -> Analysis Model`:

1. `Classic (Browser)`
- Drops audio (`.wav`, `.mp3`, etc.) directly into the web app.
- Analysis runs in-browser with custom FFT logic.
- Best for immediate preview and quick iteration.

2. `Voice / Deep (Backend)`
- Upload one audio file.
- Local voice backend API auto-runs Python analyzer and injects generated JSON map.
- Audio is reused for playback sync automatically.
- `Voice Focus` can request a stem target (for example vocals-only geometry).
- Manual `features.json` loading is still supported as fallback.

## Architecture

### Python Pipeline (`python/bgm`)
- Loader/features: `python/bgm/features.py`
- Normalization/smoothing: `python/bgm/normalize.py`
- Schema validation: `python/bgm/schema.py`
- Demucs stem split: `python/bgm/separate.py`
- CLI orchestration: `python/bgm/analyze.py`

Primary outputs:
- `features.csv`
- `features.json`
- `metadata.json`
- optional `edges.csv`

### Web Pipeline (`web/`)
- Entry/orchestration: `web/app.js`
- Runtime + shared utilities: `web/app/runtime.js`
- Analysis/mapping/presets: `web/app/analysis-module.js`
- Rendering/camera/effects: `web/app/render-module.js`
- Playback/import/export/recording workflows: `web/app/workflow-module.js`

## How Node Placement Works

Detailed math is in `docs/ALGORITHMS.md`. Summary:

### Classic Browser descriptors (per frame)
Computed from STFT magnitude with Hann window:
- `rms`
- `zcr`
- `centroidHz`
- `spreadHz`
- `rolloffHz` (85% cumulative energy)
- `flatness`
- `peakHz`
- `flux` (positive spectral change)

### Feature normalization
Each descriptor is min-max normalized to `[0,1]` (browser flow).

### Mapping modes
1. `Manifold (PCA)`
- PCA projection of feature vectors to 3 components.
- Components are range-normalized then scaled into scene coordinates.

2. `Time Spine`
- `x` follows time linearly.
- `y` and `z` are weighted combinations of normalized descriptor values.

Time Spine equations used in renderer:
- `x = (tNorm - 0.5) * 36`
- `y = (peakN - 0.5) * 20 + (centroidN - 0.5) * 7`
- `z = (spreadN - 0.5) * 18 + (1 - flatnessN - 0.5) * 8 + (rmsN - 0.5) * 9 + (fluxN - 0.5) * 5`

### Node visual attributes
- size: function of normalized RMS
- color: interpolated from selected palette using either spread or peak frequency metric

## How Edges Are Built

1. Temporal edges
- Connect frame `i-1 -> i`.

2. Similarity edges (kNN)
- Browser mode: weighted descriptor-distance search with edge weight decay.
- Python mode: cKDTree nearest-neighbor edges over selected columns.

3. Connection styles
- `line`: straight comet-like segment
- `wave`: sinusoidal edge shape synchronized to playback time and frequency mix
- `ribbon`: fluid ribbon strips with traveling light-wave highlights

## UI Focus Mode

- Use the lower-right circle toggle:
  - `H` = hide overlays (HUD, legend, controls) for fullscreen display-only view
  - `S` = show overlays again
- The main visualization remains visible while UI windows are hidden.

## Script Guide

### One-click scripts

| Script | Platform | Purpose |
|---|---|---|
| `setup_mac.sh` | macOS/Linux | Prepare Docker or local Python environment |
| `setup_windows.bat` | Windows | Prepare Docker or local Python environment |
| `analyze_song.sh` | macOS/Linux | Guided audio analysis and optional stem selection |
| `analyze_song.bat` | Windows | Guided audio analysis and optional stem selection |
| `start_web.sh` | macOS/Linux | Start web preview plus local voice analyzer API |
| `start_web.bat` | Windows | Start web preview plus local voice analyzer API |
| `convert_video.sh` | macOS/Linux | Convert recorded WebM to high-quality MP4 (optional 4K output) |
| `convert_video.bat` | Windows | Convert recorded WebM to high-quality MP4 (optional 4K output) |
| `startup.sh` / `startup.bat` | macOS/Linux, Windows | Docker-first startup convenience script |

### Typical user flow

1. Run setup script once.
2. Run analyze script and choose full mix or stems.
3. Run web start script.
4. Record with `Start/Stop Video` (WebM) in the app for maximum reliability.
5. Convert WebM to MP4 using `convert_video.sh` or `convert_video.bat`.
6. Open `http://localhost:5173`.

## Setup

See complete instructions:
- `docs/INSTALL.md`

Quick path (macOS/Linux):
```bash
./setup_mac.sh
./analyze_song.sh
./start_web.sh
```

Quick path (Windows):
- `setup_windows.bat`
- `analyze_song.bat`
- `start_web.bat`

## Python CLI Examples

Full mix:
```bash
python -m bgm.analyze \
  --input /path/to/song.wav \
  --outdir ../out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm zscore
```

Full mix + stems:
```bash
python -m bgm.analyze \
  --input /path/to/song.wav \
  --outdir ../out \
  --separate vocals drums
```

kNN edges export:
```bash
python -m bgm.analyze \
  --input /path/to/song.wav \
  --outdir ../out \
  --edge-mode knn \
  --knn-n 4 \
  --knn-columns spectral_centroid_hz spectral_spread_hz spectral_flatness rms peak_hz
```

## Output Structure

Example:
```text
out/
  features.csv
  features.json
  metadata.json
  edges.csv                # if edge-mode != none
  vocals/                  # if --separate vocals
    features.csv
    features.json
    metadata.json
    stems/
      htdemucs/
        <track_name>/
          vocals.wav
```

## Voice / Deep Mode Workflow

In the web app:
1. choose `Voice / Deep (Backend)`
2. select `Voice Focus` (`vocals`, `drums`, `bass`, `other`, or full mix)
3. load/drag one audio file
4. press `Play` to drive active region synchronization

Notes:
- Backend API endpoint is `http://127.0.0.1:5180/api/voice/analyze`.
- If backend is unavailable, web app falls back to classic in-browser analysis.
- Manual JSON import still accepts raw frame arrays or exported analysis objects with `frames`.

## Documentation Map

- Installation: `docs/INSTALL.md`
- Development workflow: `docs/DEVELOPMENT.md`
- Detailed algorithms and formulas: `docs/ALGORITHMS.md`
- Research references: `docs/RESEARCH.md`
- Python analyzer details: `python/README.md`
- Web renderer details: `web/README.md`
- Product/technical requirements: `PRD.md`, `TRD.md`

## Research and Foundations

This project is built on standard DSP, dimensionality reduction, and source separation methods. See:
- `docs/RESEARCH.md`

Direct references:
- librosa paper: https://doi.org/10.25080/Majora-7b98e3ed-003
- Demucs (waveform source separation): https://arxiv.org/abs/1911.13254
- Hybrid Demucs: https://arxiv.org/abs/2111.03600
- HT Demucs: https://arxiv.org/abs/2211.08553
- FFT classic reference: https://doi.org/10.1090/S0025-5718-1965-0178586-1

## Repository Layout

```text
song-geometry-mapper/
  python/
  web/
  touchdesigner/
  docs/
  assets/
  out/
```

## License

This project is licensed under the MIT License.
See `LICENSE`.
