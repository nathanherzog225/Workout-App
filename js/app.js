import { store, subscribe } from './store.js';
import { el, clear, iconButton, toast } from './ui.js';
import { exportBackup, readBackupFile, restoreBackup } from './backup.js';
import { renderHome, homeTitle } from './views/home.js';

const topbar = document.getElementById('topbar');
const view = document.getElementById('view');
const dock = document.getElementById('dock');

/** Current screen. Kept in memory — this is a single-session-per-visit app. */
let route = { name: 'home' };

export function navigate(next) {
  route = next;
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  render();
}

function render() {
  const state = store.state;
  clear(topbar);
  clear(view);
  clear(dock);

  const { title, sub } = homeTitle(state);
  topbar.append(
    el('div', { class: 'topbar__title' }, title, sub && el('span', { class: 'topbar__sub' }, sub)),
    iconButton('import', 'Restore from backup', pickBackupFile),
    iconButton('export', 'Export backup', () => {
      exportBackup();
      toast('Backup exported');
    }),
  );

  if (route.name === 'home') renderHome({ state, mount: view, dock, navigate });
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
      toast('Backup restored');
    } catch (err) {
      toast(err.message || 'Could not read that file', { error: true });
    }
  });
  document.body.append(input);
  input.click();
}

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
