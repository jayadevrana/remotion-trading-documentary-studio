#!/usr/bin/env python3
from __future__ import annotations

import base64
import json
import os
from pathlib import Path

import requests


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
ASSETS_PATH = ROOT / "deliverables/wealth-equation-assets.json"
OUTPUT_DIR = ROOT / "public/images/wealth"
METADATA_PATH = ROOT / "deliverables/wealth-equation-generated-assets.json"
API_KEY = os.environ.get("VENICE_API_KEY", "CHANGED")
BASE_URL = "https://api.venice.ai/api/v1"


def ensure_dirs() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> int:
    ensure_dirs()
    manifest = json.loads(ASSETS_PATH.read_text(encoding="utf-8"))
    generated = []

    for asset in manifest["assets"]:
        output_path = OUTPUT_DIR / asset["filename"]
        if output_path.exists():
            generated.append(
                {
                    "id": asset["id"],
                    "file": str(output_path),
                    "status": "cached",
                }
            )
            continue

        response = requests.post(
            f"{BASE_URL}/images/generations",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": manifest["meta"]["model"],
                "prompt": asset["prompt"],
                "size": manifest["meta"]["size"],
                "response_format": "b64_json",
                "output_format": "png",
                "n": 1,
            },
            timeout=600,
        )
        response.raise_for_status()
        payload = response.json()
        encoded = payload["data"][0]["b64_json"]
        output_path.write_bytes(base64.b64decode(encoded))
        generated.append(
            {
                "id": asset["id"],
                "file": str(output_path),
                "status": "generated",
            }
        )

    METADATA_PATH.write_text(
        json.dumps(
            {
                "model": manifest["meta"]["model"],
                "size": manifest["meta"]["size"],
                "estimated_cost_usd": manifest["meta"]["estimated_cost_usd"],
                "generated": generated,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(METADATA_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
