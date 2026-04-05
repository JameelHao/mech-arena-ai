"""
Crop player portraits from the fire mech sprite.

The fire mech sprite (src/assets/mechs/fire-mech.png) is the source of truth
for the orange/yellow player mech. This script:
1. Saves the source as reference/player-portrait-source.jpg
2. Crops the head region to create 64x64 portraits
3. Applies color tints for angry/defeated states
"""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

REPO = Path(__file__).resolve().parent.parent
MECH_SRC = REPO / "src" / "assets" / "mechs" / "fire-mech.png"
REF_DST = REPO / "src" / "assets" / "reference" / "player-portrait-source.jpg"
PORTRAIT_DIR = REPO / "src" / "assets" / "portraits"

PORTRAIT_SIZE = 64


def crop_head(img: Image.Image) -> Image.Image:
    """Crop the head/upper-body region from the mech sprite.

    The fire mech bounding box is roughly top=41, left=72, right=253, bottom=216.
    The head/cockpit area is in the upper portion of this bounding box.
    We crop a square around the head region for the portrait.
    """
    import numpy as np

    arr = np.array(img)
    alpha = arr[:, :, 3]
    rows = np.where(np.any(alpha > 10, axis=1))[0]
    cols = np.where(np.any(alpha > 10, axis=0))[0]
    top, bottom = rows[0], rows[-1]
    left, right = cols[0], cols[-1]

    content_w = right - left
    content_h = bottom - top

    # Head is roughly the top 45% of the mech content, centered horizontally
    head_h = int(content_h * 0.45)
    head_top = top
    head_bottom = top + head_h
    head_cx = (left + right) // 2
    half = head_h // 2
    head_left = max(0, head_cx - half)
    head_right = head_left + head_h

    head = img.crop((head_left, head_top, head_right, head_bottom))
    return head.resize((PORTRAIT_SIZE, PORTRAIT_SIZE), Image.NEAREST)


def make_angry(portrait: Image.Image) -> Image.Image:
    """Apply a slight red tint and increase contrast for angry state."""
    img = portrait.copy()
    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.3)
    # Slight red/warm shift
    r, g, b, a = img.split()
    r = r.point(lambda x: min(255, int(x * 1.15)))
    g = g.point(lambda x: int(x * 0.9))
    return Image.merge("RGBA", (r, g, b, a))


def make_defeated(portrait: Image.Image) -> Image.Image:
    """Desaturate and darken for defeated state."""
    img = portrait.copy()
    # Reduce brightness
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(0.6)
    # Reduce saturation
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(0.4)
    return img


def main():
    mech = Image.open(MECH_SRC).convert("RGBA")
    print(f"Source mech: {mech.size}")

    # Step 1: Save source reference as JPG
    ref_rgb = mech.convert("RGB")
    ref_rgb.save(REF_DST, "JPEG", quality=95)
    print(f"Saved reference: {REF_DST}")

    # Step 2: Crop head and generate portraits
    head = crop_head(mech)

    # Normal
    normal_path = PORTRAIT_DIR / "player-normal.png"
    head.save(normal_path)
    print(f"Saved: {normal_path}")

    # Angry
    angry = make_angry(head)
    angry_path = PORTRAIT_DIR / "player-angry.png"
    angry.save(angry_path)
    print(f"Saved: {angry_path}")

    # Defeated
    defeated = make_defeated(head)
    defeated_path = PORTRAIT_DIR / "player-defeated.png"
    defeated.save(defeated_path)
    print(f"Saved: {defeated_path}")

    print("Done — player portraits regenerated from fire mech sprite.")


if __name__ == "__main__":
    main()
