import { WEEKS_PER_MESO, TRAINING_DAYS } from './constants.js';
import { DEFAULT_SPLIT, DEFAULT_SETS } from './template.js';

export function uid(prefix = 'id') {
  const rand = globalThis.crypto?.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

/* ------------------------------------------------------------------ *
 * Construction
 * ------------------------------------------------------------------ */

export function makeSet() {
  return { id: uid('set'), weight: '', reps: '', logged: false };
}

/**
 * An exercise as it appears on one day of one week.
 *
 * Two identity fields, and they do different jobs:
 *  - `libId`  which exercise this *is*. Used to find last week's numbers.
 *  - `slotId` which position in the day this *fills*, stable across all 8
 *             weeks. Used to apply a swap to the rest of the mesocycle.
 */
export function makeExercise({ name, muscle, equipment, libId, slotId }, setCount = DEFAULT_SETS) {
  return {
    id: uid('ex'),
    slotId: slotId || uid('slot'),
    libId: libId || null,
    name,
    muscle,
    equipment: equipment || '',
    sets: Array.from({ length: setCount }, makeSet),
  };
}

/** Library entry = the catalogue of exercises available to pick and swap in. */
export function makeLibraryEntry({ name, muscle, equipment, custom = false }) {
  return { id: uid('lib'), name, muscle, equipment: equipment || '', custom };
}

export function findLibraryEntry(library, name, muscle) {
  const key = name.trim().toLowerCase();
  return library.find((e) => e.name.trim().toLowerCase() === key && e.muscle === muscle);
}

/** Add any exercises from `split` that aren't in the library yet. Returns the library. */
export function seedLibraryFromSplit(library, split = DEFAULT_SPLIT) {
  for (const day of split) {
    for (const ex of day.exercises) {
      if (!findLibraryEntry(library, ex.name, ex.muscle)) library.push(makeLibraryEntry(ex));
    }
  }
  return library;
}

/**
 * Build a full 8-week mesocycle.
 *
 * Every week holds its own independent copy of every exercise and set. Weeks
 * never share objects, so editing week 5 can't reach back into week 1.
 */
export function createMeso({ name, split = DEFAULT_SPLIT, library = [] }) {
  // Slot ids are assigned once per planned exercise, then reused across all weeks.
  const plan = split.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      const entry = findLibraryEntry(library, ex.name, ex.muscle);
      return { ...ex, slotId: uid('slot'), libId: entry?.id ?? null };
    }),
  }));

  return {
    id: uid('meso'),
    name,
    createdAt: new Date().toISOString(),
    finishedAt: null,
    currentWeek: 0,
    weeks: Array.from({ length: WEEKS_PER_MESO }, (_, w) => ({
      index: w,
      days: plan.map((day) => {
        const meta = TRAINING_DAYS.find((d) => d.key === day.key);
        return {
          id: uid('day'),
          key: day.key,
          name: meta?.name ?? day.key,
          short: meta?.short ?? day.key,
          label: day.label,
          finishedAt: null,
          exercises: day.exercises.map((ex) => makeExercise(ex)),
        };
      }),
    })),
  };
}

/** A fresh, unlogged copy of a finished meso — same exercises, no numbers. */
export function copyMesoAsNew(meso, name) {
  const split = meso.weeks[0].days.map((day) => ({
    key: day.key,
    label: day.label,
    exercises: day.exercises.map((ex) => ({
      name: ex.name,
      muscle: ex.muscle,
      equipment: ex.equipment,
      libId: ex.libId,
    })),
  }));
  const next = createMeso({ name, split, library: [] });
  // createMeso can't resolve libIds without the library, so carry them over directly.
  for (const week of next.weeks) {
    week.days.forEach((day, di) => {
      day.exercises.forEach((ex, ei) => { ex.libId = split[di].exercises[ei].libId; });
    });
  }
  return next;
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

export function getMeso(state, mesoId = state.activeMesoId) {
  return state.mesos.find((m) => m.id === mesoId) ?? null;
}

export function getDay(meso, weekIndex, dayIndex) {
  return meso?.weeks?.[weekIndex]?.days?.[dayIndex] ?? null;
}

/** Group *consecutive* exercises sharing a muscle, so the trained order is preserved. */
export function muscleGroups(exercises) {
  const groups = [];
  for (const ex of exercises) {
    const last = groups[groups.length - 1];
    if (last && last.muscle === ex.muscle) last.exercises.push(ex);
    else groups.push({ muscle: ex.muscle, exercises: [ex] });
  }
  return groups;
}

export function dayProgress(day) {
  let total = 0;
  let logged = 0;
  for (const ex of day.exercises) {
    for (const set of ex.sets) {
      total += 1;
      if (set.logged) logged += 1;
    }
  }
  return { total, logged, pct: total ? logged / total : 0 };
}

export function weekProgress(week) {
  return week.days.reduce(
    (acc, day) => {
      const p = dayProgress(day);
      acc.total += p.total;
      acc.logged += p.logged;
      acc.daysFinished += day.finishedAt ? 1 : 0;
      return acc;
    },
    { total: 0, logged: 0, daysFinished: 0 },
  );
}

export function isDayStarted(day) {
  return Boolean(day.finishedAt) || day.exercises.some((ex) => ex.sets.some((s) => s.logged));
}

/** The distinct muscles trained on a day, in order of first appearance. */
export function dayMuscles(day) {
  return [...new Set(day.exercises.map((ex) => ex.muscle))];
}

/**
 * Last week's sets for this exercise, used as faint placeholders.
 *
 * Matched by `libId` (falling back to name) within the same weekday, so a
 * swapped-in exercise never inherits a different exercise's numbers. Looks back
 * to the nearest earlier week that actually contains it — normally that's just
 * the previous week.
 */
export function previousSetsFor(meso, weekIndex, dayIndex, exercise) {
  for (let w = weekIndex - 1; w >= 0; w--) {
    const day = getDay(meso, w, dayIndex);
    if (!day) continue;
    const match = day.exercises.find((ex) =>
      exercise.libId ? ex.libId === exercise.libId : ex.name === exercise.name);
    if (match && match.sets.some((s) => s.logged)) {
      return { weekIndex: w, sets: match.sets };
    }
  }
  return null;
}
