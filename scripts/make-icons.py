"""Draw the Marketing Madness app icons: a mint board on the original green."""

import struct
import zlib
from pathlib import Path

GREEN = (0, 115, 0, 255)
MINT = (204, 255, 204, 255)


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int, pixels: bytearray) -> None:
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        raw.extend(pixels[y * size * 4 : (y + 1) * size * 4])
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def rounded(pixels: bytearray, size: int, x: float, y: float, w: float, h: float, color: tuple[int, int, int, int], radius: float) -> None:
    x0, y0, x1, y1 = int(x), int(y), int(x + w), int(y + h)
    for yy in range(max(0, y0), min(size, y1)):
        for xx in range(max(0, x0), min(size, x1)):
            dx = dy = 0.0
            if xx < x0 + radius and yy < y0 + radius:
                dx, dy = x0 + radius - xx, y0 + radius - yy
            elif xx >= x1 - radius and yy < y0 + radius:
                dx, dy = xx - (x1 - radius - 1), y0 + radius - yy
            elif xx < x0 + radius and yy >= y1 - radius:
                dx, dy = x0 + radius - xx, yy - (y1 - radius - 1)
            elif xx >= x1 - radius and yy >= y1 - radius:
                dx, dy = xx - (x1 - radius - 1), yy - (y1 - radius - 1)
            if dx * dx + dy * dy > radius * radius:
                continue
            i = (yy * size + xx) * 4
            pixels[i : i + 4] = bytes(color)


def icon(size: int) -> bytearray:
    pixels = bytearray(size * size * 4)
    for i in range(size * size):
        pixels[i * 4 : i * 4 + 4] = bytes(GREEN)
    margin = int(size * 0.18)
    inner = size - margin * 2
    rows, gaps = 5, 5
    gap = max(2, size // 70)
    tile = (inner - gap * gaps) / 7.4
    cat_w = tile * 2.4
    row_h = (inner - gap * (rows - 1)) / rows
    radius = max(2, size // 55)
    top = margin
    for _ in range(rows):
        left = margin
        rounded(pixels, size, left, top, cat_w, row_h, MINT, radius)
        left += cat_w + gap
        for _col in range(5):
            rounded(pixels, size, left, top, tile, row_h, MINT, radius)
            left += tile + gap
        top += row_h + gap
    return pixels


if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "public" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    write_png(out / "icon-192.png", 192, icon(192))
    write_png(out / "icon-512.png", 512, icon(512))
    write_png(out / "icon-512-maskable.png", 512, icon(512))
    print(f"Wrote icons to {out}")
