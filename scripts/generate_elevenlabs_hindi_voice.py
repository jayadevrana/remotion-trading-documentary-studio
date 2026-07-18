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
TRANS_PATH = ROOT / "deliverables/wealth-equation-hindi-tts.json"
PUBLIC_AUDIO_DIR = ROOT / "public/audio/wealth-scenes"
TIMING_PATH = ROOT / "src/wealthAudioTiming.json"
MASTER_AUDIO_PATH = ROOT / "public/audio/wealth-narration.wav"
SRT_PATH = ROOT / "out/final/wealth-equation.srt"
FPS = 30
BASE_URL = "https://api.elevenlabs.io/v1"
MODEL_ID = "eleven_multilingual_v2"
VOICE_ID = "nPczCjzI2devNBz1zQrb"  # Brian - Deep, Resonant and Comforting
SPEED = 1.12

PHRASE_REPLACEMENTS = [
    ("$1,000,000", "ek million dollars"),
    ("$10 million", "das million dollars"),
    ("$100 million", "ek sau million dollars"),
    ("$1 billion", "ek billion dollars"),
    ("$30 million", "tees million dollars"),
    ("$1.5 billion", "dedh billion dollars"),
    ("$165 million", "ek sau painsath million dollars"),
    ("$20 per hour", "bees dollars per hour"),
    ("40 hours per week", "hafte ke chalis ghante"),
    ("24 saal", "chaubees saal"),
    ("117", "ek sau satrah"),
    ("165", "ek sau painsath"),
    ("100", "ek sau"),
    ("68%", "adsath pratishat"),
    ("20s, 30s aur 40s", "twenties, thirties aur forties"),
    ("Part 1", "bhaag ek"),
    ("Part 2", "bhaag do"),
    ("Part 3", "bhaag teen"),
    ("Part 4", "bhaag chaar"),
    ("Part 5", "bhaag paanch"),
]

TOKEN_REPLACEMENTS = {
    "1": "ek",
    "2": "do",
    "3": "teen",
    "4": "chaar",
    "5": "paanch",
    "7": "saat",
    "10": "das",
    "20": "bees",
    "24": "chaubees",
    "30": "tees",
    "40": "chaalis",
    "68": "adsath",
}


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
    concat_list = ROOT / "tmp/eleven_hindi_concat.txt"
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


def normalize_roman_hindi(text: str) -> str:
    normalized = text
    for source, target in PHRASE_REPLACEMENTS:
        normalized = normalized.replace(source, target)
    for token, target in TOKEN_REPLACEMENTS.items():
        normalized = re.sub(rf"\b{re.escape(token)}\b", target, normalized)
    normalized = normalized.replace("&", " aur ")
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def transliterate_text(text: str) -> str:
    parts = [part.strip() for part in re.split(r"(?<=[.!?।:])\s+|\n+", text) if part.strip()]
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


def build_hindi_tts_scenes(scenes: list[dict]) -> list[dict]:
    output = {"scenes": []}
    for scene in scenes:
        normalized = normalize_roman_hindi(scene["narration"])
        hindi_tts = transliterate_text(normalized)
        output["scenes"].append(
            {
                "id": scene["id"],
                "normalized": normalized,
                "tts": hindi_tts,
            }
        )
        print(f"Prepared Hindi text for {scene['id']}", flush=True)
    TRANS_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    return output["scenes"]


def headers(api_key: str) -> dict[str, str]:
    return {"xi-api-key": api_key}


def generate_tts(api_key: str, text: str, path: Path) -> None:
    raw_path = path.with_name(f"{path.stem}-raw.mp3")
    response = requests.post(
        f"{BASE_URL}/text-to-speech/{VOICE_ID}",
        headers={**headers(api_key), "Content-Type": "application/json"},
        params={"output_format": "mp3_44100_128"},
        json={
            "text": text,
            "model_id": MODEL_ID,
            "language_code": "hi",
            "voice_settings": {
                "stability": 0.38,
                "similarity_boost": 0.72,
                "style": 0.28,
                "use_speaker_boost": True,
            },
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
            f"atempo={SPEED},bass=g=5:f=110,highpass=f=55,lowpass=f=9000,alimiter=limit=-1.2dB",
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


def selected_scene_ids() -> set[str] | None:
    raw = os.environ.get("WEALTH_SCENE_IDS", "").strip()
    if not raw:
        return None
    return {part.strip() for part in raw.split(",") if part.strip()}


def main() -> int:
    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("ELEVENLABS_API_KEY is required")

    ensure_dirs()
    scenes_data = json.loads(SCENES_PATH.read_text(encoding="utf-8"))
    scenes = scenes_data["scenes"]
    hindi_scenes = {item["id"]: item for item in build_hindi_tts_scenes(scenes)}
    scene_filter = selected_scene_ids()
    if scene_filter:
        scenes = [scene for scene in scenes if scene["id"] in scene_filter]
        if not scenes:
            raise SystemExit("WEALTH_SCENE_IDS did not match any scene ids")

    rendered_scenes = []
    wav_paths: list[Path] = []
    srt_blocks: list[str] = []
    current_start = 0.0
    total_characters = 0

    for scene in scenes:
        audio_path = PUBLIC_AUDIO_DIR / f"{scene['id']}.wav"
        tts_text = hindi_scenes[scene["id"]]["tts"]
        total_characters += len(tts_text)
        generate_tts(api_key, tts_text, audio_path)
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

    if scene_filter:
        print(
            json.dumps(
                {
                    "scene_count": len(rendered_scenes),
                    "voice_id": VOICE_ID,
                    "characters": total_characters,
                    "sample_audio_files": [str(path) for path in wav_paths],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0

    concat_wavs(wav_paths, MASTER_AUDIO_PATH)
    TIMING_PATH.write_text(
        json.dumps(
            {
                "fps": FPS,
                "voice_id": VOICE_ID,
                "voiceSpeed": SPEED,
                "provider": "elevenlabs",
                "model": MODEL_ID,
                "totalSeconds": round(current_start, 3),
                "totalFrames": sum(scene["durationInFrames"] for scene in rendered_scenes),
                "characters": total_characters,
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
                "voice_id": VOICE_ID,
                "model": MODEL_ID,
                "characters": total_characters,
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
