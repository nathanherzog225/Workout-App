import { el, icon, buzz, toast, iconButton } from '../ui.js';
import { commit } from '../store.js';
import { muscleColor, muscleName } from '../constants.js';
import {
  getMeso, getDay, muscleGroups, dayProgress, dayStatus,
  removeExerciseFromDay, setHasNumbers,
  lastPerformedSet, placeholderSetFor, weightTrend,
  skipDay, unskipDay, skipSet, unskipSet,
  addSetToExercise, removeSetFromExercise,
} from '../model.js';
import { openSwapSheet, openAddExerciseSheet, openRemoveExerciseSheet } from './picker.js';

export function dayTopbar(state, route) {
  const day = getDay(getMeso(state, route.mesoId ?? state.activeMesoId), route.weekIndex, route.dayIndex);
  if (!day) return { title: 'Workout' };
  return { title: day.label, sub: `Week ${route.weekIndex + 1}` };
}

export function renderDay({ state, route, mount, dock, navigate }) {
  const meso = getMeso(state, route.mesoId ?? state.activeMesoId);
  const day = getDay(meso, route.weekIndex, route.dayIndex);
  if (!day) return;

  const daySkipped = Boolean(day.skippedAt);
  if (daySkipped) mount.append(renderSkippedBanner(day));

  for (const group of muscleGroups(day.exercises)) {
    mount.append(
      el('div', { class: 'group', style: { '--mc': muscleColor(group.muscle) } },
        el('div', { class: 'group__head' },
          el('span', { class: 'muscletag' }, muscleName(group.muscle)),
        ),
        group.exercises.map((ex) =>
          renderExercise({ state, meso, route, exercise: ex, daySkipped })),
      ),
    );
  }

  mount.append(
    el('button', {
      class: 'btn btn--block addex',
      type: 'button',
      onClick: () => openAddExerciseSheet({ state, meso, route }),
    }, icon('plus'), 'Add exercise'),
  );

  dock.append(renderFinishBar({ day, route, navigate }));
}

/** Returning home must keep whichever mesocycle we came from. */
export function backToHome(route) {
  return { name: 'home', mesoId: route.mesoId };
}

/* ------------------------------------------------------------------ *
 * Skipped day
 * ------------------------------------------------------------------ */

function renderSkippedBanner(day) {
  return el('div', { class: 'banner banner--skip' },
    el('span', { class: 'banner__text' }, `Workout skipped ${formatDate(day.skippedAt)}`),
    el('button', {
      class: 'btn btn--sm',
      type: 'button',
      onClick: () => commit(() => unskipDay(day)),
    }, 'Unskip'),
  );
}

/* ------------------------------------------------------------------ *
 * Progress + finish
 * ------------------------------------------------------------------ */

