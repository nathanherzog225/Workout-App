import { el, icon, clear } from '../ui.js';
import { commit } from '../store.js';
import { WEEKS_PER_MESO } from '../constants.js';
import { muscleColor, muscleName } from '../constants.js';
import {
  createMeso, seedLibrary, getMeso,
  dayProgress, weekProgress, dayMuscles, isDayStarted,
} from '../model.js';

export function homeTopbar(state) {
  const meso = getMeso(state);
  if (!meso) return { title: 'Workout' };
  const week = Math.min(Math.max(meso.currentWeek | 0, 0), meso.weeks.length - 1);
  return { title: meso.name, sub: `Week ${week + 1} of ${meso.weeks.length}` };
}

export function renderHome({ state, mount, dock, navigate }) {
  const meso = getMeso(state);

  if (!meso) {
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
    return;
  }

  // Clamp rather than trust: a hand-edited or partial backup could carry a
  // currentWeek past the end of the meso, and that shouldn't blank the screen.
  const weekIndex = Math.min(Math.max(meso.currentWeek | 0, 0), meso.weeks.length - 1);
  const week = meso.weeks[weekIndex];
  if (!week) return;

  mount.append(renderWeekStrip(meso, weekIndex));

  for (const [dayIndex, day] of week.days.entries()) {
    mount.append(renderDayCard(day, () => navigate({ name: 'day', weekIndex, dayIndex })));
  }
}

/* ---------------- week selector ---------------- */

function renderWeekStrip(meso, currentWeek) {
  const strip = el('div', { class: 'weekstrip' });

  for (let w = 0; w < meso.weeks.length; w++) {
    const p = weekProgress(meso.weeks[w]);
    const complete = p.daysFinished === meso.weeks[w].days.length;
    const started = p.logged > 0;
    const current = w === currentWeek;

    strip.append(
      el('button', {
        class: `weekpill${current ? ' is-current' : ''}${complete ? ' is-complete' : ''}${started && !complete ? ' is-started' : ''}`,
        type: 'button',
        'aria-current': current ? 'true' : null,
        onClick: () => {
          commit((s) => { getMeso(s, meso.id).currentWeek = w; });
        },
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
  const finished = Boolean(day.finishedAt);
  const started = isDayStarted(day) && !finished;

  const status = finished
    ? el('span', { class: 'pill pill--done' }, icon('check'), 'Done')
    : started
      ? el('span', { class: 'pill pill--active' }, 'In progress')
      : el('span', { class: 'daycard__chev' }, icon('chevron'));

  return el('button', { class: `daycard${finished ? ' is-finished' : ''}`, type: 'button', onClick: onOpen },
    el('div', { class: 'daycard__head' },
      el('span', { class: 'daycard__day' }, day.short),
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
