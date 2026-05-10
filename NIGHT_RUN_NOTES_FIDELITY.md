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

