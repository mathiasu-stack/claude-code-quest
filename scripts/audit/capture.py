"""Render character poses across animations and time points. Validates
the live game's character rendering matches what the audit screenshots
show (i.e., no phase drift, no per-anim variance).
"""
import asyncio, os
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("AUDIT_BASE_URL", "http://localhost:8888/test-poses.html")
OUT_DIR = Path(os.environ.get("AUDIT_OUT", "/out"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

# (char, anim, t, view)
def shots_for(char):
    out = []
    # idle at multiple time points + 3 views
    for t in [0.0, 0.25, 0.5, 0.75]:
        out.append((char, 'idle', t, 'front'))
    out.append((char, 'idle', 0.0, 'three-quarter'))
    out.append((char, 'idle', 0.0, 'side'))
    # walk cycle
    for t in [0.0, 0.25, 0.5, 0.75]:
        out.append((char, 'walk', t, 'side'))
    out.append((char, 'walk', 0.5, 'front'))
    # jump
    out.append((char, 'jump', 0.3, 'side'))
    out.append((char, 'jump', 0.5, 'front'))
    if char == 'ines':
        out.append((char, 'dance', 0.3, 'front'))
        out.append((char, 'dance', 0.6, 'three-quarter'))
        out.append((char, 'sit_idle', 0.5, 'three-quarter'))
    return out

async def main():
    chars = os.environ.get("AUDIT_CHARS", "hero,ines").split(",")
    shots = []
    for c in chars:
        shots.extend(shots_for(c.strip()))
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        ctx = await browser.new_context(viewport={"width": 720, "height": 900})
        page = await ctx.new_page()
        page.on("pageerror", lambda e: print(f"  PAGE ERROR: {e}", flush=True))
        page.on("console", lambda m: print(f"  console[{m.type}]: {m.text}", flush=True)
                if m.type in ("error","warning") else None)
        for char, anim, t, view in shots:
            url = f"{BASE_URL}?char={char}&anim={anim}&t={t}&view={view}"
            name = f"{char}__{anim}__t{int(t*100):02d}__{view}.png"
            outpath = OUT_DIR / name
            print(f"-> {name}", flush=True)
            try:
                await page.goto(url, wait_until="load", timeout=20000)
                await page.wait_for_function(
                    "() => window.__poseReady === true || window.__poseReady === 'error'",
                    timeout=15000,
                )
                canvas = await page.query_selector("canvas")
                if canvas:
                    await canvas.screenshot(path=str(outpath))
            except Exception as e:
                print(f"   exception: {e}", flush=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
