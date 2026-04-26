# Regression Checklist

Use this checklist before merging UI, renderer, or workflow changes.

Goal:
- confirm new work is additive
- confirm existing flows still work
- catch regressions early when visual features expand

## Core Ingestion

1. `Classic (Browser)` still accepts a local audio file and reaches `Ready`.
2. Playback in browser mode still updates the scene and live metrics.
3. `Voice / Deep (Backend)` still uploads one audio file and loads returned analysis.
4. Manual `features.json` import still works as a fallback.

## Geometry And View

5. Mapping modes still switch correctly:
   - `Manifold (PCA)`
   - `Time Spine`
   - `Hybrid Flow`
   - `Helix Orbit`
6. Camera presets still work and manual orbit/pan/zoom still respond.
7. Edge modes and edge styles still render correctly.
8. `Nodes Only` still hides non-node presentation layers.
9. Focus mode still hides overlays without hiding the visualization itself.
10. Math HUD still opens and closes cleanly.

## Additive Visual Features

11. New visual modes, presets, or overlays are optional and do not remove existing presets.
12. If a new overlay is added, verify it can be enabled without breaking legacy presets.
13. If a new preset is added, verify older presets still render with the expected palette/background behavior.
14. If a scene preset auto-loads defaults, verify switching back to a legacy preset restores the prior non-scene controls.

## Export And Media

15. `Export Analysis JSON` still produces a usable payload.
16. `Export 3D OBJ` still exports visible geometry.
17. `Capture Still` still succeeds.
18. If recording/export code changed, `Start/Stop Video` and MP4 conversion workflow still work.

## Environment And Docs

19. Root scripts still match the documented setup/start workflow.
20. If backend code changed, Docker `web` and `voice-api` services still start successfully.
21. Updated behavior is reflected in `README.md`, `web/README.md`, and relevant docs.

## Minimum Commands

Recommended quick validation for web changes:

```bash
node --check web/app.js
node --check web/app/runtime.js
node --check web/app/analysis-module.js
node --check web/app/render-module.js
node --check web/app/workflow-module.js
```