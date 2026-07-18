#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
TIMING_PATH = ROOT / "src/wealthAudioTiming.json"
OUTPUT_PATH = ROOT / "public/audio/wealth-bed.wav"


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
            f"sine=frequency=44:sample_rate=48000:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=88:sample_rate=48000:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=brown:amplitude=0.08:sample_rate=48000:duration={duration}",
            "-filter_complex",
            (
                "[0:a]volume=0.015[a0];"
                "[1:a]volume=0.008[a1];"
                "[2:a]lowpass=f=300,highpass=f=30,volume=0.12[a2];"
                "[a0][a1][a2]amix=inputs=3:normalize=0,"
                "alimiter=limit=-10dB,"
                "afade=t=in:ss=0:d=5,"
                f"afade=t=out:st={max(0, duration - 6)}:d=6"
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
