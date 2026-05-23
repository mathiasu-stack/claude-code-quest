"""Render character poses through the project's /play/test-poses.html
endpoint and save screenshots. Runs inside the Playwright Python Docker
image, with --network=host so we can reach the NAS's Web Station on
localhost:8888.

Default sweep: hero + ines × idle/walk/jump/dance/sit_idle ×
{front, three-quarter, side} views, walk sampled at multiple times.
Skip any cell whose animation isn't bound for that character (e.g.,
hero has no dance clip).

Output: /tmp/audit/{char}__{anim}__t{NN}__{view}.png  (mounted from host)
"""
import asyncio, sys, os
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("AUDIT_BASE_URL", "http://localhost:8888/play/test-poses.html")
OUT_DIR = Path(os.environ.get("AUDIT_OUT", "/out"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Anim presets: (char, anim, t, view, yaw)
def shots_for(char):
    out = []
    for view in ['front', 'three-quarter', 'side']:
        out.append((char, 'idle', 0.0, view, 0))
    # walk cycle sampling
    for t in [0.0, 0.25, 0.5, 0.75]:
        out.append((char, 'walk', t, 'side', 0))
    out.append((char, 'walk', 0.5, 'front', 0))
    out.append((char, 'jump', 0.3, 'side', 0))
    out.append((char, 'jump', 0.5, 'front', 0))
    # ines has these extras
    if char == 'ines':
        out.append((char, 'dance', 0.3, 'front', 0))
        out.append((char, 'dance', 0.6, 'three-quarter', 0))
        out.append((char, 'sit_idle', 0.5, 'three-quarter', 0))
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
        page.on("console", lambda m: print(f"  console[{m.type}]: {m.text}", flush=True) if m.type in ("error","warning") else None)

        ok = bad = 0
        for char, anim, t, view, yaw in shots:
            url = f"{BASE_URL}?char={char}&anim={anim}&t={t}&view={view}&yaw={yaw}"
            name = f"{char}__{anim}__t{int(t*100):02d}__{view}.png"
            outpath = OUT_DIR / name
            print(f"-> {name}", flush=True)
            try:
                await page.goto(url, wait_until="load", timeout=20000)
                # Wait for __poseReady === true
                ready = await page.wait_for_function(
                    "() => window.__poseReady === true || window.__poseReady === 'error'",
                    timeout=15000,
                )
                state = await page.evaluate("() => window.__poseReady")
                # Capture the rendered canvas (not the page chrome)
                canvas = await page.query_selector("canvas")
                if canvas:
                    await canvas.screenshot(path=str(outpath))
                else:
                    await page.screenshot(path=str(outpath), full_page=False)
                if state == 'error':
                    err = await page.evaluate("() => document.getElementById('err')?.textContent || ''")
                    print(f"   render reported error: {err[:200]}", flush=True)
                    bad += 1
                else:
                    ok += 1
            except Exception as e:
                print(f"   timeout/exception: {e}", flush=True)
                bad += 1
        print(f"DONE. ok={ok} bad={bad}", flush=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
