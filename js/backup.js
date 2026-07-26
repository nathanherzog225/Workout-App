import { store, replaceState, flush, SCHEMA_VERSION } from './store.js';

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/**
 * Download the entire app state as a JSON file.
 * On iOS this hands off to the share/save sheet so it can land in Files or iCloud.
 */
export function exportBackup() {
  flush();
  const payload = {
    kind: 'workout-app-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: store.state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout-backup-${stamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Read a user-picked backup file and return the state it contains. Throws on anything unusable. */
export async function readBackupFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const next = parsed?.kind === 'workout-app-backup' ? parsed.state : parsed;
  if (!next || typeof next !== 'object' || !Array.isArray(next.mesos)) {
    throw new Error("That doesn't look like a workout backup.");
  }
  return next;
}

/** Replace everything with the contents of a backup. Destructive — confirm before calling. */
export function restoreBackup(nextState) {
  replaceState(nextState);
}
