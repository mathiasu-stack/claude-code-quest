// spatial.cjs — runs the spatial/geometry audits.
//
// What this catches and what it doesn't:
//   ✓ 1.8  NPCs at near-identical coordinates
//   ✓ 3.1  Wall-mounted fixtures overlap (posters vs windows on the
//          same wall plane) — the SHIP IT / window class.
//   ✓ 3.10 Adjacent wall-segment gaps (collider AABBs on the same
//          wall-plane with a slit between them in the visible-gap
//          range 5cm to 50cm, distinguishing them from intentional
//          doorways).
//   ✓ 3.12 Floating objects — any extracted .position.set(x, y, z)
//          with y >= 0.4 that doesn't read as wall-mounted (x or z
//          near a wall plane), ceiling-mounted (y >= 2.8), or "sits
//          on a surface" (y near 0.78 desk-top, 1.0 reception-desk
//          top, or 1.2 monitor-on-desk).
//   △ 3.9  Walk-through walls — reduced to "outer-boundary integrity":
//          every clampMove boundary has at least one collider AABB
//          straddling it. Doesn't audit interior walls; logs a NOTE
//          row pointing at the limitation.

const { loadCurriculum, loadNpcsHandBuilt, generateAutoNpcs,
        extractPlacements, extractPosters,
        extractReceptionWindows, readFile } = require('./lib/extract.cjs');

const findings = [];
function pass(id, summary)          { findings.push({ id, status: 'PASS', summary }); }
function fail(id, summary, details) { findings.push({ id, status: 'FAIL', summary, details }); }
function note(id, summary, details) { findings.push({ id, status: 'NOTE', summary, details }); }

function main() {
  const curriculum = loadCurriculum();
  const npcs = [...loadNpcsHandBuilt(), ...generateAutoNpcs(curriculum)];
  // For floating-objects detection we deliberately exclude play.js:
  // its position.set calls are almost all RELATIVE positions inside
  // small builder functions (buildChair body, NPC face parts, etc.)
  // applied to a parent group that's later positioned by buildWorld.
  // Without parsing the JS AST we can't tell those apart from
  // absolute world placements — so we restrict the scan to files
  // whose positions ARE world-absolute (decoration + world geometry
  // scripts).
  const placements = extractPlacements([
    'play/decorations/reception.js',
    'play/decorations/library.js',
    'play/decorations/receptionCenterpiece.js',
    'play/world/atrium.js',
    'play/world/depth.js',
  ]);
  const posters = extractPosters();
  const windows = extractReceptionWindows();
  const colliders = extractColliders();

  audit_1_8_npc_overlap(npcs);
  audit_3_1_wall_fixture_overlap(posters, windows);
  audit_3_10_wall_gaps(colliders);
  audit_3_12_floating_objects(placements);
  audit_3_9_outer_boundary_integrity(colliders);

  report();
}

// ── Collider extraction (the play.js addColliderAABB calls) ──────────

function extractColliders() {
  const src = readFile('play/play.js');
  const re = /addColliderAABB\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(\d+))?\s*\)/g;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push({
      minX: parseFloat(m[1]), maxX: parseFloat(m[2]),
      minZ: parseFloat(m[3]), maxZ: parseFloat(m[4]),
      floor: m[5] ? parseInt(m[5], 10) : 1,
      _line: lineAt(src, m.index),
    });
  }
  return out;
}

function lineAt(src, idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) if (src[i] === '\n') line++;
  return line;
}

// ── 1.8  NPC overlap ─────────────────────────────────────────────────

function audit_1_8_npc_overlap(npcs) {
  const TOL = 0.5; // meters
  const dupes = [];
  // Group by floor (zone) — NPCs in different zones can't overlap.
  const byZone = new Map();
  for (const n of npcs) {
    if (!Array.isArray(n.pos)) continue;
    const z = n.zone || 1;
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z).push(n);
  }
  for (const list of byZone.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const dx = a.pos[0] - b.pos[0];
        const dz = a.pos[1] - b.pos[1];
        if (Math.hypot(dx, dz) < TOL) {
          dupes.push(`${a.name} (${a._file}:${a._line || '?'}) and ${b.name} both at ~(${a.pos[0].toFixed(1)}, ${a.pos[1].toFixed(1)})`);
        }
      }
    }
  }
  if (dupes.length === 0) pass('1.8', `No NPC coordinate overlaps (${npcs.length} NPCs across ${byZone.size} zones)`);
  else fail('1.8', `${dupes.length} NPC overlap(s)`, dupes);
}

