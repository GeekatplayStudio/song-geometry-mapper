const canvas = document.getElementById("preview-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const stage = document.querySelector(".stage");

const fileInput = document.getElementById("audio-file");
const fileLabel = document.getElementById("file-label");
const player = document.getElementById("player");
const playToggle = document.getElementById("play-toggle");
const resetViewBtn = document.getElementById("reset-view");
const sessionState = document.getElementById("session-state");
const trackCaption = document.getElementById("track-caption");

const drawerToggle = document.getElementById("drawer-toggle");
const controlDrawer = document.getElementById("control-drawer");

const mappingMode = document.getElementById("mapping-mode");
const cameraPreset = document.getElementById("camera-preset");
const edgeMode = document.getElementById("edge-mode");
const displayDecimation = document.getElementById("display-decimation");
const knnNeighbors = document.getElementById("knn-neighbors");
const freqSpread = document.getElementById("freq-spread");

const pointScale = document.getElementById("point-scale");
const edgeOpacity = document.getElementById("edge-opacity");
const trailPersistence = document.getElementById("trail-persistence");
const flowDensity = document.getElementById("flow-density");
const motionStrength = document.getElementById("motion-strength");
const rotationSpeed = document.getElementById("rotation-speed");

const visualPreset = document.getElementById("visual-preset");
const bloomStrength = document.getElementById("bloom-strength");
const fogStrength = document.getElementById("fog-strength");
const exportMode = document.getElementById("export-mode");

const showConnections = document.getElementById("show-connections");
const showLabels = document.getElementById("show-labels");
const cinemaMode = document.getElementById("cinema-mode");

const captureStillBtn = document.getElementById("capture-still");
const startRecordingBtn = document.getElementById("start-recording");
const stopRecordingBtn = document.getElementById("stop-recording");

const legendBar = document.getElementById("legend-bar");
const legendScale = document.getElementById("legend-scale");

const metricRms = document.getElementById("metric-rms");
const metricCentroid = document.getElementById("metric-centroid");
const metricSpread = document.getElementById("metric-spread");

const FFT_SIZE = 1024;
const HOP_SIZE = 512;
const MAX_POINTS = 2600;
const MAX_KNN_EDGES = 9500;
const EPSILON = 1e-12;

const PRESET_PALETTES = {
  cinematic: [
    [0.0, [80, 98, 255]],
    [0.18, [182, 82, 232]],
    [0.39, [237, 72, 81]],
    [0.57, [255, 142, 68]],
    [0.77, [82, 229, 107]],
    [1.0, [255, 241, 100]],
  ],
  scientific: [
    [0.0, [77, 120, 208]],
    [0.2, [116, 105, 215]],
    [0.4, [238, 95, 92]],
    [0.58, [248, 154, 80]],
    [0.8, [113, 211, 106]],
    [1.0, [232, 235, 126]],
  ],
  neon: [
    [0.0, [62, 75, 255]],
    [0.18, [210, 58, 255]],
    [0.38, [255, 72, 108]],
    [0.58, [255, 163, 45]],
    [0.78, [76, 244, 114]],
    [1.0, [255, 255, 120]],
  ],
};

const PRESET_BACKGROUND = {
  cinematic: { core: [9, 16, 26], aura: [28, 44, 72], vignette: [2, 4, 8] },
  scientific: { core: [9, 13, 20], aura: [22, 38, 60], vignette: [2, 3, 6] },
  neon: { core: [11, 12, 26], aura: [44, 25, 73], vignette: [3, 3, 9] },
};

const windowHann = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i += 1) {
  windowHann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
}

const state = {
  width: canvas.width,
  height: canvas.height,
  dpr: Math.max(1, window.devicePixelRatio || 1),
  decodeContext: null,
  currentAudioUrl: null,
  map: null,
  trail: [],
  lastTrailIndex: -1,
  lastPlaybackTime: 0,
  lastFrameAt: performance.now(),
  userYaw: 0,
  userPitch: 0.2,
  userZoom: 1,
  autoYaw: 0,
  autoPitch: 0,
  autoZoom: 1,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  drawerOpen: true,
  stars: [],
  recording: null,
};

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(a, b, t) {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

function rgba(color, alpha) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

function setSessionLabel(text, live = false) {
  sessionState.textContent = text;
  sessionState.classList.toggle("chip-live", live);
}

function formatTrackCaption(filename) {
  const base = filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  const maxLen = 56;
  const shortName = base.length > maxLen ? `${base.slice(0, maxLen - 1)}...` : base;
  return `Geometry of ${shortName || "your song"}`;
}

function normalizeValue(range, value) {
  const span = Math.max(EPSILON, range.max - range.min);
  return clamp((value - range.min) / span, 0, 1);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  state.dpr = Math.max(window.devicePixelRatio || 1, 1);
  state.width = Math.max(640, Math.floor(rect.width * state.dpr));
  state.height = Math.max(360, Math.floor(rect.height * state.dpr));
  canvas.width = state.width;
  canvas.height = state.height;
}

function createStars() {
  const count = 220;
  const stars = [];

  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      depth: Math.random() * 0.85 + 0.15,
      radius: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.45 + 0.18,
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  state.stars = stars;
}

function getDecodeContext() {
  if (!state.decodeContext) {
    state.decodeContext = new AudioContext();
  }
  return state.decodeContext;
}

function fftInPlace(re, im) {
  const n = re.length;
  let j = 0;

  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;

    if (i < j) {
      const tr = re[i];
      const ti = im[i];
      re[i] = re[j];
      im[i] = im[j];
      re[j] = tr;
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wlenCos = Math.cos(angle);
    const wlenSin = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wCos = 1;
      let wSin = 0;

      for (let k = 0; k < len / 2; k += 1) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * wCos - im[i + k + len / 2] * wSin;
        const vIm = re[i + k + len / 2] * wSin + im[i + k + len / 2] * wCos;

        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;

        const nextCos = wCos * wlenCos - wSin * wlenSin;
        const nextSin = wCos * wlenSin + wSin * wlenCos;
        wCos = nextCos;
        wSin = nextSin;
      }
    }
  }
}

function extractMonoSamples(buffer) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const mono = new Float32Array(length);

  for (let channel = 0; channel < channels; channel += 1) {
    const src = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += src[i] / channels;
    }
  }

  return mono;
}

