# Song Geometry Mapper - Development Steps

## Phase 0 - Foundation (Completed)

- [x] Repository layout for Python, web, TouchDesigner, and assets
- [x] Analyzer package and CLI
- [x] Schema validation, normalization, and smoothing
- [x] Optional temporal and kNN edge export
- [x] Baseline tests and Docker workflows

## Phase 1 - Product Core (Completed)

- [x] Script-based setup for macOS/Linux and Windows
- [x] Browser web viewer with interactive controls
- [x] Mapping modes: Manifold (PCA) and Time Spine
- [x] Temporal + kNN connection rendering
- [x] JSON export and import support

## Phase 2 - Advanced Features (Completed)

- [x] Wave/Straight connection style toggle
- [x] Stem separation integration (Demucs)
- [x] Voice/Deep backend ingestion mode in web UI
- [x] 3D OBJ export of visible graph (nodes + links)

## Phase 3 - Documentation and Reliability (Completed)

- [x] Front-page README rewrite for GitHub
- [x] Installation and development documentation overhaul
- [x] Algorithm and research reference documentation
- [x] In-app Help modal update to match current functionality
- [x] Mac web startup fallback when Docker daemon is unavailable

## Phase 4 - Remaining Roadmap

- [ ] CI workflow to run analyzer and web tests automatically
- [ ] Optional dependency/version pin hardening for stricter reproducibility
- [ ] Final TouchDesigner `.toe` build completion and screenshot pack
- [ ] Performance presets for large tracks
- [ ] Add explicit open-source license file
