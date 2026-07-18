#!/usr/bin/env python3
import difflib
import json
import math
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import requests


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
VOICEBOX_BASE = "http://127.0.0.1:17493"
REFERENCE_AUDIO = Path("/Users/jayadevrana/Downloads/voice_preview_frank - warm, intimate and clear.mp3")
REFERENCE_WAV = ROOT / "tmp/voice_preview_frank.wav"
SCENES_PATH = ROOT / "deliverables/reel-voiceover-scenes.json"
OUTPUT_AUDIO_DIR = ROOT / "public/audio/reel-scenes"
TIMING_PATH = ROOT / "src/reelAudioTiming.json"
SUBTITLE_PATH = ROOT / "out/final/trading-strategy-reel.srt"
VERIFY_PATH = ROOT / "analysis/reviews/trading-strategy-reel-voicebox-verification.json"

FPS = 60
TARGET_TOTAL_FRAMES = 3600
PROFILE_NAME = "Frank Warm Reel"
PROFILE_DESCRIPTION = "Warm, intimate, clear English male narrator for a premium finance reel."
REFERENCE_TEXT = "Hi, I'm Frank, a confident narrator with a warm, deep, intimate voice."
INSTRUCT = (
    "Warm, intimate, clear American English male narrator. "
    "Confident and human. Premium finance reel delivery. "
    "Natural pacing with short deliberate pauses. "
    "Stop cleanly after the final word. No trailing sounds, extra syllables, or repeated phrases. "
    "Avoid robotic tone, sing-song rhythm, or hype."
)


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def ffprobe_duration(path: Path) -> float:
    return float(
        run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ]
        )
    )


def ensure_dirs() -> None:
    OUTPUT_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    SUBTITLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    VERIFY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REFERENCE_WAV.parent.mkdir(parents=True, exist_ok=True)