// ── 3.1  Wall-mounted fixture overlap (posters ↔ windows) ────────────

function audit_3_1_wall_fixture_overlap(posters, windows) {
  // Reception walls live at:
  //   west:  x = -10.83  (frame +0.05 inward)
  //   east:  x = +10.83
  // Posters carry their pos[0] as x (the wall they're mounted on).
  const TOL = 0.5; // x must be within this to count as "same wall plane"
  const overlaps = [];
  const onSameWall = (a, b) => Math.abs(a.x - b.x) < TOL;

  // Build poster AABBs (z, y) — width 1.6 × height 2.4 per reception.js posters.
  const posterAABBs = posters.map((p) => ({
    label: `poster "${p.title}"`,
    x: p.pos[0],
    minZ: p.pos[2] - 0.8, maxZ: p.pos[2] + 0.8,
    minY: p.pos[1] - 1.2, maxY: p.pos[1] + 1.2,
    _file: p._file, _line: p._line,
  }));
  // Build window AABBs from the positions array entries.
  const windowAABBs = windows.map((w) => ({
    label: `window z=${w.z}`,
    x: w.pos.x,
    minZ: w.z - w.w / 2, maxZ: w.z + w.w / 2,
    minY: w.pos.y - w.h / 2, maxY: w.pos.y + w.h / 2,
    _file: w._file, _line: w._line,
  }));

  // Cross-check posters against windows. (Both can overlap themselves
  // too — caught by the within-set sweep below.)
  for (const p of posterAABBs) {
    for (const w of windowAABBs) {
      if (!onSameWall(p, w)) continue;
      const zo = Math.max(0, Math.min(p.maxZ, w.maxZ) - Math.max(p.minZ, w.minZ));
      const yo = Math.max(0, Math.min(p.maxY, w.maxY) - Math.max(p.minY, w.minY));
      if (zo > 0.01 && yo > 0.01) {
        overlaps.push(`${p.label} (${p._file}:${p._line}) clips ${w.label} (${w._file}:${w._line}) on wall x≈${p.x.toFixed(2)} by ${zo.toFixed(2)}×${yo.toFixed(2)}m`);
      }
    }
  }
  // Posters-vs-posters on the same wall.
  for (let i = 0; i < posterAABBs.length; i++) {
    for (let j = i + 1; j < posterAABBs.length; j++) {
      const a = posterAABBs[i], b = posterAABBs[j];
      if (!onSameWall(a, b)) continue;
      const zo = Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ));
      const yo = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
      if (zo > 0.01 && yo > 0.01) {
        overlaps.push(`${a.label} clips ${b.label} on wall x≈${a.x.toFixed(2)}`);
      }
    }
  }
  if (overlaps.length === 0) pass('3.1', `No poster/window overlaps on shared walls (${posterAABBs.length} posters, ${windowAABBs.length} windows)`);
  else fail('3.1', `${overlaps.length} wall-mounted fixture overlap(s)`, overlaps);
}

// ── 3.10  Wall-segment gaps ──────────────────────────────────────────
//
// Heuristic: two colliders on the same wall plane (same minX≈maxX or
// minZ≈maxZ) with a gap between their extents in the perpendicular
// axis. Gaps under 5cm = "touching"; 5–50cm = visible slit (flag);
// 50cm+ = doorway-class opening (intentional).

