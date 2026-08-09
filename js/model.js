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

/**
 * One set.
 *
 * `slotId` identifies *which set of this exercise* it is, and is shared by the
 * matching set in every week. That's what lets a set look back through the
 * weeks to find the last time it was actually performed, independently of the
 * other sets in the same exercise.
 *
 * `logged` and `skipped` are mutually exclusive; both false means untouched.
 */
export function makeSet(weight = '', reps = '', slotId = null) {
  return { id: uid('set'), slotId: slotId || uid('sslot'), weight, reps, logged: false, skipped: false };
}

/** A set counts as performed only if it was actually logged and not skipped. */
export function isPerformed(set) {
  return Boolean(set?.logged) && !set?.skipped;
}

/**
 * An exercise as it appears on one day of one week.
 *
 * Two identity fields, and they do different jobs:
 *  - `libId`  which exercise this *is*. Used to find last week's numbers.
 *  - `slotId` which position in the day this *fills*, stable across all 8
 *             weeks. Used to apply a swap to the rest of the mesocycle.
 */
export function makeExercise({ name, muscle, equipment, libId, slotId }, options = {}) {
  // Accepts a plain set count, or { setCount, values, setSlotIds } where values
  // is [[weight, reps], ...] of starting numbers and setSlotIds is the shared
  // per-set identity to reuse across weeks.
  const { setCount, values = null, setSlotIds = null } =
    typeof options === 'number' ? { setCount: options } : options;
  const count = setCount ?? values?.length ?? setSlotIds?.length ?? DEFAULT_SETS;
  return {
    id: uid('ex'),
    slotId: slotId || uid('slot'),
    libId: libId || null,
    name,
    muscle,
    equipment: equipment || '',
    sets: Array.from({ length: count }, (_, i) =>
      makeSet(values?.[i]?.[0] ?? '', values?.[i]?.[1] ?? '', setSlotIds?.[i] ?? null)),
  };
}

/** Fresh set-slot ids, generated once and reused by every week of a plan change. */
export function newSetSlotIds(count) {
  return Array.from({ length: count }, () => uid('sslot'));
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
export const LIBRARY_VERSION = 3;

/** Exercise names corrected after release, mapped old → new. */
const EXERCISE_RENAMES = {
  'Dumbbbell Flexion Row': 'Dumbbell Flexion Row',
};

/** Day labels replaced by plain weekday names. */
const LEGACY_DAY_LABELS = new Set(['Upper A', 'Lower A', 'Upper B', 'Lower B']);

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
    const name = EXERCISE_RENAMES[obj.name] ?? obj.name;
    if (muscle !== obj.muscle || equipment !== obj.equipment || name !== obj.name) changed += 1;
    obj.muscle = muscle;
    obj.equipment = equipment;
    obj.name = name;
  };

  for (const entry of state.library) fix(entry);
  for (const meso of state.mesos) {
    for (const week of meso.weeks) {
      for (const day of week.days) {
        // Days are identified by their weekday now, not an Upper/Lower label.
        if (LEGACY_DAY_LABELS.has(day.label)) {
          day.label = day.name;
          changed += 1;
        }
        for (const exercise of day.exercises) fix(exercise);
      }
    }
  }
  changed += dedupeLibrary(state);
  return changed;
}

/**
 * Collapse library entries that now share a name and muscle — a rename can
 * make one collide with an existing entry. Exercises referencing a dropped
 * entry are repointed at the survivor so nothing loses its history link.
 */
function dedupeLibrary(state) {
  const keyOf = (e) => `${e.name.trim().toLowerCase()}|${e.muscle}`;
  const survivors = new Map();
  const remap = new Map();
  const kept = [];

  for (const entry of state.library) {
    const key = keyOf(entry);
    if (survivors.has(key)) {
      remap.set(entry.id, survivors.get(key));
      continue;
    }
    survivors.set(key, entry.id);
    kept.push(entry);
  }
  if (!remap.size) return 0;

  state.library = kept;
  for (const meso of state.mesos) {
    for (const week of meso.weeks) {
      for (const day of week.days) {
        for (const exercise of day.exercises) {
          if (remap.has(exercise.libId)) exercise.libId = remap.get(exercise.libId);
        }
      }
    }
  }
  return remap.size;
}

