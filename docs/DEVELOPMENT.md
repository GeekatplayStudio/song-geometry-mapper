# Development Workflow

## Local Workflow

1. Run tests before and after changes.
2. Keep analyzer outputs deterministic for identical inputs/settings.
3. Update docs when changing CLI args, output schema, or visual controls.
4. For web visual/math helpers, add or update `node:test` coverage.

## Test Commands

Docker:

```bash
docker compose run --rm test
```

Local `.venv`:

```bash
cd python
source .venv/bin/activate
python -m pytest -q
```

Web visual utility tests:

```bash
node --test web/tests/*.test.js
```

## Analyzer CLI Reference

```bash
python -m bgm.analyze \
  --input /path/to/audio.wav \
  --outdir ../out \
  --sr 48000 \
  --n_fft 2048 \
  --hop 512 \
  --smooth 5 \
  --norm zscore \
  --edge-mode knn \
  --knn-n 4
```

## Code Standards

- Keep execution local-only (no cloud services).
- Prefer explicit, reproducible defaults.
- Add concise comments where algorithmic intent is not obvious.
- Avoid hidden side effects in data transforms.

## Release Checklist

- All tests passing
- README and docs updated
- TouchDesigner instructions synced with current schema
- Example output regenerated (if schema changed)
