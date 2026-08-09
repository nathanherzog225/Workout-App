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

**Skipping** is its own state, distinct from both logged and empty. A whole day
carries `skippedAt`; a single set carries `skipped`. Skipping a day sets one
timestamp and never touches individual sets, so Unskip restores the previous
state exactly. Sets you logged before skipping the day stay logged.

**References look back per set, not per week.** Each set finds the most recent
earlier week where *that same set slot* was actually performed — `logged` and
not `skipped` — so skipped weeks and skipped sets are stepped over rather than
blanking the reference. That one lookup drives the weight arrows, the faint
placeholders, and the fallback after a skip. It reads live state, so editing a
set in a finished week immediately updates what later weeks show.

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

## Putting it on your iPhone home screen

The app needs to be served over HTTPS for the service worker (and therefore the
installable, chrome-less app) to work. GitHub Pages does this for free.

**1. Turn on GitHub Pages** — repo **Settings → Pages**, set Source to
*Deploy from a branch*, pick this repo's default branch and the `/ (root)` folder,
then Save. After a minute the site is live at
`https://<username>.github.io/<repo>/`.

**2. Add it to your home screen** — open that URL **in Safari** (not Chrome — only
Safari installs a proper standalone web app on iOS), then **Share → Add to Home
Screen → Add**.

It launches with no browser chrome, works offline, and keeps its data between
sessions.

> **Add to the home screen *before* entering real data.** iOS gives a home-screen
> web app its own storage, separate from Safari's, so anything logged in Safari
> beforehand won't appear in the installed app. If that happens, Export from Safari
> and Restore inside the installed app.

> Data lives in this browser's storage on this device. Deleting the app's site data,
> or "Clear History and Website Data" in Safari, wipes it — export a backup regularly.

Deploys land on the next launch: the service worker fetches the page from the
network first and falls back to its cache only when offline.

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
