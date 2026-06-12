#!/usr/bin/env python3
"""Generate per-rig clothing-recolor texture variants for the NPC cast.

Each ethnicity rig GLB has one baked base-color atlas shared by skin,
hair and clothing. This script extracts that atlas, isolates the
shirt/clothing pixels by hue-saturation selection, and writes ~4
recolored jpg variants per rig (mustard / purple / charcoal / teal /
burgundy, minus whichever is closest to the rig's own base shirt).
Skin, hair and face pixels are left untouched (verified by diffing the
region outside the dilated clothing mask).

Usage:
    python3 scripts/gen_clothing_variants.py inspect            # atlas stats per rig
    python3 scripts/gen_clothing_variants.py inspect <rig>      # detailed hue histogram
    python3 scripts/gen_clothing_variants.py generate           # write jpgs; if ALL verify, also wires manifest.json
    python3 scripts/gen_clothing_variants.py verify             # re-check skin invariance of written variants
    python3 scripts/gen_clothing_variants.py wire               # patch manifest.json textureVariants (idempotent)

Output files: play/assets/characters/<rig>_v1.jpg .. _v4.jpg (q85).
Code side (already wired): gltfCharacter.js picks hash(npcId) % (n+1),
outcome 0 keeps the original baked atlas.
"""
import io
import json
import math
import os
import struct
import sys

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'play', 'assets', 'characters')

RIGS = [
    'western_male', 'western_female', 'african_male', 'african_female',
    'easian_male', 'easian_female', 'sasian_male', 'sasian_female',
    'hijab_female', 'arab_male',
]

# Office-plausible but distinct target colors (sRGB).
PALETTE = {
    'mustard':  (200, 156, 42),
    'purple':   (112, 62, 160),
    'charcoal': (52, 54, 60),
    'teal':     (24, 126, 116),
    'burgundy': (128, 32, 48),
}

# Per-rig shirt selector overrides, filled in after `inspect`.
#   hue: (lo, hi) degrees, wraps if lo > hi
#   sat_min / sat_max, val_min / val_max: 0..1 bounds
#   white: True -> select low-sat bright pixels (collared white shirt)
# When a rig has no entry, auto-detection picks the dominant saturated
# non-skin hue band.
#
# Atlas findings (from preview overlays): every rig wears a DARK NAVY
# garment (men's shirts, women's trousers) and the women also wear a
# PALE BLUE blouse. Men: select the navy shirt — val_min 0.06 keeps
# bluish-black hair (v≈0.05) out of the mask. Women: select the pale
# blue blouse — val_min 0.55 keeps the navy trousers out, sat_max 0.30
# keeps it out of pure-white trim, hue band keeps it off peach skin.
_MALE_NAVY = {'hue': (175, 265), 'sat_min': 0.05, 'sat_max': 0.85,
              'val_min': 0.06, 'val_max': 0.45}
_FEMALE_PALE_BLUE = {'hue': (185, 255), 'sat_min': 0.03, 'sat_max': 0.30,
                     'val_min': 0.55, 'val_max': 1.0}
# In-game check (2026-06-12): african/easian/sasian/arab males wear
# WHITE shirts with navy trousers — the navy mask was recoloring their
# pants. Only western_male wears navy on top (his white region is just
# the 3.2% collar), so he keeps the navy selector.
_MALE_WHITE_SHIRT = {'white': True, 'sat_max': 0.18, 'val_min': 0.55}
RIG_SHIRT = {
    'western_male':   dict(_MALE_NAVY),
    'african_male':   dict(_MALE_WHITE_SHIRT),
    'easian_male':    dict(_MALE_WHITE_SHIRT),
    'sasian_male':    dict(_MALE_WHITE_SHIRT),
    'arab_male':      dict(_MALE_WHITE_SHIRT),
    'western_female': dict(_FEMALE_PALE_BLUE),
    'african_female': dict(_FEMALE_PALE_BLUE),
    'easian_female':  dict(_FEMALE_PALE_BLUE),
    'sasian_female':  dict(_FEMALE_PALE_BLUE),
    'hijab_female':   dict(_FEMALE_PALE_BLUE),
}

SKIN_HUE = (3.0, 50.0)   # protected band: never select skin-tone hues


def parse_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, _ver, length = struct.unpack_from('<III', data, 0)
    if magic != 0x46546C67:
        raise ValueError(f'{path}: not a GLB')
    off = 12
    gltf = bin_chunk = None
    while off < length:
        clen, ctype = struct.unpack_from('<II', data, off)
        off += 8
        chunk = data[off:off + clen]
        if ctype == 0x4E4F534A:
            gltf = json.loads(chunk)
        elif ctype == 0x004E4942:
            bin_chunk = chunk
        off += clen
    return gltf, bin_chunk


