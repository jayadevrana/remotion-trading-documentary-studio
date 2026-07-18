#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import os
import re
import subprocess
from pathlib import Path

import requests


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
SCENES_PATH = ROOT / "deliverables/wealth-equation-scenes.json"
TRANS_PATH = ROOT / "deliverables/wealth-equation-transliterated.json"
PUBLIC_AUDIO_DIR = ROOT / "public/audio/wealth-scenes"
TIMING_PATH = ROOT / "src/wealthAudioTiming.json"
MASTER_AUDIO_PATH = ROOT / "public/audio/wealth-narration.wav"
SRT_PATH = ROOT / "out/final/wealth-equation.srt"
API_KEY = os.environ.get("VENICE_API_KEY", "CHANGED")
BASE_URL = "https://api.venice.ai/api/v1"
FPS = 30
VOICE = "hm_psi"
SPEED = 1.2


def ensure_dirs() -> None:
    PUBLIC_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    TIMING_PATH.parent.mkdir(parents=True, exist_ok=True)
    SRT_PATH.parent.mkdir(parents=True, exist_ok=True)


def ffprobe_duration(path: Path) -> float:
    return float(
        subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    )


def concat_wavs(paths: list[Path], dest: Path) -> None:
    concat_list = ROOT / "tmp/wealth_tts_concat.txt"
    concat_list.parent.mkdir(parents=True, exist_ok=True)
    concat_list.write_text("\n".join(f"file '{p.as_posix()}'" for p in paths), encoding="utf-8")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c",
            "copy",
            str(dest),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def format_srt_timestamp(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours = millis // 3_600_000
    millis %= 3_600_000
    minutes = millis // 60_000
    millis %= 60_000
    secs = millis // 1000
    millis %= 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def transliterate_text(text: str) -> str:
    parts = [part.strip() for part in re.split(r"(?<=[.!?।])\s+|\n+", text) if part.strip()]
    output_parts: list[str] = []

    for part in parts:
        response = requests.get(
            "https://inputtools.google.com/request",
            params={
                "text": part,
                "itc": "hi-t-i0-und",
                "num": 1,
                "cp": 0,
                "cs": 1,
                "ie": "utf-8",
                "oe": "utf-8",
                "app": "demopage",
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        if payload[0] != "SUCCESS":
            raise RuntimeError(f"Transliteration failed for text: {part[:120]}")
        output_parts.append(payload[1][0][1][0].strip())

    return " ".join(output_parts)


def transliterate_scenes(scenes: list[dict]) -> list[dict]:
    if TRANS_PATH.exists():
        return json.loads(TRANS_PATH.read_text(encoding="utf-8"))["scenes"]

    output = {"scenes": []}
    for scene in scenes:
        print(f"Transliterating {scene['id']}", flush=True)
        output["scenes"].append({"id": scene["id"], "tts": transliterate_text(scene["narration"])})
        TRANS_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    TRANS_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    return output["scenes"]


def generate_tts(text: str, path: Path) -> None:
    raw_path = path.with_name(f"{path.stem}-raw.wav")
    response = requests.post(
        f"{BASE_URL}/audio/speech",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={
            "input": text,
            "model": "tts-kokoro",
            "response_format": "wav",
            "speed": SPEED,
            "streaming": False,
            "voice": VOICE,
        },
        timeout=600,
    )
    response.raise_for_status()
    raw_path.write_bytes(response.content)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_path),
            "-af",
            "asetrate=48000*0.97,aresample=48000,atempo=1.031,bass=g=4:f=120,highpass=f=55,lowpass=f=8500,alimiter=limit=-1.4dB",
            "-ar",
            "48000",
            "-ac",
            "1",
            str(path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    raw_path.unlink(missing_ok=True)


def main() -> int:
    ensure_dirs()
    scenes_data = json.loads(SCENES_PATH.read_text(encoding="utf-8"))
    scenes = scenes_data["scenes"]
    transliterated = {item["id"]: item["tts"] for item in transliterate_scenes(scenes)}

    rendered_scenes = []
    wav_paths: list[Path] = []
    srt_blocks: list[str] = []
    current_start = 0.0

    for scene in scenes:
        audio_path = PUBLIC_AUDIO_DIR / f"{scene['id']}.wav"
        if not audio_path.exists():
            generate_tts(transliterated[scene["id"]], audio_path)

        duration_seconds = ffprobe_duration(audio_path)
        duration_frames = math.ceil(duration_seconds * FPS)
        rendered_scenes.append(
            {
                "id": scene["id"],
                "title": scene["title"],
                "caption": scene["caption"],
                "kicker": scene.get("kicker", ""),
                "visualMode": scene["visualMode"],
                "assetId": scene["assetId"],
                "audioFile": f"audio/wealth-scenes/{scene['id']}.wav",
                "audioDurationSeconds": round(duration_seconds, 3),
                "durationInFrames": duration_frames,
                "startFrame": round(current_start * FPS),
                "narration": scene["narration"],
            }
        )
        srt_blocks.append(
            "\n".join(
                [
                    str(len(srt_blocks) + 1),
                    f"{format_srt_timestamp(current_start)} --> {format_srt_timestamp(current_start + duration_seconds)}",
                    scene["caption"],
                ]
            )
        )
        current_start += duration_seconds
        wav_paths.append(audio_path)
        print(f"Generated {scene['id']}", flush=True)

    concat_wavs(wav_paths, MASTER_AUDIO_PATH)
    TIMING_PATH.write_text(
        json.dumps(
            {
                "fps": FPS,
                "voice": VOICE,
                "voiceSpeed": SPEED,
                "totalSeconds": round(current_start, 3),
                "totalFrames": sum(scene["durationInFrames"] for scene in rendered_scenes),
                "scenes": rendered_scenes,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    SRT_PATH.write_text("\n\n".join(srt_blocks), encoding="utf-8")
    print(
        json.dumps(
            {
                "voice": VOICE,
                "scene_count": len(rendered_scenes),
                "master_audio": str(MASTER_AUDIO_PATH),
                "timing_json": str(TIMING_PATH),
                "subtitle_path": str(SRT_PATH),
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
