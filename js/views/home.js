import { el, icon, toast } from '../ui.js';
import { commit } from '../store.js';
import { openSheet } from '../sheet.js';
import { muscleColor, muscleName } from '../constants.js';
import {
  createMeso, copyMesoAsNew, seedLibrary, getMeso,
  dayProgress, weekProgress, dayMuscles, dayStatus,
  mesoStats, lastTrainedAt,
} from '../model.js';

/** The meso being looked at — the active one unless the route names another. */
function viewedMeso(state, route = {}) {
  return getMeso(state, route.mesoId ?? state.activeMesoId);
}

export function homeTopbar(state, route) {
  const meso = viewedMeso(state, route);
  if (!meso) return { title: 'Workout' };
  const week = clampWeek(meso);
  return { title: meso.name, sub: `Week ${week + 1} of ${meso.weeks.length}` };
}

function clampWeek(meso) {
  return Math.min(Math.max(meso.currentWeek | 0, 0), meso.weeks.length - 1);
}

export function renderHome({ state, route = {}, mount, dock, navigate }) {
  const meso = viewedMeso(state, route);
  const past = state.mesos.filter((m) => m.id !== state.activeMesoId);

  if (!meso) {
    renderEmpty({ mount, dock, state });
    if (past.length) mount.append(renderArchive(past, navigate));
    return;
  }

  const isActive = meso.id === state.activeMesoId;
  if (!isActive) mount.append(renderArchiveBanner(navigate));

  const weekIndex = clampWeek(meso);
  const week = meso.weeks[weekIndex];
  if (!week) return;

  mount.append(renderWeekStrip(meso, weekIndex));

  for (const [dayIndex, day] of week.days.entries()) {
    mount.append(renderDayCard(day, () =>
      navigate({ name: 'day', mesoId: meso.id, weekIndex, dayIndex })));
  }

  mount.append(renderMesoActions({ state, meso, isActive, navigate }));
  if (isActive && past.length) mount.append(renderArchive(past, navigate));
}

/* ---------------- empty state ---------------- */

function renderEmpty({ mount, dock }) {
  mount.append(
    el('div', { class: 'empty' },
      el('div', { class: 'empty__icon' }, icon('dumbbell')),
      el('h2', {}, 'No mesocycle yet'),
      el('p', { class: 'small' }, '8 weeks · Thu / Fri / Sat / Mon'),
    ),
  );
  dock.append(
    el('button', {
      class: 'btn btn--primary btn--block',
      type: 'button',
      onClick: () => {
        commit((s) => {
          seedLibrary(s);
          const created = createMeso({ name: `Meso ${s.mesos.length + 1}`, library: s.library });
          s.mesos.push(created);
          s.activeMesoId = created.id;
        });
      },
    }, icon('plus'), 'Start a mesocycle'),
  );
}

/* ---------------- week selector ---------------- */

function renderWeekStrip(meso, currentWeek) {
  const strip = el('div', { class: 'weekstrip' });

  for (let w = 0; w < meso.weeks.length; w++) {
    const p = weekProgress(meso.weeks[w]);
    // A week counts as done once every day is either finished or skipped.
    const complete = p.daysSettled === meso.weeks[w].days.length;
    const started = p.logged > 0;
    const current = w === currentWeek;

    strip.append(
      el('button', {
        class: `weekpill${current ? ' is-current' : ''}${complete ? ' is-complete' : ''}${started && !complete ? ' is-started' : ''}`,
        type: 'button',
        'aria-current': current ? 'true' : null,
        onClick: () => commit((s) => { getMeso(s, meso.id).currentWeek = w; }),
      },
        el('span', { class: 'weekpill__n' }, String(w + 1)),
        complete ? el('span', { class: 'weekpill__tick' }, icon('check')) : null,
      ),
    );
  }

  // Keep the selected week in view when the strip overflows.
  queueMicrotask(() => {
    strip.querySelector('.is-current')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  });

  return el('div', { class: 'weekstrip-wrap' },
    el('div', { class: 'weekstrip-label' }, 'Week'),
    strip,
  );
}

/* ---------------- day card ---------------- */

function renderDayCard(day, onOpen) {
  const { total, logged, pct } = dayProgress(day);
  const state = dayStatus(day);
  const finished = state === 'finished';
  const skipped = state === 'skipped';

  const status = skipped
    ? el('span', { class: 'pill pill--skip' }, icon('skip'), 'Skipped')
    : finished
      ? el('span', { class: 'pill pill--done' }, icon('check'), 'Done')
      : state === 'active'
        ? el('span', { class: 'pill pill--active' }, 'In progress')
        : el('span', { class: 'daycard__chev' }, icon('chevron'));

  return el('button', {
    class: `daycard${finished ? ' is-finished' : ''}${skipped ? ' is-skipped' : ''}`,
    type: 'button',
    onClick: onOpen,
  },
    el('div', { class: 'daycard__head' },
      el('span', { class: 'daycard__label' }, day.label),
      status,
    ),
    el('div', { class: 'musclebar' },
      dayMuscles(day).map((m) =>
        el('span', {
          class: 'musclebar__seg',
          style: { background: muscleColor(m) },
          title: muscleName(m),
        })),
    ),
    el('div', { class: 'daycard__foot' },
      el('div', { class: `pbar${finished ? ' pbar--good' : ''}` },
        el('i', { style: { width: `${Math.round(pct * 100)}%` } })),
      el('span', { class: 'daycard__meta' }, `${logged}/${total} sets`),
    ),
  );
}