def base_color_atlas(rig):
    """Returns (PIL RGB image, source mime) of the rig's baseColorTexture."""
    gltf, bin_chunk = parse_glb(os.path.join(ASSETS, rig + '.glb'))
    texs = gltf.get('textures', [])
    img_idx = None
    for m in gltf.get('materials', []):
        bct = m.get('pbrMetallicRoughness', {}).get('baseColorTexture')
        if bct is not None:
            img_idx = texs[bct['index']].get('source')
            break
    if img_idx is None:
        raise ValueError(f'{rig}: no baseColorTexture found')
    img = gltf['images'][img_idx]
    bv = gltf['bufferViews'][img['bufferView']]
    o = bv.get('byteOffset', 0)
    blob = bin_chunk[o:o + bv['byteLength']]
    return Image.open(io.BytesIO(blob)).convert('RGB'), img.get('mimeType', '?')


def _np():
    import numpy as np
    return np


def rgb_to_hsv_arrays(arr):
    """arr: float32 HxWx3 in 0..1 -> (h_deg, s, v) float32 arrays."""
    np = _np()
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    v = arr.max(axis=-1)
    mn = arr.min(axis=-1)
    c = v - mn
    s = np.where(v > 0, c / np.maximum(v, 1e-8), 0)
    h = np.zeros_like(v)
    m = (c > 1e-8)
    rm = m & (v == r)
    gm = m & (v == g) & ~rm
    bm = m & (v == b) & ~rm & ~gm
    h[rm] = (60 * ((g[rm] - b[rm]) / c[rm])) % 360
    h[gm] = 60 * ((b[gm] - r[gm]) / c[gm]) + 120
    h[bm] = 60 * ((r[bm] - g[bm]) / c[bm]) + 240
    return h, s, v


def hue_in(h, lo, hi):
    np = _np()
    if lo <= hi:
        return (h >= lo) & (h <= hi)
    return (h >= lo) | (h <= hi)


def shirt_mask(rig, arr):
    """Boolean HxW mask of clothing pixels + descriptive string."""
    np = _np()
    h, s, v = rgb_to_hsv_arrays(arr)
    cfg = RIG_SHIRT.get(rig)
    if cfg and cfg.get('white'):
        m = (s <= cfg.get('sat_max', 0.16)) & (v >= cfg.get('val_min', 0.6))
        # Morphological opening: low-sat-bright also catches tiny specks
        # like eye whites and teeth — erase anything thinner than ~7px
        # (shirt UV islands are hundreds of px and survive intact).
        mimg = Image.fromarray((m * 255).astype('uint8'), 'L')
        mimg = mimg.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.MaxFilter(15))
        m = np.asarray(mimg) > 127
        desc = 'white/low-sat (opened)'
    elif cfg:
        m = hue_in(h, *cfg['hue'])
        m &= (s >= cfg.get('sat_min', 0.22)) & (s <= cfg.get('sat_max', 1.0))
        m &= (v >= cfg.get('val_min', 0.06)) & (v <= cfg.get('val_max', 1.0))
        desc = f"hue {cfg['hue']}"
    else:
        # Auto: dominant 30-degree hue band among saturated non-skin pixels.
        cand = (s > 0.28) & (v > 0.10) & ~hue_in(h, *SKIN_HUE)
        if cand.sum() < 500:
            raise ValueError(f'{rig}: too few saturated non-skin pixels for auto-detect')
        hist, edges = np.histogram(h[cand], bins=36, range=(0, 360))
        peak = int(hist.argmax())
        lo = (edges[peak] - 12) % 360
        hi = (edges[peak + 1] + 12) % 360
        m = hue_in(h, lo, hi) & (s > 0.22) & (v > 0.06) & ~hue_in(h, *SKIN_HUE)
        desc = f'auto hue {lo:.0f}-{hi:.0f}'
    return m, desc


def mask_mean_color(arr, m):
    np = _np()
    if m.sum() == 0:
        return (0, 0, 0)
    return tuple((arr[m].mean(axis=0) * 255).round().astype(int))


def closest_palette(base_rgb):
    best, bd = None, 1e9
    for name, rgb in PALETTE.items():
        d = sum((a - b) ** 2 for a, b in zip(base_rgb, rgb))
        if d < bd:
            best, bd = name, d
    return best, bd


def recolor(arr, mask_f, target):
    """Luminance-preserving colorize inside the (feathered) mask."""
    np = _np()
    lum = arr[..., 0] * 0.299 + arr[..., 1] * 0.587 + arr[..., 2] * 0.114
    hard = mask_f > 0.5
    ref = max(float(lum[hard].mean()), 1e-3) if hard.any() else 0.5
    t = np.array(target, dtype='float32') / 255.0
    shade = np.clip(lum / ref, 0.0, 2.2)[..., None]
    out = np.clip(t[None, None, :] * shade, 0, 1)
    a = mask_f[..., None]
    return arr * (1 - a) + out * a


