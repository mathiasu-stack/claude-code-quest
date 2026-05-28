// rooms.js — declarative scene-layout data.
// EXPORTED FROM IN-GAME EDITOR — generated 2026-05-28T19:11:03.644Z
//
// See play/world/roomsLoader.js for the entry-type spec.

const wallH = 3.8;

window.ROOMS = [
  {
    id: 'reception',
    floor: 1,
    zoneIdx: 0,
    description: 'Onboarding zone — Linda, IT bench, Aisha, Kenji, Diana',
    objects: [
      { type: 'floor_plate', pos: [0, 0, 0], size: { w: 22, d: 22 }, color: 0x9aa9bc },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-9.7778, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-7.3333, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-4.8889, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [-2.4444, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [0, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [2.4444, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [4.8889, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [7.3333, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, -9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, -7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, -4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, -2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, 0], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, 2.4444], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, 4.8889], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, 7.3333], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'decoration', id: 'floor_tile', pos: [9.7778, 0.002, 9.7778], size: { width: 2.4444, height: 0.005, depth: 2.4444, stretch: true } },
      { type: 'floor_plate', pos: [0, 0.012, -1], size: { w: 2.4, d: 18 }, color: 0xc9a44c, metalness: 0.85, roughness: 0.18 },
      { type: 'wall', pos: [0, 1.9, -11], size: { w: 22, h: 3.8, d: 0.3 } },
      { type: 'wall', pos: [-11, 1.9, -6.375], size: { w: 0.3, h: 3.8, d: 9.25 } },
      { type: 'wall', pos: [-11, 1.9, 6.375], size: { w: 0.3, h: 3.8, d: 9.25 } },
      { type: 'wall', pos: [-11, 3.2, 0], size: { w: 0.3, h: 1.2, d: 3.5 } },
      { type: 'wall', pos: [11, 3.3, 0], size: { w: 0.3, h: 1, d: 22 } },
      { type: 'wall', pos: [11, 0.5, -9.9], size: { w: 0.3, h: 1, d: 2.2 } },
      { type: 'wall', pos: [11, 0.5, 2.3], size: { w: 0.3, h: 1, d: 17.4 } },
      { type: 'wall', pos: [11, 1.9, -9.9], size: { w: 0.3, h: 1.8, d: 2.2 } },
      { type: 'wall', pos: [11, 1.9, -5.3], size: { w: 0.3, h: 1.8, d: 2.2 } },
      { type: 'wall', pos: [11, 1.9, -1.5], size: { w: 0.3, h: 1.8, d: 0.6 } },
      { type: 'wall', pos: [11, 1.9, 1.5], size: { w: 0.3, h: 1.8, d: 0.6 } },
      { type: 'wall', pos: [11, 1.9, 7.6], size: { w: 0.3, h: 1.8, d: 6.8 } },
      { type: 'wall', pos: [11, 2.7, -7.6], size: { w: 0.3, h: 0.2, d: 2.4 } },
      { type: 'wall', pos: [-6.375, 1.9, 11], size: { w: 9.25, h: 3.8, d: 0.3 } },
      { type: 'wall', pos: [6.375, 1.9, 11], size: { w: 9.25, h: 3.8, d: 0.3 } },
      { type: 'wall', pos: [0, 3.2, 11], size: { w: 3.5, h: 1.2, d: 0.3 } },
      { type: 'wall_sign', text: 'KEDASH CORP', pos: [-7.5, 3.2, -10.84], size: { width: 4, height: 0.9 } },
      { type: 'decoration', id: 'reception_desk', pos: [-0.039, 0, -9.035], rotY: 0, size: { width: 5.5, height: 2.9, depth: 2, stretch: true } },
      { type: 'builder', fn: 'plant', pos: [-10.2, 0, -10.2] },
      { type: 'builder', fn: 'plant', pos: [10.2, 0, -10.2] },
      { type: 'builder', fn: 'plant', pos: [-10.2, 0, 9.5] },
      { type: 'builder', fn: 'plant', pos: [10.2, 0, 9.5] },
      { type: 'builder', fn: 'water_cooler', pos: [-9.5, 0, -2] },
      { type: 'builder', fn: 'couch', pos: [-8.5, 0, 5], rotY: 1.5708 },
      { type: 'builder', fn: 'couch', pos: [8.5, 0, 5], rotY: -1.5708 },
      { type: 'builder', fn: 'desk', pos: [-7.5, 0, -3], rotY: 1.5708, args: { w: 1.6, d: 0.8 }, scale: [1.55, 1.55, 1.55] },
      { type: 'builder', fn: 'chair', pos: [-6.4, 0, -3] },
      { type: 'builder', fn: 'desk', pos: [7.5, 0, -3], rotY: -1.5708, args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'chair', pos: [6.4, 0, -3], rotY: 3.1416 },
      { type: 'builder', fn: 'desk', pos: [-7.5, 0, 3], rotY: 1.5708, args: { w: 2.2, d: 0.8 } },
      { type: 'builder', fn: 'monitor', pos: [-7.5, 0, 2], rotY: 1.5708, args: { screenColor: 11225020 } },
      { type: 'builder', fn: 'monitor', pos: [-7.5, 0, 4], rotY: 1.5708, args: { screenColor: 16763432 } },
      { type: 'builder', fn: 'chair', pos: [-6.4, 0, 3] },
      { type: 'builder', fn: 'filing_cabinet', pos: [7.6, 0, 2] },
      { type: 'builder', fn: 'filing_cabinet', pos: [7.6, 0, 3] },
      { type: 'builder', fn: 'filing_cabinet', pos: [7.6, 0, 4] },
      { type: 'builder', fn: 'chair', pos: [6.2, 0, 3], rotY: 3.1416 },
      { type: 'builder', fn: 'reception_windows' },
      { type: 'builder', fn: 'decorate_reception' },
      { type: 'builder', fn: 'reception_centerpiece' },
      { type: 'builder', fn: 'atrium' },
      { type: 'builder', fn: 'elevator' }
    ],
  },
  {
    id: 'library',
    floor: 1,
    zoneIdx: 1,
    description: 'Knowledge Library — reading tables, bookshelves, library NPCs',
    objects: [
      { type: 'floor_plate', pos: [0, 0, 22], size: { w: 22, d: 22 }, color: 0x8d6e63 },
      { type: 'wall', pos: [-10.9917, 1.9, 16.6015], rotY: 0, size: { w: 0.3, h: 3.8, d: 10.9 } },
      { type: 'wall', pos: [-10.995, 1.9, 27.4087], rotY: 0, size: { w: 0.3, h: 3.8, d: 10.85 } },
      { type: 'wall', pos: [-11, 3.2, 22], size: { w: 0.3, h: 1.2, d: 3.5 } },
      { type: 'wall', pos: [11.0446, 1.9, 22.2897], rotY: 0, size: { w: 0.3, h: 3.8, d: 22 } },
      { type: 'wall_sign', text: 'KNOWLEDGE LIBRARY', pos: [-10.83, 2.8, 22], rotY: 1.5708, size: { width: 8, height: 1.6 }, bg: '#3e2723', fg: '#d4af37' },
      { type: 'builder', fn: 'bookshelf', pos: [-10.5, 0, 14], rotY: 1.5708, args: { seed: 14 } },
      { type: 'builder', fn: 'bookshelf', pos: [-10.5, 0, 18], rotY: 1.5708, args: { seed: 18 } },
      { type: 'builder', fn: 'bookshelf', pos: [-10.5, 0, 26], rotY: 1.5708, args: { seed: 26 } },
      { type: 'builder', fn: 'bookshelf', pos: [10.5, 0, 14], rotY: -1.5708, args: { seed: 114 } },
      { type: 'builder', fn: 'bookshelf', pos: [10.5, 0, 18], rotY: -1.5708, args: { seed: 118 } },
      { type: 'builder', fn: 'bookshelf', pos: [10.5, 0, 26], rotY: -1.5708, args: { seed: 126 } },
      { type: 'builder', fn: 'table', pos: [0, 0, 16] },
      { type: 'builder', fn: 'table', pos: [0, 0, 22] },
      { type: 'builder', fn: 'chair', pos: [-1.6, 0, 16], rotY: 1.5708, args: { color: 5125166 } },
      { type: 'builder', fn: 'chair', pos: [1.6, 0, 16], rotY: -1.5708, args: { color: 5125166 } },
      { type: 'builder', fn: 'chair', pos: [-1.6, 0, 22], rotY: 1.5708, args: { color: 5125166 } },
      { type: 'builder', fn: 'chair', pos: [1.6, 0, 22], rotY: -1.5708, args: { color: 5125166 } },
      { type: 'builder', fn: 'lamp', pos: [0, 0, 16] },
      { type: 'builder', fn: 'lamp', pos: [0, 0, 22] },
      { type: 'builder', fn: 'plant', pos: [-9.8, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [9.8, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [-9.8, 0, 30] },
      { type: 'builder', fn: 'plant', pos: [9.8, 0, 30] },
      { type: 'builder', fn: 'library_ceiling' },
      { type: 'builder', fn: 'library_arched_window' },
      { type: 'builder', fn: 'decorate_library' },
      { type: 'wall', pos: [-0.0097, 0, 33.1334], rotY: 0, size: { w: 21.8, h: 7.6, d: 0.3 } }
    ],
  },
  {
    id: 'west_files',
    floor: 1,
    zoneIdx: 2,
    template: 'west_room',
    center: [-22, 0, 0],
    objects: [
      { type: 'builder', fn: 'table', pos: [-22, 0, 0] },
      { type: 'builder', fn: 'lamp', pos: [-22, 0, 0] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, -9] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, -9] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, 9] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, 9] }
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
      { type: 'builder', fn: 'lamp', pos: [-22, 0, 22] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, 13] },
      { type: 'builder', fn: 'plant', pos: [-31, 0, 31] },
      { type: 'builder', fn: 'plant', pos: [-13, 0, 31] }
    ],
  },
  // ─────────────────────────────────────────────────────────────────
  // FLOOR 2 — Open coworking (north) + two enclosed meeting rooms (south)
  // ─────────────────────────────────────────────────────────────────
  // Layout: north half is open coworking; south half is split into
  // SW + SE enclosed rooms by an E-W wall at z=0 (with a 3 m doorway
  // gap at x=0) and a N-S wall at x=0 (south half only). The four
  // chapter-cluster desk slots at (±5.5, ±5.5) sit at floor's four
  // corners, two of them in the open coworking, two in the meeting
  // rooms. Outer perimeter + elevator door come from buildFloorOffice.
  {
    id: 'office_floor2',
    floor: 2,
    template: 'office_floor',
    objects: [
      // East–west divider at z=0, split for a 3 m doorway centered at x=0.
      { type: 'wall', pos: [-6.25, wallH/2, 0],  size: { w: 9.5, h: wallH, d: 0.3 } },
      { type: 'wall', pos: [ 6.25, wallH/2, 0],  size: { w: 9.5, h: wallH, d: 0.3 } },
      // North–south divider at x=0, south half only (z=0..+11) split
      // for a 2.5 m doorway centered at z=+5.5 (between the two south desks).
      { type: 'wall', pos: [0, wallH/2, 2.125], size: { w: 0.3, h: wallH, d: 4.25 } },  // z=0..4.25
      { type: 'wall', pos: [0, wallH/2, 8.875], size: { w: 0.3, h: wallH, d: 4.25 } },  // z=6.75..11
      // Lintels above the doorways (decorative — auto-skipped from collide).
      { type: 'wall', pos: [0, wallH - 0.4, 0], size: { w: 3, h: 0.8, d: 0.3 } },

      // Chapter-cluster desks (slot positions used by floorOfficePositionForNPC).
      { type: 'builder', fn: 'desk', pos: [-5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [-5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },

      // Coworking touches (north half) — couch + plants for the open area.
      { type: 'builder', fn: 'couch', pos: [0, 0, -9], rotY: 0 },
      { type: 'builder', fn: 'plant', pos: [-9.5, 0, -9.5] },
      { type: 'builder', fn: 'plant', pos: [ 9.5, 0, -9.5] },
      { type: 'builder', fn: 'water_cooler', pos: [-9.5, 0, -3] },

      // SW meeting room — a small conference table flanked by two chairs.
      { type: 'builder', fn: 'table', pos: [-5.5, 0, 8.5], args: { w: 2.2 } },
      { type: 'builder', fn: 'chair', pos: [-4.0, 0, 8.5], rotY: -Math.PI / 2 },
      { type: 'builder', fn: 'chair', pos: [-7.0, 0, 8.5], rotY:  Math.PI / 2 },

      // SE meeting room — filing cabinet wall + plant for a working feel.
      { type: 'builder', fn: 'filing_cabinet', pos: [9.5, 0, 2] },
      { type: 'builder', fn: 'filing_cabinet', pos: [9.5, 0, 3] },
      { type: 'builder', fn: 'plant', pos: [9.5, 0, 9.5] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // FLOOR 3 — Engineering pods around a central kitchen
  // ─────────────────────────────────────────────────────────────────
  // Layout: no full interior walls — instead a central kitchen
  // counter at the origin (~4×4 m of furniture) creates four pod
  // areas around it. Each pod has its chapter desk. Reads as an
  // open-plan engineering floor with a shared break area.
  {
    id: 'office_floor3',
    floor: 3,
    template: 'office_floor',
    objects: [
      // Low partition counters around the central kitchen — short
      // walls (h=1.0 m) that don't fully separate the pods but
      // visually anchor the kitchen. Lintel-skip would apply if these
      // were overhead; here they're 0..1 m so they DO collide.
      { type: 'wall', pos: [-2.5, 0.5, -2.5], size: { w: 0.3, h: 1.0, d: 5 } },  // NW partition (N-S)
      { type: 'wall', pos: [ 2.5, 0.5, -2.5], size: { w: 0.3, h: 1.0, d: 5 } },  // NE partition
      { type: 'wall', pos: [-2.5, 0.5,  2.5], size: { w: 5,   h: 1.0, d: 0.3 } },// SW partition (E-W)
      { type: 'wall', pos: [ 2.5, 0.5,  2.5], size: { w: 5,   h: 1.0, d: 0.3 } },// SE partition

      // Chapter-cluster desks at corners — slot positions preserved
      // so floorOfficePositionForNPC's NPC placement still works.
      { type: 'builder', fn: 'desk', pos: [-5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [-5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      // Per-desk monitor to make engineering pods feel like dev stations.
      { type: 'builder', fn: 'monitor', pos: [-5.5, 0, -5.7], args: { screenColor: 0x4fc3f7 } },
      { type: 'builder', fn: 'monitor', pos: [ 5.5, 0, -5.7], args: { screenColor: 0xab47bc } },
      { type: 'builder', fn: 'monitor', pos: [-5.5, 0,  5.3], args: { screenColor: 0x66bb6a } },
      { type: 'builder', fn: 'monitor', pos: [ 5.5, 0,  5.3], args: { screenColor: 0xffca28 } },

      // Central kitchen — table at the heart serves as a stand-in
      // counter; water cooler off to one side; couches for break.
      { type: 'builder', fn: 'table', pos: [0, 0, 0], args: { w: 3.0 } },
      { type: 'builder', fn: 'water_cooler', pos: [-1.6, 0, 0] },
      { type: 'builder', fn: 'couch', pos: [0, 0, -9.5], rotY: 0 },
      { type: 'builder', fn: 'couch', pos: [0, 0,  9.5], rotY: Math.PI },

      // Corner plants to soften the engineering vibe.
      { type: 'builder', fn: 'plant', pos: [-9.5, 0, -9.5] },
      { type: 'builder', fn: 'plant', pos: [ 9.5, 0, -9.5] },
      { type: 'builder', fn: 'plant', pos: [-9.5, 0,  9.5] },
      { type: 'builder', fn: 'plant', pos: [ 9.5, 0,  9.5] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // FLOOR 4 — Executive suite with central E-W corridor
  // ─────────────────────────────────────────────────────────────────
  // Layout: a 3 m corridor runs E-W along z=0 (between two long walls).
  // Four enclosed offices fan off the corridor: NW + NE in the north
  // half, SW + SE in the south. Each office has its chapter desk plus
  // executive furnishings (bookshelf, plant, monitor).
  {
    id: 'office_floor4',
    floor: 4,
    template: 'office_floor',
    objects: [
      // Corridor walls — two long E-W walls at z=±1.5, each with 3 m
      // doorways centered at x=±5.5 (aligned to the chapter desks).
      // North wall of corridor (z=-1.5): 3 segments, doors between them.
      { type: 'wall', pos: [-9, wallH/2, -1.5], size: { w: 4, h: wallH, d: 0.3 } }, // x=-11..-7
      { type: 'wall', pos: [ 0, wallH/2, -1.5], size: { w: 8, h: wallH, d: 0.3 } }, // x=-4..+4
      { type: 'wall', pos: [ 9, wallH/2, -1.5], size: { w: 4, h: wallH, d: 0.3 } }, // x=+7..+11
      // South wall of corridor (z=+1.5):
      { type: 'wall', pos: [-9, wallH/2,  1.5], size: { w: 4, h: wallH, d: 0.3 } },
      { type: 'wall', pos: [ 0, wallH/2,  1.5], size: { w: 8, h: wallH, d: 0.3 } },
      { type: 'wall', pos: [ 9, wallH/2,  1.5], size: { w: 4, h: wallH, d: 0.3 } },
      // Office-dividing N-S walls in the north half (between NW and NE)
      // and south half (between SW and SE). Stop 0.75 m short of the
      // corridor walls (corridor at z=±1.5) and the outer walls.
      { type: 'wall', pos: [0, wallH/2, -6.625], size: { w: 0.3, h: wallH, d: 8.75 } }, // z=-11..-2.25
      { type: 'wall', pos: [0, wallH/2,  6.625], size: { w: 0.3, h: wallH, d: 8.75 } }, // z=+2.25..+11

      // Chapter-cluster desks at corners (slot positions preserved).
      { type: 'builder', fn: 'desk', pos: [-5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0, -5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [-5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },
      { type: 'builder', fn: 'desk', pos: [ 5.5, 0,  5.5], args: { w: 1.6, d: 0.8 } },

      // Executive furnishings — one of each per office.
      { type: 'builder', fn: 'bookshelf', pos: [-9.5, 0, -8.5], rotY: 0 },        // NW
      { type: 'builder', fn: 'plant',     pos: [-9.5, 0, -3] },                   // NW
      { type: 'builder', fn: 'bookshelf', pos: [ 9.5, 0, -8.5], rotY: 0 },        // NE
      { type: 'builder', fn: 'plant',     pos: [ 9.5, 0, -3] },                   // NE
      { type: 'builder', fn: 'couch',     pos: [-9, 0,  9], rotY:  Math.PI / 2 }, // SW lounge couch
      { type: 'builder', fn: 'plant',     pos: [-9.5, 0,  3] },                   // SW
      { type: 'builder', fn: 'couch',     pos: [ 9, 0,  9], rotY: -Math.PI / 2 }, // SE lounge couch
      { type: 'builder', fn: 'plant',     pos: [ 9.5, 0,  3] },                   // SE
    ],
  }
];

// Lookup helpers used by play.js and the in-game editor.
window.ROOM_BY_ZONE = (floor, zoneIdx) =>
  window.ROOMS.find(r => r.floor === floor && r.zoneIdx === zoneIdx) || null;
window.ROOM_BY_ID = (id) => window.ROOMS.find(r => r.id === id) || null;
