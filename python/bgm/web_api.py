from __future__ import annotations

import argparse
import cgi
import csv
import json
import os
import shutil
import tempfile
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
    return parser.parse_args(argv)


def normalize_separate_target(value: str | None) -> str | None:
    text = (value or "").strip().lower()
    if text in SEPARATION_NONE_VALUES:
        return None
    return text


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

    payload: dict[str, Any] = {
        "frames": features,
        "track": {
            "name": source_name,
            "durationSec": float(metadata.get("audio", {}).get("duration_seconds", 0)),
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
        if path != "/api/voice/analyze":
            self.send_json(404, {"ok": False, "error": "Not found"})
            return

        tmp_dir: Path | None = None
        try:
            content_type = self.headers.get("Content-Type", "")
            main_type, _ = cgi.parse_header(content_type)
            if main_type != "multipart/form-data":
                self.send_json(400, {"ok": False, "error": "Expected multipart/form-data payload"})
                return

            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": content_type,
                },
            )

            if "audio" not in form:
                self.send_json(400, {"ok": False, "error": "Missing 'audio' file field"})
                return

            audio_field = form["audio"]
            if isinstance(audio_field, list):
                audio_field = audio_field[0]

            audio_bytes = audio_field.file.read()
            if not audio_bytes:
                self.send_json(400, {"ok": False, "error": "Audio payload is empty"})
                return

            filename = Path(audio_field.filename or "uploaded-audio.wav").name

            server_config = getattr(self.server, "config", {})
            separate = normalize_separate_target(form.getfirst("separate", server_config.get("separate_default")))

            sr = int(form.getfirst("sr", str(server_config.get("sr", 48_000))))
            n_fft = int(form.getfirst("n_fft", str(server_config.get("n_fft", 2_048))))
            hop = int(form.getfirst("hop", str(server_config.get("hop", 512))))
            smooth = int(form.getfirst("smooth", str(server_config.get("smooth", 1))))
            norm = str(form.getfirst("norm", server_config.get("norm", "none")))
            edge_mode = str(form.getfirst("edge_mode", server_config.get("edge_mode", "none")))
            knn_n = int(form.getfirst("knn_n", str(server_config.get("knn_n", 4))))

            tmp_dir = Path(tempfile.mkdtemp(prefix="sgm-voice-api-"))
            input_path = tmp_dir / filename
            out_dir = tmp_dir / "out"
            input_path.write_bytes(audio_bytes)

            outputs = analyze_to_outputs(
                input_path=input_path,
                outdir=out_dir,
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

            self.send_json(200, {"ok": True, "payload": payload})
        except Exception as error:  # noqa: BLE001
            self.send_json(500, {"ok": False, "error": str(error)})
        finally:
            if tmp_dir:
                shutil.rmtree(tmp_dir, ignore_errors=True)


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
