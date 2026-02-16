import json
from pathlib import Path

import pandas as pd

from bgm.analyze import analyze_to_outputs
from bgm.schema import REQUIRED_COLUMNS


def _non_index_columns() -> list[str]:
    return [column for column in REQUIRED_COLUMNS if column not in {"t_seconds", "frame_index"}]


def test_temporal_edges_match_frame_count(chirp_audio_path: Path, tmp_path: Path) -> None:
    outdir = tmp_path / "out_temporal"
    outputs = analyze_to_outputs(chirp_audio_path, outdir, edge_mode="temporal", norm="none")

    features = pd.read_csv(outputs["features_csv"])
    edges = pd.read_csv(outputs["edges_csv"])

    assert len(edges) == len(features) - 1
    assert list(edges.columns) == ["i", "j", "weight", "mode"]
    assert (edges["i"] + 1 == edges["j"]).all()
    assert (edges["mode"] == "temporal").all()


def test_knn_edges_written_and_reported(chirp_audio_path: Path, tmp_path: Path) -> None:
    outdir = tmp_path / "out_knn"
    outputs = analyze_to_outputs(chirp_audio_path, outdir, edge_mode="knn", knn_n=2, norm="none")

    edges = pd.read_csv(outputs["edges_csv"])
    metadata = json.loads(outputs["metadata_json"].read_text(encoding="utf-8"))

    assert len(edges) > 0
    assert (edges["mode"] == "knn").all()
    assert metadata["edges"]["count"] == len(edges)
    assert metadata["edges"]["path"] is not None


def test_minmax_normalization_skips_time_and_frame_index(chirp_audio_path: Path, tmp_path: Path) -> None:
    outdir = tmp_path / "out_norm"
    outputs = analyze_to_outputs(chirp_audio_path, outdir, norm="minmax", smooth=1)

    features = pd.read_csv(outputs["features_csv"])
    for column in _non_index_columns():
        assert features[column].min() >= -1e-9
        assert features[column].max() <= 1.0 + 1e-9

    assert features["t_seconds"].iloc[-1] > 1.0
    assert features["frame_index"].iloc[-1] > 1


def test_metadata_column_ranges_include_required_columns(chirp_audio_path: Path, tmp_path: Path) -> None:
    outdir = tmp_path / "out_metadata"
    outputs = analyze_to_outputs(chirp_audio_path, outdir, norm="none")
    metadata = json.loads(outputs["metadata_json"].read_text(encoding="utf-8"))

    ranges = metadata["columns"]
    for column in REQUIRED_COLUMNS:
        assert column in ranges
        assert set(ranges[column].keys()) == {"min", "max"}
        assert ranges[column]["max"] >= ranges[column]["min"]


def test_analyze_is_deterministic_for_same_input_settings(chirp_audio_path: Path, tmp_path: Path) -> None:
    out_a = tmp_path / "out_a"
    out_b = tmp_path / "out_b"

    first = analyze_to_outputs(chirp_audio_path, out_a, norm="zscore", smooth=5, edge_mode="knn", knn_n=3)
    second = analyze_to_outputs(chirp_audio_path, out_b, norm="zscore", smooth=5, edge_mode="knn", knn_n=3)

    first_features = pd.read_csv(first["features_csv"])
    second_features = pd.read_csv(second["features_csv"])
    first_edges = pd.read_csv(first["edges_csv"])
    second_edges = pd.read_csv(second["edges_csv"])

    pd.testing.assert_frame_equal(first_features, second_features, check_exact=False, rtol=1e-12, atol=1e-12)
    pd.testing.assert_frame_equal(first_edges, second_edges, check_exact=False, rtol=1e-12, atol=1e-12)
