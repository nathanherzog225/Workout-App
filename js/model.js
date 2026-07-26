import { WEEKS_PER_MESO, TRAINING_DAYS, canonicalMuscle, canonicalEquipment } from './constants.js';
import { DEFAULT_SPLIT, DEFAULT_SETS } from './template.js';
import { CATALOG } from './catalog.js';

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
 * Bumped whenever the built-in catalogue changes, so existing saved data
 * picks up new exercises on next load.
 */
export const LIBRARY_VERSION = 2;

/**
 * Populate the library with the built-in catalogue plus the split.
 * Idempotent by name+muscle, so re-running can't create duplicates.
 */
export function seedLibrary(state) {
  for (const entry of CATALOG) {
    if (!findLibraryEntry(state.library, entry.name, entry.muscle)) {
      state.library.push(makeLibraryEntry(entry));
    }
  }
  seedLibraryFromSplit(state.library);
  state.settings.librarySeeded = true;
  state.settings.libraryVersion = LIBRARY_VERSION;
  return state.library;
}

/**
 * Bring saved data onto the current muscle/equipment vocabulary.
 *
 * Only renames labels — no logged weight, rep or set data is touched.
 */
export function migrateVocabulary(state) {
  let changed = 0;
  const fix = (obj) => {
    const muscle = canonicalMuscle(obj.muscle);
    const equipment = canonicalEquipment(obj.equipment);
    if (muscle !== obj.muscle || equipment !== obj.equipment) changed += 1;
    obj.muscle = muscle;
    obj.equipment = equipment;
  };

  for (const entry of state.library) fix(entry);
  for (const meso of state.mesos) {
    for (const week of meso.weeks) {
      for (const day of week.days) {
        for (const exercise of day.exercises) fix(exercise);
      }
    }
  }
  return changed;
}

/** Run once per load: migrate old vocabulary, then top up the library. */
export function ensureLibraryCurrent(state) {
  const migrated = migrateVocabulary(state);
  const stale = state.settings.libraryVersion !== LIBRARY_VERSION;
  if (stale) seedLibrary(state);
  return { migrated, seeded: stale };
}

/** Library sorted for a picker: same muscle first, then everything else by muscle. */
export function libraryForMuscle(library, muscle, { excludeId = null } = {}) {
  const usable = library.filter((e) => e.id !== excludeId);
  return {
    same: usable.filter((e) => e.muscle === muscle),
    other: usable.filter((e) => e.muscle !== muscle),
  };
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

/* ------------------------------------------------------------------ *
 * Editing the plan: swaps and additions
 * ------------------------------------------------------------------ */

/** True if any set on this exercise has been logged. */
export function hasLoggedSets(exercise) {
  return exercise.sets.some((s) => s.logged);
}

/**
 * Which weeks a plan change may touch.
 *
 * Never earlier than the current week, never a day that's already finished,
 * and never an exercise with logged sets. Those are returned as `blocked` so
 * the UI can say what it skipped instead of silently dropping it.
 */
function editableWeeks(meso, fromWeek, dayIndex, slotId, scope) {
  const lastWeek = scope === 'rest' ? meso.weeks.length - 1 : fromWeek;
  const allowed = [];
  const blocked = [];
  for (let w = fromWeek; w <= lastWeek; w++) {
    const day = getDay(meso, w, dayIndex);
    if (!day) continue;
    const exercise = slotId ? day.exercises.find((e) => e.slotId === slotId) : null;
    if (day.finishedAt || (exercise && hasLoggedSets(exercise))) blocked.push(w);
    else allowed.push(w);
  }
  return { allowed, blocked };
}

/**
 * Replace the exercise filling `slotId` with a library entry.
 *
 * `scope` is 'day' (this week only) or 'rest' (this week through week 8).
 * The slot keeps its identity so later weeks stay aligned; sets are reset to
 * blank at the same count, because the old numbers belonged to the old lift.
 */
export function swapExercise(meso, { weekIndex, dayIndex, slotId, replacement, scope }) {
  const { allowed, blocked } = editableWeeks(meso, weekIndex, dayIndex, slotId, scope);
  for (const w of allowed) {
    const day = getDay(meso, w, dayIndex);
    const exercise = day.exercises.find((e) => e.slotId === slotId);
    if (!exercise) continue;
    exercise.id = uid('ex');
    exercise.libId = replacement.id;
    exercise.name = replacement.name;
    exercise.muscle = replacement.muscle;
    exercise.equipment = replacement.equipment || '';
    exercise.sets = Array.from({ length: exercise.sets.length }, makeSet);
  }
  return { changed: allowed.length, blocked: blocked.length };
}

/** Append a new exercise to a day, optionally across the rest of the mesocycle. */
export function addExerciseToDay(meso, { weekIndex, dayIndex, entry, scope, setCount = DEFAULT_SETS }) {
  // One slot id shared by every week this lands in, so a later swap can target it.
  const slotId = uid('slot');
  const { allowed, blocked } = editableWeeks(meso, weekIndex, dayIndex, null, scope);
  for (const w of allowed) {
    getDay(meso, w, dayIndex).exercises.push(makeExercise({
      name: entry.name,
      muscle: entry.muscle,
      equipment: entry.equipment,
      libId: entry.id,
      slotId,
    }, setCount));
  }
  return { changed: allowed.length, blocked: blocked.length };
}

/** Remove an exercise from a day (and optionally the rest of the meso). Refuses logged ones. */
export function removeExerciseFromDay(meso, { weekIndex, dayIndex, slotId, scope }) {
  const { allowed, blocked } = editableWeeks(meso, weekIndex, dayIndex, slotId, scope);
  for (const w of allowed) {
    const day = getDay(meso, w, dayIndex);
    const i = day.exercises.findIndex((e) => e.slotId === slotId);
    if (i >= 0) day.exercises.splice(i, 1);
  }
  return { changed: allowed.length, blocked: blocked.length };
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
