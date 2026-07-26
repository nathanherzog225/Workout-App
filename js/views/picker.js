import { el, icon, toast, appendAll } from '../ui.js';
import { commit } from '../store.js';
import { openSheet } from '../sheet.js';
import { MUSCLES, EQUIPMENT, muscleColor, muscleName } from '../constants.js';
import {
  makeLibraryEntry, findLibraryEntry, libraryForMuscle,
  swapExercise, addExerciseToDay, removeExerciseFromDay, hasLoggedSets, getDay,
} from '../model.js';
import { WEEKS_PER_MESO } from '../constants.js';

/* ------------------------------------------------------------------ *
 * Swap an exercise
 * ------------------------------------------------------------------ */

export function openSwapSheet({ state, meso, route, exercise }) {
  // Swapping a lift you've already logged would rewrite logged data, so it's
  // blocked outright rather than silently discarding those sets.
  if (hasLoggedSets(exercise)) {
    toast('This exercise already has logged sets — uncheck them first', { error: true, ms: 3600 });
    return;
  }

  openSheet({
    title: 'Swap exercise',
    subtitle: exercise.name,
    build: (api) => renderPicker({
      state,
      muscle: exercise.muscle,
      excludeId: exercise.libId,
      onPick: (entry) => api.replace(scopeSheet({
        title: 'Apply swap to',
        subtitle: `${exercise.name} → ${entry.name}`,
        meso,
        route,
        run: (scope) => {
          const result = commit(() => swapExercise(meso, {
            weekIndex: route.weekIndex,
            dayIndex: route.dayIndex,
            slotId: exercise.slotId,
            replacement: entry,
            scope,
          }));
          reportPlanChange(result, `Swapped to ${entry.name}`);
        },
      })),
    }),
  });
}

/* ------------------------------------------------------------------ *
 * Add an exercise to the day
 * ------------------------------------------------------------------ */

export function openAddExerciseSheet({ state, meso, route }) {
  const day = getDay(meso, route.weekIndex, route.dayIndex);

  openSheet({
    title: 'Add exercise',
    subtitle: `${day.label} · Week ${route.weekIndex + 1}`,
    build: (api) => renderPicker({
      state,
      muscle: null,
      onPick: (entry) => api.replace(scopeSheet({
        title: 'Add to',
        subtitle: entry.name,
        meso,
        route,
        run: (scope) => {
          const result = commit(() => addExerciseToDay(meso, {
            weekIndex: route.weekIndex,
            dayIndex: route.dayIndex,
            entry,
            scope,
          }));
          reportPlanChange(result, `Added ${entry.name}`);
        },
      })),
    }),
  });
}

/* ------------------------------------------------------------------ *
 * Remove an exercise from the day
 * ------------------------------------------------------------------ */

export function openRemoveExerciseSheet({ meso, route, exercise }) {
  if (hasLoggedSets(exercise)) {
    toast('This exercise already has logged sets — uncheck them first', { error: true, ms: 3600 });
    return;
  }
  openSheet(scopeSheet({
    title: 'Remove from',
    subtitle: exercise.name,
    meso,
    route,
    run: (scope) => {
      const result = commit(() => removeExerciseFromDay(meso, {
        weekIndex: route.weekIndex,
        dayIndex: route.dayIndex,
        slotId: exercise.slotId,
        scope,
      }));
      reportPlanChange(result, `Removed ${exercise.name}`);
    },
  }));
}

/* ------------------------------------------------------------------ *
 * Shared: exercise list with search
 * ------------------------------------------------------------------ */

function renderPicker({ state, muscle, excludeId = null, onPick }) {
  const listEl = el('div', { class: 'picker__list' });
  const searchEl = el('input', {
    class: 'searchinput',
    type: 'search',
    placeholder: 'Search exercises',
    'aria-label': 'Search exercises',
    onInput: () => paint(searchEl.value),
  });

  function paint(query = '') {
    const q = query.trim().toLowerCase();
    const match = (e) => !q || e.name.toLowerCase().includes(q) || muscleName(e.muscle).toLowerCase().includes(q);
    const { same, other } = libraryForMuscle(state.library, muscle, { excludeId });

    listEl.replaceChildren();

    // Same muscle first — that's the swap you almost always want.
    const sameHits = same.filter(match);
    if (sameHits.length) {
      appendAll(listEl,
        el('div', { class: 'picker__label', style: { '--mc': muscleColor(muscle) } },
          el('span', { class: 'picker__dot' }),
          `Same muscle · ${muscleName(muscle)}`),
        sameHits.map((e) => exerciseRow(e, onPick)),
      );
    }

    const others = other.filter(match);
    if (others.length) {
      const byMuscle = new Map();
      for (const e of others) {
        if (!byMuscle.has(e.muscle)) byMuscle.set(e.muscle, []);
        byMuscle.get(e.muscle).push(e);
      }
      // Keep the canonical muscle order rather than insertion order.
      for (const m of MUSCLES.map((x) => x.id)) {
        const entries = byMuscle.get(m);
        if (!entries) continue;
        appendAll(listEl,
          el('div', { class: 'picker__label', style: { '--mc': muscleColor(m) } },
            el('span', { class: 'picker__dot' }),
            muscleName(m)),
          entries.map((e) => exerciseRow(e, onPick)),
        );
      }
    }

    if (!sameHits.length && !others.length) {
      appendAll(listEl, el('div', { class: 'picker__none muted small' },
        q ? `No exercise matches “${query}”.` : 'No exercises yet.'));
    }
  }

  paint();

  return [
    el('div', { class: 'searchwrap' }, icon('search'), searchEl),
    el('button', {
      class: 'btn btn--block newex',
      type: 'button',
      onClick: () => openNewExerciseSheet({
        state,
        presetMuscle: muscle,
        onCreate: (entry) => onPick(entry),
      }),
    }, icon('plus'), 'Create new exercise'),
    listEl,
  ];
}

