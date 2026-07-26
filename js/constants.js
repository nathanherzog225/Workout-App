export const WEEKS_PER_MESO = 8;

// The four fixed training days of a mesocycle week, in the order they're trained.
export const TRAINING_DAYS = [
  { key: 'thu', name: 'Thursday', short: 'Thu' },
  { key: 'fri', name: 'Friday', short: 'Fri' },
  { key: 'sat', name: 'Saturday', short: 'Sat' },
  { key: 'mon', name: 'Monday', short: 'Mon' },
];

// Colour-coded muscle groups. `id` is what gets stored on an exercise.
export const MUSCLES = [
  { id: 'chest', name: 'Chest', color: '#FF6B6B' },
  { id: 'back', name: 'Back', color: '#4DABF7' },
  { id: 'lats', name: 'Lats', color: '#3BC9DB' },
  { id: 'traps', name: 'Traps', color: '#5C7CFA' },
  { id: 'shoulders', name: 'Shoulders', color: '#FFA94D' },
  { id: 'biceps', name: 'Biceps', color: '#38D9A9' },
  { id: 'triceps', name: 'Triceps', color: '#22B8CF' },
  { id: 'forearms', name: 'Forearms', color: '#94D82D' },
  { id: 'quads', name: 'Quads', color: '#9775FA' },
  { id: 'hamstrings', name: 'Hamstrings', color: '#DA77F2' },
  { id: 'glutes', name: 'Glutes', color: '#F783AC' },
  { id: 'calves', name: 'Calves', color: '#A9E34B' },
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
