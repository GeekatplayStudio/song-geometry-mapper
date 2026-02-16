# Song Geometry Mapper - Python Analyzer (Geekatplay Studio)

This package extracts frame-wise audio descriptors and writes three primary outputs:

- `features.csv`
- `features.json`
- `metadata.json`

Optional edge export:

- `edges.csv` (temporal or kNN)

## Install

### Docker (fully isolated)

From repo root:

```bash
docker compose build analyzer
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
  --norm zscore
```

Run tests:

```bash
docker compose run --rm test
```

### Local venv (project-local, no global packages)

```bash
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Run

```bash
python -m bgm.analyze \
  --input /path/to/audio.wav \
  --outdir ../out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm zscore
```

### Optional edges

```bash
python -m bgm.analyze \
  --input /path/to/audio.wav \
  --outdir ../out \
  --edge-mode knn \
  --knn-n 4 \
  --knn-columns spectral_centroid_hz spectral_spread_hz spectral_flatness rms peak_hz
```

## Output columns

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

## Tests

```bash
python -m pytest
```