def build(rig, write=True, verbose=True):
    np = _np()
    img, mime = base_color_atlas(rig)
    arr = np.asarray(img, dtype='float32') / 255.0
    m, desc = shirt_mask(rig, arr)
    frac = m.mean()
    base_rgb = mask_mean_color(arr, m)
    # Only skip a palette color when the base garment is GENUINELY close
    # to it (e.g. navy shirt vs charcoal) — raw RGB distance otherwise
    # "skips" colors that look nothing like the garment (pale blue's
    # nearest neighbour is purple). Cap at 4 variants either way.
    skip, d2 = closest_palette(base_rgb)
    if d2 > 12000:
        skip = None
    variants = [k for k in PALETTE if k != skip][:4]
    if verbose:
        print(f'{rig}: atlas {img.size} {mime}, shirt={desc}, '
              f'{frac * 100:.1f}% px, base rgb{base_rgb}, skip={skip}, '
              f'variants={variants}')
    if frac < 0.02 or frac > 0.60:
        print(f'  !! {rig}: suspicious mask coverage {frac * 100:.1f}% — check selector')
    # Feather the mask 1px so jpg edges don't ring.
    mimg = Image.fromarray((m * 255).astype('uint8'), 'L').filter(ImageFilter.GaussianBlur(1.0))
    mask_f = np.asarray(mimg, dtype='float32') / 255.0
    # Pixels far from the mask must be byte-identical pre-encode.
    mask_f[mask_f < 0.02] = 0.0
    written = []
    for i, name in enumerate(variants, start=1):
        out = recolor(arr, mask_f, PALETTE[name])
        out_img = Image.fromarray((out * 255).round().astype('uint8'), 'RGB')
        # 1024² is plenty for NPC viewing distance and quarters the GPU
        # memory + download size vs the native 2048² atlas — full-size
        # variants made mobile loads (40 jpgs alongside ~150 MB of rig
        # GLBs) time out, dropping whole rigs to procedural fallback.
        out_img.thumbnail((1024, 1024), Image.LANCZOS)
        fn = f'{rig}_v{i}.jpg'
        if write:
            out_img.save(os.path.join(ASSETS, fn), quality=85)
        written.append((fn, name))
    return written, m


def verify(rig, m=None):
    """Skin invariance: outside the (generously dilated) mask, the variant
    must match a q85 JPEG ROUNDTRIP of the original — comparing against
    the raw PNG would count plain re-encode noise (~mean 2/255 across the
    whole image) as failure. JPEG is block-local, so pixels far from the
    recolored region encode identically and the diff there is ~0."""
    np = _np()
    img, _ = base_color_atlas(rig)
    if m is None:
        a01 = np.asarray(img, dtype='float32') / 255.0
        m, _d = shirt_mask(rig, a01)
    # Baseline per variant size: the original atlas resized the same way
    # the variant was, then JPEG-roundtripped. Outside the recolored
    # region the resampled pixels are identical, so the encoded blocks
    # match except at the mask boundary — which the 31px dilation
    # excludes.
    _cache = {}

    def _baseline(size):
        if size not in _cache:
            bi = img if img.size == size else img.resize(size, Image.LANCZOS)
            buf = io.BytesIO()
            bi.save(buf, format='JPEG', quality=85)
            base = np.asarray(Image.open(buf).convert('RGB'), dtype='float32')
            mi = Image.fromarray((m * 255).astype('uint8'), 'L')
            if mi.size != size:
                mi = mi.resize(size, Image.BILINEAR)
            dil = mi.point(lambda px: 255 if px > 0 else 0).filter(ImageFilter.MaxFilter(31))
            _cache[size] = (base, np.asarray(dil) == 0)
        return _cache[size]

    ok = True
    i = 1
    while True:
        p = os.path.join(ASSETS, f'{rig}_v{i}.jpg')
        if not os.path.exists(p):
            break
        vimg = Image.open(p).convert('RGB')
        base, outside = _baseline(vimg.size)
        var = np.asarray(vimg, dtype='float32')
        d = np.abs(var - base)[outside]
        mean_d, max_d = float(d.mean()), float(d.max())
        kb = os.path.getsize(p) // 1024
        status = 'ok' if (mean_d < 0.6 and max_d < 50) else 'FAIL'
        if status == 'FAIL':
            ok = False
        print(f'  {rig}_v{i}.jpg ({kb} KB): skin-region diff mean={mean_d:.2f} max={max_d:.0f} -> {status}')
        i += 1
    return ok