/* ---------------- mesocycle actions ---------------- */

function renderMesoActions({ state, meso, isActive, navigate }) {
  const stats = mesoStats(meso);

  return el('div', {},
    el('div', { class: 'section-label' }, 'Mesocycle'),
    el('div', { class: 'mesosummary' },
      el('span', {}, `${stats.daysFinished}/${stats.days} workouts`),
      el('span', { class: 'faint' }, '·'),
      el('span', {}, `${stats.logged} sets logged`),
    ),

    el('button', {
      class: 'optionrow',
      type: 'button',
      onClick: () => openRenameSheet(meso),
    },
      el('span', { class: 'optionrow__title' }, 'Rename'),
      el('span', { class: 'optionrow__sub' }, meso.name),
      el('span', { class: 'optionrow__chev' }, icon('chevron')),
    ),

    isActive && el('button', {
      class: 'optionrow',
      type: 'button',
      onClick: () => openNextMesoSheet({ state, meso, navigate }),
    },
      el('span', { class: 'optionrow__title' }, 'Start next mesocycle'),
      el('span', { class: 'optionrow__sub' },
        stats.complete
          ? 'Copy this plan into a fresh 8 weeks'
          : `${stats.days - stats.daysFinished} workouts still unfinished`),
      el('span', { class: 'optionrow__chev' }, icon('chevron')),
    ),
  );
}

function openRenameSheet(meso) {
  openSheet({
    title: 'Rename mesocycle',
    build: (api) => {
      const input = el('input', {
        class: 'textinput',
        type: 'text',
        value: meso.name,
        'aria-label': 'Mesocycle name',
        autocapitalize: 'words',
      });
      const save = () => {
        const name = input.value.trim();
        if (!name) {
          toast('Give it a name', { error: true });
          return;
        }
        commit((s) => { getMeso(s, meso.id).name = name; });
        api.close();
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
      queueMicrotask(() => input.focus());

      return [
        el('label', { class: 'field' },
          el('span', { class: 'field__label' }, 'Name'),
          input),
        el('button', { class: 'btn btn--primary btn--block', type: 'button', onClick: save }, 'Save'),
      ];
    },
  });
}

function openNextMesoSheet({ state, meso, navigate }) {
  const stats = mesoStats(meso);

  openSheet({
    title: 'Start next mesocycle',
    subtitle: meso.name,
    build: (api) => [
      el('p', { class: 'sheet__note small muted', style: { marginTop: '0' } },
        'Copies the plan from week ', el('strong', {}, String(meso.weeks.length)),
        ' — the exercises and set counts you finished on — into a fresh 8 weeks with no numbers. ',
        el('strong', {}, meso.name), ' is kept in full and moves to your history.'),

      !stats.complete && el('p', { class: 'sheet__warn small' },
        icon('alert'),
        `${stats.days - stats.daysFinished} of ${stats.days} workouts in this mesocycle aren't finished yet.`),

      el('button', {
        class: 'btn btn--primary btn--block',
        type: 'button',
        style: { marginTop: '16px' },
        onClick: () => {
          api.closeAll();
          const created = commit((s) => {
            const source = getMeso(s, meso.id);
            source.finishedAt = source.finishedAt || new Date().toISOString();
            const next = copyMesoAsNew(source, {
              name: `Meso ${s.mesos.length + 1}`,
              library: s.library,
            });
            s.mesos.push(next);
            s.activeMesoId = next.id;
            return next;
          });
          navigate({ name: 'home' });
          toast(`${created.name} started`);
        },
      }, icon('plus'), 'Create next mesocycle'),
    ],
  });
}

/* ---------------- past mesocycles ---------------- */

function renderArchiveBanner(navigate) {
  return el('div', { class: 'banner' },
    el('span', { class: 'banner__text' }, 'Viewing a past mesocycle'),
    el('button', {
      class: 'btn btn--sm',
      type: 'button',
      onClick: () => navigate({ name: 'home' }),
    }, 'Current'),
  );
}

function renderArchive(mesos, navigate) {
  // Newest first.
  const ordered = [...mesos].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return el('div', {},
    el('div', { class: 'section-label' }, `Past mesocycles · ${ordered.length}`),
    ordered.map((meso) => {
      const stats = mesoStats(meso);
      const last = lastTrainedAt(meso);
      return el('button', {
        class: 'optionrow',
        type: 'button',
        onClick: () => navigate({ name: 'home', mesoId: meso.id }),
      },
        el('span', { class: 'optionrow__title' }, meso.name),
        el('span', { class: 'optionrow__sub' },
          [
            `${stats.daysFinished}/${stats.days} workouts`,
            `${stats.logged} sets`,
            last ? `last ${formatDate(last)}` : null,
          ].filter(Boolean).join(' · ')),
        el('span', { class: 'optionrow__chev' }, icon('chevron')),
      );
    }),
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
