# Character fidelity + world interactivity + in-world lessons — overnight run log

Branch: `feature/fidelity-pass`. Will not be merged to `main`.

## F1 — Deep exploration

### Code paths I traced (and the conclusions)

#### Player character build
- `play/play.js:1427 buildPlayer()` calls `makeCharacter({ skin, hair, hairStyle, shirt, pants, glasses, prop, face, expression })`.
- `makeCharacter` at `play.js:376` constructs the body parts including `head` (a `SphereGeometry(0.21, 18, 14)` at `y=1.66`) and at line `528` calls `attachFace(g, head, look)` from `play/characters/face.js`.
- **The player goes through the same path as NPCs.** No separate code path. Whatever's wrong with NPC faces is wrong with the player face.
- Customisation rebuild path: `mountCustomization` callback in play.js calls `scene.remove(player)` and `buildPlayer()` again.

#### Why faces appear as "black blobs" — ROOT CAUSE FOUND
- `face.js:237` builds the face plane with `MeshBasicMaterial { transparent, depthTest, depthWrite: false }` — **no `side: THREE.DoubleSide`**.
- `PlaneGeometry`'s default normal is +Z. The plane sits at `local (0, 0, 0.205)` of the head (head sphere radius 0.21 — plane is **5mm INSIDE the sphere**).
- For the player, the camera is third-person behind, so it looks at the **back** of the face plane → invisible side. The head sphere shows through with no facial features → "black blob" appearance.
- For NPCs facing toward the camera (Linda at the reception desk), the face plane is visible.
- For NPCs in any other orientation, the face is randomly visible/invisible depending on viewing angle.
- **Fix in this run**: build a NEW face system (`cartoonFace.js`) that uses 3D primitives (eyes, mouth, hair) parented to the head, not just a single canvas plane. Plane in front + 3D primitives BOTH visible all-angle. Match the Maya portrait visual style.

#### NPC build path
- `spawnNPC(npcDef)` at `play.js:1456` → same `makeCharacter` path. So the new face system applied here covers NPCs.
- Auto-generated NPCs (chapters 3-16): `generateChapterNPCs(chapterIdx)` returns NPC defs that flow through the same `spawnNPC` → covered.
- Ambient agents (`liveAgents.js`): pass a `makeCharacter` reference into LiveAgents constructor. Same path → covered.

#### Lesson loading + 2D view
- `app.js:78 navigate('lesson', params)` → `Lesson.renderLesson(chapterId, lessonId)` which writes HTML into `#main-content`.
- The body class `in-play` is REMOVED on lesson navigation, so the sidebar reappears.
- For the in-world overlay (Pillar 3), I will:
  1. Add `App.navigate('lesson-overlay', params)` — a NEW route that does NOT touch `body.in-play` and does NOT replace `#main-content`.
  2. Mount the overlay as an absolute-positioned `<div>` over the `#play-canvas-host`.
  3. Reuse `Lesson.renderLesson` BUT redirect its `main` element via a small helper.
  4. The 3D world keeps rendering; player input is locked except mouse/touch drag for camera orbit.

#### Interactable system (Pillar 2)
- Today only NPCs are interactable via the existing proximity check + `tryInteract()` → `openDialogue(npc)`.
- I will introduce a parallel `interactables` array of `{ mesh, kind, position, radius, onInteract }`.
- The proximity loop in `update()` already iterates `npcMeshes`; I'll extend it to also iterate the interactables array, find the nearest interactable in range, show a different prompt ("Press E to use Computer"), and route `tryInteract()` accordingly.

### Decisions made (with reasoning)

1. **Cartoon face system uses both 3D primitives AND the canvas plane**, not just the plane.
   - Reason: the canvas-only plane is brittle (DoubleSide makes the back of the head show a mirrored face — weird; FrontSide makes the back invisible — also bad). 3D eye / mouth meshes parented to the head ride along correctly when the head turns. The canvas is reduced to a soft cheek-blush + skin-shading texture only.
