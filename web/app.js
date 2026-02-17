import { createRuntime } from "./app/runtime.js";
import { createAnalysisModule } from "./app/analysis-module.js";
import { createRenderModule } from "./app/render-module.js";
import { createWorkflowModule } from "./app/workflow-module.js";

const runtime = createRuntime();
Object.assign(runtime, createAnalysisModule(runtime));
Object.assign(runtime, createRenderModule(runtime));
Object.assign(runtime, createWorkflowModule(runtime));

const {
  canvas,
  fileInput,
  player,
  playToggle,
  pauseAudioBtn,
  resetViewBtn,
  drawerToggle,
  tabButtons,
  mappingMode,
  cameraPreset,
  dragMode,
  knnNeighbors,
  visualPreset,
  customPresetSelect,
  customPresetName,
  saveCustomPresetBtn,
  deleteCustomPresetBtn,
  colorMetric,
  paletteFile,
  clearPaletteBtn,
  captureStillBtn,
  exportAnalysisJsonBtn,
  export3dObjBtn,
  startRecordingBtn,
  stopRecordingBtn,
  helpBtn,
  supportVladBtn,
  focusToggleBtn,
  helpModal,
  closeHelpBtn,
  voiceCacheDir,
  voiceCacheClearBtn,
  voiceCacheStatus,
  offsetX,
  offsetY,
  offsetZ,
  valOffsetX,
  valOffsetY,
  valOffsetZ,
  metricRms,
  metricCentroid,
  metricSpread,
  state,
  clamp,
  setSessionLabel,
  resizeCanvas,
  createStars,
  refreshCustomPresetOptions,
  recolorFrames,
  loadCustomPaletteFromFile,
  clearCustomPalette,
  applyCustomPresetByName,
  saveCurrentSettingsAsCustomPreset,
  deleteCustomPresetByName,
  rebuildKnnEdges,
  remapFrames,
  loadAnalysisJson,
  loadAndAnalyzeFile,
  handlePlaybackToggle,
  pausePlayback,
  setActiveTab,
  exportAnalysisJson,
  exportVisible3dObj,
  captureStill,
  startRecording,
  stopRecording,
  toggleDrawer,
  resetCamera,
  updateCameraMotion,
  drawBackground,
  updateTrail,
  drawTrail,
  drawMap,
  updateLegend,
  getFrameIndexAtTime,
} = runtime;

function updateSupportButtonTheme(nowSec) {
  if (!supportVladBtn) {
    return;
  }

  let r = 96;
  let g = 140;
  let b = 240;
  let glowAlpha = 0.24;

  if (state.map && state.map.frames.length > 0) {
    const activeIndex = player.src ? getFrameIndexAtTime(player.currentTime) : -1;
    const frame = activeIndex >= 0 ? state.map.frames[activeIndex] : state.map.frames[0];

    if (frame?.color) {
      r = frame.color.r;
      g = frame.color.g;
      b = frame.color.b;
      glowAlpha = clamp(0.2 + (frame.rmsN || 0) * 0.38, 0.2, 0.56);
    }
  }

  const hiR = Math.round(clamp(r * 0.86 + 48, 0, 255));
  const hiG = Math.round(clamp(g * 0.86 + 48, 0, 255));
  const hiB = Math.round(clamp(b * 0.86 + 48, 0, 255));
  const intensity = 0.86;

  supportVladBtn.style.background = `linear-gradient(115deg, rgba(${hiR}, ${hiG}, ${hiB}, ${(0.24 * intensity).toFixed(3)}), rgba(${r}, ${g}, ${b}, ${(0.2 * intensity).toFixed(3)}))`;
  supportVladBtn.style.borderColor = `rgba(${hiR}, ${hiG}, ${hiB}, ${(0.62 * intensity).toFixed(3)})`;
  supportVladBtn.style.color = "#ecf6ff";
  supportVladBtn.style.boxShadow = `0 0 14px rgba(${r}, ${g}, ${b}, ${(glowAlpha * intensity).toFixed(3)})`;
}

