/**
 * Built-in exercise catalogue, used to populate the swap list and the
 * "add exercise" picker. Seeded into the saved library once, after which it's
 * just ordinary data you can add to.
 *
 * Names that also appear in the training split are spelled identically here so
 * seeding doesn't create duplicates.
 */
export const CATALOG = [
  // chest
  { name: 'Bench Press (Narrow Grip)', muscle: 'chest', equipment: 'Barbell' },
  { name: 'Barbell Bench Press', muscle: 'chest', equipment: 'Barbell' },
  { name: 'Incline Barbell Press', muscle: 'chest', equipment: 'Barbell' },
  { name: 'Dumbbell Bench Press', muscle: 'chest', equipment: 'Dumbbell' },
  { name: 'Incline Dumbbell Press', muscle: 'chest', equipment: 'Dumbbell' },
  { name: 'Dumbbell Press Flye (Incline)', muscle: 'chest', equipment: 'Dumbbell' },
  { name: 'Machine Chest Press', muscle: 'chest', equipment: 'Machine' },
  { name: 'Pec Dec Flye', muscle: 'chest', equipment: 'Machine' },
  { name: 'Cable Crossover', muscle: 'chest', equipment: 'Cable' },
  { name: 'Smith Machine Incline Press', muscle: 'chest', equipment: 'Smith machine' },
  { name: 'Push-Up', muscle: 'chest', equipment: 'Bodyweight' },
  { name: 'Dip (Chest Lean)', muscle: 'chest', equipment: 'Bodyweight' },

  // back
  { name: 'Dumbbell Row (2-Arm)', muscle: 'back', equipment: 'Dumbbell' },
  { name: 'Dumbbell Row (1-Arm)', muscle: 'back', equipment: 'Dumbbell' },
  { name: 'Barbell Row', muscle: 'back', equipment: 'Barbell' },
  { name: 'T-Bar Row', muscle: 'back', equipment: 'Barbell' },
  { name: 'Seated Cable Row', muscle: 'back', equipment: 'Cable' },
  { name: 'Chest Supported Row', muscle: 'back', equipment: 'Machine' },
  { name: 'Machine Row', muscle: 'back', equipment: 'Machine' },
  { name: 'Face Pull', muscle: 'back', equipment: 'Cable' },

  // lats
  { name: 'Machine Pulldown', muscle: 'lats', equipment: 'Machine' },
  { name: 'Lat Pulldown (Wide)', muscle: 'lats', equipment: 'Cable' },
  { name: 'Pull-Up', muscle: 'lats', equipment: 'Bodyweight' },
  { name: 'Chin-Up', muscle: 'lats', equipment: 'Bodyweight' },
  { name: 'Assisted Pull-Up', muscle: 'lats', equipment: 'Machine' },
  { name: 'Straight-Arm Pulldown', muscle: 'lats', equipment: 'Cable' },
  { name: 'Cable Pullover', muscle: 'lats', equipment: 'Cable' },

  // traps
  { name: 'Barbell Shrug', muscle: 'traps', equipment: 'Barbell' },
  { name: 'Dumbbell Shrug', muscle: 'traps', equipment: 'Dumbbell' },
  { name: 'Cable Shrug', muscle: 'traps', equipment: 'Cable' },
  { name: 'Machine Shrug', muscle: 'traps', equipment: 'Machine' },

  // shoulders
  { name: 'Machine Lateral Raise', muscle: 'shoulders', equipment: 'Machine' },
  { name: 'Dumbbell Lateral Raise', muscle: 'shoulders', equipment: 'Dumbbell' },
  { name: 'Cable Lateral Raise', muscle: 'shoulders', equipment: 'Cable' },
  { name: 'Overhead Press (Barbell)', muscle: 'shoulders', equipment: 'Barbell' },
  { name: 'Dumbbell Shoulder Press', muscle: 'shoulders', equipment: 'Dumbbell' },
  { name: 'Machine Shoulder Press', muscle: 'shoulders', equipment: 'Machine' },
  { name: 'Rear Delt Flye (Dumbbell)', muscle: 'shoulders', equipment: 'Dumbbell' },
  { name: 'Reverse Pec Dec', muscle: 'shoulders', equipment: 'Machine' },
  { name: 'Upright Row', muscle: 'shoulders', equipment: 'Barbell' },

  // biceps
  { name: 'Cable Curl', muscle: 'biceps', equipment: 'Cable' },
  { name: 'Dumbbell Curl (Alternating)', muscle: 'biceps', equipment: 'Dumbbell' },
  { name: 'Barbell Curl', muscle: 'biceps', equipment: 'Barbell' },
  { name: 'EZ Bar Curl', muscle: 'biceps', equipment: 'Barbell' },
  { name: 'Incline Dumbbell Curl', muscle: 'biceps', equipment: 'Dumbbell' },
  { name: 'Hammer Curl', muscle: 'biceps', equipment: 'Dumbbell' },
  { name: 'Preacher Curl', muscle: 'biceps', equipment: 'Barbell' },
  { name: 'Machine Curl', muscle: 'biceps', equipment: 'Machine' },

  // triceps
  { name: 'Machine Triceps Extension', muscle: 'triceps', equipment: 'Machine' },
  { name: 'EZ Bar Overhead Triceps Extension', muscle: 'triceps', equipment: 'Barbell' },
  { name: 'Cable Triceps Pushdown (Bar)', muscle: 'triceps', equipment: 'Cable' },
  { name: 'Cable Triceps Pushdown (Rope)', muscle: 'triceps', equipment: 'Cable' },
  { name: 'Dumbbell Overhead Extension', muscle: 'triceps', equipment: 'Dumbbell' },
  { name: 'Skull Crusher', muscle: 'triceps', equipment: 'Barbell' },
  { name: 'Triceps Kickback', muscle: 'triceps', equipment: 'Dumbbell' },
  { name: 'Dip (Upright)', muscle: 'triceps', equipment: 'Bodyweight' },

  // forearms
  { name: 'Barbell Standing Wrist Curl', muscle: 'forearms', equipment: 'Barbell' },
  { name: 'Reverse Wrist Curl', muscle: 'forearms', equipment: 'Barbell' },
  { name: 'Reverse Curl', muscle: 'forearms', equipment: 'Barbell' },
  { name: 'Wrist Roller', muscle: 'forearms', equipment: 'Other' },
  { name: "Farmer's Carry", muscle: 'forearms', equipment: 'Dumbbell' },

  // quads
  { name: 'Smith Machine Squat (Feet Forward)', muscle: 'quads', equipment: 'Smith machine' },
  { name: 'Leg Press', muscle: 'quads', equipment: 'Machine' },
  { name: 'Barbell Back Squat', muscle: 'quads', equipment: 'Barbell' },
  { name: 'Front Squat', muscle: 'quads', equipment: 'Barbell' },
  { name: 'Hack Squat', muscle: 'quads', equipment: 'Machine' },
  { name: 'Leg Extension', muscle: 'quads', equipment: 'Machine' },
  { name: 'Bulgarian Split Squat', muscle: 'quads', equipment: 'Dumbbell' },
  { name: 'Walking Lunge', muscle: 'quads', equipment: 'Dumbbell' },
  { name: 'Goblet Squat', muscle: 'quads', equipment: 'Dumbbell' },

  // hamstrings
  { name: 'Lying Leg Curl', muscle: 'hamstrings', equipment: 'Machine' },
  { name: 'Seated Leg Curl', muscle: 'hamstrings', equipment: 'Machine' },
  { name: 'Romanian Deadlift', muscle: 'hamstrings', equipment: 'Barbell' },
  { name: 'Stiff Leg Deadlift', muscle: 'hamstrings', equipment: 'Barbell' },
  { name: 'Good Morning', muscle: 'hamstrings', equipment: 'Barbell' },
  { name: 'Glute Ham Raise', muscle: 'hamstrings', equipment: 'Bodyweight' },

  // glutes
  { name: 'Barbell Hip Thrust', muscle: 'glutes', equipment: 'Barbell' },
  { name: 'Machine Glute Kickback', muscle: 'glutes', equipment: 'Machine' },
  { name: 'Machine Hip Thrust', muscle: 'glutes', equipment: 'Machine' },
  { name: 'Cable Kickback', muscle: 'glutes', equipment: 'Cable' },
  { name: 'Glute Bridge', muscle: 'glutes', equipment: 'Barbell' },
  { name: 'Sumo Deadlift', muscle: 'glutes', equipment: 'Barbell' },
  { name: 'Step-Up', muscle: 'glutes', equipment: 'Dumbbell' },

  // calves
  { name: 'Calf Machine', muscle: 'calves', equipment: 'Machine' },
  { name: 'Standing Calf Raise', muscle: 'calves', equipment: 'Machine' },
  { name: 'Seated Calf Raise', muscle: 'calves', equipment: 'Machine' },
  { name: 'Leg Press Calf Raise', muscle: 'calves', equipment: 'Machine' },

  // lower back
  { name: 'Back Raise (45 Degree)', muscle: 'erectors', equipment: 'Bodyweight' },
  { name: 'Back Raise (Weighted)', muscle: 'erectors', equipment: 'Other' },
  { name: 'Hyperextension', muscle: 'erectors', equipment: 'Bodyweight' },
  { name: 'Deadlift', muscle: 'erectors', equipment: 'Barbell' },
  { name: 'Reverse Hyper', muscle: 'erectors', equipment: 'Machine' },

  // abs
  { name: 'Machine Crunch', muscle: 'abs', equipment: 'Machine' },
  { name: 'Knee to Abs', muscle: 'abs', equipment: 'Bodyweight' },
  { name: 'Cable Crunch', muscle: 'abs', equipment: 'Cable' },
  { name: 'Hanging Leg Raise', muscle: 'abs', equipment: 'Bodyweight' },
  { name: 'Decline Sit-Up', muscle: 'abs', equipment: 'Bodyweight' },
  { name: 'Ab Wheel', muscle: 'abs', equipment: 'Other' },
  { name: 'Plank', muscle: 'abs', equipment: 'Bodyweight' },
  { name: 'Russian Twist', muscle: 'abs', equipment: 'Other' },
];
