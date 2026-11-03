/**
 * <a-term-toggle> — a reader-facing "Show pronunciations" switch
 *
 * A labelled checkbox that turns pronunciation mode on and off for the page
 * (or part of it) by setting --a-term-pronunciation, with an optional keyboard
 * shortcut. It works alongside <a-term> but does not depend on it.
 *
 * ── Usage ────────────────────────────────────────────────────────────────
 *
 *   <script type="module" src="a-term-toggle.js"></script>
 *
 *   <a-term-toggle></a-term-toggle>
 *   <a-term-toggle>Afficher la prononciation</a-term-toggle>   ← label text
 *
 * ── Attributes ───────────────────────────────────────────────────────────
 *
 *   checked     start switched on. Without it, the initial state follows the
 *               target's current --a-term-pronunciation, so a page that defaults to
 *               inline starts checked.
 *   shortcut    keyboard shortcut, default "Alt+Shift+1"; "none" for none.
 *               Modifiers: Alt, Shift, Ctrl, Meta. Key: a digit, a letter,
 *               or a KeyboardEvent.code such as "Slash". Matched on the
 *               physical key (e.code), so Alt+Shift+1 works whatever the 1
 *               key types (⁄ with Option on macOS, & on AZERTY). Shown as
 *               Option on Apple platforms. Ignored while typing in a field.
 *   target      CSS selector for the element to set --a-term-pronunciation on;
 *               default the root element (the whole page).
 *   status-on   announced when switched on by the shortcut
 *   status-off  …and off (defaults: "Pronunciations shown" / "hidden")
 *
 * ── Behaviour ────────────────────────────────────────────────────────────
 *
 *   Checked sets --a-term-pronunciation: inline on the target, unchecked sets none,
 *   as an inline style. Sections that set --a-term-pronunciation themselves keep
 *   their own value. Toggles with the same target stay in sync, and one
 *   key press toggles once however many toggles share the shortcut.
 *
 *   .checked     property, read/write
 *   change       event fired on the element when the state changes
 *
 * ── Styling ──────────────────────────────────────────────────────────────
 *
 *   ::part(label)     the <label> (flex row: checkbox, text, hint)
 *   ::part(checkbox)  the <input type=checkbox>
 *   ::part(hint)      the shortcut hint (hidden on touch-only screens)
 *   ::part(key)       each <kbd> in the hint
 */

const IS_APPLE = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? '');
const SYNC = 'a-term-toggle-sync';

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `<style>
  :host { display: block; }
  :host([hidden]) { display: none; }
  label { display: flex; align-items: center; gap: .6em; cursor: pointer; }
  input { margin: 0; inline-size: 1.1em; block-size: 1.1em; flex: none; }
  .hint { margin-inline-start: auto; font-size: .85em; opacity: .75; white-space: nowrap; }
  .hint:empty { display: none; }
  /* Fonts whose "1" has a flag and a base, so the default Alt+Shift+1 can't
     be read as Alt+Shift+I (SF Mono, the Mac's ui-monospace, draws 1 as a
     near-plain stroke). Menlo: macOS, Consolas: Windows, DejaVu: Linux. */
  kbd {
    font-family: Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace;
    font-variant-numeric: lining-nums;
    font-size: .9em;
    padding: 0 .35em; border: 1px solid #d1d5db; border-bottom-width: 2px;
    border-radius: 4px; background: #f9fafb; color: #374151;
  }
  /* Touch screens: no keyboard hint (the shortcut still works with a
     keyboard attached), and a tap target of at least 44px. A tablet with a
     keyboard or trackpad usually reports a fine pointer, so keeps the hint. */
  @media (hover: none) and (pointer: coarse) {
    .hint { display: none; }
  }
  @media (pointer: coarse) {
    /* The checkbox's own state is the feedback; no tap-highlight band. */
    label { min-block-size: 44px; -webkit-tap-highlight-color: transparent; }
    input { inline-size: 1.4em; block-size: 1.4em; }
  }
  .status {
    position: absolute; width: 1px; height: 1px; margin: -1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
  }
</style>
<label part="label">
  <input type="checkbox" part="checkbox">
  <span><slot>Show pronunciations</slot></span>
  <span class="hint" part="hint" aria-hidden="true"></span>
</label>
<span class="status" role="status"></span>`;