function exerciseRow(entry, onPick) {
  return el('button', {
    class: 'exrow',
    type: 'button',
    style: { '--mc': muscleColor(entry.muscle) },
    onClick: () => onPick(entry),
  },
    el('span', { class: 'exrow__bar' }),
    el('span', { class: 'exrow__text' },
      el('span', { class: 'exrow__name' }, entry.name),
      el('span', { class: 'exrow__meta' },
        [muscleName(entry.muscle), entry.equipment].filter(Boolean).join(' · ')),
    ),
    entry.custom ? el('span', { class: 'exrow__tag' }, 'Custom') : null,
  );
}

/* ------------------------------------------------------------------ *
 * Create a brand-new exercise
 * ------------------------------------------------------------------ */

export function openNewExerciseSheet({ state, presetMuscle = null, onCreate }) {
  let muscle = presetMuscle || 'chest';
  let equipment = '';

  openSheet({
    title: 'New exercise',
    build: (api) => {
      const nameEl = el('input', {
        class: 'textinput',
        type: 'text',
        placeholder: 'Exercise name',
        'aria-label': 'Exercise name',
        autocapitalize: 'words',
      });

      const muscleChips = el('div', { class: 'chips' },
        MUSCLES.map((m) => el('button', {
          class: `chip${m.id === muscle ? ' is-on' : ''}`,
          type: 'button',
          style: { '--mc': m.color },
          onClick: (e) => {
            muscle = m.id;
            for (const c of muscleChips.children) c.classList.remove('is-on');
            e.currentTarget.classList.add('is-on');
          },
        }, m.name)));

      const equipChips = el('div', { class: 'chips' },
        EQUIPMENT.map((eq) => el('button', {
          class: 'chip chip--plain',
          type: 'button',
          onClick: (e) => {
            const on = equipment === eq;
            equipment = on ? '' : eq;
            for (const c of equipChips.children) c.classList.remove('is-on');
            if (!on) e.currentTarget.classList.add('is-on');
          },
        }, eq)));

      const save = () => {
        const name = nameEl.value.trim();
        if (!name) {
          nameEl.focus();
          toast('Give the exercise a name', { error: true });
          return;
        }
        const existing = findLibraryEntry(state.library, name, muscle);
        if (existing) {
          toast(`“${existing.name}” is already in your library`);
          api.close();
          onCreate(existing);
          return;
        }
        const entry = makeLibraryEntry({ name, muscle, equipment, custom: true });
        commit((s) => { s.library.push(entry); }, { render: false });
        api.close();
        onCreate(entry);
      };

      return [
        el('label', { class: 'field' },
          el('span', { class: 'field__label' }, 'Name'),
          nameEl),
        el('div', { class: 'field' },
          el('span', { class: 'field__label' }, 'Muscle group'),
          muscleChips),
        el('div', { class: 'field' },
          el('span', { class: 'field__label' }, 'Equipment'),
          equipChips),
        el('button', { class: 'btn btn--primary btn--block', type: 'button', onClick: save },
          'Create exercise'),
      ];
    },
  });
}

/* ------------------------------------------------------------------ *
 * "Just this day" vs "rest of the meso"
 * ------------------------------------------------------------------ */

function scopeSheet({ title, subtitle, meso, route, run }) {
  const week = route.weekIndex + 1;
  const lastWeek = WEEKS_PER_MESO;

  return {
    title,
    subtitle,
    build: (api) => [
      el('button', {
        class: 'optionrow',
        type: 'button',
        onClick: () => { api.closeAll(); run('day'); },
      },
        el('span', { class: 'optionrow__title' }, 'Just this day'),
        el('span', { class: 'optionrow__sub' }, `Week ${week} only`),
        el('span', { class: 'optionrow__chev' }, icon('chevron')),
      ),
      el('button', {
        class: 'optionrow',
        type: 'button',
        onClick: () => { api.closeAll(); run('rest'); },
      },
        el('span', { class: 'optionrow__title' }, 'Rest of the mesocycle'),
        el('span', { class: 'optionrow__sub' },
          week === lastWeek ? `Week ${week} (last week)` : `Weeks ${week}–${lastWeek}`),
        el('span', { class: 'optionrow__chev' }, icon('chevron')),
      ),
      el('p', { class: 'sheet__note small muted' },
        'Earlier weeks, finished workouts and logged sets are never changed.'),
    ],
  };
}

function reportPlanChange({ changed, blocked }, verb) {
  if (!changed) {
    toast('Nothing changed — those workouts are finished or logged', { error: true, ms: 3600 });
    return;
  }
  const weeks = `${changed} week${changed === 1 ? '' : 's'}`;
  toast(blocked
    ? `${verb} · ${weeks} · ${blocked} skipped (logged)`
    : `${verb} · ${weeks}`, { ms: 3200 });
}
