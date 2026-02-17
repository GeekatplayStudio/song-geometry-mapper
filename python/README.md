# Python Analyzer (`python/bgm`)

The Python analyzer is the reproducible offline extraction pipeline for Song Geometry Mapper.

It converts audio into frame-wise descriptors and metadata files used by the web viewer and external tools.

## What It Produces

Required outputs:
- `features.csv`
- `features.json`
- `metadata.json`

Optional output:
- `edges.csv` (temporal or kNN)

When stem separation is enabled, each requested stem gets its own output folder with the same files.

## Installation

### Docker

From repo root:
```bash
docker compose build analyzer
docker compose run --rm test
```

### Local virtual environment

From `python/`:
```bash
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q
```

## CLI Usage

Basic:
```bash
python -m bgm.analyze \
  --input /path/to/song.wav \
  --outdir ../out
```

Full options example:
```bash
python -m bgm.analyze \
  --input /path/to/song.wav \
  --outdir ../out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm zscore \
  --edge-mode knn \
  --knn-n 4 \
  --knn-columns spectral_centroid_hz spectral_spread_hz spectral_flatness rms peak_hz
```

Stem separation example:
```bash
python -m bgm.analyze \
  --input /path/to/song.wav \
  --outdir ../out \
  --separate vocals drums
```

`--separate all` runs all standard stems: `vocals`, `drums`, `bass`, `other`.

## Descriptor Columns

The analyzer writes these frame columns:

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

## Calculation Details

Feature extraction (`python/bgm/features.py`) uses `librosa`:
- mono load at target sample rate
- STFT magnitude
- per-frame descriptors listed above
- peak frequency from max magnitude bin index

Post-processing (`python/bgm/normalize.py`):
- smoothing with centered moving average (`--smooth`)
- normalization modes: `none`, `minmax`, `zscore`
- excludes `t_seconds` and `frame_index` from smoothing and normalization

Schema checks (`python/bgm/schema.py`):
- required columns present
- no NaN in required columns
- monotonic `t_seconds` and `frame_index`

## Edge Export

`--edge-mode none`
- no edge file

`--edge-mode temporal`
- `i -> i+1` for each frame pair

`--edge-mode knn`
- cKDTree nearest-neighbor edges in chosen descriptor space
- edge weight is stored distance

## Metadata

`metadata.json` includes:
- generation timestamp
- absolute input path
- analysis settings
- audio summary (`sample_rate`, `duration_seconds`, etc.)
- min/max ranges per numeric column
- row count
- edge summary

## Integration With Web Voice Mode

Primary flow:
- Web `Voice / Deep (Backend)` uploads audio to local API (`bgm.web_api`).
- API runs this analyzer pipeline and returns generated payload automatically.

Manual fallback flow:
1. load `features.json`
2. load matching audio file

For stems, use the corresponding stem folder `features.json` with matching stem audio.

## Tests

```bash
python -m pytest
```

## Related Docs

- project front page: `../README.md`
- algorithm details: `../docs/ALGORITHMS.md`
- research references: `../docs/RESEARCH.md`
- license: `../LICENSE`
