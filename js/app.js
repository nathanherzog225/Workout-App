import { store, subscribe, commit } from './store.js';
import { ensureLibraryCurrent } from './model.js';
import { el, clear, iconButton, toast, icon } from './ui.js';
import { exportBackup, readBackupFile, restoreBackup } from './backup.js';
import { renderHome, homeTopbar } from './views/home.js';
import { renderDay, dayTopbar, backToHome } from './views/day.js';

const topbarEl = document.getElementById('topbar');
const viewEl = document.getElementById('view');
const dockEl = document.getElementById('dock');

const VIEWS = {
  home: { render: renderHome, topbar: homeTopbar },
  day: { render: renderDay, topbar: dayTopbar, back: backToHome },
};

/** Current screen. Kept in memory — one screen at a time, no history stack needed. */
let route = { name: 'home' };

let resetScroll = false;

export function navigate(next) {
  route = next;
  resetScroll = true;
  render();
}

function render() {
  const state = store.state;
  const view = VIEWS[route.name] ?? VIEWS.home;

  // Logging a set re-renders the whole view; hold the scroll position so the
  // list doesn't jump out from under you mid-workout.
  const scrollY = window.scrollY;
  const active = document.activeElement;
  const focusKey = active?.dataset?.focus || null;
  const caret = focusKey && active.selectionStart != null ? active.selectionStart : null;

  clear(topbarEl);
  clear(viewEl);
  clear(dockEl);

  const { title, sub } = view.topbar(state, route) ?? {};
  // Note: native append() stringifies null, so only real nodes go in.
  topbarEl.append(...[
    view.back && iconButton('back', 'Back', () => navigate(view.back(route))),
    el('div', { class: 'topbar__title' }, title ?? 'Workout',
      sub ? el('span', { class: 'topbar__sub' }, sub) : null),
    iconButton('import', 'Restore from backup', pickBackupFile),
    iconButton('export', 'Export backup', () => {
      exportBackup();
      toast('Backup exported');
    }),
  ].filter(Boolean));

  view.render({ state, route, mount: viewEl, dock: dockEl, navigate });

  if (resetScroll) {
    resetScroll = false;
    window.scrollTo(0, 0);
  } else {
    window.scrollTo(0, scrollY);
    if (focusKey) {
      const next = viewEl.querySelector(`[data-focus="${focusKey}"]`);
      if (next) {
        next.focus({ preventScroll: true });
        if (caret != null) try { next.setSelectionRange(caret, caret); } catch { /* not a text input */ }
      }
    }
  }
}

/** Hidden file input, created on demand so iOS shows the Files picker. */
function pickBackupFile() {
  const input = el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    try {
      const next = await readBackupFile(file);
      const count = next.mesos?.length ?? 0;
      const ok = confirm(
        `Restore this backup?\n\n${count} mesocycle${count === 1 ? '' : 's'}\n\n` +
        'This replaces everything currently in the app.',
      );
      if (!ok) return;
      restoreBackup(next);
      route = { name: 'home' };
      toast('Backup restored');
    } catch (err) {
      toast(err.message || 'Could not read that file', { error: true });
    }
  });
  document.body.append(input);
  input.click();
}

// Bring saved data onto the current muscle/equipment vocabulary and make sure
// the library matches the current catalogue. Both are no-ops once up to date.
commit((s) => ensureLibraryCurrent(s), { render: false });

subscribe(render);
render();

// Surface storage problems rather than silently dropping data.
if (!store.storageHealthy) {
  toast(
    store.corruptOnLoad
      ? 'Saved data was unreadable and has been set aside.'
      : "This browser is blocking storage — data won't be saved.",
    { error: true, ms: 6000 },
  );
}

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is best-effort */ });
  });
}