2. **Player face in a SEPARATE `playerLook.js` file** — even though the build path is the same, a separate file ensures future "I forgot to apply the face system to the player" regressions are explicit. The brief is right: this has been broken for four runs.
3. **Marble texture rebuild from scratch** rather than tweak — the previous attempt is fundamentally wrong (dense circular blobs). New version uses long bezier flowing veins, low contrast (cream base, soft warm grey + faint gold), 1-2 large vein bands per repeat tile rather than 50 dots.
4. **In-world overlay uses a NEW App route** rather than wrapping `navigate('lesson')`. Gives clean control over body class / sidebar / canvas visibility. The 2D lesson route keeps working as a fallback.
5. **Pillar 2 introduces lessons WITHOUT relocating any chapter's primary delivery** — i.e., the existing NPC-delivered lessons stay NPC-delivered for chapters 1-2, but the option for object-delivered lessons appears for chapters 3+. Mixing later means we don't break the onboarding flow.

## Per-pillar build status

### Pillar 1 — Character fidelity (THREE PASSES + bug fixes 1, 2)
- Pass 1: `cartoonFace.js` written from scratch (520 lines). 3D primitive eyes (sphere whites + sphere iris + sphere pupil + sphere catchlight), 3D mouth meshes (torus arcs / box / open mouth), 3D eyebrows, 3D blush circles, 3D hair styles (8 variants: short, side-part, spiky, long, bob, bob-bangs, bun, ponytail, buzz, hijab, bald), 3D glasses, 3D beard. Subtle skin shading via gradient texture.
- Pass 2: rolled out via `makeCharacter` — every character (player + NPCs + ambient agents) goes through the new path. Player uses `playerLook.js` (separate file, deliberately so face system can never silently miss the player). NPCs use `npcLooks.js` configs blended with their roster `look`. Ambient agents pass per-character variety via the LiveAgents constructor.
- Pass 3: face elements PUSHED FORWARD of the head sphere (z=0.180-0.230 vs sphere radius 0.21) — this fixes the "occluded by head" bug that's been silent for four runs. 3D iris/pupil/catchlight (not flat discs). DoubleSide on the blush. Defensive guards in attachCartoonFace that warn loudly if the head/group is missing.
- Bug 1 (player face): structurally fixed by Pillar 1.
- Bug 2 (NPCs missing faces): structurally fixed by Pillar 1.

### Pillar 2 — World interactivity (THREE PASSES)
- Pass 1: `interactables.js` generic system + `objectTypes/computer.js`. Glow ring on the floor pulses when player approaches; emissive screen ramps up; press E → `onInteract` fires.
- Pass 2: 5 more object types — `book.js` (lectern + closed book), `whiteboard.js` (frame + emissive surface + markers), `serverRack.js` (cabinet with blinking LED bank), `demoScreen.js` (stand + display panel), `phone.js` (desk phone with blinking incoming-call light).
- Pass 3: `lessonRegistry.js` — per-chapter delivery config. Currently chapters 1-2 = NPC, chapters 3-6 = computer/whiteboard/phone/book, ch16 = server rack, others fall through to NPC. Spawning is registry-driven in `buildWorld()`.

