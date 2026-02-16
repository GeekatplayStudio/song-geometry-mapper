import numpy as np
import pandas as pd
import pytest

from bgm.schema import REQUIRED_COLUMNS, validate_feature_schema


def make_valid_frame_table(rows: int = 8) -> pd.DataFrame:
    t_seconds = np.linspace(0.0, 1.4, rows)
    return pd.DataFrame(
        {
            "t_seconds": t_seconds,
            "rms": np.linspace(0.1, 0.5, rows),
            "spectral_centroid_hz": np.linspace(300.0, 1_200.0, rows),
            "spectral_spread_hz": np.linspace(50.0, 400.0, rows),
            "spectral_spread_khz": np.linspace(0.05, 0.4, rows),
            "spectral_rolloff_hz": np.linspace(500.0, 3_000.0, rows),
            "spectral_flatness": np.linspace(0.01, 0.2, rows),
            "zcr": np.linspace(0.05, 0.3, rows),
            "peak_hz": np.linspace(280.0, 1_400.0, rows),
            "frame_index": np.arange(rows),
        }
    )


def test_schema_contains_required_columns() -> None:
    table = make_valid_frame_table()
    assert set(REQUIRED_COLUMNS).issubset(table.columns)
    validate_feature_schema(table)


def test_schema_rejects_missing_columns() -> None:
    table = make_valid_frame_table().drop(columns=["peak_hz"])
    with pytest.raises(ValueError, match="Missing required columns"):
        validate_feature_schema(table)


def test_schema_rejects_nans() -> None:
    table = make_valid_frame_table()
    table.loc[2, "rms"] = np.nan
    with pytest.raises(ValueError, match="contains NaN"):
        validate_feature_schema(table)


def test_schema_rejects_non_monotonic_time() -> None:
    table = make_valid_frame_table()
    table.loc[4, "t_seconds"] = table.loc[3, "t_seconds"] - 0.1
    with pytest.raises(ValueError, match="t_seconds"):
        validate_feature_schema(table)


def test_schema_rejects_non_monotonic_frame_index() -> None:
    table = make_valid_frame_table()
    table.loc[5, "frame_index"] = table.loc[4, "frame_index"] - 1
    with pytest.raises(ValueError, match="frame_index"):
        validate_feature_schema(table)
