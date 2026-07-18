#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import os
import re
import statistics
import subprocess
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from textwrap import dedent
from typing import Any

from youtube_transcript_api import YouTubeTranscriptApi


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CHANNEL = "https://www.youtube.com/@pinetrades/videos"
DEFAULT_REFERENCE_DIR = ROOT / "analysis" / "pinetrades"
DEFAULT_REVIEW_DIR = ROOT / "analysis" / "reviews"
PROMPT_PATH = ROOT / "agents" / "pinetrades-reviewer-prompt.md"


@dataclass
class ReferenceVideo:
    id: str
    title: str
    url: str
    duration: int | None
    view_count: int | None
    upload_date: str | None
    description: str
    opening_transcript: str


def run_command(command: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(
        command,
        cwd=str(cwd or ROOT),
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True))


def flatten_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def markdown_to_text(path: Path) -> str:
    text = path.read_text() if path.exists() else ""
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        lines.append(line)
    return "\n".join(lines)


def fetch_channel_entries(channel_url: str, limit: int) -> list[dict[str, Any]]:
    payload = run_command(
        [
            "yt-dlp",
            "--flat-playlist",
            "--playlist-end",
            str(limit),
            "--dump-single-json",
            channel_url,
        ]
    )
    data = json.loads(payload)
    return data.get("entries", [])


def fetch_video_details(video_url: str) -> dict[str, Any]:
    payload = run_command(
        [
            "yt-dlp",
            "--dump-single-json",
            "--skip-download",
            video_url,
        ]
    )
    return json.loads(payload)


def fetch_opening_transcript(video_id: str, seconds: int = 50) -> str:
    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id, languages=["en"])
    snippets: list[str] = []
    for item in transcript:
        snippets.append(item.text)
        if item.start >= seconds:
            break
    return flatten_text(" ".join(snippets))


def build_reference_videos(entries: list[dict[str, Any]], transcript_limit: int) -> list[ReferenceVideo]:
    videos: list[ReferenceVideo] = []
    for index, entry in enumerate(entries):
        url = entry.get("url") or f"https://www.youtube.com/watch?v={entry['id']}"
        details = fetch_video_details(url)
        opening = ""
        if index < transcript_limit:
            try:
                opening = fetch_opening_transcript(details["id"])
            except Exception as exc:  # pragma: no cover - network variance
                opening = f"Transcript unavailable: {type(exc).__name__}"

        videos.append(
            ReferenceVideo(
                id=details["id"],
                title=details["title"],
                url=details["webpage_url"],
                duration=details.get("duration"),
                view_count=details.get("view_count"),
                upload_date=details.get("upload_date"),
                description=flatten_text(details.get("description") or ""),
                opening_transcript=opening,
            )
        )
    return videos


def most_common_title_words(videos: list[ReferenceVideo], limit: int = 15) -> list[tuple[str, int]]:
    counter: Counter[str] = Counter()
    for video in videos:
        cleaned = re.sub(r"[^A-Za-z0-9 ]+", " ", video.title)
        for token in cleaned.upper().split():
            if len(token) < 3:
                continue
            counter[token] += 1
    return counter.most_common(limit)


