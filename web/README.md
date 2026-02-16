# Geekatplay Studio - Web Preview

Premium dark-mode frontend for local audio upload and full-song 3D spectral mapping.

## Highlights

- Fullscreen cinematic stage with bottom popup controls
- Static 3D song map (all points placed once from spectral analysis)
- Mapping modes: `Manifold (PCA)` and `Time Spine`
- Color mapped by **spectral spread (kHz)** with live legend
- Reactive glow only around currently active musical region
- Temporal + kNN connections, plus flowing trail path over playback
- Camera presets (`Drift`, `Orbit`, `Pulse`, `Dive`) with manual drag/zoom
- Label toggle, connection toggle, bloom/fog controls
- Export still PNG and record WebM preview video locally

## Run (Docker)

From repo root:

```bash
docker compose up web
```

Open:

- `http://localhost:5173`

## Run (No Docker)

From repo root:

```bash
cd web
python3 -m http.server 5173
```

Open:

- `http://localhost:5173`

## Usage

1. Load an audio file in the `Session` panel.
2. Wait for `Analyzing 100%` and status `Ready`.
3. Press `Play` to animate trail/flow through the fixed 3D map.
4. Tune mapping, edges, and camera in the bottom controls drawer.
5. Capture still or start/stop video recording from `Post FX & Export`.
