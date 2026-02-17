# Algorithms and Calculations

This document explains how Song Geometry Mapper computes descriptors, builds geometry, and renders connections.

## 1. Frame Extraction

### Browser classic analyzer (`web/app.js`)

Constants:
- `FFT_SIZE = 1024`
- `HOP_SIZE = 512`
- Hann window applied before FFT

Per frame calculations (`computeFrameDescriptor`):

1. RMS
- `rms = sqrt(sum(sample^2) / FFT_SIZE)`

2. Zero-crossing rate
- count sign changes in frame and divide by `FFT_SIZE`

3. STFT magnitude bins
- custom in-place FFT over windowed frame
- use positive frequency half-spectrum

4. Spectral centroid
- `centroid = sum(mag_k * hz_k) / sum(mag_k)`

5. Spectral spread (standard deviation around centroid)
- `spread = sqrt(sum(mag_k * (hz_k - centroid)^2) / sum(mag_k))`

6. Spectral rolloff
- frequency where cumulative magnitude reaches 85% of total magnitude

7. Spectral flatness
- geometric_mean(magnitude) / arithmetic_mean(magnitude)

8. Peak frequency
- frequency bin index of max magnitude

9. Spectral flux
- positive frame-to-frame magnitude increase average

All descriptors are collected in frame objects and later min-max normalized.

### Python analyzer (`python/bgm/features.py`)

Uses `librosa` for descriptor extraction on mono signal at target sample rate.

Computed arrays:
- `rms`
- `spectral_centroid_hz`
- `spectral_spread_hz` (bandwidth)
- `spectral_rolloff_hz`
- `spectral_flatness`
- `zcr`
- `peak_hz` (argmax over magnitude bins)
- `t_seconds` from frame index

Derived:
- `spectral_spread_khz = spectral_spread_hz / 1000`

## 2. Smoothing and Normalization (Python)

Implemented in `python/bgm/normalize.py`.

Smoothing:
- centered moving average (`window = --smooth`) on numeric columns
- excludes `t_seconds` and `frame_index`

Normalization modes (`--norm`):
- `none`: no transform
- `minmax`: `(x - min) / (max - min)`
- `zscore`: `(x - mean) / std`

## 3. Feature Vectors for Geometry

Browser maps each frame to this vector:

`[centroidN, spreadN, rolloffN, flatnessN, zcrN, rmsN, peakN, fluxN]`

Where each `*N` is min-max normalized over the track.

## 4. Node Mapping Equations

Implemented in `applyMapping` (`web/app.js`).

Let `tNorm = i / (N-1)`.

### Time Spine mode

- `x = (tNorm - 0.5) * 36`
- `y = (peakN - 0.5) * 20 + (centroidN - 0.5) * 7`
- `z = (spreadN - 0.5) * 18 + (1 - flatnessN - 0.5) * 8 + (rmsN - 0.5) * 9 + (fluxN - 0.5) * 5`

### Manifold mode (PCA)

1. PCA on feature vectors to 3 components
2. normalize each component to `[0,1]`
3. map to scene:
- `x = (xN - 0.5) * 28 + (tNorm - 0.5) * 1.8`
- `y = (yN - 0.5) * 20 + (rmsN - 0.5) * 3`
- `z = (zN - 0.5) * 21 + (fluxN - 0.5) * 4`

## 5. Node Appearance

Per frame defaults:
- `size = 0.82 + (rmsN ^ 0.68) * 4.8`
- `color = palette interpolation by selected metric`

Color metrics:
- `spreadKhz` or `peakHz/1000`

## 6. Edge Construction

### Browser temporal edges

`buildTemporalEdges`:
- edge `(i-1, i)` with weight `0.36`

### Browser similarity edges

`buildKnnEdges`:
- local candidate search window over sampled frame indices
- weighted descriptor distance:

`d = sqrt(1.25*d0^2 + 1.05*d1^2 + 1.0*d2^2 + 0.55*d3^2 + 0.55*d4^2 + 0.82*d5^2 + 0.93*d6^2 + 1.1*d7^2)`

where:
- `d0 = centroidN diff`
- `d1 = spreadN diff`
- `d2 = rolloffN diff`
- `d3 = flatnessN diff`
- `d4 = zcrN diff`
- `d5 = rmsN diff`
- `d6 = peakN diff`
- `d7 = fluxN diff`

Edge weight:
- `weight = exp(-d * 3.6)`

### Python edges

Temporal (`build_temporal_edges`):
- `(i, i+1)`, weight `1.0`

kNN (`build_knn_edges`):
- cKDTree nearest neighbors on selected descriptor columns
- stored weight is distance

## 7. Playback-Synchronized Wave Connections

In wave style (`drawEdges`):
- phase uses playback time: `player.currentTime`
- wave endpoint pinning uses envelope `sin(pi*t)`
- local wave frequency from edge descriptors blended with active playback frame frequency factor
- this keeps wave motion aligned with currently playing song region

## 8. Camera Projection and Visibility

`projectPoint3D` uses:
- user offsets/zoom/pan/yaw/pitch
- optional motion perturbation under active playback
- perspective divide with dynamic camera distance
- depth culling (`depth < 0.9` is clipped)

## 9. Export Behavior

### Analysis JSON export
- includes frames, ranges, controls, and edge sets
- can be re-imported by web UI

### OBJ export (visible graph)
- exports current visible nodes and visible edges
- respects decimation, edge mode, visibility toggles, frustum culling
- writes `v` (vertices), `p` (points), `l` (lines)

## 10. Voice / Deep Mode Notes

Voice mode in UI assumes external feature generation.

Supported input JSON formats:
1. raw feature frame array
2. exported analysis object with `frames`

Import behavior:
- if `x,y,z` exist in frames: keep those positions
- otherwise: recompute positions with current mapping mode
- if edge arrays are included and valid: use them
- otherwise: rebuild temporal and kNN edges