class ATermToggle extends HTMLElement {
  static observedAttributes = ['shortcut', 'target'];

  #box; #hint; #status; #keys = null;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(TEMPLATE.content.cloneNode(true));
    this.#box    = root.querySelector('input');
    this.#hint   = root.querySelector('.hint');
    this.#status = root.querySelector('.status');
    this.#box.addEventListener('change', () => this.#apply(true));
  }

  connectedCallback() {
    this.#parseShortcut();
    this.#box.checked = this.hasAttribute('checked') ||
      getComputedStyle(this.#target()).getPropertyValue('--a-term-pronunciation').trim() === 'inline';
    this.#apply(false);
    document.addEventListener('keydown', this.#onKey);
    document.addEventListener(SYNC, this.#onSync);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.#onKey);
    document.removeEventListener(SYNC, this.#onSync);
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'shortcut') this.#parseShortcut();
    if (name === 'target') this.#apply(false);
  }

  get checked() { return this.#box.checked; }
  set checked(v) {
    if (this.#box.checked === !!v) return;
    this.#box.checked = !!v;
    this.#apply(true);
  }

  #target() {
    const sel = this.getAttribute('target');
    return (sel && document.querySelector(sel)) || document.documentElement;
  }

  // Set the mode on the target; tell other toggles and listeners if it changed.
  #apply(changed) {
    const target = this.#target();
    target.style.setProperty('--a-term-pronunciation', this.#box.checked ? 'inline' : 'none');
    if (!changed) return;
    document.dispatchEvent(new CustomEvent(SYNC, { detail: { target, checked: this.#box.checked, from: this } }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onSync = e => {
    const { target, checked, from } = e.detail;
    if (from === this || target !== this.#target() || this.#box.checked === checked) return;
    this.#box.checked = checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  #onKey = e => {
    const k = this.#keys;
    if (!k || e.defaultPrevented || e.repeat) return;
    if (e.code !== k.code || e.altKey !== k.alt || e.shiftKey !== k.shift ||
        e.ctrlKey !== k.ctrl || e.metaKey !== k.meta) return;
    const t = e.composedPath()[0];
    if (t?.closest?.('input:not([type=checkbox]), textarea, select, [contenteditable]:not([contenteditable=false])')) return;
    e.preventDefault();   // one key press toggles once, however many toggles share it
    this.checked = !this.checked;
    this.#status.textContent = this.checked
      ? (this.getAttribute('status-on')  ?? 'Pronunciations shown')
      : (this.getAttribute('status-off') ?? 'Pronunciations hidden');
  };

  // "Alt+Shift+1" → { alt, shift, ctrl, meta, code: 'Digit1' }, and the hint.
  #parseShortcut() {
    const spec = (this.getAttribute('shortcut') ?? 'Alt+Shift+1').trim();
    this.#keys = null;
    this.#hint.replaceChildren();
    this.#box.removeAttribute('aria-keyshortcuts');
    if (!spec || spec.toLowerCase() === 'none') return;

    const parts = spec.split('+').map(s => s.trim()).filter(Boolean);
    const key   = parts.pop();
    const mods  = new Set(parts.map(m => m.toLowerCase()));
    const code  = /^\d$/.test(key) ? `Digit${key}` : /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key;
    this.#keys = {
      code,
      alt:   mods.has('alt') || mods.has('option'),
      shift: mods.has('shift'),
      ctrl:  mods.has('ctrl') || mods.has('control'),
      meta:  mods.has('meta') || mods.has('cmd') || mods.has('command'),
    };

    const names = [
      this.#keys.ctrl && 'Ctrl', this.#keys.alt && 'Alt', this.#keys.shift && 'Shift', this.#keys.meta && 'Meta',
    ].filter(Boolean);
    this.#box.setAttribute('aria-keyshortcuts', [...names, key].join('+'));

    const shown = { Alt: IS_APPLE ? 'Option' : 'Alt', Meta: IS_APPLE ? 'Cmd' : 'Meta' };
    [...names.map(n => shown[n] ?? n), key].forEach((label, i) => {
      if (i) this.#hint.append('+');
      const kbd = document.createElement('kbd');
      kbd.setAttribute('part', 'key');
      kbd.textContent = label;
      this.#hint.append(kbd);
    });
  }
}

customElements.define('a-term-toggle', ATermToggle);
