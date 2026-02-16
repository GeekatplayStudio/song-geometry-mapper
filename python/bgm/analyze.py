from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .features import (
    KNN_DEFAULT_COLUMNS,
    build_knn_edges,
    build_temporal_edges,
    extract_frame_features,
)
from .normalize import NORMALIZATION_CHOICES, normalize_dataframe, smooth_dataframe
from .schema import column_min_max, validate_feature_schema

EXCLUDED_COLUMNS = ("t_seconds", "frame_index")
EDGE_MODES = ("none", "temporal", "knn")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Song Geometry Mapper analyzer")
    parser.add_argument("--input", required=True, help="Input audio path (wav/mp3/flac)")
    parser.add_argument("--outdir", required=True, help="Output directory")
    parser.add_argument("--sr", type=int, default=48_000, help="Target sample rate")
    parser.add_argument("--n_fft", type=int, default=2_048, help="STFT FFT window size")
    parser.add_argument("--hop", type=int, default=512, help="Hop size")
    parser.add_argument(
        "--smooth",
        type=int,
        default=1,
        help="Moving average window size (1 disables smoothing)",
    )
    parser.add_argument(
        "--norm",
        default="none",
        choices=sorted(NORMALIZATION_CHOICES),
        help="Normalization method",
    )
    parser.add_argument(
        "--edge-mode",
        default="none",
        choices=EDGE_MODES,
        help="Optional edge export mode",
    )
    parser.add_argument(
        "--knn-n",
        type=int,
        default=3,
        help="Neighbor count for --edge-mode knn",
    )
    parser.add_argument(
        "--knn-columns",
        nargs="+",
        default=list(KNN_DEFAULT_COLUMNS),
        help="Descriptor columns used for kNN edges",
    )
    return parser.parse_args(argv)


def analyze_to_outputs(
    input_path: str | Path,
    outdir: str | Path,
    *,
    sr: int = 48_000,
    n_fft: int = 2_048,
    hop: int = 512,
    smooth: int = 1,
    norm: str = "none",
    edge_mode: str = "none",
    knn_n: int = 3,
    knn_columns: list[str] | None = None,
) -> dict[str, Path | None]:
    output_dir = Path(outdir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Keep the pipeline deterministic for repeatable visual geometry exports.
    features, audio_meta = extract_frame_features(input_path, sr=sr, n_fft=n_fft, hop_length=hop)
    features = smooth_dataframe(features, window=smooth, exclude=EXCLUDED_COLUMNS)
    features = normalize_dataframe(features, method=norm, exclude=EXCLUDED_COLUMNS)
    validate_feature_schema(features)

    feature_csv_path = output_dir / "features.csv"
    feature_json_path = output_dir / "features.json"
    metadata_path = output_dir / "metadata.json"

    features.to_csv(feature_csv_path, index=False)
    feature_json_path.write_text(
        json.dumps(features.to_dict(orient="records"), indent=2),
        encoding="utf-8",
    )

    edges_path: Path | None = None
    edges_count = 0
    if edge_mode == "temporal":
        # Temporal edges preserve sequence flow in downstream visualizers.
        edges = build_temporal_edges(features["frame_index"].astype(int).to_numpy())
        edges_path = output_dir / "edges.csv"
        edges.to_csv(edges_path, index=False)
        edges_count = int(len(edges))
    elif edge_mode == "knn":
        # kNN edges emphasize descriptor similarity rather than strict time order.
        chosen_columns = knn_columns or list(KNN_DEFAULT_COLUMNS)
        edges = build_knn_edges(features, columns=chosen_columns, neighbors=knn_n)
        edges_path = output_dir / "edges.csv"
        edges.to_csv(edges_path, index=False)
        edges_count = int(len(edges))

    # Metadata is used by render layers (web/TouchDesigner) for ranges and settings recall.
    metadata: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input_audio": str(Path(input_path).resolve()),
        "settings": {
            "sr": sr,
            "n_fft": n_fft,
            "hop": hop,
            "smooth": smooth,
            "norm": norm,
            "exclude_from_norm_and_smooth": list(EXCLUDED_COLUMNS),
            "edge_mode": edge_mode,
            "knn_n": knn_n,
            "knn_columns": knn_columns or list(KNN_DEFAULT_COLUMNS),
        },
        "audio": audio_meta,
        "columns": column_min_max(features),
        "rows": int(len(features)),
        "edges": {
            "count": edges_count,
            "path": str(edges_path) if edges_path else None,
        },
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return {
        "features_csv": feature_csv_path,
        "features_json": feature_json_path,
        "metadata_json": metadata_path,
        "edges_csv": edges_path,
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    output_paths = analyze_to_outputs(
        args.input,
        args.outdir,
        sr=args.sr,
        n_fft=args.n_fft,
        hop=args.hop,
        smooth=args.smooth,
        norm=args.norm,
        edge_mode=args.edge_mode,
        knn_n=args.knn_n,
        knn_columns=args.knn_columns,
    )
    print(f"Wrote {output_paths['features_csv']}")
    print(f"Wrote {output_paths['features_json']}")
    print(f"Wrote {output_paths['metadata_json']}")
    if args.edge_mode != "none":
        print(f"Wrote {output_paths['edges_csv']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
