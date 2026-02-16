import numpy as np
import pandas as pd
import pytest

from bgm.normalize import normalize_dataframe, smooth_dataframe


@pytest.fixture
def sample_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "t_seconds": [0.0, 0.1, 0.2, 0.3],
            "frame_index": [0, 1, 2, 3],
            "rms": [1.0, 2.0, 3.0, 4.0],
            "spectral_flatness": [2.0, 2.0, 2.0, 2.0],
        }
    )


def test_normalize_none_returns_identical_values(sample_df: pd.DataFrame) -> None:
    result = normalize_dataframe(sample_df, method="none")
    pd.testing.assert_frame_equal(result, sample_df)


def test_normalize_minmax_scales_numeric_columns(sample_df: pd.DataFrame) -> None:
    result = normalize_dataframe(sample_df, method="minmax")
    assert np.isclose(result["rms"].iloc[0], 0.0)
    assert np.isclose(result["rms"].iloc[-1], 1.0)
    assert (result["spectral_flatness"] == 0.0).all()
    assert result["t_seconds"].equals(sample_df["t_seconds"])
    assert result["frame_index"].equals(sample_df["frame_index"])


def test_normalize_zscore_has_zero_mean_for_variable_columns(sample_df: pd.DataFrame) -> None:
    result = normalize_dataframe(sample_df, method="zscore")
    assert np.isclose(float(result["rms"].mean()), 0.0, atol=1e-12)
    assert np.isclose(float(result["rms"].std(ddof=0)), 1.0, atol=1e-12)
    assert (result["spectral_flatness"] == 0.0).all()


def test_normalize_invalid_method_raises(sample_df: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="Unsupported normalization method"):
        normalize_dataframe(sample_df, method="bad")


def test_smoothing_window_one_keeps_data(sample_df: pd.DataFrame) -> None:
    result = smooth_dataframe(sample_df, window=1)
    pd.testing.assert_frame_equal(result, sample_df)


def test_smoothing_applies_centered_moving_average(sample_df: pd.DataFrame) -> None:
    result = smooth_dataframe(sample_df, window=3)
    expected_rms = pd.Series([1.5, 2.0, 3.0, 3.5])
    assert np.allclose(result["rms"], expected_rms)
    assert result["t_seconds"].equals(sample_df["t_seconds"])
    assert result["frame_index"].equals(sample_df["frame_index"])
