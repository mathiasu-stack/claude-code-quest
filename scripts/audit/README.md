# Audit suite

Static checks against the codebase. Catches data-consistency and spatial
bugs without rendering the game.

## Run

```bash
bash scripts/audit/run-all.sh        # all audits
node scripts/audit/data-consistency.cjs   # data audits only
node scripts/audit/spatial.cjs            # spatial audits only
```

Exit code = number of `FAIL` rows across all scripts (clamped to 254).
`NOTE` rows are non-blocking — they flag known limitations of static
analysis.

## What gets audited

### Data consistency (`data-consistency.cjs`)

Loads `data/curriculum.js` + `curriculum2.js` into a sandbox `window`,
extracts the hand-built NPC roster from `play/play.js`, and simulates
`generateChapterNPCs()` for the procedural NPCs (skipping the chapter
ids in `HAND_BUILT_CHAPTER_IDS`).

- `1.1` NPC `role` ≠ any string in `RANKS` (player ranks).
- `1.2` NPC `chapterId` exists in curriculum.
- `1.3` Lesson NPC `lessonId` exists inside its chapter.
- `1.4` Test NPC `testId` matches `chapter.practicalTest.id`.
- `1.5` Every chapter has ≥1 lesson NPC + a test NPC.
- `1.6` No duplicate `lessonId` across hand-built + auto-gen NPCs.
- `2.1` Unique chapter ids.
- `2.2` Globally-unique lesson ids.
- `2.4` Every chapter has a `practicalTest`.
- `2.8` Test criterion `type` ∈ `{keyword, regex, length, structure}`.
- `2.9` Regex criteria compile under `new RegExp(value, 'i')`.
- `2.12` Knowledge-check `correctIndex` in range.

### Spatial (`spatial.cjs`)

Regex-extracts literal `position.set(x, y, z)` calls, NPC `pos:` arrays,
and `addColliderAABB(...)` calls from the listed source files.

- `1.8` NPCs within 0.5 m on the same floor.
- `3.1` Wall-mounted fixtures (posters, windows) overlap on the same
        wall plane (x or z ≈ ±10.83).
- `3.10` Adjacent collider AABBs on the same wall-plane with a 5–50 cm
         gap between them (the "visible slit" range; > 50 cm =
         intentional doorway).
- `3.12` Floating objects — `position.set(x, y, z)` with `y ≥ 0.4`
         that isn't near a wall plane, ceiling, or known surface
         height. **Restricted to decoration + world scripts** —
         play.js builder bodies have relative positions that look
         floating without context.
- `3.9` Outer-boundary integrity — every clampMove edge that needs a
        collider has one. Interior walls aren't audited (would need a
        scene-simulation pass).

### Layout (`layout.cjs`)

Runs `engine/layout.js` (the same placement code the game uses) plus
`data/npc_overrides.js`, so it checks where NPCs actually stand in game.

- `4.1` Every relocated upper-floor NPC is inside the walkable floor (reachable).
- `4.2` No two relocated NPCs within 0.6 m on the same floor.
- `4.3` No NPC inside a desk / table / couch / bookshelf footprint (`data/rooms.js`).
- `4.4` Every chapter fits its room (`Layout.LESSON_CAPACITY`, currently 8).
- `4.5` No ES module imported under two different URLs (a `?v=` mismatch
        forks module state).

### Evaluator strength (`evaluator.cjs`)

- `5.1` Every practical test declares an `evidence` block.
- `5.2` A keyword-salad submission fails every practical test.
- `5.3` Salad plus well-formed evidence passes every test (still passable).

### Facts freshness (`data-consistency.cjs`)

- `2.13` `data/facts.js` was verified within the last 35 days, and every id
         in its `usedBy` list exists. Fails monthly until someone re-verifies.

### Browser smoke (`browser-smoke.sh`, not in run-all)

Needs docker and the Playwright image. Loads the dashboard, two lessons, the
ch10 test view and the 3D view on floors 1 and 4 against a running server;
fails on page errors, failed requests or missing UI. Run it after touching
play.js or any module under `play/`.

## What's NOT audited

- **Visual rendering bugs** — texture missing, GLB doesn't fit its
  slot, depth-buffer fighting. Needs a rendered frame.
- **Interior wall walk-through** — only floor-1 outer-boundary
  colliders are checked. A full simulation of the build code +
  collider registry comparison would be needed.
- **Animation correctness** — clip names, retargeting, blend weights.
- **Save-data migration** — needs real save files.
- **Performance budgets** — separate Tier 3 audit, not implemented.

See the original audit plan in this conversation for the full list of
proposals and what was deferred.

## Extending

The shared `lib/extract.cjs` exposes loaders/extractors that any new
audit can reuse:
- `loadCurriculum()` → the merged CURRICULUM array
- `loadNpcsHandBuilt()` / `generateAutoNpcs(curriculum)` → NPC roster
- `extractPlacements(files)` → literal positions + nearest geometry size
- `extractPosters()` → reception poster literals
- `extractReceptionWindows()` → window positions array
