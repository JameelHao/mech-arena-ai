#!/usr/bin/env python3
"""
Crop player portrait assets from the portrait source reference image.

Source: src/assets/reference/player-portrait-source.jpg
Output: src/assets/portraits/player-{normal,angry,defeated}.png

Each portrait is 64x64 with a blue background/frame in portrait-strip style,
matching the visual style of the enemy (water) portraits but with a distinct
blue color scheme.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageEnhance
    import numpy as np
except ImportError:
    print("Error: Pillow and numpy are required. Install with: pip install Pillow numpy")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE = REPO_ROOT / "src/assets/reference/player-portrait-source.jpg"
OUTPUT_DIR = REPO_ROOT / "src/assets/portraits"
PROOF_DIR = REPO_ROOT / "docs"

# Head crop region from source (determined by content analysis)
HEAD_CROP = (123, 12, 255, 144)
HEAD_SIZE = 58  # resize before placing on canvas
FRAME_W = 3

# Color schemes per state
STYLES = {
    "normal": {
        "frame": (45, 65, 120),
        "bg": (25, 40, 85),
        "color_enhance": 1.0,
        "brightness": 1.0,
        "red_boost": 0,
    },
    "angry": {
        "frame": (80, 50, 110),
        "bg": (40, 30, 80),
        "color_enhance": 1.4,
        "brightness": 0.85,
        "red_boost": 15,
    },
    "defeated": {
        "frame": (35, 40, 60),
        "bg": (20, 25, 45),
        "color_enhance": 0.3,
        "brightness": 0.5,
        "red_boost": 0,
    },
}


def make_portrait(head_img: Image.Image, style: dict) -> Image.Image:
    """Create a 64x64 portrait with colored background and frame."""
    # Apply color/brightness adjustments to head
    adjusted = head_img.copy()
    if style["color_enhance"] != 1.0:
        adjusted = ImageEnhance.Color(adjusted).enhance(style["color_enhance"])
    if style["brightness"] != 1.0:
        adjusted = ImageEnhance.Brightness(adjusted).enhance(style["brightness"])

    # Build canvas with frame + background
    canvas = Image.new("RGB", (64, 64), style["frame"])
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([FRAME_W, FRAME_W, 63 - FRAME_W, 63 - FRAME_W], fill=style["bg"])

    # Remove black background from head via alpha masking
    head_rgba = adjusted.convert("RGBA")
    head_arr = np.array(head_rgba)
    black_mask = np.all(head_arr[:, :, :3] < 25, axis=2)
    head_arr[black_mask, 3] = 0
    head_processed = Image.fromarray(head_arr)

    # Center head on canvas
    ox = (64 - head_processed.width) // 2
    oy = (64 - head_processed.height) // 2
    canvas.paste(head_processed, (ox, oy), head_processed)

    # Apply red boost for angry state
    if style["red_boost"] > 0:
        canvas_arr = np.array(canvas).astype(np.float32)
        canvas_arr[:, :, 0] = np.clip(canvas_arr[:, :, 0] * 1.2 + style["red_boost"], 0, 255)
        canvas = Image.fromarray(canvas_arr.astype(np.uint8))

    return canvas


def generate_proof(src: Image.Image, portraits: dict[str, Image.Image]) -> None:
    """Generate a proof image showing source, crop region, and resulting portraits."""
    src_rgb = src.convert("RGB")
    sw, sh = src_rgb.size

    # Canvas: source (256) + gap (16) + portraits column (64*3 + gaps)
    margin = 16
    canvas_w = sw + margin + 64
    canvas_h = max(sh, 64 * 3 + margin * 2)
    canvas = Image.new("RGB", (canvas_w, canvas_h), (30, 30, 30))

    # Draw source image
    canvas.paste(src_rgb, (0, 0))

    # Draw crop region rectangle on source
    draw = ImageDraw.Draw(canvas)
    x0, y0, x1, y1 = HEAD_CROP
    draw.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(255, 0, 0), width=2)

    # Draw label
    draw.text((x0, max(0, y0 - 12)), "CROP", fill=(255, 0, 0))

    # Draw resulting portraits on the right
    px = sw + margin
    for i, (state, portrait) in enumerate(portraits.items()):
        py = i * (64 + margin)
        canvas.paste(portrait, (px, py))
        draw.text((px, py + 66), state, fill=(200, 200, 200))

    PROOF_DIR.mkdir(parents=True, exist_ok=True)
    proof_path = PROOF_DIR / "portrait-crop-proof.png"
    canvas.save(proof_path)
    print(f"  Proof image saved: {proof_path.relative_to(REPO_ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Crop player portraits from source.")
    parser.add_argument("--proof", action="store_true", help="Generate crop proof image")
    args = parser.parse_args()

    if not SOURCE.exists():
        print(f"Error: Source file not found: {SOURCE}")
        sys.exit(1)

    src = Image.open(SOURCE).convert("RGBA")
    head = src.crop(HEAD_CROP).resize((HEAD_SIZE, HEAD_SIZE), Image.LANCZOS)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    portraits: dict[str, Image.Image] = {}
    for state, style in STYLES.items():
        portrait = make_portrait(head, style)
        out_path = OUTPUT_DIR / f"player-{state}.png"
        portrait.save(out_path)
        portraits[state] = portrait
        print(f"  {out_path.relative_to(REPO_ROOT)}: {portrait.size} {portrait.mode}")

    if args.proof:
        generate_proof(src, portraits)

    print("Done: all player portraits generated from portrait strip source.")


if __name__ == "__main__":
    main()
