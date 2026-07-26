# Workout

A personal mesocycle workout tracker. Phone-only web app / PWA, no account, no server —
everything is stored on-device in the browser and backed up with an export button.

- **Mesocycle:** 8 weeks × 4 training days (Thursday, Friday, Saturday, Monday)
- **Storage:** one JSON blob in `localStorage`, written automatically on every change
- **Backup:** export to a `.json` file, restore from one

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
  views/              screens
icons/                app icons
```