/**
 * Structural schema version. Bumped when new fields are added to saved data.
 *   4 — per-set `slotId` + `skipped`, per-day `skippedAt`
 */
export const STATE_VERSION = 4;

export function needsStructuralMigration(state) {
  return (state.settings?.stateVersion ?? 0) < STATE_VERSION;
}

/**
 * Add the fields introduced in v4 to existing saved data.
 *
 * Strictly additive: no weight, rep, logged flag, finish stamp or exercise is
 * read for anything other than counting, and none is modified. Set slot ids are
 * assigned *by position* within each exercise slot, keyed on the day and
 * exercise slot so the same position in every week gets the same id — which
 * reproduces the positional matching the app used before, leaving every
 * existing placeholder pointing exactly where it pointed yesterday.
 *
 * Idempotent: fields already present are left alone.
 */
export function migrateStructure(state) {
  const stats = { setSlots: 0, setsFlagged: 0, daysFlagged: 0, untouchedValues: 0 };

  for (const meso of state.mesos) {
    // day index + exercise slot + set position -> shared slot id
    const slotsByPosition = new Map();

    for (const week of meso.weeks) {
      week.days?.forEach((day, dayIndex) => {
        if (!('skippedAt' in day)) {
          day.skippedAt = null;
          stats.daysFlagged += 1;
        }
        for (const exercise of day.exercises ?? []) {
          exercise.sets?.forEach((set, i) => {
            if (!set.slotId) {
              const key = `${dayIndex}|${exercise.slotId ?? exercise.name}|${i}`;
              if (!slotsByPosition.has(key)) slotsByPosition.set(key, uid('sslot'));
              set.slotId = slotsByPosition.get(key);
              stats.setSlots += 1;
            }
            if (!('skipped' in set)) {
              set.skipped = false;
              stats.setsFlagged += 1;
            }
            stats.untouchedValues += 1;
          });
        }
      });
    }
  }

  state.settings.stateVersion = STATE_VERSION;
  return stats;
}

export const SEED_VERSION = 1;

/**
 * Apply the template's week-1 starting numbers to a mesocycle created before
 * they existed.
 *
 * Deliberately conservative: only a mesocycle with nothing logged, nothing
 * typed and no finished day anywhere is touched, so this can never overwrite
 * real training data. Runs once.
 */
export function applyWeek1Seed(state) {
  if (state.settings.week1SeedVersion === SEED_VERSION) return 0;
  state.settings.week1SeedVersion = SEED_VERSION;

  let filled = 0;
  for (const meso of state.mesos) {
    const untouched = meso.weeks.every((w) => w.days.every((d) =>
      !d.finishedAt && d.exercises.every((e) => e.sets.every((s) => !s.logged && !setHasNumbers(s)))));
    if (!untouched) continue;

    meso.weeks.forEach((week, wi) => {
      for (const day of week.days) {
        const plan = DEFAULT_SPLIT.find((p) => p.key === day.key);
        if (!plan) continue;
        for (const spec of plan.exercises) {
          if (!spec.sets) continue;
          const exercise = day.exercises.find((e) => e.name === spec.name);
          if (!exercise) continue;
          // Week 1 gets the numbers; later weeks get the matching set count, blank.
          exercise.sets = spec.sets.map(([weight, reps]) =>
            (wi === 0 ? makeSet(weight, reps) : makeSet()));
          if (wi === 0) filled += exercise.sets.length;
        }
      }
    });
  }
  return filled;
}

