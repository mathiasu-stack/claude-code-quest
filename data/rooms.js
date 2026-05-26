// rooms.js — declarative scene-layout data.
//
// Loaded by play/world/roomsLoader.js. Each room maps to one floor +
// optionally one curriculum zone. The `objects` array is what the
// in-game editor (Phase 2) lets you manipulate.
//
// Object types (see roomsLoader.js for the full spec):
//   - 'decoration' { id, pos:[x,y,z], rotY?, size?:{width,depth,height,stretch?} }
//   - 'builder'    { fn, pos:[x,y,z], rotY?, args? }      → calls a registered builder
//   - 'poster'     { title, sub, pos, rotY?, size?:{width,height} }
//   - 'clutter'    { fn, pos, rotY?, args? }              → same as builder, semantic tag
//   - 'wall'       { pos, rotY?, size:{w,h,d}, material?:'office'|'inner' }
//   - 'floor_plate'{ pos, size:{w,d}, color, metalness?, roughness? }
//   - 'wall_sign'  { text, pos, rotY?, size:{width,height}, bg?, fg? }
//   - 'ceo_portrait' (no args — buildCeoPortrait sets its own position)
//
// Conventions:
//   - pos is [x, y, z] in world units (meters).
//   - rotY is in radians.
//   - Per-floor visibility is auto-applied via room.floor → userData.floor.
//
// Edits made here are picked up the next time start() runs (no rebuild
// needed — it's plain JS data the loader reads each scene assembly).

const wallH = 3.8;

