/**
 * Zone 2 cardio — its own module, deliberately separate from the set tracker.
 *
 * One number a day against a 45-minute goal, and a weekly roll-up against 180.
 * No look-back, no carry-forward, no trend arrows: unlike a set, a cardio entry
 * is only ever "how many minutes today".
 */
import { el, icon } from '../ui.js';
import { commit } from '../store.js';
import { CARDIO_DAILY_GOAL, CARDIO_COLOR } from '../constants.js';
import { cardioMinutes, cardioFill, cardioGoalMet, setCardioMinutes, weekCardio } from '../model.js';

/* ------------------------------------------------------------------ *
 * Ring
 * ------------------------------------------------------------------ */

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Progress ring. Returns the node plus the arc, so a caller mid-keystroke can
 * redraw the fill without a re-render that would steal focus from the input.
 */
function ring(fill, { met }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('class', 'cardioring__svg');
  svg.setAttribute('aria-hidden', 'true');

  const circle = (cls, extra = {}) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    Object.entries({ cx: 32, cy: 32, r: RING_R, class: cls, ...extra })
      .forEach(([k, v]) => c.setAttribute(k, v));
    return c;
  };

  const arc = circle('cardioring__arc', {
    'stroke-dasharray': RING_C,
    'stroke-dashoffset': RING_C * (1 - fill),
    // Start the fill at 12 o'clock and run clockwise.
    transform: 'rotate(-90 32 32)',
  });

  svg.append(circle('cardioring__track'), arc);
  const node = el('div', { class: `cardioring${met ? ' is-met' : ''}` }, svg);
  return { node, arc };
}

/* ------------------------------------------------------------------ *
 * Per-day module
 * ------------------------------------------------------------------ */

/**
 * The day's cardio card: one input, the ring, and the raw "30 / 45 min".
 *
 * Typing commits with `render: false` and updates the ring and readout by hand,
 * so the number under your finger never jumps and the ring still tracks live.
 */
export function renderCardioCard({ day }) {
  const met = cardioGoalMet(day);
  const { node: ringNode, arc } = ring(cardioFill(day), { met });

  // Rendered up front and toggled with the ring: typing commits without a
  // re-render, so anything that reacts to the number has to be updated by hand.
  const metBadge = el('span', { class: 'cardio__met', hidden: !met }, icon('check'), 'Goal met');

  const readout = el('div', { class: 'cardio__readout' },
    el('span', { class: 'cardio__minutes' }, String(cardioMinutes(day))),
    el('span', { class: 'cardio__goal' }, ` / ${CARDIO_DAILY_GOAL} min`),
  );

  const input = el('input', {
    class: 'cardio__input',
    type: 'text',
    inputmode: 'numeric',
    maxLength: 3,
    value: day.cardio?.zone2Minutes ?? '',
    placeholder: '0',
    'aria-label': 'Zone 2 minutes today',
    dataset: { focus: `cardio:${day.id}` },
    onInput: (e) => {
      const clean = e.target.value.replace(/[^0-9]/g, '');
      if (clean !== e.target.value) e.target.value = clean;
      commit(() => setCardioMinutes(day, clean), { render: false });

      // Repaint just this card. The ring caps at full; the readout doesn't.
      const fill = cardioFill(day);
      const nowMet = cardioGoalMet(day);
      arc.setAttribute('stroke-dashoffset', String(RING_C * (1 - fill)));
      ringNode.classList.toggle('is-met', nowMet);
      metBadge.hidden = !nowMet;
      readout.firstChild.textContent = String(cardioMinutes(day));
    },
    onFocus: (e) => e.target.select(),
  });

  return el('section', { class: 'cardio', style: { '--cc': CARDIO_COLOR } },
    el('div', { class: 'cardio__head' },
      el('span', { class: 'cardiotag' }, 'Zone 2 cardio'),
      metBadge,
    ),
    el('div', { class: 'cardio__body' },
      ringNode,
      el('div', { class: 'cardio__fields' },
        el('label', { class: 'cardio__label', for: null },
          el('span', { class: 'cardio__labeltext' }, 'Minutes today'),
          input,
        ),
        readout,
      ),
    ),
  );
}

/* ------------------------------------------------------------------ *
 * Weekly summary
 * ------------------------------------------------------------------ */

/**
 * The week's cardio total against 180, plus which days hit the full 45.
 *
 * Rendered on the home screen for whichever week is selected, so it stays
 * retrievable long after the week is finished rather than flashing once.
 */
export function renderWeekCardio(week) {
  const { total, goal, pct, daysMet, days } = weekCardio(week);
  const complete = total >= goal;

  return el('section', { class: `cardioweek${complete ? ' is-complete' : ''}`, style: { '--cc': CARDIO_COLOR } },
    el('div', { class: 'cardioweek__head' },
      el('span', { class: 'cardiotag' }, 'Zone 2 cardio'),
      el('span', { class: 'cardioweek__total' },
        el('strong', {}, String(total)),
        ` / ${goal} min`),
    ),

    el('div', { class: 'cardioweek__bar' },
      el('i', { style: { width: `${Math.round(pct * 100)}%` } })),

    el('div', { class: 'cardioweek__days' },
      days.map((d) => el('span', {
        class: `cardiochip${d.met ? ' is-met' : ''}`,
        title: `${d.label}: ${d.minutes} of ${CARDIO_DAILY_GOAL} min`,
      },
        el('span', { class: 'cardiochip__day' }, d.short),
        el('span', { class: 'cardiochip__min' }, String(d.minutes)),
      )),
    ),

    el('div', { class: 'cardioweek__foot small' },
      complete
        ? `Weekly goal met · ${daysMet} of ${days.length} days at ${CARDIO_DAILY_GOAL} min`
        : `${daysMet} of ${days.length} days at ${CARDIO_DAILY_GOAL} min · ${Math.max(goal - total, 0)} min to go`),
  );
}
