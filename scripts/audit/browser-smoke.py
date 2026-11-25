"""Browser smoke test for Claude Code Quest (runs inside the Playwright image).

Loads the 2D views and the 3D play view on floors 1 and 4, collecting every
console error, page error and failed request, plus screenshots. Run it with
scripts/audit/browser-smoke.sh (needs docker). Known pre-existing console
noise (present before 2026-11-25): a THREE Raycaster sprite warning and
"[buildPlayer] FACE MISSING".
"""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('BASE', 'http://127.0.0.1:8888/')
OUT = Path('/out'); OUT.mkdir(parents=True, exist_ok=True)
report = {'errors': [], 'failed': [], 'steps': []}


def hook(page, tag):
    page.on('console', lambda m: m.type == 'error' and report['errors'].append(f'[{tag}] console: {m.text[:300]}'))
    page.on('pageerror', lambda e: report['errors'].append(f'[{tag}] pageerror: {str(e)[:300]}'))
    page.on('requestfailed', lambda r: report['failed'].append(f'[{tag}] {r.url} {r.failure}'))
    page.on('response', lambda r: r.status >= 400 and report['failed'].append(f'[{tag}] HTTP {r.status} {r.url}'))


async def two_d(browser):
    ctx = await browser.new_context(viewport={'width': 1280, 'height': 900})
    page = await ctx.new_page(); hook(page, '2d')
    await page.goto(BASE, wait_until='networkidle')
    await page.evaluate("() => { try { App.navigate('dashboard'); } catch (e) {} }")
    await page.wait_for_timeout(800)
    await page.screenshot(path=str(OUT / '2d-dashboard.png'))
    await page.evaluate("() => App.navigate('lesson', { chapterId: 'ch10', lessonId: 'ch10-l03' })")
    await page.wait_for_timeout(600)
    txt = await page.inner_text('#main-content')
    report['steps'].append({'ch10-l03 shows Opus 5.5 $4': '$4 / $20' in txt, 'verified line': 'Checked against Claude Code' in txt})
    await page.screenshot(path=str(OUT / '2d-lesson-ch10-l03.png'), full_page=False)
    await page.evaluate("() => App.navigate('lesson', { chapterId: 'ch14', lessonId: 'ch14-l06' })")
    await page.wait_for_timeout(600)
    html = await page.inner_html('#main-content')
    report['steps'].append({'ch14-l06 video link card': 'video-link' in html, 'no placeholder': 'coming soon' not in html})
    await page.screenshot(path=str(OUT / '2d-lesson-ch14-l06.png'))
    await page.evaluate("() => App.navigate('test', { chapterId: 'ch10' })")
    await page.wait_for_timeout(800)
    html = await page.inner_html('#main-content')
    report['steps'].append({'ch10 test evidence card': 'scenario-evidence' in html, 'code filled in': 'KDQ-' in html or 'YOUR-CODE' not in html})
    await page.screenshot(path=str(OUT / '2d-test-ch10.png'), full_page=True)
    await ctx.close()


async def three_d(browser, floor, pos, name):
    ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
    await ctx.add_init_script(f"sessionStorage.setItem('ccq_play_pos', JSON.stringify({{floor: {floor}, x: {pos[0]}, z: {pos[1]}}}));"
                              "localStorage.setItem('ccq_graphics', 'low');")
    page = await ctx.new_page(); hook(page, f'3d-f{floor}')
    await page.goto(BASE, wait_until='networkidle')
    await page.evaluate("() => App.navigate('play')")
    ok = True
    try:
        await page.wait_for_function('() => !!window.__playApi', timeout=90000)
    except Exception as e:
        ok = False; report['errors'].append(f'[3d-f{floor}] play never initialised: {e}')
    await page.wait_for_timeout(12000)
    await page.screenshot(path=str(OUT / f'3d-{name}.png'))
    report['steps'].append({f'3d floor {floor} initialised': ok})
    await ctx.close()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        await two_d(browser)
        await three_d(browser, 1, (0, 5), 'floor1')
        await three_d(browser, 4, (16.0, 10.2), 'floor4-ch16')
        await browser.close()
    (OUT / 'report.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))

asyncio.run(main())
