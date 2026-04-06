#!/usr/bin/env python3
"""
Generate portrait state variants from reference portrait JPG files.

Sources (read-only, do not modify):
  - src/assets/reference/portraits/final-player-falcon-unit.jpg
  - src/assets/reference/portraits/final-enemy-venom-battalion.jpg

Outputs:
  - src/assets/portraits/final-player-falcon-unit.png (64x64 base)
  - src/assets/portraits/final-enemy-venom-battalion.png (64x64 base)
  - src/assets/portraits/player-{normal,angry,defeated}.png
  - src/assets/portraits/water-{normal,angry,defeated}.png
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
REF_DIR = REPO_ROOT / "src/assets/reference/portraits"
PORTRAIT_DIR = REPO_ROOT / "src/assets/portraits"
PROOF_DIR = REPO_ROOT / "docs"

PLAYER_REF = REF_DIR / "final-player-falcon-unit.jpg"
ENEMY_REF = REF_DIR / "final-enemy-venom-battalion.jpg"


def center_crop_square(img: Image.Image) -> Image.Image:
    """Center-crop to square to avoid distortion on non-square sources."""
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def make_state_variant(base: Image.Image, state: str) -> Image.Image:
    """Apply state-specific visual effects to a 64x64 portrait."""
    img = base.copy().convert("RGB")
    if state == "normal":
        return img
    if state == "angry":
        img = ImageEnhance.Color(img).enhance(1.4)
        img = ImageEnhance.Brightness(img).enhance(0.85)
        arr = np.array(img).astype(np.float32)
        arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.2 + 15, 0, 255)
        return Image.fromarray(arr.astype(np.uint8))
    if state == "defeated":
        img = ImageEnhance.Color(img).enhance(0.3)
        img = ImageEnhance.Brightness(img).enhance(0.5)
        return img
    return img


def generate_proof(
    player_base: Image.Image,
    enemy_base: Image.Image,
    player_variants: dict[str, Image.Image],
    enemy_variants: dict[str, Image.Image],
) -> None:
    """Generate proof image showing sources and all state variants."""
    margin = 12
    label_h = 16
    row_h = 64 + label_h
    canvas_w = 64 + margin + 3 * (64 + margin)
    canvas_h = 2 * row_h + margin
    canvas = Image.new("RGB", (canvas_w, canvas_h), (30, 30, 30))
    draw = ImageDraw.Draw(canvas)

    # Player row
    canvas.paste(player_base, (0, 0))
    draw.text((0, 64), "FALCON UNIT", fill=(100, 180, 255))
    for i, (state, variant) in enumerate(player_variants.items()):
        x = 64 + margin + i * (64 + margin)
        canvas.paste(variant, (x, 0))
        draw.text((x, 64), state, fill=(200, 200, 200))

    # Enemy row
    y_off = row_h + margin
    canvas.paste(enemy_base, (0, y_off))
    draw.text((0, y_off + 64), "VENOM BTLN", fill=(255, 100, 100))
    for i, (state, variant) in enumerate(enemy_variants.items()):
        x = 64 + margin + i * (64 + margin)
        canvas.paste(variant, (x, y_off))
        draw.text((x, y_off + 64), state, fill=(200, 200, 200))

    PROOF_DIR.mkdir(parents=True, exist_ok=True)
    proof_path = PROOF_DIR / "portrait-crop-proof.png"
    canvas.save(proof_path)
    print(f"  Proof image saved: {proof_path.relative_to(REPO_ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate portrait state variants.")
    parser.add_argument("--proof", action="store_true", help="Generate proof image")
    args = parser.parse_args()

    for ref, label in [(PLAYER_REF, "player"), (ENEMY_REF, "enemy")]:
        if not ref.exists():
            print(f"Error: {label} reference not found: {ref}")
            sys.exit(1)

    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    STATES = ["normal", "angry", "defeated"]

    # Process player
    player_img = Image.open(PLAYER_REF).convert("RGB")
    player_base = center_crop_square(player_img).resize((64, 64), Image.LANCZOS)
    player_base.save(PORTRAIT_DIR / "final-player-falcon-unit.png")

    player_variants: dict[str, Image.Image] = {}
    for state in STATES:
        v = make_state_variant(player_base, state)
        v.save(PORTRAIT_DIR / f"player-{state}.png")
        player_variants[state] = v
        print(f"  player-{state}.png: {v.size} {v.mode}")

    # Process enemy
    enemy_img = Image.open(ENEMY_REF).convert("RGB")
    enemy_base = center_crop_square(enemy_img).resize((64, 64), Image.LANCZOS)
    enemy_base.save(PORTRAIT_DIR / "final-enemy-venom-battalion.png")

    enemy_variants: dict[str, Image.Image] = {}
    for state in STATES:
        v = make_state_variant(enemy_base, state)
        v.save(PORTRAIT_DIR / f"water-{state}.png")
        enemy_variants[state] = v
        print(f"  water-{state}.png: {v.size} {v.mode}")

    if args.proof:
        generate_proof(player_base, enemy_base, player_variants, enemy_variants)

    print("Done: all portraits generated from reference JPG files.")


if __name__ == "__main__":
    main()
