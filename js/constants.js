export const WEEKS_PER_MESO = 8;

// The four fixed training days of a mesocycle week, in the order they're trained.
export const TRAINING_DAYS = [
  { key: 'thu', name: 'Thursday', short: 'Thu' },
  { key: 'fri', name: 'Friday', short: 'Fri' },
  { key: 'sat', name: 'Saturday', short: 'Sat' },
  { key: 'mon', name: 'Monday', short: 'Mon' },
];

/**
 * Colour-coded muscle groups. `id` is what gets stored on an exercise.
 * Hues are spread so that muscles trained on the same day stay easy to tell apart.
 */
export const MUSCLES = [
  { id: 'chest', name: 'Chest', color: '#FF6B6B' },
  { id: 'back', name: 'Back', color: '#4DABF7' },
  { id: 'lats', name: 'Lats', color: '#5C7CFA' },
  { id: 'traps', name: 'Traps', color: '#9C6ADE' },
  { id: 'shoulders', name: 'Shoulders', color: '#FFA94D' },
  { id: 'biceps', name: 'Biceps', color: '#3DDC97' },
  { id: 'triceps', name: 'Triceps', color: '#17B8A6' },
  { id: 'forearms', name: 'Forearms', color: '#94D82D' },
  { id: 'quads', name: 'Quads', color: '#8B5CF6' },
  { id: 'hamstrings', name: 'Hamstrings', color: '#E879F9' },
  { id: 'glutes', name: 'Glutes', color: '#FB7185' },
  { id: 'calves', name: 'Calves', color: '#A9E34B' },
  { id: 'erectors', name: 'Lower Back', color: '#D9A05B' },
  { id: 'abs', name: 'Abs', color: '#FFD43B' },
];

export const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));

export function muscleName(id) {
  return MUSCLE_BY_ID[id]?.name ?? id ?? 'Other';
}

export function muscleColor(id) {
  return MUSCLE_BY_ID[id]?.color ?? '#8B94A3';
}

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Smith machine',
  'Bodyweight',
  'Bands',
  'Other',
];