window.ROOMS = [

  // ─────────────────────────────────────────────────────────────────
  // FLOOR 1 — Reception (zone 0, ch01)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'reception',
    floor: 1,
    zoneIdx: 0,
    description: 'Onboarding zone — Linda, IT bench, Aisha, Kenji, Diana',
    objects: [

      // ── Shell: floor + carpet runner ────────────────────────────
      { type: 'floor_plate', pos: [0, 0, 0], size: { w: 22, d: 22 }, color: 0x9aa9bc },
      { type: 'floor_plate', pos: [0, 0.0025, -1], size: { w: 2.4, d: 18 },
        color: 0xc9a44c, metalness: 0.85, roughness: 0.18 },

      // ── Reception room walls ────────────────────────────────────
      // back (north)
      { type: 'wall', pos: [0, wallH/2, -11], size: { w: 22, h: wallH, d: 0.3 } },
      // west wall — doorway opening centred at z=0 for the Files west-wing room.
      { type: 'wall', pos: [-11, wallH/2, -6.375], size: { w: 0.3, h: wallH, d: 9.25 } },
      { type: 'wall', pos: [-11, wallH/2,  6.375], size: { w: 0.3, h: wallH, d: 9.25 } },
      { type: 'wall', pos: [-11, wallH - 0.6, 0], size: { w: 0.3, h: 1.2, d: 3.5 } },
      // east wall — segmented for 3 window openings at z=-3/0/+3 + elevator door at z=-7.6.
      { type: 'wall', pos: [11, 3.3, 0],   size: { w: 0.3, h: 1.0,  d: 22 } },   // top strip
      { type: 'wall', pos: [11, 0.5, -9.9],size: { w: 0.3, h: 1.0,  d: 2.2 } },  // bottom strip south of elevator
      { type: 'wall', pos: [11, 0.5, 2.3], size: { w: 0.3, h: 1.0,  d: 17.4 } }, // bottom strip north of elevator
      { type: 'wall', pos: [11, 1.9, -9.9],size: { w: 0.3, h: 1.8,  d: 2.2 } },  // middle band south cap
      { type: 'wall', pos: [11, 1.9, -5.3],size: { w: 0.3, h: 1.8,  d: 2.2 } },  // between elevator and window z=-3
      { type: 'wall', pos: [11, 1.9, -1.5],size: { w: 0.3, h: 1.8,  d: 0.6 } },  // between windows -3 and 0
      { type: 'wall', pos: [11, 1.9,  1.5],size: { w: 0.3, h: 1.8,  d: 0.6 } },  // between windows 0 and 3
      { type: 'wall', pos: [11, 1.9,  7.6],size: { w: 0.3, h: 1.8,  d: 6.8 } },  // north cap
      { type: 'wall', pos: [11, 2.7, -7.6],size: { w: 0.3, h: 0.2,  d: 2.4 } },  // lintel above elevator door
      // front (south) wall — 3.5m doorway centred at z=+11.
      { type: 'wall', pos: [-6.375, wallH/2, 11], size: { w: 9.25, h: wallH, d: 0.3 } },
      { type: 'wall', pos: [ 6.375, wallH/2, 11], size: { w: 9.25, h: wallH, d: 0.3 } },
      { type: 'wall', pos: [ 0,     wallH - 0.6, 11], size: { w: 3.5, h: 1.2, d: 0.3 } },

      // ── Wall signs ──────────────────────────────────────────────
      { type: 'ceo_portrait' },
      { type: 'wall_sign', text: 'KEDASH CORP',
        pos: [-7.5, 3.2, -10.84], size: { width: 4, height: 0.9 } },

      // ── Reception desk ─────────────────────────────────────────
      // Stretched non-uniformly so the Kedash back panel rises above
      // the hero. See play.js comments for the geometry justification.
      { type: 'decoration', id: 'reception_desk',
        pos: [0, 0, -8],
        size: { width: 3.6, height: 2.2, depth: 1.6, stretch: true } },

      // ── Corner plants (reception) ──────────────────────────────
      { type: 'builder', fn: 'plant', pos: [-10.2, 0, -10.2] },
      { type: 'builder', fn: 'plant', pos: [ 10.2, 0, -10.2] },
      { type: 'builder', fn: 'plant', pos: [-10.2, 0,   9.5] },
      { type: 'builder', fn: 'plant', pos: [ 10.2, 0,   9.5] },

      // ── Lobby furniture ────────────────────────────────────────
      { type: 'builder', fn: 'water_cooler', pos: [-9.5, 0, -2] },
      { type: 'builder', fn: 'couch', pos: [-8.5, 0, 5], rotY: Math.PI / 2 },
      { type: 'builder', fn: 'couch', pos: [ 8.5, 0, 5], rotY: -Math.PI / 2 },

      // ── IT bench (Marcus) ──────────────────────────────────────
      { type: 'builder', fn: 'desk',  pos: [-7.5, 0, -3], rotY:  Math.PI/2, args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'chair', pos: [-6.4, 0, -3] },

      // ── Aisha area ─────────────────────────────────────────────
      { type: 'builder', fn: 'desk',  pos: [ 7.5, 0, -3], rotY: -Math.PI/2, args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'chair', pos: [ 6.4, 0, -3], rotY: Math.PI },

      // ── Kenji area (wider desk + 2 side monitors) ──────────────
      { type: 'builder', fn: 'desk',    pos: [-7.5, 0, 3], rotY: Math.PI/2, args: { w: 2.2, d: 0.8 } },
      { type: 'builder', fn: 'monitor', pos: [-7.5, 0, 2.0], rotY: Math.PI/2, args: { screenColor: 0xab47bc } },
      { type: 'builder', fn: 'monitor', pos: [-7.5, 0, 4.0], rotY: Math.PI/2, args: { screenColor: 0xffca28 } },
      { type: 'builder', fn: 'chair',   pos: [-6.4, 0, 3] },

      // ── Diana area (filing cabinets) ───────────────────────────
      { type: 'builder', fn: 'filing_cabinet', pos: [7.6, 0, 2] },
      { type: 'builder', fn: 'filing_cabinet', pos: [7.6, 0, 3] },
      { type: 'builder', fn: 'filing_cabinet', pos: [7.6, 0, 4] },
      { type: 'builder', fn: 'chair',          pos: [6.2, 0, 3], rotY: Math.PI },

      // ── Compound builders (each builder owns its own multi-mesh) ─
      // Reception has no procedural ceiling — the atrium overlay covers
      // it from above with a tall ceiling + skylight, so buildReception-
      // Ceiling is intentionally NOT registered for this room.
      { type: 'builder', fn: 'reception_windows'      },
      { type: 'builder', fn: 'decorate_reception'     },  // posters, clutter, ceiling lamps, doors, west-wall window, service-elevator, plants, IT bench laptop+server, demo screens, Diana cabinet labels, skirting
      { type: 'builder', fn: 'reception_centerpiece'  },  // the K sculpture + plinth + glass top
      { type: 'builder', fn: 'atrium'                 },  // marble overlay + tall walls + curtain wall + chandelier
      { type: 'builder', fn: 'elevator'               },  // glass shaft + cab — spans floors 1-4
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // FLOOR 1 — Library (zone 1, ch02 after curriculum reshuffle ch02 is index 6, but the zone-1 PHYSICAL room is library)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'library',
    floor: 1,
    zoneIdx: 1,
    description: 'Knowledge Library — reading tables, bookshelves, library NPCs',
    objects: [

      // ── Shell ──────────────────────────────────────────────────
      { type: 'floor_plate', pos: [0, 0, 22], size: { w: 22, d: 22 }, color: 0x8d6e63 },

      // ── Walls (back + west doorway split + east solid) ─────────
      { type: 'wall', pos: [0, wallH/2, 33], size: { w: 22, h: wallH, d: 0.3 } },
      { type: 'wall', pos: [-11, wallH/2, 17.375], size: { w: 0.3, h: wallH, d: 9.25 } },
      { type: 'wall', pos: [-11, wallH/2, 26.625], size: { w: 0.3, h: wallH, d: 9.25 } },
      { type: 'wall', pos: [-11, wallH - 0.6, 22], size: { w: 0.3, h: 1.2, d: 3.5 } },
      { type: 'wall', pos: [11, wallH/2, 22], size: { w: 0.3, h: wallH, d: 22 } },

      // ── Library wall sign ──────────────────────────────────────
      { type: 'wall_sign', text: 'KNOWLEDGE LIBRARY',
        pos: [-10.83, 2.8, 22], rotY: Math.PI / 2,
        size: { width: 8, height: 1.6 }, bg: '#3e2723', fg: '#d4af37' },

      // ── Bookshelves (procedural with seeded book layout per fn) ─
      { type: 'builder', fn: 'bookshelf', pos: [-10.5, 0, 14], rotY:  Math.PI/2, args: { seed: 14 } },
      { type: 'builder', fn: 'bookshelf', pos: [-10.5, 0, 18], rotY:  Math.PI/2, args: { seed: 18 } },
      { type: 'builder', fn: 'bookshelf', pos: [-10.5, 0, 26], rotY:  Math.PI/2, args: { seed: 26 } },
      { type: 'builder', fn: 'bookshelf', pos: [ 10.5, 0, 14], rotY: -Math.PI/2, args: { seed: 114 } },
      { type: 'builder', fn: 'bookshelf', pos: [ 10.5, 0, 18], rotY: -Math.PI/2, args: { seed: 118 } },
      { type: 'builder', fn: 'bookshelf', pos: [ 10.5, 0, 26], rotY: -Math.PI/2, args: { seed: 126 } },

      // ── Reading tables + chairs + lamps ────────────────────────
      { type: 'builder', fn: 'table', pos: [0, 0, 16] },
      { type: 'builder', fn: 'table', pos: [0, 0, 22] },
      { type: 'builder', fn: 'chair', pos: [-1.6, 0, 16], rotY:  Math.PI/2, args: { color: 0x4e342e } },
      { type: 'builder', fn: 'chair', pos: [ 1.6, 0, 16], rotY: -Math.PI/2, args: { color: 0x4e342e } },
      { type: 'builder', fn: 'chair', pos: [-1.6, 0, 22], rotY:  Math.PI/2, args: { color: 0x4e342e } },
      { type: 'builder', fn: 'chair', pos: [ 1.6, 0, 22], rotY: -Math.PI/2, args: { color: 0x4e342e } },
      { type: 'builder', fn: 'lamp',  pos: [0, 0, 16] },
      { type: 'builder', fn: 'lamp',  pos: [0, 0, 22] },

      // ── Corner plants (library) ────────────────────────────────
      { type: 'builder', fn: 'plant', pos: [-9.8, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [ 9.8, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [-9.8, 0, 30] },
      { type: 'builder', fn: 'plant', pos: [ 9.8, 0, 30] },

      // ── Compound builders ──────────────────────────────────────
      { type: 'builder', fn: 'library_ceiling'        },
      { type: 'builder', fn: 'library_arched_window'  },
      { type: 'builder', fn: 'decorate_library'       },  // open books, mugs, bookmarks, globe, ladder, armchair, sidetable, book stacks, grandfather clock, library cart, poster, skirting
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // FLOOR 1 — West-wing rooms (ch03 Files, ch04 Plan Mode — z varies)
  // Built by buildFloor1WestRoom(idx, centerX, centerZ). The shell
  // (floor plate / walls / sign / accent strip) is theme-derived and
  // stays in code; only the furniture is data.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'west_files',
    floor: 1,
    zoneIdx: 2,          // CURRICULUM[2] = ch03 (Files / CLAUDE.md Atrium per ZONE_THEMES)
    template: 'west_room',
    center: [-22, 0, 0],
    objects: [
      { type: 'builder', fn: 'table', pos: [-22, 0, 0] },
      { type: 'builder', fn: 'lamp',  pos: [-22, 0, 0] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, -9] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, -9] },
      { type: 'builder', fn: 'plant', pos: [-31, 0,  9] },
      { type: 'builder', fn: 'plant', pos: [-13, 0,  9] },
    ],
  },
  {
    id: 'west_planmode',
    floor: 1,
    zoneIdx: 3,
    template: 'west_room',
    center: [-22, 0, 22],
    objects: [
      { type: 'builder', fn: 'table', pos: [-22, 0, 22] },
      { type: 'builder', fn: 'lamp',  pos: [-22, 0, 22] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, 31] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, 31] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // FLOORS 2-4 — Compact office templates. buildFloorOffice still
  // produces the shell (theme-coloured floor + ceiling + perimeter
  // walls + internal cross divider + elevator-door lintel + chapter
  // sign labels); only the 4 chapter desks live in data.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'office_floor2',
    floor: 2,
    template: 'office_floor',
    objects: [
      { type: 'builder', fn: 'desk', pos: [-5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [-5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
    ],
  },
  {
    id: 'office_floor3',
    floor: 3,
    template: 'office_floor',
    objects: [
      { type: 'builder', fn: 'desk', pos: [-5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [-5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
    ],
  },
  {
    id: 'office_floor4',
    floor: 4,
    template: 'office_floor',
    objects: [
      { type: 'builder', fn: 'desk', pos: [-5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [-5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
    ],
  },
];

// Helper: look up the room record for a (floor, zoneIdx) pair. Used
// by buildFloor1WestRoom + buildFloorOffice to find their furniture set.
window.ROOM_BY_ZONE = (floor, zoneIdx) =>
  window.ROOMS.find(r => r.floor === floor && r.zoneIdx === zoneIdx) || null;
window.ROOM_BY_ID = (id) => window.ROOMS.find(r => r.id === id) || null;
