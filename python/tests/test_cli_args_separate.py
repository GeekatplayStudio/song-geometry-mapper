import pytest
from bgm.analyze import parse_args, HAS_DEMUCS


def test_separate_arg_parsing() -> None:
    if not HAS_DEMUCS:
        # If demucs is not installed, --separate should fail or not be present
        with pytest.raises(SystemExit):
             parse_args(["--input", "in.wav", "--outdir", "out", "--separate", "vocals"])
        return

    # If demucs is installed, it should parse correctly
    args = parse_args(["--input", "in.wav", "--outdir", "out", "--separate", "vocals"])
    assert args.separate == ["vocals"]

    args_multi = parse_args(["--input", "in.wav", "--outdir", "out", "--separate", "vocals", "drums"])
    assert args_multi.separate == ["vocals", "drums"]

    args_all = parse_args(["--input", "in.wav", "--outdir", "out", "--separate", "all"])
    assert args_all.separate == ["all"]

    # Invalid choice
    with pytest.raises(SystemExit):
        parse_args(["--input", "in.wav", "--outdir", "out", "--separate", "invalid_stem"])
