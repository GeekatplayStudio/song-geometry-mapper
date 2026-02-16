import numpy as np
import pandas as pd
import pytest

from bgm.features import build_knn_edges, build_temporal_edges


def test_temporal_edges_connect_consecutive_frames() -> None:
    edges = build_temporal_edges([0, 1, 2, 3])
    assert list(edges["i"]) == [0, 1, 2]
    assert list(edges["j"]) == [1, 2, 3]
    assert (edges["mode"] == "temporal").all()


def test_temporal_edges_empty_when_single_frame() -> None:
    edges = build_temporal_edges([10])
    assert edges.empty


def test_knn_edges_produces_unique_undirected_pairs() -> None:
    df = pd.DataFrame(
        {
            "spectral_centroid_hz": [0.0, 1.0, 2.0, 3.0],
            "spectral_spread_hz": [0.0, 1.0, 2.0, 3.0],
            "spectral_flatness": [0.1, 0.1, 0.2, 0.2],
            "rms": [0.3, 0.4, 0.5, 0.6],
            "peak_hz": [100.0, 200.0, 300.0, 400.0],
        }
    )

    edges = build_knn_edges(df, neighbors=2)
    assert set(edges.columns) == {"i", "j", "weight", "mode"}
    assert (edges["i"] < edges["j"]).all()
    assert (edges["mode"] == "knn").all()
    assert len(edges) >= 3
    assert not edges.duplicated(subset=["i", "j"]).any()


def test_knn_edges_rejects_missing_columns() -> None:
    df = pd.DataFrame({"spectral_centroid_hz": [1.0, 2.0]})
    with pytest.raises(ValueError, match="missing columns"):
        build_knn_edges(df, neighbors=1)


def test_knn_edges_rejects_non_positive_neighbors() -> None:
    df = pd.DataFrame(
        {
            "spectral_centroid_hz": [0.0, 1.0],
            "spectral_spread_hz": [0.0, 1.0],
            "spectral_flatness": [0.2, 0.3],
            "rms": [0.4, 0.5],
            "peak_hz": [100.0, 150.0],
        }
    )
    with pytest.raises(ValueError, match="neighbors must be >= 1"):
        build_knn_edges(df, neighbors=0)


def test_knn_edges_empty_for_single_point() -> None:
    df = pd.DataFrame(
        {
            "spectral_centroid_hz": [0.0],
            "spectral_spread_hz": [0.0],
            "spectral_flatness": [0.2],
            "rms": [0.4],
            "peak_hz": [100.0],
        }
    )
    edges = build_knn_edges(df, neighbors=1)
    assert edges.empty