/** Run once per load: migrate structure and vocabulary, top up the library, seed week 1. */
export function ensureLibraryCurrent(state) {
  const structure = needsStructuralMigration(state) ? migrateStructure(state) : null;
  const migrated = migrateVocabulary(state);
  const stale = state.settings.libraryVersion !== LIBRARY_VERSION;
  if (stale) seedLibrary(state);
  const seededSets = applyWeek1Seed(state);
  return { structure, migrated, seeded: stale, seededSets };
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
  // Exercise and set slot ids are assigned once per planned exercise, then
  // reused across all weeks so each set can find itself in earlier weeks.
  const plan = split.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      const entry = findLibraryEntry(library, ex.name, ex.muscle);
      const count = ex.setCount ?? ex.sets?.length ?? DEFAULT_SETS;
      return {
        ...ex,
        slotId: uid('slot'),
        libId: entry?.id ?? null,
        setSlotIds: newSetSlotIds(count),
      };
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
          skippedAt: null,
          // Only week 1 carries the template's starting numbers; every later
          // week gets the same plan with empty fields.
          exercises: day.exercises.map((ex) => makeExercise(ex, {
            setCount: ex.setCount ?? ex.sets?.length ?? DEFAULT_SETS,
            values: w === 0 ? ex.sets : null,
            setSlotIds: ex.setSlotIds,
          })),
        };
      }),
    })),
  };
}

/**
 * A fresh, unlogged mesocycle with the same plan — same exercises, same set
 * counts, no numbers.
 *
 * Copied from the *last* week by default, since that reflects the plan you
 * actually finished the block on (including any mid-meso swaps or added sets)
 * rather than what you started it with.
 */
export function copyMesoAsNew(meso, { name, library = [], sourceWeekIndex = meso.weeks.length - 1 }) {
  const source = meso.weeks[sourceWeekIndex] ?? meso.weeks[0];
  const split = source.days.map((day) => ({
    key: day.key,
    label: day.label,
    exercises: day.exercises.map((ex) => ({
      name: ex.name,
      muscle: ex.muscle,
      equipment: ex.equipment,
      setCount: ex.sets.length,
    })),
  }));
  return createMeso({ name, split, library });
}

/** Totals across a whole mesocycle, for the archive list. */
export function mesoStats(meso) {
  let total = 0;
  let logged = 0;
  let daysFinished = 0;
  for (const week of meso.weeks) {
    for (const day of week.days) {
      if (day.finishedAt) daysFinished += 1;
      const p = dayProgress(day);
      total += p.total;
      logged += p.logged;
    }
  }
  const days = meso.weeks.reduce((n, w) => n + w.days.length, 0);
  return { total, logged, daysFinished, days, complete: days > 0 && daysFinished === days };
}