function audit_3_10_wall_gaps(colliders) {
  const VISIBLE_MIN = 0.05;
  const VISIBLE_MAX = 0.50;
  const gaps = [];
  // Split into wall-plane buckets: same floor, same axis, same plane coord.
  const buckets = new Map();
  function bucket(c) {
    // East-west wall (constant X)
    if (Math.abs(c.maxX - c.minX) < 0.6) {
      const xMid = (c.minX + c.maxX) / 2;
      return `f${c.floor}|x=${xMid.toFixed(2)}`;
    }
    // North-south wall (constant Z)
    if (Math.abs(c.maxZ - c.minZ) < 0.6) {
      const zMid = (c.minZ + c.maxZ) / 2;
      return `f${c.floor}|z=${zMid.toFixed(2)}`;
    }
    return null; // not a wall-like AABB
  }
  for (const c of colliders) {
    const b = bucket(c);
    if (!b) continue;
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b).push(c);
  }
  for (const [plane, list] of buckets) {
    const isX = plane.includes('|x=');
    // Sort by perpendicular axis (Z for vertical walls, X for horizontal).
    list.sort((a, b) => isX ? a.minZ - b.minZ : a.minX - b.minX);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1], curr = list[i];
      const gap = isX ? (curr.minZ - prev.maxZ) : (curr.minX - prev.maxX);
      if (gap >= VISIBLE_MIN && gap <= VISIBLE_MAX) {
        gaps.push(`Gap on plane ${plane}: ${gap.toFixed(2)}m between ${isX ? `z=${prev.maxZ.toFixed(2)}..${curr.minZ.toFixed(2)}` : `x=${prev.maxX.toFixed(2)}..${curr.minX.toFixed(2)}`} (play.js:${prev._line}/${curr._line})`);
      }
    }
  }
  if (gaps.length === 0) pass('3.10', `No visible-slit gaps in wall-segment buckets (${buckets.size} planes checked)`);
  else fail('3.10', `${gaps.length} wall-segment gap(s) in the 5cm–50cm visible-slit range`, gaps);
}

// ── 3.12  Floating objects ───────────────────────────────────────────
//
// For each .position.set(x, y, z) with y >= 0.4 in the extracted
// records, classify whether the placement is:
//   - wall-mounted (x near ±10.83 or z near ±10.95) — supported
//   - ceiling-mounted (y >= 2.8) — supported
//   - sits on a surface: y within 0.05m of 0.78 (desk/table top),
//     1.0 (reception desk top, before our Meshy swap), or 1.2
//     (monitor on desk).
//   - on the upper-floor base (y == floor base y for floors 2-4).
// Anything else with y >= 0.4 is flagged as "floating".

const SURFACE_HEIGHTS = [0.50, 0.78, 0.80, 0.85, 1.0, 1.05, 1.2];
const FLOOR_BASE_YS = [0, 4.5, 9.0, 13.5];
const CEILING_MIN_Y = 2.8;
const WALL_PLANES_X = [-10.83, 10.83, -10.95, 10.95, 11.15, -11.15];
const WALL_PLANES_Z = [-10.95, 10.95, -11.15, 11.15, -10.85, 10.85];
const WALL_TOL = 0.30;
const SURFACE_TOL = 0.10;
const FLOOR_TOL = 0.05;

function audit_3_12_floating_objects(records) {
  const floaters = [];
  for (const r of records) {
    if (!r.pos) continue;
    const { x, y, z } = r.pos;
    if (y < 0.4) continue;
    if (y >= CEILING_MIN_Y) continue;     // ceiling/high — assume hung
    if (FLOOR_BASE_YS.some(fy => Math.abs(y - fy) < FLOOR_TOL)) continue;
    if (SURFACE_HEIGHTS.some(sy => Math.abs(y - sy) < SURFACE_TOL)) continue;
    if (WALL_PLANES_X.some(wx => Math.abs(x - wx) < WALL_TOL)) continue;
    if (WALL_PLANES_Z.some(wz => Math.abs(z - wz) < WALL_TOL)) continue;
    // Upper-floor specifically: y between 4.5 and 13.5 with surface
    // multiples — re-check against floor-relative surfaces.
    let onUpperSurface = false;
    for (const fy of FLOOR_BASE_YS) {
      for (const sy of SURFACE_HEIGHTS) {
        if (Math.abs(y - (fy + sy)) < SURFACE_TOL) { onUpperSurface = true; break; }
      }
      if (onUpperSurface) break;
    }
    if (onUpperSurface) continue;
    floaters.push(`${r.file}:${r.line} ${r.label || '(unnamed)'} at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})` + (r.dims ? `, dims ${r.dims.w}×${r.dims.h}×${r.dims.d}` : ''));
  }
  if (floaters.length === 0) pass('3.12', `No floating objects detected (${records.length} placements scanned, ${records.filter(r => r.pos && r.pos.y >= 0.4).length} elevated)`);
  else fail('3.12', `${floaters.length} placement(s) appear to be floating (y>=0.4, no nearby wall/ceiling/surface)`, floaters);
  note('3.12*', `Scan is restricted to decoration/world scripts (not play.js).\n         play.js's position.set calls are largely relative-to-parent inside\n         builder functions (chair backs, badge offsets, NPC face parts) and\n         can't be distinguished from absolute placements without an AST pass.`);
}

