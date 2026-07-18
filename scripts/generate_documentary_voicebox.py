#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import os
import subprocess
import time
from pathlib import Path

import requests


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
VOICEBOX_BASE = "http://127.0.0.1:17493"
REFERENCE_AUDIO = Path("/Users/jayadevrana/Downloads/voice_preview_shivank - deep, breathy and suspense.mp3")
REFERENCE_WAV = ROOT / "tmp/shivank_reference.wav"
SCENES_PATH = ROOT / "deliverables/wealth-equation-scenes.json"
HINDI_TTS_PATH = ROOT / "deliverables/wealth-equation-hindi-tts.json"
PUBLIC_AUDIO_DIR = ROOT / "public/audio/wealth-scenes"
TIMING_PATH = ROOT / "src/wealthAudioTiming.json"
MASTER_AUDIO_PATH = ROOT / "public/audio/wealth-narration.wav"
SRT_PATH = ROOT / "out/final/wealth-equation.srt"

FPS = 30
VOICE_SPEED = 1.2
PROFILE_NAME = "Shivank Deep Suspense Hindi"
PROFILE_DESCRIPTION = "Deep, breathy, suspenseful Hindi documentary narrator."
INSTRUCT = (
    "Deep, breathy, suspenseful Hindi male narrator. "
    "Natural human delivery. Preserve a grounded Indian Hindi accent. "
    "Code-switch smoothly for English finance words and numbers. "
    "Avoid robotic tone, sing-song cadence, or exaggerated drama. "
    "Use deliberate pauses only where punctuation suggests them. "
    "Stop cleanly after the last word."
)

GROUPS = [
    ["s01", "s02", "s03", "s04"],
    ["s05", "s06", "s07", "s08"],
    ["s09", "s10", "s11", "s12"],
    ["s13", "s14", "s15", "s16"],
    ["s17", "s18", "s19", "s20"],
    ["s21", "s22", "s23"],
    ["s24", "s25", "s26"],
    ["s27", "s28", "s29", "s30"],
]
WAIT_POLL_SECONDS = 2
WAIT_MAX_POLLS = int(os.environ.get("VOICEBOX_MAX_POLLS", "1800"))


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
    PUBLIC_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    TIMING_PATH.parent.mkdir(parents=True, exist_ok=True)
    SRT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REFERENCE_WAV.parent.mkdir(parents=True, exist_ok=True)


def api_get(path: str, **kwargs):
    last_error: Exception | None = None
    for _ in range(3):
        try:
            return requests.get(f"{VOICEBOX_BASE}{path}", timeout=kwargs.pop("timeout", 60), **kwargs)
        except requests.RequestException as error:
            last_error = error
            time.sleep(1.5)
    raise RuntimeError(f"GET {path} failed after retries") from last_error


def api_post(path: str, **kwargs):
    timeout = kwargs.pop("timeout", 600)
    last_error: Exception | None = None
    for _ in range(3):
        try:
            return requests.post(f"{VOICEBOX_BASE}{path}", timeout=timeout, **kwargs)
        except requests.RequestException as error:
            last_error = error
            time.sleep(1.5)
    raise RuntimeError(f"POST {path} failed after retries") from last_error


def list_history() -> list[dict]:
    response = api_get("/history")
    response.raise_for_status()
    return response.json().get("items", [])


def ensure_reference_wav() -> None:
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


def ensure_voicebox_ready() -> None:
    health = api_get("/health")
    health.raise_for_status()
    payload = health.json()
    if payload.get("status") != "healthy":
        raise RuntimeError(f"Voicebox health check failed: {payload}")
    if not payload.get("model_loaded"):
        load = api_post("/models/load", params={"model_size": "1.7B"}, timeout=600)
        load.raise_for_status()


def transcribe_reference_text() -> str:
    with REFERENCE_WAV.open("rb") as handle:
        response = api_post(
            "/transcribe",
            files={"file": (REFERENCE_WAV.name, handle, "audio/wav")},
            data={"language": "hi"},
            timeout=300,
        )
    response.raise_for_status()
    text = response.json().get("text", "").strip()
    if not text:
        raise RuntimeError("Could not transcribe the reference sample for profile setup.")
    return text


def get_or_create_profile() -> str:
    profiles = api_get("/profiles").json()
    for profile in profiles:
        if profile.get("name") == PROFILE_NAME:
            return str(profile["id"])

    created = api_post(
        "/profiles",
        json={"name": PROFILE_NAME, "language": "hi", "description": PROFILE_DESCRIPTION},
    )
    created.raise_for_status()
    return str(created.json()["id"])


def profile_has_samples(profile_id: str) -> bool:
    samples = api_get(f"/profiles/{profile_id}/samples").json()
    return bool(samples)


def ensure_profile_sample(profile_id: str, reference_text: str) -> None:
    if profile_has_samples(profile_id):
        return

    with REFERENCE_WAV.open("rb") as handle:
        uploaded = api_post(
            f"/profiles/{profile_id}/samples",
            files={"file": (REFERENCE_WAV.name, handle, "audio/wav")},
            data={"reference_text": reference_text},
            timeout=300,
        )
    uploaded.raise_for_status()


def wait_for_generation(generation_id: str) -> dict:
    for _ in range(WAIT_MAX_POLLS):
        current = api_get(f"/history/{generation_id}", timeout=30)
        current.raise_for_status()
        payload = current.json()
        if payload["status"] == "completed" and payload.get("audio_path"):
            return payload
        if payload["status"] == "failed":
            raise RuntimeError(payload.get("error") or f"Voicebox generation {generation_id} failed.")
        time.sleep(WAIT_POLL_SECONDS)

    raise TimeoutError(f"Voicebox generation {generation_id} timed out.")


