#!/usr/bin/env python3
"""Crop player portraits from the reference source image.

Reads src/assets/reference/player-portrait-source.png (256x256 fire-mech sprite)
and extracts the head region, then resizes to 64x64 for each portrait state.

Output:
  src/assets/portraits/player-normal.png
  src/assets/portraits/player-angry.png
  src/assets/portraits/player-defeated.png

Requires: Pillow (`pip install Pillow`)
"""

from pathlib import Path

from PIL import Image, ImageEnhance

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE = REPO_ROOT / "src" / "assets" / "reference" / "player-portrait-source.png"
OUTPUT_DIR = REPO_ROOT / "src" / "assets" / "portraits"

# Head region of the 256x256 fire-mech sprite (top-center crop box)
HEAD_BOX = (64, 0, 192, 128)  # left, upper, right, lower → 128x128 region
PORTRAIT_SIZE = (64, 64)


def crop_portrait(src: Image.Image, box: tuple, size: tuple) -> Image.Image:
    """Crop a region and resize to the target portrait size."""
    cropped = src.crop(box)
    return cropped.resize(size, Image.NEAREST)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Source image not found: {SOURCE}")

    src = Image.open(SOURCE).convert("RGBA")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Normal portrait — direct crop from head region
    normal = crop_portrait(src, HEAD_BOX, PORTRAIT_SIZE)
    normal.save(OUTPUT_DIR / "player-normal.png")

    # Angry portrait — slight red tint shift
    angry = crop_portrait(src, HEAD_BOX, PORTRAIT_SIZE)
    r, g, b, a = angry.split()
    r = r.point(lambda x: min(255, int(x * 1.2)))
    angry = Image.merge("RGBA", (r, g, b, a))
    enhancer = ImageEnhance.Contrast(angry)
    angry = enhancer.enhance(1.15)
    angry.save(OUTPUT_DIR / "player-angry.png")

    # Defeated portrait — desaturated / dimmed
    defeated = crop_portrait(src, HEAD_BOX, PORTRAIT_SIZE)
    enhancer = ImageEnhance.Color(defeated)
    defeated = enhancer.enhance(0.5)
    enhancer = ImageEnhance.Brightness(defeated)
    defeated = enhancer.enhance(0.75)
    defeated.save(OUTPUT_DIR / "player-defeated.png")

    print("Player portraits generated:")
    for name in ("player-normal.png", "player-angry.png", "player-defeated.png"):
        path = OUTPUT_DIR / name
        print(f"  {path.relative_to(REPO_ROOT)}  ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
