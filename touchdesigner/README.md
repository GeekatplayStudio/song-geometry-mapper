# Song Geometry Mapper - TouchDesigner Setup (Geekatplay Studio)

This project is designed for local use on macOS and Windows with recent TouchDesigner builds.

`SongGeometryMapper.toe` in this repo is a placeholder file. Use this recipe to build the network exactly.

The newer web-only `Observatory` and `Cathedral` scene families are additive presentation layers in the browser renderer. They do not change the analyzer CSV/JSON contract consumed by this TouchDesigner workflow.

## Inputs

- Main data file: `../out/features.csv`
- Optional edge file: `../out/edges.csv` (from Python `--edge-mode temporal` or `--edge-mode knn`)

## 1) Load CSV

1. Create `filein1` (`File In DAT`) and point it to `features.csv`.
2. Turn on `Reload` pulse button or `Sync to File` for hot-reload while iterating.
3. Add `select1` (`Select DAT`) if you want to keep only active columns for performance.

## 2) DAT -> CHOP and mapping controls

1. Add `datto1` (`DAT to CHOP`) to convert numeric columns.
2. In `datto1`, use first row as channel names.
3. Add `null_data` (`Null CHOP`) as a stable output node.
4. Add `math_scale` (`Math CHOP`) for global scaling and offset shaping.

Create a UI `Container COMP` named `ui_controls` with custom parameters:

- `filepath` (string)
- `xsource` (menu: `t_seconds`, `spectral_centroid_hz`, `peak_hz`, `spectral_spread_hz`, `spectral_flatness`, `rms`, `zcr`)
- `ysource` (same menu)
- `zsource` (same menu)
- `xscale` (float)
- `yscale` (float)
- `zscale` (float)
- `pointsizescale` (float)
- `colormin` (float, optional override)
- `colormax` (float, optional override)
- `decimation` (int, min 1)
- `showedges` (toggle)
- `edgemode` (menu: `temporal`, `knn`)
- `knn_n` (int)
- `trailfade` (float 0.85-0.999)
- `bloomstrength` (float)
- `motionstrength` (float)
- `gradientslot` (menu)

## 3) Build point positions

Use one of these two equivalent paths.

### Option A: Instancing workflow (recommended)

1. Build channels `tx`, `ty`, `tz`, `pscale`, and `color_index` in CHOPs:
   - `tx` = selected X source * `xscale`
   - `ty` = selected Y source * `yscale`
   - `tz` = selected Z source * `zscale`
   - `pscale` = `rms * pointsizescale`
   - `color_index` = normalized `spectral_spread_khz`
2. Apply decimation with `Resample CHOP` or `Delete CHOP` pattern (`every Nth sample`).
3. Create `geo_points` (`Geometry COMP`) with a low-poly `sphere1` as instanced primitive.
4. In `geo_points` instancing page:
   - Enable `Instancing`.
   - Translate OP = CHOP containing `tx ty tz`.
   - Uniform Scale OP/Channel = `pscale`.
   - Color OP channels = mapped RGB channels.

### Option B: SOP point workflow

1. Use `DAT to SOP` to create points from rows.
2. Add `Point SOP` to set point scale and color attributes.
3. Render with `geo_points` and a point-friendly material.

## 4) Color mapping and legend

1. Add `ramp1` (`Ramp TOP`) vertical gradient (sci-fi palette):
   - deep violet -> blue -> cyan -> green -> yellow -> orange/red
2. Convert `color_index` to UV lookup:
   - Use `TOP to CHOP`/`Lookup CHOP` or GLSL instancing color lookup.
3. Create `legend_container` (`Container COMP`):
   - Include a vertical ramp bar.
   - Add text labels at min/max based on `spectral_spread_khz` data range.
   - Title text: `Spectral Spread (kHz)`.

## 5) Edges

### Temporal edges

1. If `edges.csv` is exported in temporal mode, load via `File In DAT`.
2. Build line primitives from pairs `(i, j)` using `Add SOP` with polygon-by-index.
3. Render with thin emissive material.

### kNN edges

1. Export from Python (`--edge-mode knn --knn-n N`) to keep TD graphing simple.
2. Load `edges.csv` and build lines as above.
3. Gate visibility with `showedges` toggle.

## 6) Camera and navigation

1. Add `cam1`, `light1`, and `render1`.
2. Use `Camera COMP` with orbit controls (LMB orbit, MMB pan, wheel zoom).
3. Add a `resetcam` pulse parameter in `ui_controls` to reset transform values.

## 7) Sci-fi liquid motion (required visual style)

### Position flow field

1. Add subtle curl-noise displacement (SOP or GLSL):
   - `offset = curlNoise(position * freq + time * speed) * motionstrength`
2. Drive `motionstrength` by smoothed `rms` or spectral flux.
3. Keep displacement subtle so data topology remains readable.

### Trail feedback stack

1. Render scene to `render1`.
2. Build TOP feedback loop:
   - `feedback1` -> `blur1` -> `displace1` (small warp) -> `level_fade` (multiply < 1 using `trailfade`) -> `composite1`
   - Composite current `render1` over processed feedback (`Add` or `Screen`).
3. This gives liquid, cinematic trails without heavy 3D geometry cost.

### Post FX

1. Add `bloom`/`glow` stage driven by `bloomstrength`.
2. Add depth-of-field (camera focus or post-process approximation).
3. Add subtle depth fog (shader or depth-graded color correction).
4. Finish with color grading and light grain.

## 8) Performance setup

- Use `decimation` slider during interaction (for example 2-10).
- Keep sphere instance polycount low.
- Keep feedback resolution lower in preview, full resolution only for export.

## 9) Export

1. Add `moviefileout1` (`Movie File Out TOP`).
2. Connect final post-FX TOP.
3. Set frame range and codec.
4. Export stills with `Window COMP` snapshot or `Movie File Out TOP` single-frame output.

## 10) Default mapping

- X = `t_seconds`
- Y = `peak_hz`
- Z = `spectral_spread_hz`
- Point size = `rms`
- Point color = `spectral_spread_khz`

## Related Docs

- project front page: `../README.md`
- preservation baseline: `../docs/PRESERVATION.md`
- installation: `../docs/INSTALL.md`
- analyzer details: `../python/README.md`