function computeFrameDescriptor(mono, start, sampleRate, re, im, mag, prevMag) {
  let rmsSum = 0;
  let zcr = 0;
  let prev = 0;

  for (let i = 0; i < FFT_SIZE; i += 1) {
    const sample = mono[start + i] || 0;
    const windowed = sample * windowHann[i];
    re[i] = windowed;
    im[i] = 0;

    rmsSum += sample * sample;
    if (i > 0 && (sample >= 0) !== (prev >= 0)) {
      zcr += 1;
    }
    prev = sample;
  }

  fftInPlace(re, im);

  const half = FFT_SIZE >> 1;
  const binHz = sampleRate / FFT_SIZE;
  let sumMag = 0;
  let weighted = 0;
  let arithmetic = 0;
  let logSum = 0;
  let peakMag = -1;
  let peakHz = 0;
  let flux = 0;

  for (let k = 1; k < half; k += 1) {
    const magnitude = Math.hypot(re[k], im[k]);
    const hz = k * binHz;
    const safe = magnitude + EPSILON;

    mag[k] = magnitude;
    sumMag += magnitude;
    weighted += magnitude * hz;
    arithmetic += safe;
    logSum += Math.log(safe);

    const rising = magnitude - prevMag[k];
    flux += rising > 0 ? rising : 0;
    prevMag[k] = magnitude;

    if (magnitude > peakMag) {
      peakMag = magnitude;
      peakHz = hz;
    }
  }

  const centroid = sumMag > 0 ? weighted / sumMag : 0;

  let spreadNumerator = 0;
  let cumulative = 0;
  let rolloffHz = 0;
  const rolloffTarget = sumMag * 0.85;

  for (let k = 1; k < half; k += 1) {
    const hz = k * binHz;
    const magnitude = mag[k];
    const diff = hz - centroid;
    spreadNumerator += magnitude * diff * diff;

    cumulative += magnitude;
    if (rolloffHz === 0 && cumulative >= rolloffTarget) {
      rolloffHz = hz;
    }
  }

  const spread = sumMag > 0 ? Math.sqrt(spreadNumerator / sumMag) : 0;
  const flatness = Math.exp(logSum / Math.max(1, half - 1)) / (arithmetic / Math.max(1, half - 1));

  return {
    t: start / sampleRate,
    rms: Math.sqrt(rmsSum / FFT_SIZE),
    centroidHz: centroid,
    spreadHz: spread,
    spreadKhz: spread / 1000,
    rolloffHz,
    flatness,
    zcr: zcr / FFT_SIZE,
    peakHz,
    flux: flux / Math.max(1, half - 1),
  };
}

function computeRanges(descriptors) {
  const keys = ["rms", "centroidHz", "spreadHz", "rolloffHz", "flatness", "zcr", "peakHz", "flux"];
  const ranges = {};

  for (const key of keys) {
    ranges[key] = { min: Infinity, max: -Infinity };
  }

  for (const descriptor of descriptors) {
    for (const key of keys) {
      if (descriptor[key] < ranges[key].min) {
        ranges[key].min = descriptor[key];
      }
      if (descriptor[key] > ranges[key].max) {
        ranges[key].max = descriptor[key];
      }
    }
  }

  return ranges;
}

function buildTemporalEdges(frames) {
  const edges = [];
  for (let i = 1; i < frames.length; i += 1) {
    edges.push({ a: i - 1, b: i, weight: 0.36 });
  }
  return edges;
}

function descriptorDistance(a, b) {
  const d0 = a.centroidN - b.centroidN;
  const d1 = a.spreadN - b.spreadN;
  const d2 = a.rolloffN - b.rolloffN;
  const d3 = a.flatnessN - b.flatnessN;
  const d4 = a.zcrN - b.zcrN;
  const d5 = a.rmsN - b.rmsN;
  const d6 = a.peakN - b.peakN;
  const d7 = a.fluxN - b.fluxN;

  return Math.sqrt(
    d0 * d0 * 1.25 +
      d1 * d1 * 1.05 +
      d2 * d2 * 1.0 +
      d3 * d3 * 0.55 +
      d4 * d4 * 0.55 +
      d5 * d5 * 0.82 +
      d6 * d6 * 0.93 +
      d7 * d7 * 1.1,
  );
}

function buildKnnEdges(frames, neighbors) {
  const n = frames.length;
  if (n < 3) {
    return [];
  }

  const k = Math.max(1, Math.min(10, neighbors));
  const step = n > 1600 ? Math.ceil(n / 1600) : 1;
  const indices = [];

  for (let i = 0; i < n; i += step) {
    indices.push(i);
  }
  if (indices[indices.length - 1] !== n - 1) {
    indices.push(n - 1);
  }

  const edges = [];
  const unique = new Set();
  const localSpan = Math.max(24, Math.floor(indices.length * 0.22));

  for (let idx = 0; idx < indices.length; idx += 1) {
    const i = indices[idx];
    const base = frames[i];
    const nearest = [];

    const localStart = Math.max(0, idx - localSpan);
    const localEnd = Math.min(indices.length, idx + localSpan + 1);

    for (let cursor = localStart; cursor < localEnd; cursor += 1) {
      if (cursor === idx) {
        continue;
      }

      const j = indices[cursor];
      const dist = descriptorDistance(base, frames[j]);

      if (nearest.length < k) {
        nearest.push({ j, dist });
        nearest.sort((a, b) => a.dist - b.dist);
      } else if (dist < nearest[nearest.length - 1].dist) {
        nearest[nearest.length - 1] = { j, dist };
        nearest.sort((a, b) => a.dist - b.dist);
      }
    }

    for (const entry of nearest) {
      const a = Math.min(i, entry.j);
      const b = Math.max(i, entry.j);
      const key = `${a}-${b}`;
      if (unique.has(key)) {
        continue;
      }
      unique.add(key);

      edges.push({
        a,
        b,
        weight: Math.exp(-entry.dist * 3.6),
      });

      if (edges.length >= MAX_KNN_EDGES) {
        return edges;
      }
    }
  }

  return edges;
}