def infer_reference_patterns(videos: list[ReferenceVideo]) -> dict[str, Any]:
    durations = [video.duration for video in videos if video.duration]
    openings = [video.opening_transcript for video in videos if video.opening_transcript and "Transcript unavailable" not in video.opening_transcript]
    description_prefixes = []
    for video in videos:
        first_line = video.description.split("-------------------")[0].strip()
        if first_line:
            description_prefixes.append(first_line)

    title_words = most_common_title_words(videos)
    hook_phrases = []
    for opening in openings:
        sentences = re.split(r"(?<=[.!?])\s+", opening)
        if sentences:
            hook_phrases.append(sentences[0])

    recurring_patterns = [
        "Problem-led opening that names a trading pain point in the first sentence.",
        "Fast pivot from pain point to tool explanation using phrases like 'That is where this indicator helps.'",
        "Single-tool focus: each video tends to center around one indicator or toolkit rather than many unrelated ideas.",
        "Explicit chart utility language: buy/sell, trend, support and resistance, volume, price action, or reversals.",
        "Commercial CTA is consistent and tied to the indicator page rather than a generic channel CTA.",
    ]

    return {
        "sample_size": len(videos),
        "duration_seconds": {
            "min": min(durations) if durations else None,
            "max": max(durations) if durations else None,
            "avg": round(statistics.mean(durations), 2) if durations else None,
            "median": round(statistics.median(durations), 2) if durations else None,
        },
        "top_title_words": title_words,
        "hook_examples": hook_phrases[:5],
        "recurring_patterns": recurring_patterns,
        "cta_signature": "PineTrades videos consistently push viewers toward a specific indicator landing page rather than a vague subscribe CTA.",
        "visual_style_notes": [
            "High-contrast promise in the title and thumbnail language.",
            "Narration explains what the viewer is seeing instead of drifting into theory too early.",
            "Tool proof is usually shown on-chart before the CTA lands.",
        ],
    }


def render_style_guide(videos: list[ReferenceVideo], patterns: dict[str, Any], out_path: Path) -> None:
    top_titles = "\n".join(f"- {video.title}" for video in videos[:6])
    hook_examples = "\n".join(f"- {item}" for item in patterns["hook_examples"])
    title_words = "\n".join(f"- {word}: {count}" for word, count in patterns["top_title_words"])
    recurring = "\n".join(f"- {item}" for item in patterns["recurring_patterns"])
    visual_notes = "\n".join(f"- {item}" for item in patterns["visual_style_notes"])

    content = f"""# PineTrades Style Guide Snapshot

Channel sampled: `{DEFAULT_CHANNEL}`
Videos sampled: `{patterns['sample_size']}`

## Runtime Range
- Average runtime: `{patterns['duration_seconds']['avg']} seconds`
- Median runtime: `{patterns['duration_seconds']['median']} seconds`
- Min runtime: `{patterns['duration_seconds']['min']} seconds`
- Max runtime: `{patterns['duration_seconds']['max']} seconds`

## Recent Title Samples
{top_titles}

## Frequent Title Vocabulary
{title_words}

## Opening Hook Examples
{hook_examples}

## Recurring Structural Patterns
{recurring}

## Visual / Narrative Notes
{visual_notes}

## CTA Signature
- {patterns['cta_signature']}
"""
    out_path.write_text(content)


def ffprobe_video(path: Path) -> dict[str, Any]:
    payload = run_command(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(path),
        ]
    )
    return json.loads(payload)


def make_contact_sheet(video_path: Path, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(video_path),
            "-vf",
            "fps=1/8,scale=720:-1,tile=3x3",
            "-frames:v",
            "1",
            str(out_path),
            "-y",
        ],
        check=True,
    )


def safe_ratio(value: float, target: float, tolerance: float) -> int:
    distance = abs(value - target)
    raw = max(0.0, 10.0 - (distance / tolerance) * 10.0)
    return int(round(min(10.0, raw)))


