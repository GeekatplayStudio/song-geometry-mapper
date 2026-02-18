from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import shutil
import tempfile
from email.parser import BytesParser
from email.policy import default as email_policy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from .analyze import analyze_to_outputs

SEPARATION_NONE_VALUES = {"", "none", "off", "false", "0", "no", "full", "full-mix", "mix"}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Song Geometry Mapper local voice analyzer API")
    parser.add_argument("--host", default=os.environ.get("BGM_WEB_API_HOST", "127.0.0.1"))
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("BGM_WEB_API_PORT", "5180")),
    )
    parser.add_argument("--sr", type=int, default=48_000)
    parser.add_argument("--n_fft", type=int, default=2_048)
    parser.add_argument("--hop", type=int, default=512)
    parser.add_argument("--smooth", type=int, default=1)
    parser.add_argument("--norm", default="none")
    parser.add_argument("--edge-mode", default="none")
    parser.add_argument("--knn-n", type=int, default=4)
    parser.add_argument("--separate-default", default="vocals")
    parser.add_argument(
        "--cache-dir",
        default=os.environ.get("BGM_WEB_API_CACHE_DIR", str(Path(tempfile.gettempdir()) / "sgm-voice-api-cache")),
    )
    return parser.parse_args(argv)


def normalize_separate_target(value: str | None) -> str | None:
    text = (value or "").strip().lower()
    if text in SEPARATION_NONE_VALUES:
        return None
    return text


