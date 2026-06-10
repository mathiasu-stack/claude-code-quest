// npcCasting.js — maps each named character to a Quaternius asset.
//
// Used by the GLTF builder pipeline. If an entry's asset is unavailable
// (manifest.available === false, or load 404), the caller falls back
// to the procedural builder for that character.
//
// To re-cast a character, change its `gltfAssetId` here and reload.
// Adding a new named NPC: add an entry keyed by their id (the same id
// faceConfigs.js / npcLooks.js uses).

export const NPC_CASTING = {
  player:  { gltfAssetId: 'hero',               fallbackAssetId: 'western_male' },
  linda:   { gltfAssetId: 'business_female_01', fallbackAssetId: 'western_female' },
  marcus:  { gltfAssetId: 'executive_male_01',  fallbackAssetId: 'western_male' },
  // Re-cast the formerly procedural NPCs onto the 10 ethnicity rigs.
  // Gender-matched to the established names/looks; ethnicity matched
  // where the name implies it. western_female is reused for diana +
  // elena (both European/light) — gltfCharacter applies a per-NPC
  // stature variation (manifest statureVary) so they read distinctly.
  aisha:   { gltfAssetId: 'sasian_female',      fallbackAssetId: 'western_female' },
  kenji:   { gltfAssetId: 'easian_male',        fallbackAssetId: 'western_male' },
  diana:   { gltfAssetId: 'western_female',     fallbackAssetId: 'easian_female' },
  sarah:   { gltfAssetId: 'african_female',     fallbackAssetId: 'western_female' },
  elena:   { gltfAssetId: 'western_female',     fallbackAssetId: 'easian_female' },
  raj:     { gltfAssetId: 'sasian_male',        fallbackAssetId: 'western_male' },
  mei:     { gltfAssetId: 'easian_female',      fallbackAssetId: 'western_female' },
  noor:    { gltfAssetId: 'hijab_female',       fallbackAssetId: 'sasian_female' },
  ines:    { gltfAssetId: 'ines',               fallbackAssetId: null }, // child visitor — static Meshy mesh
  // FIN-03 — Maya rides the western_female rig via her own manifest id;
  // a bespoke maya.glb swaps in later by editing ONLY the manifest
  // entry's `file` field (no code change).
  maya:    { gltfAssetId: 'maya',               fallbackAssetId: 'western_female' },
  // Ceremony stand-ins (FIN-06) — must visually match the originals.
  'fin-maya':  { gltfAssetId: 'maya',            fallbackAssetId: 'western_female' },
  'fin-elena': { gltfAssetId: 'western_female',  fallbackAssetId: 'easian_female' },
  'fin-rena':  { gltfAssetId: 'western_female',  fallbackAssetId: 'easian_female' },
};

// Auto-generated chapter NPCs (ch03..ch16) — round-robin through the
// full ethnicity roster based on a hash of the id, so each gets a
// stable model across reloads but variety is preserved. Per-NPC stature
// variation (gltfCharacter, manifest statureVary) distinguishes NPCs
// that hash to the same model.
const AUTO_POOL = [
  'western_male', 'western_female',
  'african_male', 'african_female',
  'easian_male', 'easian_female',
  'sasian_male', 'sasian_female',
  'arab_male', 'hijab_female',
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getCastingFor(id) {
  if (NPC_CASTING[id]) return NPC_CASTING[id];
  const idx = hashStr(id) % AUTO_POOL.length;
  return { gltfAssetId: AUTO_POOL[idx], fallbackAssetId: null };
}

// Resolve to the actual asset id to load. Tries primary first, then
// fallback, then returns null (caller falls back to procedural).
// `assetLoader.entryFor(id).available` is the gate.
export function resolveAssetForCharacter(id, assetLoader) {
  const c = getCastingFor(id);
  const tryAsset = (aid) => {
    if (!aid) return null;
    const e = assetLoader.entryFor(aid);
    return (e && e.available) ? aid : null;
  };
  return tryAsset(c.gltfAssetId) || tryAsset(c.fallbackAssetId) || null;
}
