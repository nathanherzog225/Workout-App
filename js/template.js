/**
 * The training split a new mesocycle is generated from.
 *
 * Names, muscle groups and equipment match the exercise library exactly, so
 * every entry resolves to a library exercise rather than creating a duplicate.
 * Exercise order is exactly as trained — the day view groups *consecutive*
 * exercises that share a muscle, so this order is never reshuffled.
 *
 * `sets` is [weight, reps] per set, and defines both the set count and the
 * starting numbers pre-filled into week 1. They are filled in but NOT logged:
 * they're editable starting values you tick off as you actually do them.
 * Weeks 2–8 get the same exercises and set counts with empty fields.
 *
 * Weights are lb. Bodyweight exercises carry the logged bodyweight (165).
 */
export const DEFAULT_SETS = 2;

export const DEFAULT_SPLIT = [
  {
    key: 'thu',
    label: 'Thursday',
    exercises: [
      {
        name: 'Bench Press (Narrow Grip)', muscle: 'chest', equipment: 'Barbell',
        sets: [['100', '12'], ['110', '10']],
      },
      {
        name: 'Dumbbell Press Flye (Incline)', muscle: 'chest', equipment: 'Dumbbell',
        sets: [['25', '12'], ['40', '5'], ['30', '10']],
      },
      {
        name: 'Machine Triceps Extension', muscle: 'triceps', equipment: 'Machine',
        sets: [['70', '12'], ['80', '10']],
      },
      {
        name: 'Dumbbell Row (2-Arm)', muscle: 'back', equipment: 'Dumbbell',
        sets: [['40', '12'], ['45', '10']],
      },
      {
        name: 'Machine Pulldown', muscle: 'back', equipment: 'Machine',
        sets: [['55', '12'], ['65', '10']],
      },
      {
        name: 'Cable Curl', muscle: 'biceps', equipment: 'Cable',
        sets: [['50', '12'], ['57.5', '8'], ['65', '4']],
      },
      {
        name: 'Machine Lateral Raise', muscle: 'shoulders', equipment: 'Machine',
        sets: [['30', '12'], ['45', '10'], ['60', '8']],
      },
      {
        name: 'Knee to abs', muscle: 'abs', equipment: 'Bodyweight Only',
        sets: [['165', '20'], ['165', '20']],
      },
    ],
  },
  {
    key: 'fri',
    label: 'Friday',
    exercises: [
      {
        name: 'Smith Machine Squat (Feet Forward)', muscle: 'quads', equipment: 'Smith Machine',
        sets: [['90', '12'], ['100', '10']],
      },
      {
        name: 'Leg Press', muscle: 'quads', equipment: 'Machine',
        sets: [['180', '12'], ['230', '10']],
      },
      {
        name: 'Machine Glute Kickback', muscle: 'glutes', equipment: 'Machine',
        sets: [['35', '12'], ['50', '10']],
      },
      {
        name: 'Back Raise (45 degree)', muscle: 'hamstrings', equipment: 'Bodyweight Only',
        sets: [['165', '20']],
      },
      {
        name: 'Calf Machine', muscle: 'calves', equipment: 'Machine',
        sets: [['125', '12'], ['155', '10']],
      },
      {
        name: 'Machine Crunch', muscle: 'abs', equipment: 'Machine',
        sets: [['105', '13'], ['120', '12']],
      },
    ],
  },
  {
    key: 'sat',
    label: 'Saturday',
    exercises: [
      {
        name: 'Dumbbell Row (2-Arm)', muscle: 'back', equipment: 'Dumbbell',
        sets: [['40', '12'], ['45', '10']],
      },
      {
        name: 'EZ Bar Overhead Triceps Extension', muscle: 'triceps', equipment: 'Barbell',
        sets: [['50', '12'], ['60', '10']],
      },
      {
        name: 'Cable Triceps Pushdown (Bar)', muscle: 'triceps', equipment: 'Cable',
        sets: [['50', '12'], ['57.5', '10']],
      },
      {
        name: 'Pec Dec Flye', muscle: 'chest', equipment: 'Machine',
        sets: [['100', '12'], ['130', '10']],
      },
      {
        name: 'Dumbbell Curl (Alternating)', muscle: 'biceps', equipment: 'Dumbbell',
        sets: [['30', '12'], ['35', '10'], ['35', '8']],
      },
      {
        name: 'Cable Curl', muscle: 'biceps', equipment: 'Cable',
        sets: [['35', '12'], ['42.5', '10'], ['50', '8']],
      },
      {
        name: 'Machine Lateral Raise', muscle: 'shoulders', equipment: 'Machine',
        sets: [['35', '12'], ['50', '10'], ['65', '8']],
      },
      {
        name: 'Knee to abs', muscle: 'abs', equipment: 'Bodyweight Only',
        sets: [['165', '25'], ['165', '25']],
      },
    ],
  },
  {
    key: 'mon',
    label: 'Monday',
    exercises: [
      {
        name: 'Barbell Hip Thrust', muscle: 'glutes', equipment: 'Barbell',
        sets: [['80', '12'], ['105', '10']],
      },
      {
        name: 'Smith Machine Squat (Feet Forward)', muscle: 'quads', equipment: 'Smith Machine',
        sets: [['95', '12'], ['100', '10']],
      },
      {
        name: 'Lying Leg Curl', muscle: 'hamstrings', equipment: 'Machine',
        sets: [['100', '12']],
      },
      {
        name: 'Back Raise (weighted)', muscle: 'hamstrings', equipment: 'Freemotion',
        sets: [['45', '12']],
      },
      {
        name: 'Machine Crunch', muscle: 'abs', equipment: 'Machine',
        sets: [['135', '12'], ['150', '10']],
      },
      {
        name: 'Barbell Standing Wrist Curl', muscle: 'forearms', equipment: 'Barbell',
        sets: [['95', '12'], ['105', '10'], ['115', '8']],
      },
    ],
  },
];
