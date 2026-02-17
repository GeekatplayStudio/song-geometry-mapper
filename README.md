# Song Geometry Mapper

**Geekatplay Studio** presents **Song Geometry Mapper**: a local-first toolkit that converts audio into frame-wise spectral descriptors and maps the full song into a cinematic 3D geometry.

It includes:
- A Python analyzer CLI (`features.csv`, `features.json`, `metadata.json`, optional `edges.csv`)
- A premium local web preview (fullscreen 3D map, trails, connections, labels, export)
- A TouchDesigner build recipe for production-grade visuals

Recent visual upgrades in web preview:
- Borderless points with opacity control for cleaner depth layering
- Activation pulse + short vibration response on active regions
- Meteor-style trail shaping (brighter head, softer fading tail)
- Visual-range enhancements: depth tint, adaptive label density fade, peak-only chromatic split, micro-dolly camera pulse
- New built-in `Cinematic+` visual preset option
- Save/load/delete custom presets for all control drawer settings (stored locally in browser)
- Orbit/Pan drag mode and explicit pause control for playback navigation
- Hz-aware color mapping (`spectral spread` or `peak frequency`) and custom palette JSON import
- Dedicated glow intensity/threshold controls for tighter bloom behavior
- Connection style blending (`Connection Solidness`) from particle trails to solid thin lines
- **New**: Toggle between `Wave` (organic) and `Straight` connection styles
- **New**: Audio stem separation (isolating vocals, drums, bass, etc.) alongside full analysis

## Quick Install (No Global Side Effects)

### Option A: Docker (Recommended)

```bash
git clone https://github.com/GeekatplayStudio/song-geometry-mapper.git
cd song-geometry-mapper
docker compose build analyzer
docker compose run --rm test
```

Analyze audio:

```bash
docker compose run --rm analyzer \
  --input /workspace/assets/example_audio/your_audio.wav \
  --outdir /workspace/out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm zscore \
  --edge-mode temporal
```

Run web app:

```bash
docker compose up web
```

Open: `http://localhost:5173`

### Option B: Local `.venv` (Project-Local Python)

```bash
git clone https://github.com/GeekatplayStudio/song-geometry-mapper.git
cd song-geometry-mapper/python
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q
```

Analyze audio:

```bash
python -m bgm.analyze \
  --input /path/to/audio.wav \
  --outdir ../out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm zscore \
  --edge-mode temporal
```

Optional web app without Docker:

```bash
cd ../web
python3 -m http.server 5173
```

Web visual utility tests:

```bash
node --test web/tests/*.test.js
```

## Default Mapping

- `X`: time (`t_seconds`) or manifold axis
- `Y`: peak/centroid frequency
- `Z`: spectral spread / texture
- Point size: `rms`
- Point color: `spectral_spread_khz`

## Outputs

- `out/features.csv`
- `out/features.json`
- `out/metadata.json`
- `out/edges.csv` (optional)

## TouchDesigner

Open `touchdesigner/README.md` and follow the node-by-node recipe.
Use:
- `out/features.csv`
- `out/edges.csv` (optional)

`touchdesigner/SongGeometryMapper.toe` is a placeholder file for the build.

## Docs

- Product requirements: `PRD.md`
- Technical requirements: `TRD.md`
- Development phases: `DEVELOPMENT_STEPS.md`
- Installation details: `docs/INSTALL.md`
- Development workflow: `docs/DEVELOPMENT.md`
- Python analyzer notes: `python/README.md`
- Web preview notes: `web/README.md`

## Repo Layout

```text
song-geometry-mapper/
  python/
  web/
  touchdesigner/
  assets/
  out/
  docs/
```

## Credits and Licensing

This is a clean-room implementation inspired by publicly described spectral-to-visual mapping concepts. No proprietary assets or private pipelines are included.

Choose a license before public distribution (MIT or Apache-2.0 recommended).
