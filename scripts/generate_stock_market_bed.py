#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
TIMING_PATH = ROOT / "src/stockMarketDarkAudioTiming.json"
OUTPUT_PATH = ROOT / "public/audio/stock-market-dark-bed.wav"


def main() -> int:
    timing = json.loads(TIMING_PATH.read_text(encoding="utf-8"))
    duration = max(30, math.ceil(float(timing["totalSeconds"]) + 4))
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=42:sample_rate=48000:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=84:sample_rate=48000:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=brown:amplitude=0.09:sample_rate=48000:duration={duration}",
            "-filter_complex",
            (
                "[0:a]volume=0.014[a0];"
                "[1:a]volume=0.007[a1];"
                "[2:a]lowpass=f=320,highpass=f=28,volume=0.13[a2];"
                "[a0][a1][a2]amix=inputs=3:normalize=0,"
                "alimiter=limit=-10dB,"
                "afade=t=in:ss=0:d=6,"
                f"afade=t=out:st={max(0, duration - 7)}:d=7"
            ),
            "-ar",
            "48000",
            "-ac",
            "2",
            str(OUTPUT_PATH),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