def parse_boolish(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        if value == 1:
            return True
        if value == 0:
            return False
    if isinstance(value, str):
        text = value.strip().lower()
        if text in {"1", "true", "yes", "y", "on"}:
            return True
        if text in {"0", "false", "no", "n", "off"}:
            return False
    return None


def ai_generated_from_metadata(metadata: dict[str, Any]) -> tuple[bool | None, str]:
    checks: list[tuple[Any, str]] = [
        (metadata.get("ai_generated"), "metadata.ai_generated"),
        ((metadata.get("source") or {}).get("ai_generated"), "metadata.source.ai_generated"),
        ((metadata.get("provenance") or {}).get("ai_generated"), "metadata.provenance.ai_generated"),
        ((metadata.get("settings") or {}).get("ai_generated"), "metadata.settings.ai_generated"),
    ]
    for candidate, source in checks:
        parsed = parse_boolish(candidate)
        if parsed is not None:
            return parsed, source
    return None, "not-provided"


def build_payload_from_outputs(
    features: list[dict[str, Any]],
    metadata: dict[str, Any],
    edges_path: Path | None,
    source_name: str,
    separated_stem: str | None,
) -> dict[str, Any]:
    columns = metadata.get("columns", {})
    spread_range = columns.get("spectral_spread_khz", {"min": 0, "max": 2.5})
    peak_range_hz = columns.get("peak_hz", {"min": 0, "max": 8_000})
    ai_generated, ai_source = ai_generated_from_metadata(metadata)

    payload: dict[str, Any] = {
        "frames": features,
        "track": {
            "name": source_name,
            "durationSec": float(metadata.get("audio", {}).get("duration_seconds", 0)),
        },
        "analysis": {
            "sampleRateHz": metadata.get("audio", {}).get("sample_rate"),
            "fftSize": metadata.get("audio", {}).get("n_fft"),
            "hopSize": metadata.get("audio", {}).get("hop_length"),
            "aiGenerated": ai_generated,
            "aiDetectionSource": ai_source,
        },
        "ranges": {
            "spreadRangeKhz": {
                "min": float(spread_range.get("min", 0)),
                "max": float(spread_range.get("max", 2.5)),
            },
            "peakRangeKhz": {
                "min": float(peak_range_hz.get("min", 0)) / 1000.0,
                "max": float(peak_range_hz.get("max", 8_000)) / 1000.0,
            },
        },
        "source": {
            "engine": "python-bgm",
            "mode": "voice-api",
            "separated_stem": separated_stem,
            "ai_generated": ai_generated,
            "ai_detection_source": ai_source,
        },
    }

    if edges_path and edges_path.exists():
        temporal: list[dict[str, Any]] = []
        knn: list[dict[str, Any]] = []
        with edges_path.open("r", encoding="utf-8", newline="") as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                try:
                    edge = {
                        "a": int(row.get("i", "-1")),
                        "b": int(row.get("j", "-1")),
                        "weight": float(row.get("weight", "0")),
                    }
                except ValueError:
                    continue

                mode = (row.get("mode") or "").strip().lower()
                if mode == "temporal":
                    temporal.append(edge)
                elif mode == "knn":
                    knn.append(edge)

        if temporal or knn:
            payload["edges"] = {"temporal": temporal, "knn": knn}

    return payload


def sanitize_song_basename(filename: str) -> str:
    stem = Path(filename or "uploaded-audio").stem
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-._")
    return normalized or "uploaded-audio"


def resolve_cache_root(cache_dir_raw: str, server_config: dict[str, Any]) -> Path:
    configured = str(server_config.get("cache_dir") or tempfile.gettempdir())
    root = Path(cache_dir_raw or configured).expanduser()
    root.mkdir(parents=True, exist_ok=True)
    return root


def clear_cached_analysis(cache_root: Path, song_name: str | None = None) -> dict[str, Any]:
    removed_files = 0
    removed_dirs = 0
    targets: list[Path] = []

    def is_analysis_output_dir(path: Path) -> bool:
        if not path.is_dir():
            return False
        required = ("features.json", "features.csv", "metadata.json")
        return all((path / filename).is_file() for filename in required)

    if song_name:
        safe = sanitize_song_basename(song_name)
        targets.append(cache_root / f"{safe}.analysis.json")
        targets.append(cache_root / safe)
    else:
        targets.extend(cache_root.glob("*.analysis.json"))
        for analysis_json in cache_root.glob("*.analysis.json"):
            stem = analysis_json.stem
            if stem.endswith(".analysis"):
                song_stem = stem[: -len(".analysis")]
                if song_stem:
                    targets.append(cache_root / song_stem)

    # Also remove orphan analysis output folders that still contain analyzer artifacts
    # but may no longer have a matching *.analysis.json index file.
    for child in cache_root.iterdir():
        if not child.is_dir():
            continue
        if song_name:
            safe = sanitize_song_basename(song_name)
            if child.name != safe:
                continue
        if is_analysis_output_dir(child):
            targets.append(child)

    seen: set[str] = set()
    unique_targets: list[Path] = []
    for path in targets:
        key = str(path.resolve()) if path.exists() else str(path)
        if key in seen:
            continue
        seen.add(key)
        unique_targets.append(path)

    for path in unique_targets:
        try:
            if path.is_file():
                path.unlink(missing_ok=True)
                removed_files += 1
            elif path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
                removed_dirs += 1
        except OSError:
            continue

    return {
        "cache_root": str(cache_root),
        "mode": "single-song" if song_name else "all",
        "song": sanitize_song_basename(song_name) if song_name else None,
        "removed_files": removed_files,
        "removed_dirs": removed_dirs,
    }


def compute_audio_hash(audio_bytes: bytes) -> str:
    return hashlib.sha256(audio_bytes).hexdigest()


def analysis_signature(
    *,
    sr: int,
    n_fft: int,
    hop: int,
    smooth: int,
    norm: str,
    edge_mode: str,
    knn_n: int,
    separate: str | None,
) -> dict[str, Any]:
    return {
        "sr": int(sr),
        "n_fft": int(n_fft),
        "hop": int(hop),
        "smooth": int(smooth),
        "norm": str(norm),
        "edge_mode": str(edge_mode),
        "knn_n": int(knn_n),
        "separate": separate,
    }


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp_path.replace(path)


def load_cached_payload(
    analysis_json_path: Path,
    *,
    audio_hash: str,
    signature: dict[str, Any],
) -> dict[str, Any] | None:
    if not analysis_json_path.exists():
        return None

    try:
        doc = json.loads(analysis_json_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    if not isinstance(doc, dict):
        return None

    cache_meta = doc.get("_cache")
    payload = doc.get("payload")
    if not isinstance(cache_meta, dict) or not isinstance(payload, dict):
        return None

    if cache_meta.get("audio_sha256") != audio_hash:
        return None

    if cache_meta.get("analysis") != signature:
        return None

    return payload


def parse_multipart_form_data(content_type: str, body: bytes) -> tuple[dict[str, str], dict[str, tuple[str, bytes]]]:
    header_blob = f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8", errors="replace")
    message = BytesParser(policy=email_policy).parsebytes(header_blob + body)

    if not message.is_multipart():
        raise ValueError("Expected multipart/form-data payload")

    fields: dict[str, str] = {}
    files: dict[str, tuple[str, bytes]] = {}

    for part in message.iter_parts():
        name = part.get_param("name", header="content-disposition")
        if not name:
            continue

        filename = part.get_filename()
        data = part.get_payload(decode=True) or b""

        if filename:
            files[name] = (Path(filename).name, data)
            continue

        charset = part.get_content_charset() or "utf-8"
        fields[name] = data.decode(charset, errors="replace")

    return fields, files


class VoiceApiServer(ThreadingHTTPServer):
    def __init__(self, server_address: tuple[str, int], handler_cls: type[BaseHTTPRequestHandler], config: dict[str, Any]):
        super().__init__(server_address, handler_cls)
        self.config = config


class VoiceApiHandler(BaseHTTPRequestHandler):
    server_version = "SGMVoiceAPI/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[voice-api] {self.client_address[0]} - {fmt % args}")

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        super().end_headers()

    def send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/health":
            self.send_json(200, {"ok": True, "service": "voice-analyzer"})
            return
        self.send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/voice/cache/clear":
            self.handle_cache_clear()
            return

        if path != "/api/voice/analyze":
            self.send_json(404, {"ok": False, "error": "Not found"})
            return

        tmp_dir: Path | None = None
        try:
            content_type = self.headers.get("Content-Type", "")
            if not content_type.lower().startswith("multipart/form-data"):
                self.send_json(400, {"ok": False, "error": "Expected multipart/form-data payload"})
                return

            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0:
                self.send_json(400, {"ok": False, "error": "Empty request body"})
                return

            body = self.rfile.read(content_length)
            form_fields, form_files = parse_multipart_form_data(content_type, body)

            if "audio" not in form_files:
                self.send_json(400, {"ok": False, "error": "Missing 'audio' file field"})
                return

            filename, audio_bytes = form_files["audio"]
            if not audio_bytes:
                self.send_json(400, {"ok": False, "error": "Audio payload is empty"})
                return

            server_config = getattr(self.server, "config", {})

            def read_field(name: str, default: Any) -> Any:
                value = form_fields.get(name)
                if value is None or value == "":
                    return default
                return value

            separate = normalize_separate_target(read_field("separate", server_config.get("separate_default")))

            sr = int(read_field("sr", server_config.get("sr", 48_000)))
            n_fft = int(read_field("n_fft", server_config.get("n_fft", 2_048)))
            hop = int(read_field("hop", server_config.get("hop", 512)))
            smooth = int(read_field("smooth", server_config.get("smooth", 1)))
            norm = str(read_field("norm", server_config.get("norm", "none")))
            edge_mode = str(read_field("edge_mode", server_config.get("edge_mode", "none")))
            knn_n = int(read_field("knn_n", server_config.get("knn_n", 4)))

            cache_dir_raw = str(read_field("cache_dir", "")).strip()
            cache_root = resolve_cache_root(cache_dir_raw, server_config)

            song_basename = sanitize_song_basename(filename)
            analysis_json_path = cache_root / f"{song_basename}.analysis.json"
            song_out_dir = cache_root / song_basename

            audio_hash = compute_audio_hash(audio_bytes)
            signature = analysis_signature(
                sr=sr,
                n_fft=n_fft,
                hop=hop,
                smooth=smooth,
                norm=norm,
                edge_mode=edge_mode,
                knn_n=knn_n,
                separate=separate,
            )

            cached_payload = load_cached_payload(
                analysis_json_path,
                audio_hash=audio_hash,
                signature=signature,
            )
            if cached_payload is not None:
                self.send_json(
                    200,
                    {
                        "ok": True,
                        "cached": True,
                        "analysis_json": str(analysis_json_path),
                        "payload": cached_payload,
                    },
                )
                return

            tmp_dir = Path(tempfile.mkdtemp(prefix="sgm-voice-api-"))
            input_path = tmp_dir / filename
            input_path.write_bytes(audio_bytes)

            outputs = analyze_to_outputs(
                input_path=input_path,
                outdir=song_out_dir,
                sr=sr,
                n_fft=n_fft,
                hop=hop,
                smooth=smooth,
                norm=norm,
                edge_mode=edge_mode,
                knn_n=knn_n,
                separate=separate,
            )

            features = json.loads(Path(outputs["features_json"]).read_text(encoding="utf-8"))
            metadata = json.loads(Path(outputs["metadata_json"]).read_text(encoding="utf-8"))
            payload = build_payload_from_outputs(
                features=features,
                metadata=metadata,
                edges_path=Path(outputs["edges_csv"]) if outputs["edges_csv"] else None,
                source_name=filename,
                separated_stem=separate,
            )

            write_json_atomic(
                analysis_json_path,
                {
                    "ok": True,
                    "payload": payload,
                    "_cache": {
                        "audio_sha256": audio_hash,
                        "analysis": signature,
                        "analysis_json": str(analysis_json_path),
                        "out_dir": str(song_out_dir),
                    },
                },
            )

            self.send_json(
                200,
                {
                    "ok": True,
                    "cached": False,
                    "analysis_json": str(analysis_json_path),
                    "payload": payload,
                },
            )
        except Exception as error:  # noqa: BLE001
            self.send_json(500, {"ok": False, "error": str(error)})
        finally:
            if tmp_dir:
                shutil.rmtree(tmp_dir, ignore_errors=True)

    def handle_cache_clear(self) -> None:
        server_config = getattr(self.server, "config", {})
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        body = b""
        if content_length > 0:
            body = self.rfile.read(content_length)

        payload: dict[str, Any] = {}
        if body:
            content_type = (self.headers.get("Content-Type", "") or "").split(";")[0].strip().lower()
            if content_type != "application/json":
                self.send_json(400, {"ok": False, "error": "Expected application/json payload"})
                return
            try:
                parsed = json.loads(body.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                self.send_json(400, {"ok": False, "error": "Invalid JSON payload"})
                return
            if not isinstance(parsed, dict):
                self.send_json(400, {"ok": False, "error": "JSON payload must be an object"})
                return
            payload = parsed

        cache_dir_raw = str(payload.get("cache_dir") or "").strip()
        song_name_raw = str(payload.get("song_name") or "").strip()
        clear_mode = str(payload.get("mode") or "").strip().lower()
        clear_all = clear_mode in {"all", "full"} or parse_boolish(payload.get("all")) is True

        cache_root = resolve_cache_root(cache_dir_raw, server_config)
        result = clear_cached_analysis(cache_root, None if clear_all else song_name_raw or None)

        self.send_json(200, {"ok": True, **result})


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    config = {
        "sr": args.sr,
        "n_fft": args.n_fft,
        "hop": args.hop,
        "smooth": args.smooth,
        "norm": args.norm,
        "edge_mode": args.edge_mode,
        "knn_n": args.knn_n,
        "separate_default": args.separate_default,
        "cache_dir": args.cache_dir,
    }
    server = VoiceApiServer((args.host, args.port), VoiceApiHandler, config=config)
    print(f"[voice-api] listening on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
