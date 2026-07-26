import { el, icon } from '../ui.js';

/**
 * Home screen. Step 1 renders the empty state only — the meso/week/day UI
 * lands once the training split is defined.
 */
export function renderHome({ state, mount, dock }) {
  const hasMeso = state.mesos.length > 0;

  if (!hasMeso) {
    mount.append(
      el('div', { class: 'empty' },
        el('div', { class: 'empty__icon' }, icon('dumbbell')),
        el('h2', {}, 'No mesocycle yet'),
        el('p', { class: 'small' }, '8 weeks · Thu / Fri / Sat / Mon'),
      ),
    );
    dock.append(
      el('button', { class: 'btn btn--primary btn--block', type: 'button', disabled: true },
        icon('plus'), 'Start a mesocycle'),
    );
    return;
  }

  mount.append(el('div', { class: 'card' }, el('p', { class: 'muted small' }, 'Mesocycle view coming next.')));
}

export function homeTitle() {
  return { title: 'Workout', sub: null };
}