function powerIteration(matrix, dimension, prevVectors) {
  const v = new Float64Array(dimension);
  for (let i = 0; i < dimension; i += 1) {
    v[i] = Math.sin((i + 1) * 0.61) + Math.cos((i + 2) * 0.37);
  }

  for (let iter = 0; iter < 34; iter += 1) {
    const next = new Float64Array(dimension);

    for (let row = 0; row < dimension; row += 1) {
      let sum = 0;
      for (let col = 0; col < dimension; col += 1) {
        sum += matrix[row][col] * v[col];
      }
      next[row] = sum;
    }

    for (const prev of prevVectors) {
      let dot = 0;
      for (let i = 0; i < dimension; i += 1) {
        dot += next[i] * prev[i];
      }
      for (let i = 0; i < dimension; i += 1) {
        next[i] -= dot * prev[i];
      }
    }

    let length = 0;
    for (let i = 0; i < dimension; i += 1) {
      length += next[i] * next[i];
    }
    length = Math.sqrt(length) || 1;

    for (let i = 0; i < dimension; i += 1) {
      v[i] = next[i] / length;
    }
  }

  let eigenValue = 0;
  for (let row = 0; row < dimension; row += 1) {
    let mv = 0;
    for (let col = 0; col < dimension; col += 1) {
      mv += matrix[row][col] * v[col];
    }
    eigenValue += v[row] * mv;
  }

  return { vector: v, eigenValue };
}

function pcaProject(vectors, components = 3) {
  const n = vectors.length;
  if (n === 0) {
    return [];
  }

  const dimension = vectors[0].length;
  const means = new Float64Array(dimension);

  for (const vector of vectors) {
    for (let i = 0; i < dimension; i += 1) {
      means[i] += vector[i];
    }
  }
  for (let i = 0; i < dimension; i += 1) {
    means[i] /= Math.max(1, n);
  }

  const centered = vectors.map((vector) => {
    const arr = new Float64Array(dimension);
    for (let i = 0; i < dimension; i += 1) {
      arr[i] = vector[i] - means[i];
    }
    return arr;
  });

  const covariance = Array.from({ length: dimension }, () => new Float64Array(dimension));

  for (const row of centered) {
    for (let i = 0; i < dimension; i += 1) {
      for (let j = i; j < dimension; j += 1) {
        covariance[i][j] += row[i] * row[j];
      }
    }
  }

  const denom = Math.max(1, n - 1);
  for (let i = 0; i < dimension; i += 1) {
    for (let j = i; j < dimension; j += 1) {
      covariance[i][j] /= denom;
      covariance[j][i] = covariance[i][j];
    }
  }

  const basis = [];
  const matrix = covariance.map((row) => Float64Array.from(row));

  for (let comp = 0; comp < components; comp += 1) {
    const { vector, eigenValue } = powerIteration(matrix, dimension, basis);
    basis.push(vector);

    for (let i = 0; i < dimension; i += 1) {
      for (let j = 0; j < dimension; j += 1) {
        matrix[i][j] -= eigenValue * vector[i] * vector[j];
      }
    }
  }

  return centered.map((row) =>
    basis.map((vector) => {
      let dot = 0;
      for (let i = 0; i < dimension; i += 1) {
        dot += row[i] * vector[i];
      }
      return dot;
    }),
  );
}

function applyMapping(frames, mode) {
  if (!frames || frames.length === 0) {
    return;
  }

  const total = Math.max(1, frames.length - 1);

  if (mode === "manifold") {
    // PCA layout reveals descriptor clusters/bridges across the whole track.
    const vectors = frames.map((frame) => frame.featureVec);
    const coords = pcaProject(vectors, 3);

    const ranges = [
      { min: Infinity, max: -Infinity },
      { min: Infinity, max: -Infinity },
      { min: Infinity, max: -Infinity },
    ];

    for (const c of coords) {
      for (let i = 0; i < 3; i += 1) {
        if (c[i] < ranges[i].min) {
          ranges[i].min = c[i];
        }
        if (c[i] > ranges[i].max) {
          ranges[i].max = c[i];
        }
      }
    }

    for (let i = 0; i < frames.length; i += 1) {
      const frame = frames[i];
      const c = coords[i];
      const tNorm = i / total;

      const xN = normalizeValue(ranges[0], c[0]);
      const yN = normalizeValue(ranges[1], c[1]);
      const zN = normalizeValue(ranges[2], c[2]);

      frame.x = (xN - 0.5) * 28 + (tNorm - 0.5) * 1.8;
      frame.y = (yN - 0.5) * 20 + (frame.rmsN - 0.5) * 3;
      frame.z = (zN - 0.5) * 21 + (frame.fluxN - 0.5) * 4;
    }
    return;
  }

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const tNorm = i / total;

    frame.x = (tNorm - 0.5) * 36;
    frame.y = (frame.peakN - 0.5) * 20 + (frame.centroidN - 0.5) * 7;
    frame.z =
      (frame.spreadN - 0.5) * 18 +
      (1 - frame.flatnessN - 0.5) * 8 +
      (frame.rmsN - 0.5) * 9 +
      (frame.fluxN - 0.5) * 5;
  }
}

function activePalette() {
  const selected = visualPreset.value;
  return PRESET_PALETTES[selected] || PRESET_PALETTES.cinematic;
}

function colorFromSpread(spreadKhz, range) {
  const stops = activePalette();
  const min = range?.min ?? 0;
  const max = range?.max ?? 2.5;
  const t = clamp((spreadKhz - min) / Math.max(EPSILON, max - min), 0, 1);

  let left = stops[0];
  let right = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      left = stops[i];
      right = stops[i + 1];
      break;
    }
  }

  const local = (t - left[0]) / Math.max(EPSILON, right[0] - left[0]);
  return {
    r: Math.round(lerp(left[1][0], right[1][0], local)),
    g: Math.round(lerp(left[1][1], right[1][1], local)),
    b: Math.round(lerp(left[1][2], right[1][2], local)),
  };
}

