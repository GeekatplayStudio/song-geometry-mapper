from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from scipy.io import wavfile
from scipy.signal import chirp


def write_chirp_wav(path: Path, sr: int = 48_000, duration_seconds: float = 1.25) -> Path:
    t = np.linspace(0.0, duration_seconds, int(sr * duration_seconds), endpoint=False)
    waveform = 0.5 * chirp(t, f0=300.0, f1=3_500.0, t1=duration_seconds, method="linear")
    wavfile.write(path, sr, waveform.astype(np.float32))
    return path


@pytest.fixture
def chirp_audio_path(tmp_path: Path) -> Path:
    return write_chirp_wav(tmp_path / "chirp.wav")