def format_srt_timestamp(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours = millis // 3_600_000
    millis %= 3_600_000
    minutes = millis // 60_000
    millis %= 60_000
    secs = millis // 1000
    millis %= 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def speed_and_normalize(source: Path, dest: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(source),
            "-af",
            f"atempo={VOICE_SPEED},highpass=f=60,lowpass=f=10000,alimiter=limit=-1.2dB",
            "-ar",
            "48000",
            "-ac",
            "1",
            str(dest),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def concat_wavs(paths: list[Path], dest: Path) -> None:
    concat_list = ROOT / "tmp/wealth_voice_concat.txt"
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


def cut_scene_audio(source: Path, start: float, duration: float, dest: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start:.3f}",
            "-t",
            f"{duration:.3f}",
            "-i",
            str(source),
            "-ar",
            "48000",
            "-ac",
            "1",
            str(dest),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def load_scene_tts_map() -> dict[str, str]:
    if not HINDI_TTS_PATH.exists():
        return {}
    payload = json.loads(HINDI_TTS_PATH.read_text(encoding="utf-8"))
    return {item["id"]: item["tts"] for item in payload.get("scenes", [])}


def matching_generation(profile_id: str, group_text: str) -> dict | None:
    generating_match: dict | None = None
    for item in list_history():
        if item.get("profile_id") == profile_id and item.get("text") == group_text:
            if item.get("status") == "completed" and item.get("audio_path"):
                return item
            if generating_match is None:
                generating_match = item
    return generating_match


def append_rendered_scene(
    rendered_scenes: list[dict],
    srt_blocks: list[str],
    wav_paths: list[Path],
    scene: dict,
    scene_path: Path,
    current_start: float,
) -> float:
    duration_seconds = ffprobe_duration(scene_path)
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
    wav_paths.append(scene_path)
    return current_start + duration_seconds


def main() -> int:
    ensure_dirs()
    ensure_reference_wav()
    ensure_voicebox_ready()
    profile_id = get_or_create_profile()
    reference_text = ""
    if profile_has_samples(profile_id):
        reference_text = "existing-sample"
    else:
        reference_text = transcribe_reference_text()
        ensure_profile_sample(profile_id, reference_text)

    scenes_data = json.loads(SCENES_PATH.read_text(encoding="utf-8"))
    scenes = scenes_data["scenes"]
    scene_map = {scene["id"]: scene for scene in scenes}
    scene_tts_map = load_scene_tts_map()
    rendered_scenes = []
    wav_paths: list[Path] = []
    srt_blocks: list[str] = []
    current_start = 0.0

    for group_index, scene_ids in enumerate(GROUPS, start=1):
        group_scenes = [scene_map[scene_id] for scene_id in scene_ids]
        group_scene_paths = [PUBLIC_AUDIO_DIR / f"{scene['id']}.wav" for scene in group_scenes]
        if all(path.exists() for path in group_scene_paths):
            for scene, scene_path in zip(group_scenes, group_scene_paths):
                current_start = append_rendered_scene(rendered_scenes, srt_blocks, wav_paths, scene, scene_path, current_start)
            print(f"Skipping group {group_index}/{len(GROUPS)}: existing scene audio found", flush=True)
            continue

        group_text = "\n\n".join(scene_tts_map.get(scene["id"], scene["narration"]) for scene in group_scenes)
        existing_generation = matching_generation(profile_id, group_text)
        if existing_generation and existing_generation.get("status") == "completed" and existing_generation.get("audio_path"):
            completed = existing_generation
            print(f"Reusing completed group {group_index}/{len(GROUPS)}: {', '.join(scene_ids)}", flush=True)
        else:
            if existing_generation and existing_generation.get("status") == "generating":
                generation_id = existing_generation["id"]
                print(f"Waiting on existing group {group_index}/{len(GROUPS)}: {', '.join(scene_ids)}", flush=True)
            else:
                payload = {
                    "profile_id": profile_id,
                    "text": group_text,
                    "language": "hi",
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
                print(f"Generating group {group_index}/{len(GROUPS)}: {', '.join(scene_ids)}", flush=True)
            completed = wait_for_generation(generation_id)

        source_audio_path = Path(completed["audio_path"])
        raw_path = PUBLIC_AUDIO_DIR / f"group-{group_index:02d}-raw.wav"
        final_path = PUBLIC_AUDIO_DIR / f"group-{group_index:02d}.wav"
        raw_path.write_bytes(source_audio_path.read_bytes())
        speed_and_normalize(raw_path, final_path)
        raw_path.unlink(missing_ok=True)

        group_duration_seconds = ffprobe_duration(final_path)
        weights = [max(40, len(scene_tts_map.get(scene["id"], scene["narration"]))) for scene in group_scenes]
        total_weight = sum(weights)
        allocations = [group_duration_seconds * weight / total_weight for weight in weights]
        allocated_sum = sum(allocations[:-1]) if len(allocations) > 1 else 0
        allocations[-1] = max(0.05, group_duration_seconds - allocated_sum)

        group_offset = 0.0
        for scene, duration_seconds in zip(group_scenes, allocations):
            scene_path = PUBLIC_AUDIO_DIR / f"{scene['id']}.wav"
            cut_scene_audio(final_path, group_offset, duration_seconds, scene_path)
            group_offset += duration_seconds
            current_start = append_rendered_scene(rendered_scenes, srt_blocks, wav_paths, scene, scene_path, current_start)

    concat_wavs(wav_paths, MASTER_AUDIO_PATH)
    TIMING_PATH.write_text(
        json.dumps(
            {
                "fps": FPS,
                "voiceSpeed": VOICE_SPEED,
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
                "profile_id": profile_id,
                "reference_text": reference_text,
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
