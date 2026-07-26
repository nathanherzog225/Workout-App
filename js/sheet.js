import { el, clear, icon } from './ui.js';

const host = document.getElementById('sheet-host');
let stack = [];

/**
 * Bottom sheet. `build(api)` returns the body content; `api.close()` dismisses,
 * `api.replace(next)` swaps in another sheet (used for swap → scope → confirm).
 */
export function openSheet({ title, subtitle, build, onClose }) {
  stack.push({ title, subtitle, build, onClose });
  paint();
}

export function closeSheet() {
  const top = stack.pop();
  top?.onClose?.();
  paint();
}

export function closeAllSheets() {
  while (stack.length) stack.pop()?.onClose?.();
  paint();
}

function paint() {
  clear(host);
  if (!stack.length) {
    host.hidden = true;
    document.body.style.overflow = '';
    return;
  }

  const spec = stack[stack.length - 1];
  const api = {
    close: closeSheet,
    closeAll: closeAllSheets,
    replace: (next) => { stack.pop(); openSheet(next); },
    push: openSheet,
  };

  host.hidden = false;
  // Stop the page behind the sheet from scrolling with it.
  document.body.style.overflow = 'hidden';

  host.append(
    el('div', { class: 'sheet__scrim', onClick: closeSheet }),
    el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': spec.title },
      el('div', { class: 'sheet__grab' }),
      el('div', { class: 'sheet__head' },
        el('div', { class: 'sheet__titles' },
          el('div', { class: 'sheet__title' }, spec.title),
          spec.subtitle ? el('div', { class: 'sheet__sub' }, spec.subtitle) : null,
        ),
        el('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Close', onClick: closeSheet },
          icon('close')),
      ),
      el('div', { class: 'sheet__body' }, spec.build(api)),
    ),
  );
}

addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stack.length) closeSheet();
});
