export const WEEKS_PER_MESO = 8;

// The four fixed training days of a mesocycle week, in the order they're trained.
export const TRAINING_DAYS = [
  { key: 'thu', name: 'Thursday', short: 'Thu' },
  { key: 'fri', name: 'Friday', short: 'Fri' },
  { key: 'sat', name: 'Saturday', short: 'Sat' },
  { key: 'mon', name: 'Monday', short: 'Mon' },
];

/**
 * Muscle groups, in four colour families:
 *   Chest / Triceps / Shoulders  → magenta-pink
 *   Back / Biceps                → blue
 *   Quads / Hamstrings / Glutes  → green
 *   Abs / Calves / Forearms / Traps → purple
 *
 * Within a family the shades differ in lightness and hue so muscles trained on
 * the same day stay tellable apart at a glance.
 */
export const MUSCLES = [
  { id: 'chest', name: 'Chest', color: '#FF5C8A' },
  { id: 'shoulders', name: 'Shoulders', color: '#FF8FC4' },
  { id: 'triceps', name: 'Triceps', color: '#D6478F' },

  { id: 'back', name: 'Back', color: '#2E90FA' },
  { id: 'biceps', name: 'Biceps', color: '#4CC9F0' },

  { id: 'quads', name: 'Quads', color: '#4ADE80' },
  { id: 'hamstrings', name: 'Hamstrings', color: '#BEF264' },
  { id: 'glutes', name: 'Glutes', color: '#2DD4BF' },

  { id: 'abs', name: 'Abs', color: '#C084FC' },
  { id: 'calves', name: 'Calves', color: '#8B5CF6' },
  { id: 'forearms', name: 'Forearms', color: '#818CF8' },
  { id: 'traps', name: 'Traps', color: '#D8B4FE' },
];

export const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));

/** Muscle groups dropped in later revisions, mapped to where they went. */
export const MUSCLE_ALIASES = {
  lats: 'back',
  erectors: 'hamstrings',
};

export function canonicalMuscle(id) {
  return MUSCLE_ALIASES[id] ?? id;
}

export function muscleName(id) {
  return MUSCLE_BY_ID[canonicalMuscle(id)]?.name ?? id ?? 'Other';
}

export function muscleColor(id) {
  return MUSCLE_BY_ID[canonicalMuscle(id)]?.color ?? '#8B94A3';
}

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Smith Machine',
  'Freemotion',
  'Bodyweight Only',
  'Bodyweight Loadable',
  'Machine Assistance',
];

/** Equipment names dropped in later revisions. */
export const EQUIPMENT_ALIASES = {
  'Smith machine': 'Smith Machine',
  Bodyweight: 'Bodyweight Only',
  Bands: 'Other',
};

export function canonicalEquipment(name) {
  return EQUIPMENT_ALIASES[name] ?? name;
}
