# Workout

A personal mesocycle workout tracker. Phone-only web app / PWA, no account, no server —
everything is stored on-device in the browser and backed up with an export button.

- **Mesocycle:** 8 weeks × 4 training days (Thursday, Friday, Saturday, Monday)
- **Storage:** one JSON blob in `localStorage`, written automatically on every change
- **Backup:** export to a `.json` file, restore from one

## How it works

**Weeks are independent.** Every week holds its own copy of every exercise and
set — no shared objects. That's what makes "never change earlier weeks or
already-logged data" hold structurally rather than by convention.

**Last week's numbers** appear as faint placeholders in the current week. They
are placeholders only; an untouched set stays empty in the saved data. Logging a
set you left blank falls back to the placeholder it was showing.

**Swap / add / remove** an exercise asks whether to apply to just this day or
the rest of the mesocycle. All three route through one guard (`editableWeeks`
in `js/model.js`), which refuses to touch weeks earlier than the current one,
finished workouts, or exercises with logged sets — and reports what it skipped.

**Starting the next block** copies the plan from the *last* week of the current
mesocycle — the exercises and set counts you actually finished on — into a
fresh 8 weeks with no numbers. The old mesocycle is kept in full.

## Running it

There's no build step, but ES modules need to be served over HTTP (not `file://`):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## On your iPhone

Host the folder anywhere with HTTPS (GitHub Pages works), open it in Safari, then
**Share → Add to Home Screen**. It launches standalone, works offline, and keeps its
data between sessions.

> Data lives in this browser's storage on this device. Deleting the app's site data,
> or "Clear History and Website Data" in Safari, wipes it — export a backup regularly.

## Layout

```
index.html            app shell
manifest.webmanifest  PWA manifest
sw.js                 offline cache
css/styles.css        dark theme + tokens
js/
  app.js              boot, top bar, routing
  store.js            state + autosave to localStorage
  backup.js           export / restore
  ui.js               DOM + icon helpers
  constants.js        muscle colours, training days, equipment
  model.js            mesocycle structure, swap/add guards
  catalog.js          the exercise library (315 exercises)
  template.js         the training split a new meso is built from
  sheet.js            bottom sheets
  views/              screens
icons/                app icons
```
