# Preservation Baseline

This document captures the current Song Geometry Mapper baseline before further design or feature expansion.

Its purpose is simple:
- preserve what already works
- make future work additive by default
- reduce accidental regressions during UI and rendering upgrades

## Additive Change Rule

Unless a user explicitly approves a removal or migration, new implementation must ship as an addition, not a replacement.

That means:
- keep existing workflows available while new ones are introduced
- keep current scripts, analyzer contracts, and export paths working
- keep current visualization modes accessible even if a stronger default presentation is added
- treat experimental visuals as opt-in presets, modes, overlays, or panels first
- document any intentional behavioral change before shipping it

## Current Baseline To Preserve

### Root Scripts

The following entrypoints are part of the current user-facing surface and should remain available:
- `setup_mac.sh`
- `setup_windows.bat`
- `analyze_song.sh`
- `analyze_song.bat`
- `start_web.sh`
- `start_web.bat`
- `convert_video.sh`
- `convert_video.bat`
- `startup.sh`
- `startup.bat`

### Analyzer Baseline

Python analyzer responsibilities to preserve:
- deterministic offline descriptor extraction from local audio
- optional Demucs stem separation when available
- export of `features.csv`, `features.json`, and `metadata.json`
- optional edge export via `edges.csv`
- CLI entrypoint: `python -m bgm.analyze`
- local backend API entrypoint: `python -m bgm.web_api`

Stable analyzer option surface to preserve:
- `--sr`
- `--n_fft`
- `--hop`
- `--smooth`
- `--norm`
- `--edge-mode`
- `--knn-n`
- `--knn-columns`
- `--separate`

### Web App Baseline

Current ingestion modes to preserve:
- `Classic (Browser)` in-browser analysis path
- `Voice / Deep (Backend)` local API path
- manual `features.json` import fallback

Current geometry modes to preserve:
- `Manifold (PCA)`
- `Time Spine`
- `Hybrid Flow`
- `Helix Orbit`

Current interaction and presentation features to preserve:
- camera presets plus manual orbit/pan/zoom
- temporal and similarity connectivity controls
- edge styles including straight, wave, and ribbon
- reactive trails, glow, fog, pulse, flow particles, and cinema FX controls
- focus mode toggle for fullscreen display-only presentation
- Math HUD diagnostics panel
- palette presets and custom palette loading
- auto spread calibration per song

Current export features to preserve:
- analysis JSON export
- OBJ export of visible graph
- PNG still capture
- WebM recording
- MP4 conversion helper workflow via repo scripts

### Integration Baseline

The following integration paths are part of the current product surface:
- Docker web service
- Docker voice API service
- local-first no-cloud operation
- TouchDesigner ingest of analyzer output

## Safe Extension Pattern

Preferred implementation pattern for future work:
1. add a new mode, preset, overlay, or layout
2. keep current controls and workflows functional
3. verify old and new paths side by side
4. only replace an old path after explicit approval and documented migration notes

Examples of additive work:
- add a new visualization family as another preset or scene mode
- add a new structural overlay without removing current mapping modes
- add a new export format beside JSON/OBJ/PNG/WebM
- add a new backend analysis option beside existing classic and voice flows
- add a new onboarding or presentation layout while retaining the current drawer-driven control system

## Minimum Regression Check For New Features

When shipping additive work, verify at least these paths:
1. browser mode still analyzes a local file
2. backend mode still calls the local API and loads returned analysis
3. manual JSON import still works
4. playback sync still drives active-region rendering
5. focus mode still hides overlays without hiding the visualization
6. exports still work for the formats touched by the change
7. setup/start scripts and Docker workflows still match the docs

Use this walkthrough when validating visual additions:
- `docs/REGRESSION_CHECKLIST.md`

## Source Documents

This baseline is backed by:
- root overview: `README.md`
- development workflow: `docs/DEVELOPMENT.md`
- technical reference: `TRD.md`
- analyzer details: `python/README.md`
- web viewer details: `web/README.md`