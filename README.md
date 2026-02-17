# Song Geometry Mapper

Song Geometry Mapper is a local-first audio analysis and 3D visualization toolkit by Geekatplay Studio.

It turns a song into a time-indexed geometric structure:
- nodes = short audio frames
- node position = spectral behavior over time
- node size/color = energy and frequency descriptors
- edges = temporal flow and timbral similarity

The project includes:
- Python analyzer pipeline (`python/bgm`) for reproducible offline extraction
- Browser analyzer and cinematic renderer (`web/app.js`) for interactive exploration
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
- Uses precomputed `features.json` (typically from Python analyzer).
- Audio file is used for playback sync.
- Supports stem-focused workflows (for example vocals-only geometry from Demucs outputs).

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

### Web Pipeline (`web/app.js`)
- Parses audio/JSON, computes or imports descriptors
- Builds geometry (`manifold` or `time` mapping)
- Draws nodes, trails, labels, edge waves/lines, post FX
- Supports exports:
  - analysis JSON
  - PNG still
  - WebM recording
  - visible 3D graph as OBJ

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

## Script Guide

### One-click scripts

| Script | Platform | Purpose |
|---|---|---|
| `setup_mac.sh` | macOS/Linux | Prepare Docker or local Python environment |
| `setup_windows.bat` | Windows | Prepare Docker or local Python environment |
| `analyze_song.sh` | macOS/Linux | Guided audio analysis and optional stem selection |
| `analyze_song.bat` | Windows | Guided audio analysis and optional stem selection |
| `start_web.sh` | macOS/Linux | Start web preview (Docker when daemon is ready, else Python fallback) |
| `start_web.bat` | Windows | Start web preview |
| `startup.sh` / `startup.bat` | macOS/Linux, Windows | Docker-first startup convenience script |

### Typical user flow

1. Run setup script once.
2. Run analyze script and choose full mix or stems.
3. Run web start script.
4. Open `http://localhost:5173`.

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
2. load/drag `features.json` from analyzer output
3. load/drag corresponding audio file (full mix or matching stem audio)
4. press `Play` to drive active region synchronization

Notes:
- JSON can be raw frame arrays or exported analysis object with `frames`.
- If JSON includes `x,y,z`, those positions are preserved.

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

Add a license before public distribution (for example MIT or Apache-2.0).
