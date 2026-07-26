import { el, icon, buzz, toast, iconButton } from '../ui.js';
import { commit } from '../store.js';
import { muscleColor, muscleName } from '../constants.js';
import {
  getMeso, getDay, muscleGroups, makeSet, previousSetsFor, dayProgress,
  hasLoggedSets, removeExerciseFromDay,
} from '../model.js';
import { openSwapSheet, openAddExerciseSheet, openRemoveExerciseSheet } from './picker.js';

export function dayTopbar(state, route) {
  const day = getDay(getMeso(state), route.weekIndex, route.dayIndex);
  if (!day) return { title: 'Workout' };
  return { title: day.label, sub: `${day.name} · Week ${route.weekIndex + 1}` };
}

export function renderDay({ state, route, mount, dock, navigate }) {
  const meso = getMeso(state);
  const day = getDay(meso, route.weekIndex, route.dayIndex);
  if (!day) return;

  for (const group of muscleGroups(day.exercises)) {
    mount.append(
      el('div', { class: 'group', style: { '--mc': muscleColor(group.muscle) } },
        el('div', { class: 'group__head' },
          el('span', { class: 'muscletag' }, muscleName(group.muscle)),
        ),
        group.exercises.map((ex) => renderExercise({ state, meso, route, day, exercise: ex })),
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

  dock.append(renderFinishBar({ day, navigate }));
}

/* ------------------------------------------------------------------ *
 * Progress + finish
 * ------------------------------------------------------------------ */

function renderFinishBar({ day, navigate }) {
  const { total, logged, pct } = dayProgress(day);
  const remaining = total - logged;
  const finished = Boolean(day.finishedAt);
  const complete = remaining === 0 && total > 0;

  const bar = el('div', { class: 'dockbar__row' },
    el('div', { class: `pbar pbar--lg${finished || complete ? ' pbar--good' : ''}` },
      el('i', { style: { width: `${Math.round(pct * 100)}%` } })),
    el('span', { class: 'dockbar__count' }, `${logged}/${total}`),
  );

  if (finished) {
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
    el('button', {
      class: 'btn btn--good btn--block',
      type: 'button',
      disabled: logged === 0,
      onClick: () => {
        if (remaining > 0 && !confirm(
          `${remaining} set${remaining === 1 ? " isn't" : "s aren't"} logged. Finish anyway?`,
        )) return;
        buzz(18);
        commit(() => { day.finishedAt = new Date().toISOString(); });
        toast(`${day.label} finished · ${logged} set${logged === 1 ? '' : 's'}`);
        navigate({ name: 'home' });
      },
    }, icon('check'), 'Finish workout'),
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

function renderExercise({ state, meso, route, day, exercise }) {
  const previous = previousSetsFor(meso, route.weekIndex, route.dayIndex, exercise);

  return el('div', { class: 'exercise' },
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
      ),
      exercise.sets.map((set, i) =>
        renderSetRow({ meso, exercise, set, index: i, previous: previous?.sets[i] ?? null })),
    ),

    renderSetControls({ meso, exercise }),
  );
}

/* ------------------------------------------------------------------ *
 * Set row
 * ------------------------------------------------------------------ */

function renderSetRow({ meso, exercise, set, index, previous }) {
  // Last week's numbers appear as faint placeholders only — never as values,
  // so an untouched set stays genuinely empty in the saved data.
  const hint = previous?.logged ? previous : null;

  const field = (key, { inputmode, max }) => el('input', {
    class: 'setinput',
    type: 'text',
    inputmode,
    maxLength: max,
    value: set[key],
    placeholder: hint?.[key] || '',
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

  return el('div', { class: `setrow${set.logged ? ' is-logged' : ''}` },
    el('span', { class: 'setrow__n' }, String(index + 1)),
    field('weight', { inputmode: 'decimal', max: 6 }),
    field('reps', { inputmode: 'numeric', max: 3 }),
    el('button', {
      class: 'logbox',
      type: 'button',
      role: 'checkbox',
      'aria-checked': String(set.logged),
      'aria-label': `Log set ${index + 1}`,
      onClick: () => {
        buzz();
        commit(() => {
          set.logged = !set.logged;
          // Logging with the field left blank falls back to what you did last
          // week, which is what the placeholder was already showing you.
          if (set.logged && hint) {
            if (!set.weight) set.weight = hint.weight;
            if (!set.reps) set.reps = hint.reps;
          }
        });
      },
    }, icon('check')),
  );
}

/* ------------------------------------------------------------------ *
 * Add / remove sets
 * ------------------------------------------------------------------ */

function renderSetControls({ meso, exercise }) {
  const count = exercise.sets.length;
  const last = exercise.sets[count - 1];

  return el('div', { class: 'exercise__foot' },
    el('button', {
      class: 'btn btn--sm',
      type: 'button',
      onClick: () => commit(() => { exercise.sets.push(makeSet()); }),
    }, icon('plus'), 'Set'),

    el('button', {
      class: 'btn btn--sm btn--quiet',
      type: 'button',
      disabled: count <= 1,
      title: 'Remove last set',
      onClick: () => {
        // Never silently discard a set that's already been logged.
        if (last.logged && !confirm(`Remove set ${count}? It's already logged.`)) return;
        commit(() => { exercise.sets.pop(); });
      },
    }, icon('minus'), 'Set'),

    el('span', { class: 'exercise__count faint small' }, `${count} set${count === 1 ? '' : 's'}`),
  );
}
