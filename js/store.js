/**
 * Single source of truth for the whole app.
 *
 * Everything lives in one JSON blob in localStorage. Writes are debounced so
 * typing into a weight field doesn't hammer storage, but any write still lands
 * within ~200ms and is force-flushed when the page is hidden or unloaded — so
 * closing the tab mid-set never loses data.
 */

export const STORAGE_KEY = 'workout-app/state';
export const SCHEMA_VERSION = 1;

function freshState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeMesoId: null,
    mesos: [],
    library: [],
    settings: {
      unit: 'lb',
    },
  };
}

/** Fill in anything a older/partial payload is missing so the app can't crash on it. */
export function normalizeState(raw) {
  const base = freshState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    mesos: Array.isArray(raw.mesos) ? raw.mesos : [],
    library: Array.isArray(raw.library) ? raw.library : [],
    settings: { ...base.settings, ...(raw.settings || {}) },
  };
}

function readFromDisk() {
  let text;
  try {
    text = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode / storage disabled. Run in memory only.
    return { state: freshState(), ok: false };
  }
  if (!text) return { state: freshState(), ok: true };
  try {
    return { state: normalizeState(JSON.parse(text)), ok: true, rawText: text };
  } catch {
    // Corrupt payload: park it under a recovery key rather than overwriting it,
    // so nothing is destroyed silently.
    try {
      localStorage.setItem(`${STORAGE_KEY}.corrupt.${Date.now()}`, text);
    } catch { /* nothing we can do */ }
    return { state: freshState(), ok: false, corrupt: true };
  }
}

const loaded = readFromDisk();

/**
 * Keep a verbatim copy of whatever was on disk before a structural migration
 * rewrites it. Written once per schema version, never overwritten, so there is
 * always a pre-migration snapshot to fall back on.
 */
export function snapshotBeforeMigration(version) {
  const key = `${STORAGE_KEY}.pre-v${version}`;
  try {
    if (!loaded.rawText || localStorage.getItem(key)) return false;
    localStorage.setItem(key, loaded.rawText);
    return true;
  } catch {
    // Out of quota or storage disabled — the migration is additive either way.
    return false;
  }
}

const listeners = new Set();
let writeTimer = null;
let pendingWrite = false;

export const store = {
  state: loaded.state,
  /** false when localStorage is unavailable or the saved blob was unreadable. */
  storageHealthy: loaded.ok,
  corruptOnLoad: Boolean(loaded.corrupt),
  lastWriteError: null,
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(store.state);
}

function writeNow() {
  writeTimer = null;
  pendingWrite = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
    store.lastWriteError = null;
  } catch (err) {
    store.lastWriteError = err;
    notify();
  }
}

/** Force any debounced write to land immediately. */
export function flush() {
  if (writeTimer) clearTimeout(writeTimer);
  if (pendingWrite || writeTimer) writeNow();
}

/**
 * Mutate state and persist. Pass `render: false` for changes that shouldn't
 * trigger a re-render (e.g. keystrokes in an input the user is still focused on).
 */
export function commit(mutate, { render = true } = {}) {
  const result = mutate(store.state);
  store.state.updatedAt = new Date().toISOString();
  pendingWrite = true;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(writeNow, 200);
  if (render) notify();
  return result;
}

/** Wholesale replace (used by import). Writes synchronously. */
export function replaceState(next) {
  store.state = normalizeState(next);
  store.state.updatedAt = new Date().toISOString();
  flush();
  writeNow();
  notify();
}

// Never lose a debounced write to a backgrounded tab or an app switch.
addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
addEventListener('pagehide', flush);
addEventListener('beforeunload', flush);