// ── 3.9  Outer-boundary integrity (reduced walk-through audit) ───────

function audit_3_9_outer_boundary_integrity(colliders) {
  // Floor 1's clampMove allows newX in [-32.5, +10.5]. So the east edge
  // is enforced by clampMove (x can't exceed 10.5; the wall at x=10.83
  // is unreachable). But the WEST edge of reception (x=-10.5..-10.83)
  // is NOT enforced by clampMove because the west wing extends past it.
  // Same idea for north (z<=-10.5) and south (z>=10.5).
  //
  // We check that:
  //   floor 1 — west reception wall at x≈-10.83-11.15 between z=-11
  //             and z=11 has at least one collider AABB covering each
  //             z-segment outside the doorway range (-1.7..1.7).
  // For floors 2-4 the clampMove already enforces everything; we just
  // note that.
  const f1WestNeeded = [
    { minZ: -11, maxZ: -1.75, label: 'west wall, south of doorway' },
    { minZ:  1.75, maxZ: 11,  label: 'west wall, north of doorway' },
  ];
  const missing = [];
  for (const need of f1WestNeeded) {
    const covered = colliders.some(c =>
      c.floor === 1 &&
      c.maxX <= -10.5 && c.maxX >= -11.5 &&
      c.minZ <= need.minZ + 0.5 && c.maxZ >= need.maxZ - 0.5,
    );
    if (!covered) missing.push(`No collider covers ${need.label} (z=${need.minZ}..${need.maxZ})`);
  }
  // Note: interior walls are NOT audited here — that would require
  // simulating the build and comparing visual wall geometry against
  // colliders, which is the bigger-effort version of this audit.
  if (missing.length === 0) {
    pass('3.9', `Outer-boundary colliders present on floor 1 west wall (interior walls not audited)`);
  } else {
    fail('3.9', `${missing.length} outer-boundary segment(s) unprotected by colliders`, missing);
  }
  note('3.9*', `Walk-through detection currently checks only floor-1 outer walls.\n         Interior walls (zone partitions, atrium partitions) would need a fuller scene\n         simulation to audit — not implemented in this pass.`);
}

// ── Reporter ─────────────────────────────────────────────────────────

function report() {
  console.log('\n=== SPATIAL ===');
  for (const f of findings) {
    let marker;
    if (f.status === 'PASS') marker = '\x1b[32m[PASS]\x1b[0m';
    else if (f.status === 'NOTE') marker = '\x1b[33m[NOTE]\x1b[0m';
    else marker = '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${marker} spatial::${f.id.padEnd(5)}  ${f.summary}`);
    if (f.details) {
      const arr = Array.isArray(f.details) ? f.details : [f.details];
      for (const d of arr.slice(0, 10)) console.log(`         · ${d}`);
      if (arr.length > 10) console.log(`         · … ${arr.length - 10} more`);
    }
  }
  const fails = findings.filter(f => f.status === 'FAIL').length;
  console.log(`\n${fails === 0 ? '\x1b[32mAll passed\x1b[0m' : `\x1b[31m${fails} audit(s) failed\x1b[0m`}.\n`);
  process.exit(Math.min(254, fails));
}

main();