def inspect(rig=None):
    np = _np()
    for r in ([rig] if rig else RIGS):
        img, mime = base_color_atlas(r)
        arr = np.asarray(img, dtype='float32') / 255.0
        h, s, v = rgb_to_hsv_arrays(arr)
        print(f'== {r}: {img.size} {mime}')
        sat = (s > 0.25) & (v > 0.10)
        hist, edges = np.histogram(h[sat], bins=12, range=(0, 360))
        tot = max(int(sat.sum()), 1)
        for b in range(12):
            pct = hist[b] * 100.0 / tot
            if pct > 2:
                sel = sat & (h >= edges[b]) & (h < edges[b + 1])
                rgbm = tuple((arr[sel].mean(axis=0) * 255).round().astype(int))
                print(f'   hue {edges[b]:5.0f}-{edges[b+1]:5.0f}: {pct:5.1f}% of sat px, mean rgb{rgbm}')
        white = (s < 0.15) & (v > 0.65)
        print(f'   low-sat bright (white cloth?): {white.mean() * 100:.1f}% of atlas')
        try:
            _m, desc = shirt_mask(r, arr)
            print(f'   -> current selector: {desc}, {_m.mean() * 100:.1f}% of atlas')
        except ValueError as e:
            print(f'   -> selector error: {e}')


def preview(rig=None):
    """Write side-by-side (atlas | atlas with current shirt mask in red)
    previews to /tmp/ccq_atlas/<rig>.jpg for visual mask tuning."""
    np = _np()
    os.makedirs('/tmp/ccq_atlas', exist_ok=True)
    for r in ([rig] if rig else RIGS):
        img, _ = base_color_atlas(r)
        arr = np.asarray(img, dtype='float32') / 255.0
        try:
            m, desc = shirt_mask(r, arr)
        except ValueError as e:
            m = np.zeros(arr.shape[:2], dtype=bool)
            desc = f'error: {e}'
        over = arr.copy()
        over[m] = over[m] * 0.35 + np.array([1.0, 0.08, 0.08], dtype='float32') * 0.65
        side = np.concatenate([arr, over], axis=1)
        out = Image.fromarray((side * 255).round().astype('uint8'), 'RGB')
        out.thumbnail((1900, 950), Image.LANCZOS)
        out.save(f'/tmp/ccq_atlas/{r}.jpg', quality=88)
        print(f'/tmp/ccq_atlas/{r}.jpg  selector={desc}  coverage={m.mean()*100:.1f}%')


def wire_manifest():
    """Insert per-rig textureVariants arrays into manifest.json by targeted
    line edit (preserves the file's existing hand formatting). Idempotent.
    Only wires rigs whose 4 jpgs all exist on disk."""
    mpath = os.path.join(ASSETS, 'manifest.json')
    with open(mpath) as f:
        lines = f.readlines()
    cur = None
    out = []
    wired = []
    for line in lines:
        s = line.strip()
        if s.startswith('"id":'):
            cur = s.split('"')[3]
        out.append(line)
        if cur in RIGS and '"statureVary": true' in line and '"textureVariants"' not in ''.join(lines):
            files = [f'{cur}_v{i}.jpg' for i in range(1, 5)]
            if all(os.path.exists(os.path.join(ASSETS, fn)) for fn in files):
                indent = line[:len(line) - len(line.lstrip())]
                arr = ', '.join(f'"{fn}"' for fn in files)
                out.append(f'{indent}"textureVariants": [{arr}],\n')
                wired.append(cur)
            else:
                print(f'  !! {cur}: variant jpgs missing on disk — not wired')
    if '"textureVariants"' in ''.join(lines):
        print('manifest already has textureVariants — nothing to do')
        return
    with open(mpath, 'w') as f:
        f.writelines(out)
    json.load(open(mpath))  # sanity: still valid JSON
    print(f'manifest.json wired for: {wired}')


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'inspect'
    if mode == 'inspect':
        inspect(sys.argv[2] if len(sys.argv) > 2 else None)
    elif mode == 'generate':
        all_ok = True
        for r in RIGS:
            written, m = build(r)
            if not verify(r, m):
                all_ok = False
        print('\nverification:', 'ALL OK' if all_ok else 'FAILURES — see above')
        if all_ok:
            wire_manifest()
        else:
            print('manifest NOT wired — fix selectors (RIG_SHIRT) and re-run')
    elif mode == 'verify':
        all_ok = all(verify(r) for r in RIGS)
        print('verification:', 'ALL OK' if all_ok else 'FAILURES — see above')
    elif mode == 'preview':
        preview(sys.argv[2] if len(sys.argv) > 2 else None)
    elif mode == 'wire':
        wire_manifest()
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