function bindEvents() {
  const VOICE_CACHE_DIR_KEY = "sgm.voice-cache-dir";

  function refreshVoiceCacheStatus() {
    if (!voiceCacheStatus) {
      return;
    }
    const path = (window.localStorage.getItem(VOICE_CACHE_DIR_KEY) || "").trim();
    voiceCacheStatus.textContent = path
      ? `Cache output: ${path}`
      : "Cache output: default temp folder";
  }

  let focusMode = false;
  const setFocusMode = (enabled) => {
    focusMode = Boolean(enabled);
    document.body.classList.toggle("focus-mode", focusMode);

    if (focusToggleBtn) {
      focusToggleBtn.textContent = focusMode ? "S" : "H";
      focusToggleBtn.setAttribute("aria-label", focusMode ? "Show UI overlays" : "Hide UI overlays");
      focusToggleBtn.setAttribute("title", focusMode ? "Show UI overlays" : "Hide UI overlays");
    }

    if (focusMode && helpModal) {
      helpModal.setAttribute("aria-hidden", "true");
    }
  };

    function updateOffsetLabel(input, label) {
        label.textContent = input.value;
    }

  if (voiceCacheDir) {
    const savedCacheDir = window.localStorage.getItem(VOICE_CACHE_DIR_KEY) || "";
    voiceCacheDir.value = savedCacheDir;
    voiceCacheDir.addEventListener("input", () => {
      const path = (voiceCacheDir.value || "").trim();
      if (path) {
        window.localStorage.setItem(VOICE_CACHE_DIR_KEY, path);
      } else {
        window.localStorage.removeItem(VOICE_CACHE_DIR_KEY);
      }
      refreshVoiceCacheStatus();
    });
  }

  if (voiceCacheClearBtn) {
    voiceCacheClearBtn.addEventListener("click", () => {
      window.localStorage.removeItem(VOICE_CACHE_DIR_KEY);
      if (voiceCacheDir) {
        voiceCacheDir.value = "";
      }
      setSessionLabel("Voice Cache: Default Temp", false);
      refreshVoiceCacheStatus();
    });
  }

  for (const modeRadio of document.querySelectorAll('input[name="analysis-mode"]')) {
    modeRadio.addEventListener("change", refreshVoiceCacheStatus);
  }

  refreshVoiceCacheStatus();

  if (focusToggleBtn) {
    focusToggleBtn.addEventListener("click", () => setFocusMode(!focusMode));
  }

  setFocusMode(false);

    if (offsetX && valOffsetX) {
        offsetX.addEventListener("input", () => updateOffsetLabel(offsetX, valOffsetX));
        offsetY.addEventListener("input", () => updateOffsetLabel(offsetY, valOffsetY));
        offsetZ.addEventListener("input", () => updateOffsetLabel(offsetZ, valOffsetZ));
    }

    if (helpBtn && helpModal) {
        helpBtn.addEventListener("click", () => {
            helpModal.setAttribute("aria-hidden", "false");
        });
        
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener("click", () => {
                helpModal.setAttribute("aria-hidden", "true");
            });
        }

        window.addEventListener("click", (e) => {
            if (e.target === helpModal) {
                helpModal.setAttribute("aria-hidden", "true");
            }
        });
    }

  fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }
    if (file.name.toLowerCase().endsWith(".json")) {
      loadAnalysisJson(file);
    } else {
      loadAndAnalyzeFile(file);
    }
  });

  // Enable drag and drop across the window
  window.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  window.addEventListener("drop", (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    if (file.name.toLowerCase().endsWith(".json")) {
      loadAnalysisJson(file);
    } else if (file.type.startsWith("audio/")) {
      loadAndAnalyzeFile(file);
    }
  });

  playToggle.addEventListener("click", handlePlaybackToggle);
  pauseAudioBtn.addEventListener("click", pausePlayback);
  resetViewBtn.addEventListener("click", resetCamera);

  player.addEventListener("loadedmetadata", () => {
    if (!state.map) {
      return;
    }
    const duration = Number(player.duration);
    if (Number.isFinite(duration) && duration > 0) {
      state.map.duration = duration;
    }
  });

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
    state.activationPulse.clear();
  });

  drawerToggle.addEventListener("click", () => toggleDrawer());

  for (const button of tabButtons) {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tabTarget || "session");
    });
  }

  mappingMode.addEventListener("change", remapFrames);
  cameraPreset.addEventListener("change", () => {
    state.autoYaw = 0;
  });
  knnNeighbors.addEventListener("change", rebuildKnnEdges);

  visualPreset.addEventListener("change", recolorFrames);
  colorMetric?.addEventListener("change", recolorFrames);

  paletteFile?.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    loadCustomPaletteFromFile(file);
  });

  clearPaletteBtn?.addEventListener("click", clearCustomPalette);

  customPresetSelect?.addEventListener("change", () => {
    applyCustomPresetByName(customPresetSelect.value);
  });

  saveCustomPresetBtn?.addEventListener("click", saveCurrentSettingsAsCustomPreset);

  deleteCustomPresetBtn?.addEventListener("click", () => {
    const candidate = customPresetSelect?.value || customPresetName?.value || "";
    deleteCustomPresetByName(candidate);
  });

  captureStillBtn.addEventListener("click", captureStill);
  exportAnalysisJsonBtn?.addEventListener("click", exportAnalysisJson);
  export3dObjBtn?.addEventListener("click", exportVisible3dObj);
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

    if (dragMode?.value === "pan") {
      state.userPanX = clamp(state.userPanX + dx / Math.max(320, state.width), -0.35, 0.35);
      state.userPanY = clamp(state.userPanY + dy / Math.max(220, state.height), -0.35, 0.35);
      return;
    }

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
  updateSupportButtonTheme(nowSec);
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
  refreshCustomPresetOptions();
  bindEvents();
  setActiveTab(state.activeTab);
  updateLegend();
  toggleDrawer(false);
  drawBackground(0);
  requestAnimationFrame(tick);
}

init();