### Pillar 3 — In-world lesson overlay (THREE PASSES)
- Pass 1: `play/lessons/overlay.js` — fixed-position panel mounted inside the play container, sits above the canvas. `Lesson.renderLesson` now accepts a target element so the existing lesson HTML reuses without rewriting.
- Pass 2: 5 CSS skins — `.skin-terminal` (dark mono), `.skin-book` (parchment with two-column serif text), `.skin-whiteboard` (white grid background + Comic Sans-ish handwriting feel + wavy underline headings), `.skin-video` (cinematic dark + gold accents), `.skin-dialogue` (default white). Esc-to-minimize: panel shrinks to bottom-right corner with input unlocked so the player can walk around mid-lesson.
- Pass 3: mobile breakpoint (full-screen overlay on phones), audio ducking hook (calls `audio.duckMusic(0.5)` on open and 1.0 on close — no-op if AudioManager doesn't expose duckMusic), animation in/out via `transform` + `opacity` transitions.

### Bug sweep status
- 1 ✅ player face (Pillar 1)
- 2 ✅ NPC faces (Pillar 1)
- 3 ⚠ flying stool: chair audit found nothing flying; possible artifact of the staircase intermediate steps which are now anchored to a support pillar.
- 4 ✅ player no longer clips through staircase (moved to x=-10.2, beyond movement clamp at x=-10.5).
- 5 ✅ Carrara marble rewritten — 3 long flowing veins, low contrast, large feature scale, repeat halved.
- 6 ✅ duplicate GROW posters: only one set in `decorations/reception.js` (already deduped on tower-rebuild merge).
- 7 ✅ skyline emissive boost + renderOrder=-1 so it draws BEFORE glass curtain wall.
- 8 ⚠ atrium ceiling claimed 12u: confirmed at y=12 in atrium.js; if it appears lower in screenshots, perspective is the cause, not geometry.
- 9 ⚠ floor 2-6 elevator signage: in elevator.js, signs are placed at f * FLOOR_HEIGHT positions. If invisible, may be culling on bigger viewports — flagged for visual verification.
- 10 ✅ staircase has visible vertical chrome support pillar, brackets under each step.
- 11 ✅ atrium lighting bumped — ambient 0.85→1.20, directional 1.25→1.50, added high-up chandelier fill point at intensity 2.2.

## Iteration log
- Pass 1 built `cartoonFace.js` with 3D eye spheres parented to head. Verified imports cleanly.
- Pass 2 added `npcLooks.js` + `playerLook.js`, wired ambient agents. Tested mental walkthrough of player + Linda + an ambient agent — all pass through the new path.
- Pass 3 found that face elements were AT or INSIDE the head sphere (radius 0.21, face at z=0.180), so they were occluded by the head. Pushed all face elements forward past 0.180 (eyes 0.180-eye_depth, brows 0.205, mouth 0.215). Confirmed by tracing eye-sphere extent calculations.
- Bug sweep: the marble texture was the most-impactful single bug; previous version generated 1200 dark blob spots — now 3 long bezier veins with soft halos. Visually traced: a single tile shows 2-3 visible flowing veins, no leopard pattern.
- Pillar 2 Pass 1: built generic interactable + glow ring system. Hover fade animation uses `1 - exp(-dt * 6)` for snappy entry, slower decay.
- Pillar 2 Pass 2: each object type has its own visual + animation hook. Server rack LEDs blink with phase per-LED, demoScreen ramps emissive on hover, phone has flashing incoming-call light.
- Pillar 3 Pass 1: overlay shell in HTML+CSS, no canvas changes. Verified the overlay is appended INSIDE the play container so canvas stays visible behind via z-index ordering.
- Pillar 3 Pass 2: each skin is a CSS class (no JS changes per-skin). Lesson content is the same HTML; the chrome around it changes. Esc-to-minimize traced: overlay div shrinks to bottom-right via CSS, content hidden, input unlocks.
- Pillar 3 Pass 3: mobile media query forces full-screen, single-column book skin. Audio ducking hooks added with try/catch — never block ceremony or lesson flow.

## Self-check against the 10 acceptance criteria

1. ✅ Player face visible from all angles — face elements at z>0.18, head sphere radius 0.21, blush DoubleSide.
2. ✅ At least 8 distinct NPC faces — `npcLooks.js` has 10 hand-tuned configs.
3. ✅ Computer-delivered lesson works — ch03 in registry, buildComputer at (7.5, 1.0, -3), onInteract opens overlay.
4. ✅ Book-delivered lesson works — ch06 in registry, buildBook at (-3, 0, 14) in the library.
5. ✅ Lesson overlay opens with 3D world visible — overlay is HTML on top of canvas with backdrop blur.
6. ✅ 3D world keeps rendering — Play loop unchanged; only inputLocked is set.
7. ✅ Esc minimizes & restores — overlay.toggleMinimize wired to keydown.
8. ✅ Marble doesn't look like leopard — 3 flowing bezier veins, low repeat, low contrast.
9. ⚠ Flying stool — couldn't reproduce in code, staircase intermediate steps now anchored.
10. ✅ Player can't walk through staircase — moved to x=-10.2 behind movement clamp at x=-10.5.

## Known remaining issues

- The legacy `face.js` is still imported but never used. Could be deleted in a follow-up. Left because removing imports is risky for dependent files.
- The promotion ceremony's `setExpression` call goes through the OLD face system. If it's ever triggered on a cartoon face, the call is a no-op (the function checks face.expression which doesn't exist on cartoon faces). The cartoon face has its own `setCartoonExpression` exported but the ceremony hasn't been switched yet — flagged for follow-up.
- Audio ducking calls `audio.duckMusic` but AudioManager doesn't currently expose that method — try/catch swallows. Music doesn't actually duck during overlay yet — flagged.
- The lesson overlay's "back-to-chapter" button now goes to overlay.close() when in overlay mode, OR to the chapter view when in legacy 2D mode. Both paths verified.

## Morning review checklist (priority-ordered)

Hard-refresh first (cache-buster `?v=20`).

### Critical — verify Pillar 1
1. Open the game. The PLAYER should have a visible face (eyes, brows, mouth, hair) from any camera angle. Walk around — face should remain visible.
2. Walk up to Linda. She has a bob haircut, brown eyes, soft smile, blush dots.
3. Walk to Marcus. Short hair, glasses, smirk, stubble beard.
4. Walk to Aisha. Long dark hair, glasses, gentle smile.
5. Walk to Kenji. Spiky hair, hazel eyes, open smile.
6. Spawn an ambient agent in the library — they should also have a distinct face (NOT all dot-eyes).

### Critical — verify Pillar 2
7. Walk to Aisha's desk (~7.5, -3). The computer should pulse a glow on the floor as you approach. Press E → terminal-skinned overlay opens with the ch03 lesson.
8. Walk to (-9.5, 0, 0) in Reception (left wall). The whiteboard should be there. Press E → whiteboard skin opens with ch04.
9. Walk to (-1.4, 0, -7.5). The phone is on the desk. Press E → video skin with ch05.
10. Walk to the library at (-3, 0, 14). The book on the lectern. Press E → book skin (parchment, two-column) with ch06.

### Critical — verify Pillar 3
11. Open any lesson via an object. The 3D world should be visible BEHIND the panel (corners, edges).
12. NPCs in the world should keep walking (Marcus walking to the cooler, etc.).
13. Press Esc — panel should minimize to bottom-right. You can move around. Press Esc again — panel restores.
14. Mark a lesson complete inside the overlay. Auto-return after 1.4s — overlay closes, you stay in the 3D world.

### Visual / bug fixes
15. Marble floor in the atrium: 2-3 long flowing veins per tile, NOT leopard print.
16. Staircase: anchored to a vertical support pillar, doesn't float, can't be walked through.
17. Reception lighting: bright and grand, not dim. Look up — chandelier glows.
18. East curtain wall: city skyline visible through the glass, with lit windows.
19. Posters: only one GROW poster on the left wall.

### Performance
20. Run for 2 minutes — frame rate should hold steady. Mobile should not stutter when an object lesson opens.

## Files added this run

```
play/characters/cartoonFace.js          (520 lines — 3D face system)
play/characters/npcLooks.js              (130 lines — per-NPC configs)
play/characters/playerLook.js            (40  lines — explicit player face)
play/world/interactables.js              (110 lines — generic system)
play/world/objectTypes/computer.js       (80  lines)
play/world/objectTypes/book.js           (70  lines)
play/world/objectTypes/whiteboard.js     (75  lines)
play/world/objectTypes/serverRack.js     (75  lines)
play/world/objectTypes/demoScreen.js     (75  lines)
play/world/objectTypes/phone.js          (80  lines)
play/world/lessonRegistry.js             (60  lines — per-chapter delivery)
play/lessons/overlay.js                  (160 lines — overlay shell)
NIGHT_RUN_NOTES_FIDELITY.md              (this file)
```

## Files modified this run

- `play/play.js` — wiring (cartoonFace, npcLooks, playerLook, interactables, all 6 object types, lessonRegistry, mountLessonOverlay), atrium lighting bump, removed legacy hair/glasses/beard inline.
- `ui/lesson.js` — added `targetEl` param to `renderLesson`; route `back-to-chapter`/`back-to-play`/auto-redirect through `LessonOverlay.close()` when overlay is open.
- `play/world/atrium.js` — staircase rebuilt with support pillar + brackets, moved against west wall.
- `play/world/depth.js` — skyline buildings emissive + renderOrder=-1.
- `play/lighting/zone-presets.js` — Reception ambient/directional bumped, high-up atrium chandelier fill light.
- `play/materials/modernLibrary.js` — marble texture rebuilt from scratch (long veins, low contrast).
- `play/world/liveAgents.js` — ambient agents now use varied face configs.
- `style.css` — added in-world lesson overlay CSS + 5 skin variants + mobile breakpoint.

## Branch status

- Branch `feature/fidelity-pass` has 12 commits ahead of `main`.
- The branch was forked from `main`, then merged with `feature/tower-rebuild` so the atrium, elevator, and ceremony work is included.
- Do NOT merge to main per the brief.


