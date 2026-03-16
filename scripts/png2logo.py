#!/usr/bin/env python3
"""
Convert a PNG/JPG image to an SVG logo with animated gold shimmer gradient.
Uses potrace for bitmap-to-vector tracing.

Usage:
    python3 scripts/png2logo.py <input_image> [--output <path>] [--threshold <0-255>] [--duration <seconds>]

Examples:
    python3 scripts/png2logo.py ~/Downloads/logo.png
    python3 scripts/png2logo.py ~/Downloads/logo.png --threshold 200 --duration 6
    python3 scripts/png2logo.py ~/Downloads/logo.png --output frontend/public/nav-logo.svg
"""

import argparse
import os
import platform
import re
import subprocess
import sys
import tarfile
import tempfile
import urllib.request

from PIL import Image

POTRACE_VERSION = "1.16"
POTRACE_DIR = os.path.join(tempfile.gettempdir(), f"potrace-{POTRACE_VERSION}.linux-x86_64")
POTRACE_BIN = os.path.join(POTRACE_DIR, "potrace")
POTRACE_URL = f"https://potrace.sourceforge.net/download/{POTRACE_VERSION}/potrace-{POTRACE_VERSION}.linux-x86_64.tar.gz"

DEFAULT_OUTPUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "public", "logo.svg",
)


def ensure_potrace():
    """Download potrace binary if not already available."""
    if os.path.isfile(POTRACE_BIN):
        return POTRACE_BIN

    # Check if potrace is installed system-wide
    from shutil import which
    system_potrace = which("potrace")
    if system_potrace:
        return system_potrace

    if platform.system() != "Linux" or platform.machine() not in ("x86_64", "AMD64"):
        print("Auto-download only supports Linux x86_64. Install potrace manually.")
        sys.exit(1)

    print(f"Downloading potrace {POTRACE_VERSION}...")
    tarball = os.path.join(tempfile.gettempdir(), "potrace.tar.gz")
    urllib.request.urlretrieve(POTRACE_URL, tarball)
    with tarfile.open(tarball, "r:gz") as tar:
        tar.extractall(tempfile.gettempdir())
    os.remove(tarball)

    if not os.path.isfile(POTRACE_BIN):
        print("Failed to extract potrace binary.")
        sys.exit(1)

    os.chmod(POTRACE_BIN, 0o755)
    print("potrace ready.")
    return POTRACE_BIN


def image_to_bmp(input_path, threshold):
    """Convert input image to a 1-bit BMP suitable for potrace."""
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    gray = Image.new("L", (w, h))
    gpx = gray.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            gpx[x, y] = int(0.299 * r + 0.587 * g + 0.114 * b)

    bmp = Image.new("1", (w, h))
    bpx = bmp.load()
    for y in range(h):
        for x in range(w):
            bpx[x, y] = 0 if gpx[x, y] < threshold else 255

    bmp_path = os.path.join(tempfile.gettempdir(), "logo_trace.bmp")
    bmp.save(bmp_path)
    print(f"Bitmap created: {w}x{h}, threshold={threshold}")
    return bmp_path


def trace_to_svg(potrace_bin, bmp_path):
    """Run potrace to convert BMP to raw SVG."""
    raw_svg = os.path.join(tempfile.gettempdir(), "logo_raw.svg")
    subprocess.run(
        [potrace_bin, bmp_path, "-s", "-o", raw_svg, "--tight", "--alphamax", "1.0", "--opttolerance", "0.2"],
        check=True,
    )
    with open(raw_svg, "r") as f:
        svg = f.read()
    os.remove(raw_svg)
    return svg


def add_shimmer_gradient(raw_svg, duration):
    """Replace the fill with an animated gold shimmer gradient."""
    vb_match = re.search(r'viewBox="([^"]+)"', raw_svg)
    if not vb_match:
        print("Could not parse SVG viewBox.")
        sys.exit(1)
    vb = vb_match.group(1)
    vb_width = int(float(vb.split()[2]))

    g_match = re.search(r'(<g transform[^>]+>.*?</g>)', raw_svg, re.DOTALL)
    if not g_match:
        print("Could not parse SVG path group.")
        sys.exit(1)
    g_content = g_match.group(1)

    g_content = g_content.replace('fill="#000000"', 'fill="url(#goldGrad)"')
    if 'fill=' not in g_content.split('>')[0]:
        g_content = g_content.replace('<g ', '<g fill="url(#goldGrad)" ', 1)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" preserveAspectRatio="xMidYMid meet">
<defs>
  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="200%" y2="0%" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#b8942a"/>
    <stop offset="12.5%" stop-color="#D4AF37"/>
    <stop offset="25%" stop-color="#e8d48b"/>
    <stop offset="37.5%" stop-color="#D4AF37"/>
    <stop offset="50%" stop-color="#b8942a"/>
    <stop offset="62.5%" stop-color="#D4AF37"/>
    <stop offset="75%" stop-color="#e8d48b"/>
    <stop offset="87.5%" stop-color="#D4AF37"/>
    <stop offset="100%" stop-color="#b8942a"/>
    <animateTransform attributeName="gradientTransform" type="translate" from="-{vb_width} 0" to="0 0" dur="{duration}s" repeatCount="indefinite"/>
  </linearGradient>
</defs>
{g_content}
</svg>'''


def main():
    parser = argparse.ArgumentParser(description="Convert an image to an SVG logo with animated gold shimmer.")
    parser.add_argument("input", help="Path to the input image (PNG, JPG, etc.)")
    parser.add_argument("--output", "-o", default=DEFAULT_OUTPUT, help=f"Output SVG path (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--threshold", "-t", type=int, default=210, help="Grayscale threshold 0-255 to separate foreground from background (default: 210)")
    parser.add_argument("--duration", "-d", type=float, default=4.0, help="Shimmer animation duration in seconds (default: 4)")
    args = parser.parse_args()

    if not os.path.isfile(args.input):
        print(f"Input file not found: {args.input}")
        sys.exit(1)

    potrace_bin = ensure_potrace()
    bmp_path = image_to_bmp(args.input, args.threshold)
    raw_svg = trace_to_svg(potrace_bin, bmp_path)
    os.remove(bmp_path)
    final_svg = add_shimmer_gradient(raw_svg, args.duration)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w") as f:
        f.write(final_svg)

    size_kb = len(final_svg) / 1024
    print(f"Logo saved: {args.output} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