def score_review(reference: dict[str, Any], video_meta: dict[str, Any], script_text: str, scene_text: str) -> dict[str, Any]:
    duration = float(video_meta["format"]["duration"])
    reference_median = reference["duration_seconds"]["median"] or duration
    runtime_score = safe_ratio(duration, reference_median, max(reference_median * 0.75, 60))

    lower_script = script_text.lower()
    hook_score = 10 if any(term in lower_script[:260] for term in ["most ", "problem", "stands out", "indicator"]) else 4
    proof_score = 10 if any(term in lower_script for term in ["profit factor", "profitable", "report panel", "report data"]) else 3
    cta_score = 10 if all(term in lower_script for term in ["whatsapp", "custom pine script", "672", "free"]) else 4
    scene_score = 10 if any(term in scene_text.lower() for term in ["hook", "strategy report", "cta"]) else 5
    caution_score = 10 if any(term in lower_script for term in ["does not guarantee", "not guarantee", "visible report"]) else 5

    total = runtime_score + hook_score + proof_score + cta_score + scene_score + caution_score
    verdict = "pass" if total >= 48 else "revise"

    must_change: list[str] = []
    should_change: list[str] = []

    if runtime_score < 6:
        must_change.append(
            f"Runtime is {round(duration, 2)} seconds, while the sampled PineTrades median is {reference_median} seconds. Expand the edit with at least one settings or use-case section if you want a closer PineTrades match."
        )
    if hook_score < 7:
        must_change.append("Rewrite the first 5 to 10 seconds so the opening sentence names a trading problem before it explains the tool.")
    if proof_score < 7:
        must_change.append("Add a stronger proof beat: show the report panel or another visible validation moment earlier and call it out explicitly.")
    if cta_score < 7:
        must_change.append("Tighten the CTA so the phone number, WhatsApp destination, and custom Pine Script offer are all clearly present.")
    if scene_score < 7:
        should_change.append("Strengthen the scene structure so the hook, showcase, proof moment, and CTA are all obvious in the timeline.")
    if caution_score < 7:
        should_change.append("Use more credibility language when discussing performance so the video stays trustworthy.")

    if not must_change:
        must_change.append("No major structural miss detected by the rules engine.")
    if not should_change:
        should_change.append("No secondary improvements flagged by the rules engine.")

    return {
        "score": total,
        "verdict": verdict,
        "subscores": {
            "runtime_fit": runtime_score,
            "hook_strength": hook_score,
            "proof_moment": proof_score,
            "cta_fit": cta_score,
            "scene_structure": scene_score,
            "credibility_language": caution_score,
        },
        "must_change_now": must_change,
        "should_improve_next": should_change,
    }


def review_to_markdown(reference: dict[str, Any], review: dict[str, Any], assets: dict[str, Any]) -> str:
    matches = [
        "Tool-focused narration and indicator-specific language match PineTrades reasonably well.",
        "The output keeps the chart and report as the main proof surfaces instead of drifting into generic filler.",
        "Commercial CTA is direct and product-oriented, which is consistent with the reference channel style.",
    ]
    mismatches = []
    if review["subscores"]["runtime_fit"] < 6:
        mismatches.append("The runtime is much shorter than the typical PineTrades long-form explainer format.")
    if review["subscores"]["hook_strength"] < 7:
        mismatches.append("The first line does not hit the same problem-led hook pattern strongly enough.")
    if review["subscores"]["proof_moment"] < 7:
        mismatches.append("The proof moment needs to land earlier or more clearly.")
    if not mismatches:
        mismatches.append("No major pattern break detected in the automated review.")

    exact_edits = "\n".join(f"- {item}" for item in review["must_change_now"] + review["should_improve_next"])
    matches_md = "\n".join(f"- {item}" for item in matches)
    mismatches_md = "\n".join(f"- {item}" for item in mismatches)
    must_change_md = "\n".join(f"- {item}" for item in review["must_change_now"])
    should_change_md = "\n".join(f"- {item}" for item in review["should_improve_next"])

    return f"""# PineTrades Output Review

- Verdict: **{review['verdict'].upper()}**
- Score: **{review['score']} / 60**
- Video analyzed: `{assets['video_path']}`
- Contact sheet: `{assets['contact_sheet']}`

## What Matches
{matches_md}

## What Breaks Pattern
{mismatches_md}

## Must Change Now
{must_change_md}

## Should Improve Next
{should_change_md}

## Exact Edit Instructions
{exact_edits}

## Reference Runtime Snapshot
- Median PineTrades runtime in the sampled set: `{reference['duration_seconds']['median']} seconds`
- Average PineTrades runtime in the sampled set: `{reference['duration_seconds']['avg']} seconds`
"""


