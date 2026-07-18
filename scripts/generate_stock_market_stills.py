#!/usr/bin/env python3
from __future__ import annotations

import base64
import json
import os
from pathlib import Path

import requests


ROOT = Path("/Users/jayadevrana/Downloads/codex youtube clipping ")
ASSETS_PATH = ROOT / "deliverables/stock-market-dark-assets.json"
OUTPUT_DIR = ROOT / "public/images/stock-market-dark"
METADATA_PATH = ROOT / "deliverables/stock-market-dark-generated-assets.json"
API_KEY = os.environ.get("VENICE_API_KEY", "CHANGED")
BASE_URL = "https://api.venice.ai/api/v1"


def ensure_dirs() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> int:
    ensure_dirs()
    manifest = json.loads(ASSETS_PATH.read_text(encoding="utf-8"))
    generated: list[dict[str, str]] = []
    default_model = manifest["meta"].get("default_model", "z-image-turbo")
    size = manifest["meta"]["size"]

    for asset in manifest["assets"]:
      output_path = OUTPUT_DIR / asset["filename"]
      if output_path.exists():
        generated.append(
            {
                "id": asset["id"],
                "file": str(output_path),
                "status": "cached",
                "model": asset.get("model", default_model),
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
              "model": asset.get("model", default_model),
              "prompt": asset["prompt"],
              "size": size,
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
              "model": asset.get("model", default_model),
          }
      )

    METADATA_PATH.write_text(
        json.dumps(
            {
                "size": size,
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