function renderFinishBar({ day, route, navigate }) {
  const { total, logged, skipped, pct } = dayProgress(day);
  const remaining = total - logged;
  const status = dayStatus(day);
  const complete = remaining === 0 && total > 0;

  const bar = el('div', { class: 'dockbar__row' },
    el('div', { class: `pbar pbar--lg${status === 'finished' || complete ? ' pbar--good' : ''}` },
      el('i', { style: { width: `${Math.round(pct * 100)}%` } })),
    el('span', { class: 'dockbar__count' },
      `${logged}/${total}${skipped ? ` · ${skipped} skipped` : ''}`),
  );

  if (status === 'skipped') {
    return el('div', { class: 'dockbar' },
      el('button', {
        class: 'btn btn--block',
        type: 'button',
        onClick: () => commit(() => unskipDay(day)),
      }, 'Unskip workout'),
    );
  }

  if (status === 'finished') {
    return el('div', { class: 'dockbar' },
      bar,
      el('div', { class: 'dockbar__row' },
        el('span', { class: 'dockbar__done' }, icon('check'), `Finished ${formatDate(day.finishedAt)}`),
        el('button', {
          class: 'btn btn--sm btn--quiet',
          type: 'button',
          // Finishing must never be a trap — you can always reopen and keep logging.
          onClick: () => commit(() => { day.finishedAt = null; }),
        }, 'Reopen'),
      ),
    );
  }

  return el('div', { class: 'dockbar' },
    bar,
    el('div', { class: 'dockbar__actions' },
      el('button', {
        class: 'btn btn--quiet dockbar__skip',
        type: 'button',
        onClick: () => {
          // Skipping never needs a number typed, so the only thing worth
          // confirming is discarding progress you've already made.
          if (logged > 0 && !confirm(
            `${logged} set${logged === 1 ? ' is' : 's are'} already logged. Skip the whole workout?`,
          )) return;
          commit(() => skipDay(day));
          toast(`${day.label} skipped`);
          navigate(backToHome(route));
        },
      }, 'Skip workout'),
      el('button', {
        class: 'btn btn--good dockbar__finish',
        type: 'button',
        disabled: logged === 0,
        onClick: () => {
          if (remaining > 0 && !confirm(
            `${remaining} set${remaining === 1 ? " isn't" : "s aren't"} logged. Finish anyway?`,
          )) return;
          buzz(18);
          commit(() => { day.finishedAt = new Date().toISOString(); });
          toast(`${day.label} finished · ${logged} set${logged === 1 ? '' : 's'}`);
          navigate(backToHome(route));
        },
      }, icon('check'), 'Finish workout'),
    ),
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ *
 * Exercise card
 * ------------------------------------------------------------------ */

function renderExercise({ state, meso, route, exercise, daySkipped }) {
  return el('div', { class: `exercise${daySkipped ? ' is-skipped' : ''}` },
    el('div', { class: 'exercise__head' },
      el('span', { class: 'exercise__name' }, exercise.name),
      exercise.equipment && el('span', { class: 'exercise__equip' }, exercise.equipment),
      iconButton('swap', `Swap ${exercise.name}`,
        () => openSwapSheet({ state, meso, route, exercise })),
      iconButton('trash', `Remove ${exercise.name}`,
        () => openRemoveExerciseSheet({ meso, route, exercise })),
    ),

    el('div', { class: 'sets' },
      el('div', { class: 'setrow setrow--head' },
        el('span', {}, 'Set'),
        el('span', {}, 'Weight'),
        el('span', {}, 'Reps'),
        el('span', {}, ''),
        el('span', {}, ''),
      ),
      exercise.sets.map((set, i) =>
        renderSetRow({ meso, route, exercise, set, index: i, daySkipped })),
    ),

    renderSetControls({ meso, route, exercise }),
  );
}

/* ------------------------------------------------------------------ *
 * Set row
 * ------------------------------------------------------------------ */

function renderSetRow({ meso, route, exercise, set, index, daySkipped }) {
  const { weekIndex, dayIndex } = route;

  // Two different references, deliberately. The placeholder is happy with any
  // earlier numbers (so week 1's seeded values still show through), while the
  // arrow only ever compares against a set that was genuinely performed.
  const hintRef = placeholderSetFor(meso, weekIndex, dayIndex, exercise, set, index);
  const hint = hintRef && setHasNumbers(hintRef.set) ? hintRef.set : null;
  const performed = lastPerformedSet(meso, weekIndex, dayIndex, exercise, set, index);
  const trend = weightTrend(set, performed);

  const skipped = Boolean(set.skipped);
  const disabled = skipped || daySkipped;

  const field = (key, { inputmode, max }) => el('input', {
    class: 'setinput',
    type: 'text',
    inputmode,
    maxLength: max,
    value: set[key],
    placeholder: hint?.[key] || '',
    disabled,
    'aria-label': key === 'weight' ? `Set ${index + 1} weight` : `Set ${index + 1} reps`,
    dataset: { focus: `${set.id}:${key}` },
    onInput: (e) => {
      const clean = e.target.value.replace(key === 'weight' ? /[^0-9.]/g : /[^0-9]/g, '');
      if (clean !== e.target.value) e.target.value = clean;
      // No re-render: the field is focused and the user is still typing.
      commit(() => { set[key] = clean; }, { render: false });
    },
    onFocus: (e) => e.target.select(),
  });

  const classes = ['setrow'];
  if (set.logged && !skipped) classes.push('is-logged');
  if (skipped) classes.push('is-skipped');

  return el('div', { class: classes.join(' ') },
    el('span', { class: 'setrow__n' }, String(index + 1)),

    // The trend badge sits inside the weight field, because the comparison is
    // weight-only — putting it anywhere else invites reading it as reps.
    el('div', { class: 'setfield' },
      field('weight', { inputmode: 'decimal', max: 6 }),
      trend && !disabled ? renderTrend(trend, performed) : null,
    ),

    field('reps', { inputmode: 'numeric', max: 3 }),

    el('button', {
      class: 'logbox',
      type: 'button',
      role: 'checkbox',
      'aria-checked': String(Boolean(set.logged)),
      'aria-label': `Log set ${index + 1}`,
      disabled,
      onClick: () => {
        buzz();
        commit(() => {
          set.logged = !set.logged;
          // Logging with the field left blank falls back to what you did last
          // time, which is what the placeholder was already showing you.
          if (set.logged && hint) {
            if (!set.weight) set.weight = hint.weight;
            if (!set.reps) set.reps = hint.reps;
          }
        });
      },
    }, icon('check')),

    el('button', {
      class: `skipbox${skipped ? ' is-on' : ''}`,
      type: 'button',
      'aria-pressed': String(skipped),
      'aria-label': skipped ? `Unskip set ${index + 1}` : `Skip set ${index + 1}`,
      title: skipped ? 'Unskip this set' : 'Skip this set',
      disabled: daySkipped,
      onClick: () => commit(() => (skipped ? unskipSet(set) : skipSet(set))),
    }, icon(skipped ? 'undo' : 'skip')),
  );
}

function renderTrend(trend, performed) {
  const label = {
    up: 'Heavier than last time',
    down: 'Lighter than last time',
    same: 'Same weight as last time',
  }[trend];
  const week = performed ? ` (week ${performed.weekIndex + 1}: ${performed.set.weight})` : '';
  return el('span', {
    class: `trend trend--${trend}`,
    title: label + week,
    'aria-label': label,
  }, icon(`trend-${trend}`));
}

/* ------------------------------------------------------------------ *
 * Add / remove sets
 * ------------------------------------------------------------------ */

function renderSetControls({ meso, route, exercise }) {
  const count = exercise.sets.length;
  const last = exercise.sets[count - 1];

  return el('div', { class: 'exercise__foot' },
    el('button', {
      class: 'btn btn--sm',
      type: 'button',
      title: 'Add a set to this week and the weeks after it',
      onClick: () => {
        const { changed } = commit(() => addSetToExercise(meso, {
          weekIndex: route.weekIndex,
          dayIndex: route.dayIndex,
          slotId: exercise.slotId,
        }));
        if (changed > 1) toast(`Set added · ${changed} weeks`);
      },
    }, icon('plus'), 'Set'),

    el('button', {
      class: 'btn btn--sm btn--quiet',
      type: 'button',
      disabled: count <= 1,
      title: 'Remove the last set',
      onClick: () => {
        // Never silently discard a set that's already been logged.
        if (last.logged && !confirm(`Remove set ${count}? It's already logged.`)) return;
        commit(() => removeSetFromExercise(meso, {
          weekIndex: route.weekIndex,
          dayIndex: route.dayIndex,
          slotId: exercise.slotId,
          setSlotId: last.slotId,
        }));
      },
    }, icon('minus'), 'Set'),

    el('span', { class: 'exercise__count faint small' }, `${count} set${count === 1 ? '' : 's'}`),
  );
}
