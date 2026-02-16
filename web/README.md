# Geekatplay Studio - Web Preview

Premium dark-mode frontend for local audio upload and full-song 3D spectral mapping.

## Highlights

- Fullscreen cinematic stage with bottom popup controls
- Bottom tabbed controls (`Session`, `Mapping`, `Visual`, `Post FX`) with one panel shown at a time
- Static 3D song map (all points placed once from spectral analysis)
- Mapping modes: `Manifold (PCA)` and `Time Spine`
- Color mapped by **spectral spread (kHz)** with live legend
- Reactive glow only around currently active musical region
- Temporal + kNN connections, plus flowing trail path over playback
- Camera presets (`Drift`, `Orbit`, `Pulse`, `Dive`) with manual drag/zoom
- Label toggle, connection toggle, bloom/fog controls
- Point opacity control with borderless points for cleaner depth styling
- Point depth (3D) control with stronger spherical shading
- Activation pulse + micro-vibration for short reactive "alive" motion
- Meteor-style trails with bright head and fading tail profile
- Adaptive label density fading to reduce clutter in dense regions
- Depth atmospheric tint and subtle peak-only chromatic split for extra cinematic range
- New built-in `Cinematic+` visual preset
- Save/load/delete custom presets (all control drawer settings) in browser local storage
- Explicit `Pause` button and drag mode switch (`Orbit` / `Pan`)
- Color metric switch (`Spectral Spread` / `Peak Frequency`) and custom palette JSON loading
- Separate `Glow Intensity` and `Glow Threshold` controls for finer bloom management
- Additional glow shaping controls: `Glow Shift (Infra)` and `Glow Decay`
- Connection trail controls: `Connection Trail Length`, `Connection Tail Fade`, and `Node Hit Pulse`
- `Connection Solidness` blends style from particle-like moving links to solid thin lines
- Static camera preset plus `Neighbor Boost` for clearer kNN link visibility
- Motion quality controls: `Motion Blur` and richer dissolving edge-comet behavior
- Export still PNG and record WebM preview video locally (with song audio)
- Export analyzed song data as JSON (`Export Analysis JSON`)
- Metric readouts hold latest valid values instead of dropping to zero during inactive frames

## Run (Docker)

From repo root:

```bash
docker compose up web
```

Open:

- `http://localhost:5173`

## Web Tests

Run focused visual utility unit tests:

```bash
node --test web/tests/*.test.js
```

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