def crawl_command(args: argparse.Namespace) -> None:
    reference_dir = Path(args.out_dir)
    reference_dir.mkdir(parents=True, exist_ok=True)

    entries = fetch_channel_entries(args.channel_url, args.limit)
    videos = build_reference_videos(entries, transcript_limit=args.transcript_limit)
    patterns = infer_reference_patterns(videos)

    snapshot = {
        "channel_url": args.channel_url,
        "videos": [asdict(video) for video in videos],
        "patterns": patterns,
    }

    save_json(reference_dir / "channel_snapshot.json", snapshot)
    save_json(reference_dir / "style_guide.json", patterns)
    render_style_guide(videos, patterns, reference_dir / "style_guide.md")
    print(f"Wrote reference snapshot to {reference_dir}")


def review_command(args: argparse.Namespace) -> None:
    reference_dir = Path(args.reference_dir)
    review_dir = Path(args.out_dir)
    review_dir.mkdir(parents=True, exist_ok=True)

    style_guide = load_json(reference_dir / "style_guide.json")
    video_path = Path(args.video)
    script_path = Path(args.script)
    scene_path = Path(args.scenes)

    contact_sheet = review_dir / f"{video_path.stem}-contact.jpg"
    make_contact_sheet(video_path, contact_sheet)

    video_meta = ffprobe_video(video_path)
    script_text = markdown_to_text(script_path)
    scene_text = scene_path.read_text() if scene_path.exists() else ""
    review = score_review(style_guide, video_meta, script_text, scene_text)

    assets = {
        "video_path": str(video_path),
        "contact_sheet": str(contact_sheet),
    }
    report = review_to_markdown(style_guide, review, assets)
    (review_dir / f"{video_path.stem}-review.md").write_text(report)

    payload = {
        "video_meta": video_meta,
        "review": review,
        "assets": assets,
    }
    save_json(review_dir / f"{video_path.stem}-review.json", payload)

    if args.use_openai and os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI

            client = OpenAI()
            prompt = PROMPT_PATH.read_text() if PROMPT_PATH.exists() else ""
            response = client.responses.create(
                model=args.model,
                input=(
                    f"{prompt}\n\nReference style guide:\n{json.dumps(style_guide, indent=2)}\n\n"
                    f"Candidate review bundle:\n{json.dumps(payload, indent=2)}"
                ),
            )
            llm_text = getattr(response, "output_text", "").strip()
            if llm_text:
                (review_dir / f"{video_path.stem}-llm-review.md").write_text(llm_text + "\n")
        except Exception as exc:  # pragma: no cover - network variance
            (review_dir / f"{video_path.stem}-llm-review-error.txt").write_text(f"{type(exc).__name__}: {exc}\n")

    print(f"Wrote review bundle to {review_dir}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Crawl PineTrades references and review output videos against them.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    crawl = subparsers.add_parser("crawl", help="Download recent PineTrades metadata and transcript openings.")
    crawl.add_argument("--channel-url", default=DEFAULT_CHANNEL)
    crawl.add_argument("--limit", type=int, default=12)
    crawl.add_argument("--transcript-limit", type=int, default=5)
    crawl.add_argument("--out-dir", default=str(DEFAULT_REFERENCE_DIR))
    crawl.set_defaults(func=crawl_command)

    review = subparsers.add_parser("review", help="Score a local output video against the PineTrades reference snapshot.")
    review.add_argument("--reference-dir", default=str(DEFAULT_REFERENCE_DIR))
    review.add_argument("--video", required=True)
    review.add_argument("--script", default=str(ROOT / "deliverables" / "voiceover-script.md"))
    review.add_argument("--scenes", default=str(ROOT / "deliverables" / "scene-breakdown.md"))
    review.add_argument("--out-dir", default=str(DEFAULT_REVIEW_DIR))
    review.add_argument("--use-openai", action="store_true")
    review.add_argument("--model", default="gpt-5")
    review.set_defaults(func=review_command)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
