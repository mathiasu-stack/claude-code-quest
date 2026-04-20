const LEVELS = [
  { min: 0,    label: 'New Hire',         rank: 'Grade 1' },
  { min: 300,  label: 'Junior Associate', rank: 'Grade 2' },
  { min: 800,  label: 'Associate',        rank: 'Grade 3' },
  { min: 1500, label: 'Senior Associate', rank: 'Grade 4' },
  { min: 2500, label: 'Consultant',       rank: 'Grade 5' },
  { min: 4000, label: 'Senior Consultant',rank: 'Grade 6' },
  { min: 6000, label: 'Manager',          rank: 'Grade 7' },
  { min: 8000, label: 'Senior Manager',   rank: 'Grade 8' },
  { min: 10000,label: 'Director',         rank: 'Grade 9' },
  { min: 13000,label: 'VP of AI',         rank: 'Grade 10' },
];

function getLevel(xp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.min) current = level;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] || null;
  const progressToNext = next
    ? Math.round(((xp - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { ...current, next, progressToNext };
}

function getLevelLabel(xp) {
  return getLevel(xp).label;
}

function formatXP(xp) {
  return xp.toLocaleString() + ' PP';
}

window.Scoring = { getLevel, getLevelLabel, formatXP };
