# Song Geometry Mapper - Development Steps

## Phase 0 - Foundation (Completed)

- [x] Create repository layout for Python, TouchDesigner, and assets.
- [x] Implement analyzer package and CLI.
- [x] Implement schema validation, normalization, and smoothing.
- [x] Implement optional temporal and kNN edge export.
- [x] Add baseline tests and Docker-isolated workflows.

## Phase 1 - MVP Hardening (Current)

- [x] Expand unit/integration test coverage.
- [x] Add product and technical documentation (`PRD.md`, `TRD.md`).
- [x] Add project development roadmap document.
- [x] Rebrand to Geekatplay Studio / Song Geometry Mapper.
- [x] Add GitHub-ready installation and development docs (`docs/`).
- [ ] Add CI workflow to run Docker-based test command automatically.
- [ ] Pin dependency versions for stricter reproducibility (optional).

## Phase 2 - TouchDesigner Build Completion

- [ ] Build final `.toe` network from `touchdesigner/README.md` steps.
- [ ] Implement configurable UI controls exactly as listed.
- [ ] Validate legend scale against data min/max in live scene.
- [ ] Validate temporal and kNN edge rendering modes.
- [ ] Capture and store example screenshots in `assets/screenshots/`.

## Phase 3 - Visual Polish

- [ ] Tune sci-fi gradient presets and post-processing stack.
- [ ] Calibrate trail feedback parameters for different audio genres.
- [ ] Add performance presets (preview vs high-quality export).

## Phase 4 - Release Packaging

- [ ] Add explicit open-source license file.
- [ ] Finalize root README with screenshots and known limitations.
- [ ] Create tagged release notes with tested environment matrix.
