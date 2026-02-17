# Installation Guide

## 1. Requirements

- macOS or Windows
- Docker Desktop (recommended), or Python 3.11+
- Optional: TouchDesigner (latest stable)

## 2. Docker Setup (Isolated)

```bash
git clone https://github.com/GeekatplayStudio/song-geometry-mapper.git
cd song-geometry-mapper
docker compose build analyzer
docker compose run --rm test
```

Run analyzer:

```bash
docker compose run --rm analyzer \
  --input /workspace/assets/example_audio/your_audio.wav \
  --outdir /workspace/out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm none \
  --separate vocals drums
```

*Note: The `--separate` flag supports multiple values: `vocals`, `drums`, `bass`, `other`, or `all`. The analyzer will process the full song (default) AND the requested stems (in subdirectories).*

Run web preview:

```bash
docker compose up web
```

Open `http://localhost:5173`.

## 3. Local Python Setup (Project-Local `.venv`)

```bash
cd song-geometry-mapper/python
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q
```

## 4. Troubleshooting

- Port `5173` busy: stop existing process/container using that port.
- No points in web view: load an audio file first, then press Play.
- Slow performance: increase decimation, reduce neighbor links, disable edges.
- Wrong color units: color uses `spectral_spread_khz`.