def normalize_text(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()


def ensure_reference_wav() -> float:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(REFERENCE_AUDIO),
            "-ac",
            "1",
            "-ar",
            "44100",
            str(REFERENCE_WAV),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return ffprobe_duration(REFERENCE_WAV)


def api_get(path: str, **kwargs):
    return requests.get(f"{VOICEBOX_BASE}{path}", timeout=kwargs.pop("timeout", 60), **kwargs)


def api_post(path: str, **kwargs):
    return requests.post(f"{VOICEBOX_BASE}{path}", timeout=kwargs.pop("timeout", 600), **kwargs)


def ensure_voicebox_ready() -> None:
    health = api_get("/health")
    health.raise_for_status()
    if health.json().get("status") != "healthy":
        raise RuntimeError("Voicebox health check did not pass.")

    load = api_post("/models/load", params={"model_size": "1.7B"})
    load.raise_for_status()


def get_or_create_profile() -> str:
    profiles = api_get("/profiles").json()
    for profile in profiles:
        if profile.get("name") == PROFILE_NAME:
            return profile["id"]

    created = api_post(
        "/profiles",
        json={"name": PROFILE_NAME, "language": "en", "description": PROFILE_DESCRIPTION},
    )
    created.raise_for_status()
    return created.json()["id"]


def ensure_profile_sample(profile_id: str) -> None:
    samples = api_get(f"/profiles/{profile_id}/samples").json()
    if samples:
        return

    with REFERENCE_WAV.open("rb") as handle:
        uploaded = api_post(
            f"/profiles/{profile_id}/samples",
            files={"file": (REFERENCE_WAV.name, handle, "audio/wav")},
            data={"reference_text": REFERENCE_TEXT},
        )
    uploaded.raise_for_status()


def wait_for_generation(generation_id: str) -> dict:
    for _ in range(180):
        current = api_get(f"/history/{generation_id}", timeout=30)
        current.raise_for_status()
        payload = current.json()
        if payload["status"] == "completed" and payload.get("audio_path"):
            return payload
        if payload["status"] == "failed":
            raise RuntimeError(payload.get("error") or f"Voicebox generation {generation_id} failed.")
        time.sleep(2)

    raise TimeoutError(f"Voicebox generation {generation_id} timed out before audio became available.")


def transcribe_audio(audio_path: Path) -> str:
    with audio_path.open("rb") as handle:
        response = api_post(
            "/transcribe",
            files={"file": (audio_path.name, handle, "audio/wav")},
            data={"language": "en"},
            timeout=300,
        )
    response.raise_for_status()
    return response.json().get("text", "").strip()


def format_srt_timestamp(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours = millis // 3_600_000
    millis %= 3_600_000
    minutes = millis // 60_000
    millis %= 60_000
    secs = millis // 1000
    millis %= 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def main() -> int:
    ensure_dirs()
    reference_duration = ensure_reference_wav()
    if reference_duration < 10:
        print(
            f"Warning: reference sample is only {reference_duration:.2f}s. "
            "Voicebox docs recommend 10-30s for less robotic output.",
            file=sys.stderr,
        )

    ensure_voicebox_ready()
    profile_id = get_or_create_profile()
    ensure_profile_sample(profile_id)

    scenes = json.loads(SCENES_PATH.read_text())
    output_scenes = []
    verification = {
        "profile_name": PROFILE_NAME,
        "reference_audio": str(REFERENCE_AUDIO),
        "reference_duration_seconds": reference_duration,
        "voicebox_base": VOICEBOX_BASE,
        "scenes": [],
    }

    for scene in scenes:
        payload = {
            "profile_id": profile_id,
            "text": scene["narration"],
            "language": "en",
            "model_size": "1.7B",
            "engine": "qwen",
            "instruct": INSTRUCT,
            "max_chunk_chars": 240,
            "crossfade_ms": 0,
            "normalize": True,
        }
        created = api_post("/generate", json=payload)
        created.raise_for_status()
        generation_id = created.json()["id"]
        completed = wait_for_generation(generation_id)

        source_audio_path = Path(completed["audio_path"])
        if not source_audio_path.exists():
          raise FileNotFoundError(f"Voicebox reported audio at {source_audio_path}, but the file does not exist yet.")

        audio_path = OUTPUT_AUDIO_DIR / f"{scene['id']}.wav"
        audio_path.write_bytes(source_audio_path.read_bytes())

        audio_duration = ffprobe_duration(audio_path)
        audio_frames = math.ceil(audio_duration * FPS)
        duration_in_frames = audio_frames + int(scene.get("padFrames", 0))
        transcription = transcribe_audio(audio_path)

        output_scenes.append(
            {
                "id": scene["id"],
                "audioFile": f"audio/reel-scenes/{scene['id']}.wav",
                "audioDurationSeconds": round(audio_duration, 3),
                "audioFrames": audio_frames,
                "durationInFrames": duration_in_frames,
                "caption": scene["caption"],
                "narration": scene["narration"],
            }
        )
        verification["scenes"].append(
            {
                "id": scene["id"],
                "generation_id": generation_id,
                "duration_seconds": round(audio_duration, 3),
                "similarity": round(similarity(scene["narration"], transcription), 3),
                "expected": scene["narration"],
                "transcribed": transcription,
                "status": completed["status"],
            }
        )

    total_frames = sum(scene["durationInFrames"] for scene in output_scenes)
    if total_frames < TARGET_TOTAL_FRAMES:
        output_scenes[-1]["durationInFrames"] += TARGET_TOTAL_FRAMES - total_frames
        total_frames = TARGET_TOTAL_FRAMES

    TIMING_PATH.write_text(
        json.dumps(
            {"fps": FPS, "targetFrames": TARGET_TOTAL_FRAMES, "totalFrames": total_frames, "scenes": output_scenes},
            indent=2,
        )
        + "\n"
    )

    cursor_seconds = 0.0
    subtitle_lines: list[str] = []
    for index, scene in enumerate(output_scenes, start=1):
        subtitle_lines.extend(
            [
                str(index),
                f"{format_srt_timestamp(cursor_seconds)} --> {format_srt_timestamp(cursor_seconds + scene['audioDurationSeconds'])}",
                scene["caption"],
                "",
            ]
        )
        cursor_seconds += scene["durationInFrames"] / FPS

    SUBTITLE_PATH.write_text("\n".join(subtitle_lines))
    VERIFY_PATH.write_text(json.dumps(verification, indent=2) + "\n")
    print(f"Wrote {TIMING_PATH}")
    print(f"Wrote {SUBTITLE_PATH}")
    print(f"Wrote {VERIFY_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
