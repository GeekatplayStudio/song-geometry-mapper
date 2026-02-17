# Installation and Setup

This guide covers both script-driven setup and manual setup.

## Prerequisites

- OS: macOS, Linux, or Windows
- Option A (recommended): Docker Desktop
- Option B: Python 3.11+ (for analyzer and local web hosting)
- Optional for stem separation: `demucs` (installed by `python/requirements.txt`)

## Quick Start With Scripts

### macOS / Linux

From repo root:
```bash
./setup_mac.sh
./analyze_song.sh
./start_web.sh
```

Script behavior:
- `setup_mac.sh`
  - prefers Docker if daemon is available
  - otherwise creates `python/.venv`, installs dependencies
- `analyze_song.sh`
  - prompts for input audio
  - optional stem separation (`vocals`, `drums`, `bass`, `other`, `all`)
  - writes outputs to `out/`
- `start_web.sh`
  - runs Docker web service when available
  - otherwise falls back to `python3 -m http.server 5173`

### Windows

Run in order:
1. `setup_windows.bat`
2. `analyze_song.bat`
3. `start_web.bat`

## Manual Setup

### Docker path

From repo root:
```bash
docker compose build analyzer
docker compose run --rm test
docker compose up web
```

Web URL:
- `http://localhost:5173`

Analyze with Docker:
```bash
docker compose run --rm analyzer \
  --input /workspace/assets/example_audio/your_audio.wav \
  --outdir /workspace/out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm none
```

### Local Python path

```bash
cd python
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q
```

Run analyzer:
```bash
python -m bgm.analyze \
  --input /path/to/audio.wav \
  --outdir ../out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm none
```

Run web (no Docker):
```bash
cd ../web
python3 -m http.server 5173
```

## Voice / Deep Workflow (Web)

`Voice / Deep (Backend)` mode expects:
- a precomputed `features.json`
- an audio file for playback sync

Typical pipeline:
1. run Python analyzer (optionally with `--separate vocals`)
2. in web UI, switch to `Voice / Deep (Backend)`
3. drag `features.json`
4. drag matching audio (`song.wav` or stem WAV)

## Output Files

Core outputs:
- `out/features.csv`
- `out/features.json`
- `out/metadata.json`
- `out/edges.csv` (if edge export enabled)

Stem outputs (when `--separate` used):
- `out/<stem>/features.csv`
- `out/<stem>/features.json`
- `out/<stem>/metadata.json`
- `out/<stem>/stems/htdemucs/<track>/<stem>.wav`

## Troubleshooting

### `localhost:5173` cannot be reached

- Ensure no other process is using port 5173.
- If Docker is up but port mapping is unavailable, run local web server manually:
  ```bash
  cd web
  python3 -m http.server 5173
  ```
- Confirm listener:
  ```bash
  lsof -nP -iTCP:5173 -sTCP:LISTEN
  ```

### Docker installed but not running

- Start Docker Desktop first, or use local Python path.

### Empty or flat visualization

- Verify `features.json` is non-empty and contains required columns.
- In voice mode, load JSON and audio for synchronized playback behavior.

### Performance is low

- Increase `Display Decimation`
- Reduce `Neighbor Links`
- Disable connections and labels

## Related Docs

- `README.md`
- `docs/ALGORITHMS.md`
- `python/README.md`
- `web/README.md`
