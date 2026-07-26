import { el } from '../ui.js';
import { muscleColor, muscleName } from '../constants.js';
import { getMeso, getDay, muscleGroups } from '../model.js';

export function dayTopbar(state, route) {
  const day = getDay(getMeso(state), route.weekIndex, route.dayIndex);
  if (!day) return { title: 'Workout' };
  return { title: day.label, sub: `${day.name} · Week ${route.weekIndex + 1}` };
}

/** Step 2: structure only. Set inputs, logging and the finish bar land in step 3. */
export function renderDay({ state, route, mount }) {
  const day = getDay(getMeso(state), route.weekIndex, route.dayIndex);
  if (!day) return;

  for (const group of muscleGroups(day.exercises)) {
    mount.append(
      el('div', { class: 'group', style: { '--mc': muscleColor(group.muscle) } },
        el('div', { class: 'group__head' },
          el('span', { class: 'muscletag' }, muscleName(group.muscle)),
        ),
        group.exercises.map((ex) =>
          el('div', { class: 'exercise' },
            el('div', { class: 'exercise__head' },
              el('span', { class: 'exercise__name' }, ex.name),
              ex.equipment && el('span', { class: 'exercise__equip' }, ex.equipment),
            ),
            el('div', { class: 'small faint' }, `${ex.sets.length} sets`),
          )),
      ),
    );
  }
}