/** When the meso was last trained, for the archive subtitle. */
export function lastTrainedAt(meso) {
  let latest = null;
  for (const week of meso.weeks) {
    for (const day of week.days) {
      if (day.finishedAt && (!latest || day.finishedAt > latest)) latest = day.finishedAt;
    }
  }
  return latest;
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

/**
 * Progress over the sets that are still in play — skipped sets drop out of the
 * denominator, so skipping the last two sets still reads as a complete day.
 */
export function dayProgress(day) {
  let total = 0;
  let logged = 0;
  let skipped = 0;
  for (const ex of day.exercises) {
    for (const set of ex.sets) {
      if (set.skipped) { skipped += 1; continue; }
      total += 1;
      if (set.logged) logged += 1;
    }
  }
  return { total, logged, skipped, pct: total ? logged / total : 0 };
}

/** A day is exactly one of: skipped, finished, in progress, or untouched. */
export function dayStatus(day) {
  if (day.skippedAt) return 'skipped';
  if (day.finishedAt) return 'finished';
  return isDayStarted(day) ? 'active' : 'new';
}

export function weekProgress(week) {
  return week.days.reduce(
    (acc, day) => {
      const p = dayProgress(day);
      acc.total += p.total;
      acc.logged += p.logged;
      acc.daysFinished += day.finishedAt ? 1 : 0;
      acc.daysSkipped += day.skippedAt ? 1 : 0;
      // "Settled" = dealt with, either trained or deliberately skipped.
      acc.daysSettled += (day.finishedAt || day.skippedAt) ? 1 : 0;
      return acc;
    },
    { total: 0, logged: 0, daysFinished: 0, daysSkipped: 0, daysSettled: 0 },
  );
}

export function isDayStarted(day) {
  return Boolean(day.finishedAt)
    || day.exercises.some((ex) => ex.sets.some((s) => s.logged || s.skipped));
}

/* ------------------------------------------------------------------ *
 * Skipping
 * ------------------------------------------------------------------ */

/**
 * Mark a whole day skipped without logging anything.
 *
 * Deliberately does not touch individual sets: the day carries one timestamp,
 * so unskipping restores the exact prior state with nothing to reconstruct.
 * Sets you already logged stay logged and keep counting as performed.
 */
export function skipDay(day) {
  day.skippedAt = new Date().toISOString();
  day.finishedAt = null;
}

export function unskipDay(day) {
  day.skippedAt = null;
}

/** Skip one set. Numbers are kept so unskipping restores them. */
export function skipSet(set) {
  set.skipped = true;
  set.logged = false;
}

export function unskipSet(set) {
  set.skipped = false;
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
  // Fresh set slots, shared by every week the swap touches: the new exercise
  // starts its own history rather than inheriting the old lift's.
  const slots = new Map();
  for (const w of allowed) {
    const day = getDay(meso, w, dayIndex);
    const exercise = day.exercises.find((e) => e.slotId === slotId);
    if (!exercise) continue;
    const count = exercise.sets.length;
    if (!slots.has(count)) slots.set(count, newSetSlotIds(count));
    exercise.id = uid('ex');
    exercise.libId = replacement.id;
    exercise.name = replacement.name;
    exercise.muscle = replacement.muscle;
    exercise.equipment = replacement.equipment || '';
    exercise.sets = slots.get(count).map((sslot) => makeSet('', '', sslot));
  }
  return { changed: allowed.length, blocked: blocked.length };
}

/* ------------------------------------------------------------------ *
 * Adding and removing sets
 * ------------------------------------------------------------------ */

/**
 * Append a set to this exercise in this week and every later week.
 *
 * The new slot is shared across those weeks, so this week's numbers become
 * next week's placeholder exactly like any other set. Appending can't disturb
 * existing data, so later weeks only need protecting when they're finished —
 * and the week you're standing in is always updated.
 */
export function addSetToExercise(meso, { weekIndex, dayIndex, slotId }) {
  const setSlotId = uid('sslot');
  let changed = 0;
  for (let w = weekIndex; w < meso.weeks.length; w++) {
    const day = getDay(meso, w, dayIndex);
    if (!day) continue;
    if (w > weekIndex && (day.finishedAt || day.skippedAt)) continue;
    const exercise = day.exercises.find((e) => e.slotId === slotId);
    if (!exercise) continue;
    exercise.sets.push(makeSet('', '', setSlotId));
    changed += 1;
  }
  return { changed, setSlotId };
}

/**
 * Remove a set slot from this week onwards.
 *
 * Removal *is* destructive, so later weeks are skipped whenever that set has
 * been logged or the day is done. The current week is the caller's call —
 * the UI confirms before removing a set you've already logged.
 */
export function removeSetFromExercise(meso, { weekIndex, dayIndex, slotId, setSlotId }) {
  let changed = 0;
  let blocked = 0;
  for (let w = weekIndex; w < meso.weeks.length; w++) {
    const day = getDay(meso, w, dayIndex);
    if (!day) continue;
    const exercise = day.exercises.find((e) => e.slotId === slotId);
    if (!exercise || exercise.sets.length <= 1) continue;
    const i = exercise.sets.findIndex((s) => s.slotId === setSlotId);
    if (i < 0) continue;
    if (w > weekIndex && (day.finishedAt || day.skippedAt || isPerformed(exercise.sets[i]))) {
      blocked += 1;
      continue;
    }
    exercise.sets.splice(i, 1);
    changed += 1;
  }
  return { changed, blocked };
}

/** Append a new exercise to a day, optionally across the rest of the mesocycle. */
export function addExerciseToDay(meso, { weekIndex, dayIndex, entry, scope, setCount = DEFAULT_SETS }) {
  // One exercise slot and one set of set-slots, shared by every week this lands
  // in, so a later swap can target it and each set can find itself week to week.
  const slotId = uid('slot');
  const setSlotIds = newSetSlotIds(setCount);
  const { allowed, blocked } = editableWeeks(meso, weekIndex, dayIndex, null, scope);
  for (const w of allowed) {
    getDay(meso, w, dayIndex).exercises.push(makeExercise({
      name: entry.name,
      muscle: entry.muscle,
      equipment: entry.equipment,
      libId: entry.id,
      slotId,
    }, { setCount, setSlotIds }));
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

/** A set worth carrying forward as a placeholder: it has numbers in it. */
export function setHasNumbers(set) {
  return Boolean(set.weight || set.reps);
}

/** The same exercise in an earlier week: same weekday, same library exercise. */
function matchingExercise(meso, weekIndex, dayIndex, exercise) {
  const day = getDay(meso, weekIndex, dayIndex);
  if (!day) return null;
  return day.exercises.find((ex) =>
    exercise.libId ? ex.libId === exercise.libId : ex.name === exercise.name) ?? null;
}

/** The same set slot in an earlier week, matched by set slotId, then position. */
function matchingSet(exercise, set, index) {
  if (!exercise) return null;
  if (set.slotId) {
    const bySlot = exercise.sets.find((s) => s.slotId === set.slotId);
    if (bySlot) return bySlot;
  }
  // Pre-migration data, or a set added after this week's plan diverged.
  return exercise.sets[index] ?? null;
}

/**
 * Walk back from `weekIndex` looking for this exact set slot, newest first.
 *
 * `accept` decides what counts as a hit, which is the whole trick: skipped
 * weeks and skipped sets simply don't qualify, so the walk continues past them
 * to the most recent week the set was really done.
 *
 * Reads live state, so editing a set in a finished week immediately updates
 * what later weeks reference.
 */
function lookBack(meso, weekIndex, dayIndex, exercise, set, index, accept) {
  for (let w = weekIndex - 1; w >= 0; w--) {
    const earlier = matchingExercise(meso, w, dayIndex, exercise);
    const candidate = matchingSet(earlier, set, index);
    if (candidate && accept(candidate)) return { weekIndex: w, set: candidate };
  }
  return null;
}

/**
 * The last week this set slot was actually performed — logged, not skipped.
 * Used for the up/same/down weight arrows.
 */
export function lastPerformedSet(meso, weekIndex, dayIndex, exercise, set, index) {
  return lookBack(meso, weekIndex, dayIndex, exercise, set, index, isPerformed);
}

/**
 * What to show as this set's faint placeholder.
 *
 * Prefers a genuinely performed set. Falls back to any earlier set that has
 * numbers typed in and wasn't skipped — that's what keeps week 1's seeded
 * starting numbers visible in week 2 before anything has been logged.
 */
export function placeholderSetFor(meso, weekIndex, dayIndex, exercise, set, index) {
  return lookBack(meso, weekIndex, dayIndex, exercise, set, index, isPerformed)
    ?? lookBack(meso, weekIndex, dayIndex, exercise, set, index,
      (s) => setHasNumbers(s) && !s.skipped);
}

/**
 * Weight comparison against the last performed instance of this set.
 * Returns 'up' | 'same' | 'down', or null when there's nothing to compare.
 */
export function weightTrend(set, reference) {
  if (!reference) return null;
  const now = parseFloat(set.weight);
  const then = parseFloat(reference.set.weight);
  if (!Number.isFinite(now) || !Number.isFinite(then)) return null;
  if (now > then) return 'up';
  if (now < then) return 'down';
  return 'same';
}
