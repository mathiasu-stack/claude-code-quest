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
  player:  { gltfAssetId: 'casual_male_01',     fallbackAssetId: 'hoodie_male_01' },
  linda:   { gltfAssetId: 'business_female_01', fallbackAssetId: 'casual_female_01' },
  marcus:  { gltfAssetId: 'casual_male_02',     fallbackAssetId: 'hoodie_male_01' },
  aisha:   { gltfAssetId: 'glasses_female_01',  fallbackAssetId: 'casual_female_01' },
  kenji:   { gltfAssetId: 'casual_male_03',     fallbackAssetId: 'casual_male_01' },
  diana:   { gltfAssetId: 'business_female_02', fallbackAssetId: 'casual_female_01' },
  sarah:   { gltfAssetId: 'casual_female_02',   fallbackAssetId: 'casual_female_01' },
  elena:   { gltfAssetId: 'business_female_03', fallbackAssetId: 'casual_female_02' },
  raj:     { gltfAssetId: 'beard_male_01',      fallbackAssetId: 'casual_male_02' },
  mei:     { gltfAssetId: 'casual_female_03',   fallbackAssetId: 'casual_female_01' },
  noor:    { gltfAssetId: 'hijab_female_01',    fallbackAssetId: null }, // procedural-only fallback
};

// Auto-generated chapter NPCs (ch03..ch16) — round-robin through the
// available casual variants based on a hash of the id, so each gets a
// stable variant across reloads but variety is preserved.
const AUTO_POOL = [
  'casual_male_01', 'casual_male_02', 'casual_male_03',
  'casual_female_01', 'casual_female_02', 'casual_female_03',
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
