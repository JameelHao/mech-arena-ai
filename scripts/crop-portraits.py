#!/usr/bin/env python3
"""
Generate portrait state variants from final portrait source files.

Sources:
  - src/assets/portraits/final-player-falcon-unit.png  (FALCON UNIT, player)
  - src/assets/portraits/final-enemy-venom-battalion.png (VENOM BATTALION, enemy)

Outputs:
  - src/assets/portraits/player-{normal,angry,defeated}.png
  - src/assets/portraits/water-{normal,angry,defeated}.png

Each portrait is 64x64 RGB. State variants apply color/brightness effects.
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
PORTRAIT_DIR = REPO_ROOT / "src/assets/portraits"
PROOF_DIR = REPO_ROOT / "docs"

# Final portrait source files (single source of truth)
PLAYER_SOURCE = PORTRAIT_DIR / "final-player-falcon-unit.png"
ENEMY_SOURCE = PORTRAIT_DIR / "final-enemy-venom-battalion.png"


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
    player_src: Image.Image,
    enemy_src: Image.Image,
    player_variants: dict[str, Image.Image],
    enemy_variants: dict[str, Image.Image],
) -> None:
    """Generate proof image showing sources and all state variants."""
    margin = 12
    label_h = 16
    # Layout: two rows (player + enemy), each with source + 3 variants
    row_h = 64 + label_h
    canvas_w = 64 + margin + 3 * (64 + margin)
    canvas_h = 2 * row_h + margin
    canvas = Image.new("RGB", (canvas_w, canvas_h), (30, 30, 30))
    draw = ImageDraw.Draw(canvas)

    # Player row
    canvas.paste(player_src.convert("RGB").resize((64, 64)), (0, 0))
    draw.text((0, 64), "FALCON UNIT", fill=(100, 180, 255))
    for i, (state, variant) in enumerate(player_variants.items()):
        x = 64 + margin + i * (64 + margin)
        canvas.paste(variant, (x, 0))
        draw.text((x, 64), state, fill=(200, 200, 200))

    # Enemy row
    y_off = row_h + margin
    canvas.paste(enemy_src.convert("RGB").resize((64, 64)), (0, y_off))
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

    for src_path, label in [(PLAYER_SOURCE, "player"), (ENEMY_SOURCE, "enemy")]:
        if not src_path.exists():
            print(f"Error: {label} source not found: {src_path}")
            sys.exit(1)

    player_src = Image.open(PLAYER_SOURCE)
    enemy_src = Image.open(ENEMY_SOURCE)

    STATES = ["normal", "angry", "defeated"]
    MAPPINGS = [
        (player_src, "player", STATES),
        (enemy_src, "water", STATES),
    ]

    player_variants: dict[str, Image.Image] = {}
    enemy_variants: dict[str, Image.Image] = {}

    for src_img, prefix, states in MAPPINGS:
        variants = player_variants if prefix == "player" else enemy_variants
        for state in states:
            variant = make_state_variant(src_img, state)
            out_path = PORTRAIT_DIR / f"{prefix}-{state}.png"
            variant.save(out_path)
            variants[state] = variant
            print(f"  {out_path.relative_to(REPO_ROOT)}: {variant.size} {variant.mode}")

    if args.proof:
        generate_proof(player_src, enemy_src, player_variants, enemy_variants)

    print("Done: all portraits generated from final source files.")


if __name__ == "__main__":
    main()
