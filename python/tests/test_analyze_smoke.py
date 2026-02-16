import json
from pathlib import Path

import pandas as pd

from bgm.analyze import analyze_to_outputs
from bgm.schema import REQUIRED_COLUMNS


def test_analyze_smoke(chirp_audio_path: Path, tmp_path: Path) -> None:
    outdir = tmp_path / "out"
    outputs = analyze_to_outputs(
        chirp_audio_path,
        outdir,
        sr=48_000,
        n_fft=2_048,
        hop=512,
        smooth=3,
        norm="none",
        edge_mode="temporal",
    )

    assert outputs["features_csv"] and outputs["features_csv"].exists()
    assert outputs["features_json"] and outputs["features_json"].exists()
    assert outputs["metadata_json"] and outputs["metadata_json"].exists()
    assert outputs["edges_csv"] and outputs["edges_csv"].exists()

    features = pd.read_csv(outputs["features_csv"])
    assert set(REQUIRED_COLUMNS).issubset(features.columns)
    assert not features[REQUIRED_COLUMNS].isna().to_numpy().any()

    metadata = json.loads(outputs["metadata_json"].read_text(encoding="utf-8"))
    assert metadata["settings"]["sr"] == 48_000
    assert metadata["audio"]["num_frames"] == len(features)
