#!/usr/bin/env python3
"""Frame raw Simulator captures into App Store marketing screenshots.

Usage (from cosmic-drift/store):  python3 frame_screenshots.py [QUICKSAND_TTF]

Reads  screenshots/raw/<device>-NN-name.png   (native Simulator resolution)
Writes screenshots/final/<device>-NN-name.png (Apple's required sizes):
  iphone  1320 x 2868  (6.9-inch iPhone)
  ipad    2064 x 2752  (13-inch iPad)

Each final is the raw capture on a dark navy background with one caption line
above it. The caption sits in its own band, so it never covers the game.
Quicksand ships in ../vendor/fonts as a woff2; Pillow cannot read woff2, so pass
a TTF conversion (fontTools + brotli:  TTFont(woff2).save(ttf) after setting
flavor = None). Without one, a system rounded sans is used.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "screenshots", "raw")
FINAL = os.path.join(HERE, "screenshots", "final")

NAVY = (11, 12, 26)          # #0b0c1a, STYLE_GUIDE.md
TEXT = (232, 238, 255)
ACCENT = (128, 221, 255)     # #80ddff, the game's cyan

# device -> canvas size, caption band height, bottom margin, side margin,
# screen corner radius as a fraction of the screenshot width, caption px
DEVICES = {
    "iphone": dict(size=(1320, 2868), top=330, bottom=150, side=120, corner=0.115, font=124),
    "ipad": dict(size=(2064, 2752), top=300, bottom=130, side=140, corner=0.030, font=150),
}

# file stem (after the device prefix) -> caption
CAPTIONS = {
    "01-chain-reaction": "Fire. Chain. Clear.",
    "02-workshop-splash": "Meet the Workshop",
    "03-level-builder": "Build your own levels",
    "04-block-designer": "Design every block",
    "05-hangar": "Your ship, your rules",
    "06-level-clear": "Clear it. Climb higher.",
    "07-splash": "A block shooter puzzle",
    "08-paywall": "One purchase. No subscription.",
}

FALLBACKS = [
    "/System/Library/Fonts/SFNSRounded.ttf",
    "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def load_font(path, px):
    if path and os.path.exists(path):
        f = ImageFont.truetype(path, px)
        try:
            f.set_variation_by_axes([700])  # Quicksand wght axis: bold
        except Exception:
            pass
        return f
    for p in FALLBACKS:
        if os.path.exists(p):
            return ImageFont.truetype(p, px)
    return ImageFont.load_default()


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    return m


def compose(raw_path, out_path, caption, cfg, ttf):
    W, H = cfg["size"]
    raw = Image.open(raw_path).convert("RGB")
    canvas = Image.new("RGB", (W, H), NAVY)

    # soft cyan glow behind the device so the dark UI reads on the dark ground
    avail_w = W - 2 * cfg["side"]
    avail_h = H - cfg["top"] - cfg["bottom"]
    scale = min(avail_w / raw.width, avail_h / raw.height)
    sw, sh = round(raw.width * scale), round(raw.height * scale)
    shot = raw.resize((sw, sh), Image.LANCZOS)
    x = (W - sw) // 2
    y = cfg["top"] + (avail_h - sh) // 2
    r = round(sw * cfg["corner"])

    glow = Image.new("RGB", (W, H), NAVY)
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((x - 6, y - 6, x + sw + 6, y + sh + 6), r + 6, fill=(34, 58, 96))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    canvas = Image.blend(canvas, glow, 0.85)

    # hairline frame, then the capture
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x - 4, y - 4, x + sw + 3, y + sh + 3), r + 4, fill=(54, 64, 98))
    canvas.paste(shot, (x, y), rounded_mask((sw, sh), r))

    # caption, centred in the band above the capture
    font = load_font(ttf, cfg["font"])
    max_w = W - 2 * cfg["side"]
    while d.textlength(caption, font=font) > max_w and font.size > 40:
        font = load_font(ttf, font.size - 4)
    tw = d.textlength(caption, font=font)
    bbox = d.textbbox((0, 0), caption, font=font)
    th = bbox[3] - bbox[1]
    ty = (cfg["top"] - th) // 2 - bbox[1] - 18
    d.text(((W - tw) / 2, ty), caption, font=font, fill=TEXT)
    bar_w = round(W * 0.09)
    by = ty + bbox[3] + 34
    d.rounded_rectangle(((W - bar_w) // 2, by, (W + bar_w) // 2, by + 8), 4, fill=ACCENT)

    canvas.save(out_path, "PNG", optimize=True)
    return canvas.size


def main():
    ttf = sys.argv[1] if len(sys.argv) > 1 else None
    os.makedirs(FINAL, exist_ok=True)
    made = 0
    for name in sorted(os.listdir(RAW)):
        if not name.endswith(".png"):
            continue
        stem = name[:-4]
        device, _, rest = stem.partition("-")
        if device not in DEVICES or rest not in CAPTIONS:
            print("skip", name)
            continue
        size = compose(os.path.join(RAW, name), os.path.join(FINAL, name),
                       CAPTIONS[rest], DEVICES[device], ttf)
        print(f"{name}: {size[0]}x{size[1]}")
        made += 1
    print(made, "framed")


if __name__ == "__main__":
    main()
