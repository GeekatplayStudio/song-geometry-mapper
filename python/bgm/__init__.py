"""Song Geometry Mapper audio analysis package."""

from .features import extract_frame_features
from .schema import REQUIRED_COLUMNS, validate_feature_schema

__all__ = ["extract_frame_features", "REQUIRED_COLUMNS", "validate_feature_schema"]
__version__ = "0.1.0"
