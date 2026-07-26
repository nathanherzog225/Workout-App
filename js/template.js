/**
 * The training split a new mesocycle is generated from.
 *
 * Names, muscle groups and equipment match the exercise library exactly, so
 * every entry resolves to a library exercise rather than creating a duplicate.
 * Exercise order is exactly as trained — the day view groups *consecutive*
 * exercises that share a muscle, so this order is never reshuffled.
 */
export const DEFAULT_SETS = 2;

export const DEFAULT_SPLIT = [
  {
    key: 'thu',
    label: 'Upper A',
    exercises: [
      { name: 'Bench Press (Narrow Grip)', muscle: 'chest', equipment: 'Barbell' },
      { name: 'Dumbbell Press Flye (Incline)', muscle: 'chest', equipment: 'Dumbbell' },
      { name: 'Machine Triceps Extension', muscle: 'triceps', equipment: 'Machine' },
      { name: 'Dumbbell Row (2-Arm)', muscle: 'back', equipment: 'Dumbbell' },
      { name: 'Machine Pulldown', muscle: 'back', equipment: 'Machine' },
      { name: 'Cable Curl', muscle: 'biceps', equipment: 'Cable' },
      { name: 'Machine Lateral Raise', muscle: 'shoulders', equipment: 'Machine' },
      { name: 'Knee to abs', muscle: 'abs', equipment: 'Bodyweight Only' },
    ],
  },
  {
    key: 'fri',
    label: 'Lower A',
    exercises: [
      { name: 'Smith Machine Squat (Feet Forward)', muscle: 'quads', equipment: 'Smith Machine' },
      { name: 'Leg Press', muscle: 'quads', equipment: 'Machine' },
      { name: 'Machine Glute Kickback', muscle: 'glutes', equipment: 'Machine' },
      { name: 'Back Raise (45 degree)', muscle: 'hamstrings', equipment: 'Bodyweight Only' },
      { name: 'Calf Machine', muscle: 'calves', equipment: 'Machine' },
      { name: 'Machine Crunch', muscle: 'abs', equipment: 'Machine' },
    ],
  },
  {
    key: 'sat',
    label: 'Upper B',
    exercises: [
      { name: 'Dumbbell Row (2-Arm)', muscle: 'back', equipment: 'Dumbbell' },
      { name: 'EZ Bar Overhead Triceps Extension', muscle: 'triceps', equipment: 'Barbell' },
      { name: 'Cable Triceps Pushdown (Bar)', muscle: 'triceps', equipment: 'Cable' },
      { name: 'Pec Dec Flye', muscle: 'chest', equipment: 'Machine' },
      { name: 'Dumbbell Curl (Alternating)', muscle: 'biceps', equipment: 'Dumbbell' },
      { name: 'Cable Curl', muscle: 'biceps', equipment: 'Cable' },
      { name: 'Machine Lateral Raise', muscle: 'shoulders', equipment: 'Machine' },
      { name: 'Knee to abs', muscle: 'abs', equipment: 'Bodyweight Only' },
    ],
  },
  {
    key: 'mon',
    label: 'Lower B',
    exercises: [
      { name: 'Barbell Hip Thrust', muscle: 'glutes', equipment: 'Barbell' },
      { name: 'Smith Machine Squat (Feet Forward)', muscle: 'quads', equipment: 'Smith Machine' },
      { name: 'Lying Leg Curl', muscle: 'hamstrings', equipment: 'Machine' },
      { name: 'Back Raise (weighted)', muscle: 'hamstrings', equipment: 'Freemotion' },
      { name: 'Machine Crunch', muscle: 'abs', equipment: 'Machine' },
      { name: 'Barbell Standing Wrist Curl', muscle: 'forearms', equipment: 'Barbell' },
    ],
  },
];
