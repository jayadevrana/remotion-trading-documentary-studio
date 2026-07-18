#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def split_strip(source: Path, scene_id: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    image = Image.open(source)
    width, height = image.size
    panel_width = width // 5
    for index in range(5):
        left = index * panel_width
        right = width if index == 4 else (index + 1) * panel_width
        crop = image.crop((left, 0, right, height))
        crop.save(output_dir / f"{scene_id}-{index + 1}.png")


def main() -> int:
    parser = argparse.ArgumentParser(description="Split a five-panel storyboard strip into five images.")
    parser.add_argument("source", type=Path)
    parser.add_argument("scene_id", type=str)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    split_strip(args.source, args.scene_id, args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