function legendGradientFromStops(stops) {
  const entries = [...stops]
    .sort((a, b) => b[0] - a[0])
    .map(([position, rgb]) => {
      const pct = clamp((1 - position) * 100, 0, 100).toFixed(1);
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}) ${pct}%`;
    });

  return `linear-gradient(180deg, ${entries.join(", ")})`;
}

function updateLegend() {
  const stops = activePalette();
  legendBar.style.background = legendGradientFromStops(stops);

  const labels = Array.from(legendScale.querySelectorAll("span"));
  if (!state.map || labels.length === 0) {
    return;
  }

  const min = state.map.spreadRangeKhz.min;
  const max = state.map.spreadRangeKhz.max;
  const last = Math.max(1, labels.length - 1);

  for (let i = 0; i < labels.length; i += 1) {
    const value = lerp(max, min, i / last);
    labels[i].textContent = value.toFixed(2);
  }
}

function recolorFrames() {
  if (!state.map) {
    updateLegend();
    return;
  }

  for (const frame of state.map.frames) {
    frame.color = colorFromSpread(frame.spreadKhz, state.map.spreadRangeKhz);
  }

  updateLegend();
}

async function nextAnimationFrame() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

async function analyzeSong(audioBuffer, progressCb) {
  const mono = extractMonoSamples(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;

  const totalFrames = Math.max(1, Math.floor((mono.length - FFT_SIZE) / HOP_SIZE) + 1);
  const stride = Math.max(1, Math.ceil(totalFrames / MAX_POINTS));

  const descriptors = [];
  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  const mag = new Float64Array(FFT_SIZE >> 1);
  const prevMag = new Float64Array(FFT_SIZE >> 1);

  let processed = 0;
  for (let frame = 0; frame < totalFrames; frame += stride) {
    const start = frame * HOP_SIZE;
    descriptors.push(computeFrameDescriptor(mono, start, sampleRate, re, im, mag, prevMag));
    processed += 1;

    if (processed % 28 === 0) {
      progressCb(frame / totalFrames);
      await nextAnimationFrame();
    }
  }
  progressCb(1);

  const ranges = computeRanges(descriptors);
  const frames = [];

  for (let i = 0; i < descriptors.length; i += 1) {
    const d = descriptors[i];

    const rmsN = normalizeValue(ranges.rms, d.rms);
    const centroidN = normalizeValue(ranges.centroidHz, d.centroidHz);
    const spreadN = normalizeValue(ranges.spreadHz, d.spreadHz);
    const rolloffN = normalizeValue(ranges.rolloffHz, d.rolloffHz);
    const flatnessN = normalizeValue(ranges.flatness, d.flatness);
    const zcrN = normalizeValue(ranges.zcr, d.zcr);
    const peakN = normalizeValue(ranges.peakHz, d.peakHz);
    const fluxN = normalizeValue(ranges.flux, d.flux);

    frames.push({
      id: i,
      t: d.t,
      rms: d.rms,
      rmsN,
      centroidHz: d.centroidHz,
      centroidN,
      spreadHz: d.spreadHz,
      spreadKhz: d.spreadKhz,
      spreadN,
      rolloffHz: d.rolloffHz,
      rolloffN,
      flatness: d.flatness,
      flatnessN,
      zcr: d.zcr,
      zcrN,
      peakHz: d.peakHz,
      peakN,
      flux: d.flux,
      fluxN,
      featureVec: [centroidN, spreadN, rolloffN, flatnessN, zcrN, rmsN, peakN, fluxN],
      x: 0,
      y: 0,
      z: 0,
      size: 0.82 + Math.pow(rmsN, 0.68) * 4.8,
      color: { r: 120, g: 170, b: 255 },
      label: `${(d.peakHz / 1000).toFixed(2)}K`,
    });
  }

  applyMapping(frames, mappingMode.value);

  const spreadRangeKhz = {
    min: ranges.spreadHz.min / 1000,
    max: ranges.spreadHz.max / 1000,
  };

  const temporalEdges = buildTemporalEdges(frames);
  const knnEdges = buildKnnEdges(frames, Number(knnNeighbors.value));

  const map = {
    frames,
    duration: audioBuffer.duration,
    spreadRangeKhz,
    temporalEdges,
    knnEdges,
  };

  for (const frame of frames) {
    frame.color = colorFromSpread(frame.spreadKhz, spreadRangeKhz);
  }

  return map;
}

function getFrameIndexAtTime(currentTime) {
  if (!state.map || state.map.frames.length === 0) {
    return -1;
  }

  const duration = state.map.duration || player.duration || 1;
  const ratio = clamp(currentTime / Math.max(EPSILON, duration), 0, 1);
  return Math.min(state.map.frames.length - 1, Math.floor(ratio * (state.map.frames.length - 1)));
}

function activityForIndex(index, activeIndex, width) {
  if (activeIndex < 0) {
    return 0;
  }

  const dist = Math.abs(index - activeIndex);
  if (dist > width * 3.1) {
    return 0;
  }

  const x = dist / Math.max(1, width);
  return Math.exp(-(x * x) * 1.48);
}

function sampleFrameAt(indexFloat) {
  if (!state.map || state.map.frames.length === 0) {
    return null;
  }

  const maxIndex = state.map.frames.length - 1;
  const clamped = clamp(indexFloat, 0, maxIndex);
  const i0 = Math.floor(clamped);
  const i1 = Math.min(maxIndex, i0 + 1);
  const t = clamped - i0;

  const a = state.map.frames[i0];
  const b = state.map.frames[i1];

  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    volume: lerp(a.rmsN, b.rmsN, t),
    flux: lerp(a.fluxN, b.fluxN, t),
    color: mixColor(a.color, b.color, t),
  };
}

function rebuildKnnEdges() {
  if (!state.map) {
    return;
  }
  setSessionLabel("Linking", true);
  state.map.knnEdges = buildKnnEdges(state.map.frames, Number(knnNeighbors.value));
  setSessionLabel(player.paused ? "Ready" : "Live", !player.paused);
}

function remapFrames() {
  if (!state.map) {
    return;
  }

  applyMapping(state.map.frames, mappingMode.value);
  state.trail = [];
  state.lastTrailIndex = -1;
}

function updateTrail(dtMs) {
  if (!state.map || state.map.frames.length === 0) {
    return;
  }

  if (player.currentTime < state.lastPlaybackTime - 0.05) {
    state.trail = [];
    state.lastTrailIndex = -1;
  }
  state.lastPlaybackTime = player.currentTime;

  if (!player.paused) {
    const frameIndex = getFrameIndexAtTime(player.currentTime);
    if (frameIndex >= 0) {
      const appendNode = (idx) => {
        const frame = state.map.frames[idx];
        if (!frame) {
          return;
        }

        state.trail.push({
          index: idx,
          x: frame.x,
          y: frame.y,
          z: frame.z,
          color: frame.color,
          volume: frame.rmsN,
          flux: frame.fluxN,
          life: 1,
        });
      };

      if (state.lastTrailIndex < 0) {
        appendNode(frameIndex);
      } else if (frameIndex !== state.lastTrailIndex) {
        const step = frameIndex > state.lastTrailIndex ? 1 : -1;
        let cursor = state.lastTrailIndex + step;
        let guard = 0;
        while (cursor !== frameIndex + step && guard < 140) {
          appendNode(cursor);
          cursor += step;
          guard += 1;
        }
      }

      state.lastTrailIndex = frameIndex;

      if (state.trail.length > 760) {
        state.trail.splice(0, state.trail.length - 760);
      }
    }
  }

  const persistence = Number(trailPersistence.value);
  // Lower persistence should clear trails quickly for responsive rhythm changes.
  const decayBase = clamp((1 - persistence) * 4.3, 0.03, 0.95);

  for (const node of state.trail) {
    const decay = dtMs * 0.001 * decayBase * (1.12 - node.volume * 0.42);
    node.life -= decay;
  }

  state.trail = state.trail.filter((node) => node.life > 0.02);
}

function updateCameraMotion(nowSec, dtMs) {
  const preset = cameraPreset.value;
  const orbitSpeed = Number(rotationSpeed.value);
  const pulse = !player.paused ? 1 : 0.4;

  state.autoYaw += orbitSpeed * dtMs * 0.00034;
  state.autoPitch = 0;
  state.autoZoom = 1;

  if (preset === "orbit") {
    state.autoYaw += orbitSpeed * dtMs * 0.0002;
    state.autoPitch = Math.sin(nowSec * 0.34) * 0.08;
  } else if (preset === "pulse") {
    state.autoPitch = Math.sin(nowSec * 0.75) * 0.14;
    state.autoZoom = 1 + Math.sin(nowSec * 1.7) * 0.09 * pulse;
  } else if (preset === "dive") {
    state.autoPitch = -0.2 + Math.sin(nowSec * 0.38) * 0.36;
    state.autoZoom = 1 + Math.sin(nowSec * 0.95) * 0.12 * pulse;
  } else {
    state.autoPitch = Math.sin(nowSec * 0.26) * 0.09;
    state.autoZoom = 1 + Math.sin(nowSec * 0.48) * 0.04 * pulse;
  }
}

function projectPoint3D(x, y, z, nowSec, activity = 0) {
  const spreadScale = Number(freqSpread.value);
  const motion = Number(motionStrength.value) * 0.24;

  let px = x * spreadScale;
  let py = y;
  let pz = z * spreadScale;

  if (motion > 0 && activity > 0.001 && !player.paused) {
    const wave = activity * motion;
    px += Math.sin(nowSec * 2.1 + x * 0.35 + z * 0.15) * wave;
    py += Math.cos(nowSec * 1.65 + y * 0.32 + x * 0.1) * wave * 0.85;
    pz += Math.sin(nowSec * 1.48 + z * 0.28 + y * 0.14) * wave;
  }

  const yaw = state.userYaw + state.autoYaw;
  const pitch = clamp(state.userPitch + state.autoPitch, -1.15, 1.2);

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const xYaw = px * cosY - pz * sinY;
  const zYaw = px * sinY + pz * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const yPitch = py * cosP - zYaw * sinP;
  const zPitch = py * sinP + zYaw * cosP;

  const zoom = clamp(state.userZoom * state.autoZoom, 0.55, 2.2);
  const focal = Math.min(state.width, state.height) * 0.96;
  const cameraDistance = 24 / zoom;
  const depth = cameraDistance - zPitch;

  if (depth < 0.9) {
    return null;
  }

  const perspective = focal / depth;
  return {
    x: state.width * 0.53 + xYaw * perspective,
    y: state.height * 0.54 + yPitch * perspective,
    depth,
    perspective,
    fog: clamp((depth - 6) / 26, 0, 1),
  };
}

function drawBackground(nowSec) {
  const preset = PRESET_BACKGROUND[visualPreset.value] || PRESET_BACKGROUND.cinematic;
  const fade = clamp(1 - Number(trailPersistence.value), 0.012, 0.3);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(${preset.vignette[0]}, ${preset.vignette[1]}, ${preset.vignette[2]}, ${fade.toFixed(3)})`;
  ctx.fillRect(0, 0, state.width, state.height);

  const radial = ctx.createRadialGradient(
    state.width * 0.5,
    state.height * 0.46,
    30,
    state.width * 0.5,
    state.height * 0.5,
    Math.max(state.width, state.height) * 0.8,
  );
  radial.addColorStop(0, `rgba(${preset.aura[0]}, ${preset.aura[1]}, ${preset.aura[2]}, 0.11)`);
  radial.addColorStop(1, `rgba(${preset.core[0]}, ${preset.core[1]}, ${preset.core[2]}, 0.02)`);
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, state.width, state.height);

  const parallax = (state.userYaw + state.autoYaw) * 0.045;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const star of state.stars) {
    const twinkle = (Math.sin(nowSec * (0.9 + star.depth) + star.twinkle) + 1) * 0.5;
    const alpha = star.alpha * (0.58 + twinkle * 0.42);
    const x = ((star.x + parallax * star.depth + 2) % 1) * state.width;
    const y = star.y * state.height;
    ctx.fillStyle = `rgba(190, 214, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, star.radius * state.dpr * (0.35 + star.depth * 0.7), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTrail(nowSec) {
  if (state.trail.length < 2) {
    return;
  }

  const projected = [];
  for (const node of state.trail) {
    const p = projectPoint3D(node.x, node.y, node.z, nowSec, node.life);
    if (p) {
      projected.push({ ...p, node });
    }
  }

  if (projected.length < 2) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 1; i < projected.length; i += 1) {
    const a = projected[i - 1];
    const b = projected[i];
    const life = Math.min(a.node.life, b.node.life);
    const energy = (a.node.volume + b.node.volume + a.node.flux + b.node.flux) * 0.25;

    const alphaWide = clamp(life * (0.04 + energy * 0.6), 0.02, 0.5);
    ctx.strokeStyle = rgba(b.node.color, alphaWide.toFixed(3));
    ctx.lineWidth = 2.4 + energy * 8.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const alphaCore = clamp(life * (0.15 + energy * 0.95), 0.05, 0.88);
    ctx.strokeStyle = rgba(b.node.color, alphaCore.toFixed(3));
    ctx.lineWidth = 0.9 + energy * 3.8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  if (!player.paused) {
    const head = projected[projected.length - 1];
    if (head) {
      const radius = 16 + head.node.volume * 22;
      const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, radius);
      glow.addColorStop(0, rgba(head.node.color, 0.88));
      glow.addColorStop(1, rgba(head.node.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawFlowParticles(activeIndex, nowSec) {
  if (!state.map || player.paused || activeIndex < 2) {
    return;
  }

  const density = Number(flowDensity.value);
  const particleCount = Math.floor(14 + density * 70);
  const pathLength = Math.min(340, activeIndex);
  const speed = 0.25 + Number(motionStrength.value) * 0.42;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < particleCount; i += 1) {
    const phase = (nowSec * speed + i / particleCount) % 1;
    const idxFloat = activeIndex - phase * pathLength;
    const sample = sampleFrameAt(idxFloat);
    const ahead = sampleFrameAt(idxFloat - 1.3);
    const behind = sampleFrameAt(idxFloat + 1.3);

    if (!sample || !ahead || !behind) {
      continue;
    }

    const p = projectPoint3D(sample.x, sample.y, sample.z, nowSec, 1);
    const pA = projectPoint3D(ahead.x, ahead.y, ahead.z, nowSec, 1);
    const pB = projectPoint3D(behind.x, behind.y, behind.z, nowSec, 1);
    if (!p || !pA || !pB) {
      continue;
    }

    const dx = pA.x - pB.x;
    const dy = pA.y - pB.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    const e = clamp((sample.volume + sample.flux) * 0.5, 0, 1);
    const trailLen = 6 + e * 26;
    const alpha = clamp(0.14 + e * 0.72, 0.1, 0.92);

    ctx.strokeStyle = rgba(sample.color, alpha.toFixed(3));
    ctx.lineWidth = 0.8 + e * 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x - nx * trailLen, p.y - ny * trailLen);
    ctx.lineTo(p.x + nx * trailLen * 0.2, p.y + ny * trailLen * 0.2);
    ctx.stroke();

    ctx.fillStyle = rgba(sample.color, clamp(alpha * 1.16, 0.2, 0.98).toFixed(3));
    ctx.beginPath();
    ctx.arc(p.x, p.y, 0.9 + e * 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEdges(byIndex, activeIndex, nowSec) {
  if (!state.map || !showConnections.checked) {
    return;
  }

  const mode = edgeMode.value;
  const edgeStrength = Number(edgeOpacity.value);
  const window = 6 + Number(flowDensity.value) * 18;
  const cinemaBoost = cinemaMode.checked ? 1.15 : 0.72;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  if (mode === "temporal" || mode === "both") {
    const stride = Math.max(1, Number(displayDecimation.value));

    for (let i = 0; i < state.map.temporalEdges.length; i += stride) {
      const edge = state.map.temporalEdges[i];
      const a = byIndex.get(edge.a);
      const b = byIndex.get(edge.b);
      if (!a || !b) {
        continue;
      }

      const activity = Math.max(
        activityForIndex(edge.a, activeIndex, window),
        activityForIndex(edge.b, activeIndex, window),
      );

      const alpha = clamp((0.006 + activity * 0.34) * edgeStrength * cinemaBoost, 0.003, 0.62);
      const width = 0.35 + activity * 1.8;
      const curve = (0.08 + Number(motionStrength.value) * 0.07 + activity * 0.28) * Math.sin(nowSec * 0.8 + edge.a * 0.02);

      const cx = (a.x + b.x) * 0.5 + (b.y - a.y) * curve;
      const cy = (a.y + b.y) * 0.5 - (b.x - a.x) * curve;

      const color = activity > 0.04 ? b.frame.color : { r: 105, g: 118, b: 138 };
      ctx.strokeStyle = rgba(color, alpha.toFixed(3));
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.stroke();
    }
  }

  if (mode === "knn" || mode === "both") {
    const stride = state.map.knnEdges.length > 6200 ? 2 : 1;

    for (let i = 0; i < state.map.knnEdges.length; i += stride) {
      const edge = state.map.knnEdges[i];
      const a = byIndex.get(edge.a);
      const b = byIndex.get(edge.b);
      if (!a || !b) {
        continue;
      }

      const activity = Math.max(
        activityForIndex(edge.a, activeIndex, window * 0.86),
        activityForIndex(edge.b, activeIndex, window * 0.86),
      );

      const alpha = clamp(
        (0.005 + edge.weight * 0.07 + activity * 0.17) * edgeStrength * (cinemaMode.checked ? 1 : 0.8),
        0.003,
        0.38,
      );
      const width = 0.32 + edge.weight * 0.95 + activity * 0.78;

      ctx.strokeStyle = rgba(b.frame.color, alpha.toFixed(3));
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawLabels(projected, activeIndex) {
  if (!showLabels.checked || projected.length === 0) {
    return;
  }

  const dpr = Math.max(1, state.dpr || 1);

  const ranked = [...projected]
    .map((item) => ({
      item,
      score: item.radius * (0.7 + item.frame.rmsN * 0.7 + item.activity * 1.1),
    }))
    .sort((a, b) => b.score - a.score);

  const stableCount = Math.min(56, ranked.length);
  const activeCount = Math.min(86, ranked.length);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  for (let i = 0; i < stableCount; i += 1) {
    const item = ranked[i].item;
    if (item.radius < 0.8) {
      continue;
    }

    const alpha = clamp(0.16 + item.frame.rmsN * 0.28, 0.12, 0.45);
    const fontPx = (8 + Math.min(4, item.radius * 0.2)) * dpr;

    ctx.font = `${fontPx.toFixed(1)}px "IBM Plex Mono", "SFMono-Regular", Menlo, monospace`;
    ctx.strokeStyle = `rgba(4, 8, 14, ${(alpha * 0.9).toFixed(3)})`;
    ctx.fillStyle = rgba(item.frame.color, alpha.toFixed(3));
    ctx.lineWidth = 2.2 * dpr;

    const lx = item.x + item.radius + 3 * dpr;
    const ly = item.y - item.radius * 0.08;
    ctx.strokeText(item.frame.label, lx, ly);
    ctx.fillText(item.frame.label, lx, ly);
  }

  if (activeIndex >= 0) {
    for (let i = 0; i < activeCount; i += 1) {
      const item = ranked[i].item;
      const focus = activityForIndex(item.index, activeIndex, 8);
      if (focus < 0.26) {
        continue;
      }

      const alpha = clamp(0.45 + focus * 0.45, 0.45, 0.95);
      const fontPx = (9 + focus * 4.4) * dpr;

      ctx.font = `${fontPx.toFixed(1)}px "IBM Plex Mono", "SFMono-Regular", Menlo, monospace`;
      ctx.strokeStyle = `rgba(4, 8, 14, ${(alpha * 0.94).toFixed(3)})`;
      ctx.fillStyle = rgba(item.frame.color, alpha.toFixed(3));
      ctx.lineWidth = 2.7 * dpr;

      const lx = item.x + item.radius + 4 * dpr;
      const ly = item.y - item.radius * (0.16 + focus * 0.22);
      ctx.strokeText(item.frame.label, lx, ly);
      ctx.fillText(item.frame.label, lx, ly);
    }
  }

  ctx.restore();
}

function drawPoints(projected, activeIndex) {
  const bloom = Number(bloomStrength.value);
  const fog = Number(fogStrength.value);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  for (const item of projected) {
    const fogFactor = clamp(item.fog * fog, 0, 1);
    const darkMix = clamp(0.26 + fogFactor * 0.55, 0.26, 0.86);
    const baseColor = mixColor(item.frame.color, { r: 10, g: 14, b: 20 }, darkMix);

    const baseAlpha = clamp(0.11 + item.frame.rmsN * 0.32 - fogFactor * 0.22, 0.06, 0.54);
    const radius = Math.max(0.55, item.radius * (0.74 + item.activity * 0.18));

    ctx.fillStyle = rgba(baseColor, baseAlpha.toFixed(3));
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(8, 12, 18, ${clamp(0.35 + fogFactor * 0.36, 0.18, 0.82).toFixed(3)})`;
    ctx.lineWidth = Math.max(0.35, radius * 0.14);
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    const highlight = mixColor(item.frame.color, { r: 255, g: 255, b: 255 }, 0.22);
    ctx.fillStyle = rgba(highlight, clamp(baseAlpha * 0.6, 0.08, 0.44).toFixed(3));
    ctx.beginPath();
    ctx.arc(item.x - radius * 0.24, item.y - radius * 0.24, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (!cinemaMode.checked) {
    return;
  }

  // Glow is only applied around active playback regions to avoid constant overexposure.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const item of projected) {
    if (item.activity < 0.06) {
      continue;
    }

    const glowPower = clamp(item.activity * (0.34 + item.frame.rmsN * 0.9) * (0.58 + bloom * 0.9), 0.02, 0.92);
    const glowRadius = item.radius * (1.2 + item.activity * 3.1 + bloom * 1.4);

    const gradient = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, glowRadius);
    gradient.addColorStop(0, rgba(item.frame.color, glowPower.toFixed(3)));
    gradient.addColorStop(1, rgba(item.frame.color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(item.x, item.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const coreAlpha = clamp(glowPower * 0.78, 0.04, 0.86);
    ctx.fillStyle = rgba(item.frame.color, coreAlpha.toFixed(3));
    ctx.beginPath();
    ctx.arc(item.x, item.y, Math.max(0.8, item.radius * (0.64 + item.activity * 0.4)), 0, Math.PI * 2);
    ctx.fill();
  }

  const active = projected.find((item) => item.index === activeIndex);
  if (active) {
    ctx.strokeStyle = rgba(active.frame.color, 0.96);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(active.x, active.y, active.radius * 2.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMap(nowSec) {
  if (!state.map) {
    return;
  }

  const decimate = Math.max(1, Number(displayDecimation.value));
  const sizeScale = Number(pointScale.value);
  const activeIndex = !player.paused ? getFrameIndexAtTime(player.currentTime) : -1;
  const activityWindow = 6 + Number(flowDensity.value) * 18;

  const projected = [];
  const byIndex = new Map();

  for (let i = 0; i < state.map.frames.length; i += decimate) {
    const frame = state.map.frames[i];
    const activity = activityForIndex(i, activeIndex, activityWindow);
    const p = projectPoint3D(frame.x, frame.y, frame.z, nowSec, activity);

    if (!p) {
      continue;
    }

    const radius = clamp(frame.size * sizeScale * p.perspective * 0.09, 0.45, 22);
    const item = {
      index: i,
      frame,
      x: p.x,
      y: p.y,
      depth: p.depth,
      fog: p.fog,
      radius,
      activity,
    };

    projected.push(item);
    byIndex.set(i, item);
  }

  projected.sort((a, b) => b.depth - a.depth);

  drawEdges(byIndex, activeIndex, nowSec);
  drawPoints(projected, activeIndex);
  drawLabels(projected, activeIndex);

  drawFlowParticles(activeIndex, nowSec);

  const active = byIndex.get(activeIndex);
  if (active) {
    metricRms.textContent = active.frame.rms.toFixed(3);
    metricCentroid.textContent = `${Math.round(active.frame.centroidHz)} Hz`;
    metricSpread.textContent = `${active.frame.spreadKhz.toFixed(2)} kHz`;
  } else {
    metricRms.textContent = "0.000";
    metricCentroid.textContent = "0 Hz";
    metricSpread.textContent = "0.00 kHz";
  }
}

async function loadAndAnalyzeFile(file) {
  if (!file) {
    return;
  }

  try {
    setSessionLabel("Analyzing 0%", true);
    fileLabel.textContent = file.name;
    trackCaption.textContent = "Geometry of your song";
    playToggle.disabled = true;

    if (state.currentAudioUrl) {
      URL.revokeObjectURL(state.currentAudioUrl);
      state.currentAudioUrl = null;
    }

    const url = URL.createObjectURL(file);
    state.currentAudioUrl = url;
    player.src = url;

    const raw = await file.arrayBuffer();
    const audioContext = getDecodeContext();
    const decoded = await audioContext.decodeAudioData(raw.slice(0));

    state.map = await analyzeSong(decoded, (progress) => {
      setSessionLabel(`Analyzing ${Math.round(progress * 100)}%`, true);
    });

    trackCaption.textContent = formatTrackCaption(file.name);

    state.trail = [];
    state.lastTrailIndex = -1;
    state.lastPlaybackTime = 0;

    recolorFrames();

    playToggle.disabled = false;
    playToggle.textContent = "Play";
    setSessionLabel("Ready", false);
  } catch (error) {
    console.error(error);
    setSessionLabel("Analyze Error", false);
  }
}

function handlePlaybackToggle() {
  if (!player.src) {
    return;
  }

  if (player.paused) {
    player
      .play()
      .then(() => {
        playToggle.textContent = "Pause";
        setSessionLabel("Live", true);
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    player.pause();
    playToggle.textContent = "Play";
    setSessionLabel("Ready", false);
  }
}

function toggleDrawer(forceOpen) {
  if (typeof forceOpen === "boolean") {
    state.drawerOpen = forceOpen;
  } else {
    state.drawerOpen = !state.drawerOpen;
  }

  stage?.classList.toggle("overlays-hidden", !state.drawerOpen);
  controlDrawer.classList.toggle("is-collapsed", !state.drawerOpen);
  drawerToggle.setAttribute("aria-expanded", String(state.drawerOpen));
  drawerToggle.setAttribute("aria-label", state.drawerOpen ? "Hide overlays" : "Show overlays");
  drawerToggle.setAttribute("title", state.drawerOpen ? "Hide overlays" : "Show overlays");
  drawerToggle.textContent = state.drawerOpen ? "▾" : "▴";
}

function resetCamera() {
  state.userYaw = 0;
  state.userPitch = 0.2;
  state.userZoom = 1;
  state.autoYaw = 0;
  state.autoPitch = 0;
  state.autoZoom = 1;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function captureStill() {
  const sourceCanvas = canvas;
  const output = document.createElement("canvas");

  if (exportMode.value === "4k") {
    output.width = 3840;
    output.height = 2160;
  } else {
    output.width = sourceCanvas.width;
    output.height = sourceCanvas.height;
  }

  const outCtx = output.getContext("2d");
  outCtx.drawImage(sourceCanvas, 0, 0, output.width, output.height);
  output.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadBlob(blob, `song-geometry-${stamp}.png`);
  }, "image/png");
}

function startRecording() {
  if (state.recording) {
    return;
  }

  if (typeof MediaRecorder === "undefined") {
    console.warn("MediaRecorder not supported in this browser.");
    return;
  }

  const stream = canvas.captureStream(60);
  const mimeCandidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "video/webm";

  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType });

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.addEventListener("stop", () => {
    const blob = new Blob(chunks, { type: mimeType });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadBlob(blob, `song-geometry-${stamp}.webm`);
    state.recording = null;
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
  });

  recorder.start(250);
  state.recording = { recorder, chunks };
  startRecordingBtn.disabled = true;
  stopRecordingBtn.disabled = false;
}

function stopRecording() {
  if (!state.recording) {
    return;
  }

  state.recording.recorder.stop();
}

function bindEvents() {
  fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    loadAndAnalyzeFile(file);
  });

  playToggle.addEventListener("click", handlePlaybackToggle);
  resetViewBtn.addEventListener("click", resetCamera);

  player.addEventListener("play", () => {
    playToggle.textContent = "Pause";
    setSessionLabel("Live", true);
  });

  player.addEventListener("pause", () => {
    if (!player.ended && player.src) {
      playToggle.textContent = "Play";
      setSessionLabel("Ready", false);
    }
  });

  player.addEventListener("ended", () => {
    playToggle.textContent = "Play";
    setSessionLabel("Ready", false);
  });

  player.addEventListener("seeking", () => {
    state.trail = [];
    state.lastTrailIndex = -1;
  });

  drawerToggle.addEventListener("click", () => toggleDrawer());

  mappingMode.addEventListener("change", remapFrames);
  cameraPreset.addEventListener("change", () => {
    state.autoYaw = 0;
  });
  knnNeighbors.addEventListener("change", rebuildKnnEdges);

  visualPreset.addEventListener("change", recolorFrames);

  captureStillBtn.addEventListener("click", captureStill);
  startRecordingBtn.addEventListener("click", startRecording);
  stopRecordingBtn.addEventListener("click", stopRecording);

  canvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging) {
      return;
    }

    const dx = event.clientX - state.dragStartX;
    const dy = event.clientY - state.dragStartY;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;

    state.userYaw += dx * 0.0038;
    state.userPitch = clamp(state.userPitch + dy * 0.0024, -1.1, 1.2);
  });

  canvas.addEventListener("pointerup", (event) => {
    state.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointercancel", () => {
    state.dragging = false;
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    state.userZoom = clamp(state.userZoom + delta, 0.55, 2.4);
  });

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space") {
      return;
    }

    const tag = document.activeElement?.tagName || "";
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
      return;
    }

    event.preventDefault();
    handlePlaybackToggle();
  });
}

function tick(nowMs) {
  const dtMs = clamp(nowMs - state.lastFrameAt, 4, 50);
  state.lastFrameAt = nowMs;

  const nowSec = nowMs * 0.001;
  updateCameraMotion(nowSec, dtMs);

  drawBackground(nowSec);

  if (state.map) {
    updateTrail(dtMs);
    drawTrail(nowSec);
    drawMap(nowSec);
  } else {
    metricRms.textContent = "0.000";
    metricCentroid.textContent = "0 Hz";
    metricSpread.textContent = "0.00 kHz";
  }

  if (player.src) {
    setSessionLabel(player.paused ? "Ready" : "Live", !player.paused);
  } else {
    setSessionLabel("Idle", false);
  }

  requestAnimationFrame(tick);
}

function init() {
  resizeCanvas();
  createStars();
  bindEvents();
  updateLegend();
  toggleDrawer(true);
  drawBackground(0);
  requestAnimationFrame(tick);
}

init();
