/**
 * <a-term> — terms the page knows about
 *
 * Marks a term (a name, an invented word, a specialist word) whose
 * pronunciation the page provides, in a page-level list of pronunciations.
 * The list is separate from any other word list a page keeps, such as the
 * spellcheck custom dictionary: the two often overlap but needn't match.
 *
 * By default a term renders as plain text: no underline, no tab stop,
 * nothing to hover. Readers (or authors) opt in to seeing pronunciations with
 * a CSS custom property, which shows the IPA inline after the term. When
 * speech is available the IPA itself is the Pronounce button.
 *
 * ── Usage ────────────────────────────────────────────────────────────────
 *
 *   <script type="module">
 *     import { pronunciations } from './a-term.js';
 *     pronunciations.add([
 *       { word: 'Niamh', pronunciation: { ipa: 'niːv', audio: 'audio/niamh.mp3' } },
 *       { word: 'tomato', variant: '1', lang: 'en-US', pronunciation: { ipa: 'təˈmeɪtoʊ' } },
 *       { word: 'tomato', variant: '2', lang: 'en-GB', pronunciation: { ipa: 'təˈmɑːtəʊ' } },
 *     ]);
 *   </script>
 *
 *   <a-term lang="ga">Niamh</a-term>          ← looked up in pronunciations
 *   <a-term variant="2">tomato</a-term>       ← a specific variant, by id
 *   <a-term ipa="tɪɡ">Tadhg</a-term>          ← one-off pronunciation override
 *
 * ── Attributes ───────────────────────────────────────────────────────────
 *
 *   variant     picks a pronunciation variant by id. Ids are arbitrary keys
 *               chosen by the author; they say nothing about the sound.
 *   ipa         one-off pronunciation, bypassing the pronunciations list
 *   audio-src   a pre-made MP3 for this occurrence
 *   lang        inherited as usual; picks the default variant and the voice
 *
 * ── Properties ───────────────────────────────────────────────────────────
 *
 *   pronunciation   read-only: what this occurrence resolved to,
 *                   { term, lang, ipa, audio?, variant? } (ipa '' if none)
 *
 * ── Pronunciations API ───────────────────────────────────────────────────
 *
 *   One entry per pronunciation; a word with several pronunciations has
 *   several entries. The shape follows the spellcheck custom dictionary
 *   proposal (whatwg/html#12590), where a word is a plain string, so an entry
 *   can be just a string, and unknown fields are kept as they are.
 *
 *   entry: 'word'
 *        | { word, variant?, lang?, pronunciation?: { ipa?, audio? } }
 *          variant  an id for markup's variant="…"; arbitrary, says nothing
 *                   about the sound. Numbers are fine (compared as text).
 *          lang     the language this pronunciation belongs to; picks the
 *                   default among a word's entries.
 *          ipa: '…' directly on the entry is shorthand for
 *          pronunciation: { ipa: '…' }.
 *          audio is the URL of a recording (MP3) of this pronunciation.
 *          A pronunciation needs at least one of the two; with audio but no
 *          IPA, the button shows a speaker icon instead. Relative URLs
 *          resolve against the page, not the file that adds them; use
 *          new URL('…', import.meta.url) for the latter.
 *
 *   pronunciations.add(entry | entry[])
 *       An entry with the same word, variant and lang replaces the existing
 *       one; anything else is added alongside it.
 *   pronunciations.remove(word | { word, variant?, lang? } | […])
 *       A string removes every entry for that word.
 *
 *   That's all, mirroring the spellcheck custom dictionary's addWords and
 *   removeWords: there is no way to read the list back. To see what a term
 *   resolved to, ask the element: el.pronunciation.
 *
 *   Words are matched exactly (NFC-normalised), then case-insensitively.
 *   No morphology: "Smaug's" is a different word from "Smaug".
 *   Connected <a-term> elements update when the pronunciations change.
 *
 *   The spellcheck custom dictionary is a separate list, and could differ,
 *   but usually the simplest thing is to give it the same words, from the
 *   same source:
 *
 *     pronunciations.add(entries);
 *     document.spellCheckCustomDictionary?.addWords(entries.map(e => e.word));
 *
 * ── Resolving a variant ──────────────────────────────────────────────────
 *
 *   1. ipa attribute, if present (skips the pronunciations list).
 *   2. variant attribute → the entry with that variant id.
 *   3. The word's entries matched against the element's language
 *      (nearest [lang], BCP-47 fallback: en-GB → en).
 *   4. An entry with no lang, else the first entry added.
 *
 *   An unknown variant id does NOT fall back to the default: guessing would
 *   be wrong exactly where variants matter ("you say tomato, I say tomato").
 *   The element resolves to nothing instead, like a term with no entry: see
 *   "Unresolved" below.
 *
 *   Everything resolves to concrete IPA before reaching a speech engine;
 *   variant ids are never sent to one.
 *
 * ── Showing pronunciations ───────────────────────────────────────────────
 *
 *   --a-term-pronunciation: none | inline     (inherited; default none)
 *
 *   It cascades, so it can be set per page, per section, or tied to a
 *   reader-facing control: <a-term-toggle> (a-term-toggle.js), or with no
 *   script at all:
 *
 *     :root:has(#show-pronunciations:checked) { --a-term-pronunciation: inline; }
 *
 *   Implemented with a container style query inside the shadow DOM, so there
 *   is nothing to observe from JS. With "none" the IPA button is
 *   display:none and therefore not in the tab order.
 *
 * ── Speech ───────────────────────────────────────────────────────────────
 *
 *   The IPA is rendered as a Pronounce button when it can be spoken; with a
 *   recording but no IPA, the button is a speaker icon. The first of these
 *   that applies is used:
 *     1. an audio-src attribute on the occurrence (pre-made MP3),
 *     2. pronunciation.audio on the matching entry (pre-made MP3),
 *     3. an adapter (window.__aTermAdapter, see adapters/), or
 *     4. Safari's speechSynthesis, which accepts SSML <phoneme> — only if
 *        enabled with ATerm.safariSpeech = true. Off by default: in practice
 *        it is too unreliable to offer as a Pronounce button.
 *   3 and 4 work from the IPA, so they need it; 1 and 2 don't.
 *   An ipa attribute replaces the entry's pronunciation, including its
 *   audio. Adapter scripts must load before this module.
 *
 *   Adapters expose synthesise({ ssml, lang, term, ipa }): Promise<ArrayBuffer>
 *   (MP3). Adapters may use the SSML or the plain fields.
 *   Audio is cached per page, keyed on the recording's URL, or "ipa|lang"
 *   for adapters.
 *
 * ── Events ───────────────────────────────────────────────────────────────
 *
 *   a-term-ssml — fires on every Pronounce click; bubbles, composed.
 *     detail: { ssml, ipa, term, lang, variant }
 *
 * ── Styling ──────────────────────────────────────────────────────────────
 *
 *   The ipa/button parts only render when --a-term-pronunciation is inline.
 *
 *   ::part(term)    the term itself
 *   ::part(ipa)     the IPA (plain text, or the Pronounce button)
 *   ::part(button)  the IPA when it is the Pronounce button
 *
 *   --a-term-ipa-color        default #6b7280 (text) / #4b5563 (button)
 *   --a-term-ipa-color-hover  default #111827
 *   --a-term-ipa-bg           default #f3f4f6 (button only)
 *   --a-term-ipa-bg-hover     default #e5e7eb (button only)
 *
 * ── Unresolved ───────────────────────────────────────────────────────────
 *
 *   When an element resolves to no pronunciation (no IPA and no recording:
 *   no entry, an entry without either, or an unknown variant id),
 *   readers see the term as
 *   plain text, with no IPA and no button, in every mode. For authors:
 *
 *   :state(unresolved)   matches the element, e.g. in an authoring stylesheet:
 *                          a-term:state(unresolved) { outline: 2px dashed red; }
 *   console warning      for an unknown variant id, listing the ids that exist
 *                        (once per term and id)
 */

// ── Pronunciations ──────────────────────────────────────────────────────────
//
// One entry per pronunciation: { word, variant?, lang?, pronunciation?, … }.
// A word with several pronunciations simply has several entries. The shape
// follows the spellcheck custom dictionary proposal, where a word is a
// string (addWords(["Igalia"])): a plain string is a valid entry here too,
// and fields this module doesn't know about are kept as they are.

const entries = new Map();   // NFC word → entry[] (in the order added)
const folded  = new Map();   // lower-cased NFC word → entry[]
const listeners = new Set(); // refresh callbacks of connected elements

const norm = t => String(t).normalize('NFC').trim();
const optStr = v => (v == null || v === '' ? undefined : String(v));

function reindex() {
  folded.clear();
  for (const [word, list] of entries) {
    const k = word.toLowerCase();
    if (!folded.has(k)) folded.set(k, list);
  }
  for (const fn of listeners) fn();
}

// Normalise an entry: word NFC, variant as a string, and the ipa shorthand
// folded into pronunciation. Unknown fields are kept.
function toEntry(e) {
  if (typeof e === 'string') e = { word: e };
  if (!e || e.word == null || !norm(e.word)) {
    throw new TypeError('<a-term> pronunciation entries need a "word"');
  }
  const { word, variant, lang, ipa, pronunciation, ...rest } = e;
  const p = pronunciation ?? (ipa ? { ipa } : undefined);
  return {
    ...rest,
    word: norm(word),
    variant: optStr(variant),
    lang: optStr(lang),
    pronunciation: p?.ipa || p?.audio
      ? { ...p, ipa: p.ipa ? norm(p.ipa) : undefined }
      : undefined,
  };
}

// Two entries are the same if word, variant and lang all match.
const sameSlot = (a, b) =>
  a.variant === b.variant && (a.lang ?? '').toLowerCase() === (b.lang ?? '').toLowerCase();

function listFor(word) {
  const key = norm(word);
  return entries.get(key) ?? folded.get(key.toLowerCase());
}

function matchLang(list, lang) {
  const want = (lang || '').toLowerCase();
  // Exact tag, then progressively shorter (en-GB-oxendict → en-GB → en).
  for (let tag = want; tag; tag = tag.includes('-') ? tag.slice(0, tag.lastIndexOf('-')) : '') {
    const hit = list.find(r => r.lang?.toLowerCase() === tag);
    if (hit) return hit;
  }
  // Element is less specific than the entry (en vs en-US): first match.
  if (want) {
    const hit = list.find(r => r.lang?.toLowerCase().startsWith(want + '-'));
    if (hit) return hit;
  }
  return null;
}

export const pronunciations = {
  /** Add entries. An entry with the same word, variant and lang replaces
   *  the existing one; anything else is added alongside. */
  add(items) {
    for (const item of [].concat(items)) {
      const e = toEntry(item);
      const list = entries.get(e.word) ?? [];
      const i = list.findIndex(x => sameSlot(x, e));
      if (i >= 0) list[i] = e; else list.push(e);
      entries.set(e.word, list);
    }
    reindex();
  },
  /** Remove words (every entry for them), or single entries:
   *  remove({ word, variant?, lang? }). */
  remove(items) {
    for (const item of [].concat(items)) {
      if (typeof item === 'string') { entries.delete(norm(item)); continue; }
      const word = norm(item.word), variant = optStr(item.variant), lang = optStr(item.lang);
      const left = (entries.get(word) ?? []).filter(x =>
        !((variant === undefined || x.variant === variant) &&
          (lang === undefined || (x.lang ?? '').toLowerCase() === lang.toLowerCase())));
      if (left.length) entries.set(word, left); else entries.delete(word);
    }
    reindex();
  },
};

// Like the spellcheck custom dictionary (addWords/removeWords), the public
// API is add and remove only. Reading back is internal: a page that wants to
// know what a term resolved to can ask the element (el.pronunciation).

/** The variant ids defined for a word (empty if none). */
function variantIds(word) {
  return [...new Set((listFor(word) ?? []).map(r => r.variant).filter(v => v != null))];
}

function lookup(word, { lang, variant } = {}) {
  const list = listFor(word);
  if (!list?.length) return null;
  if (variant != null) return list.find(r => r.variant === String(variant)) ?? null;
  return matchLang(list, lang) ?? list.find(r => !r.lang) ?? list[0];
}

// ── Speech availability ───────────────────────────────────────────────────

const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Safari's speechSynthesis accepts SSML <phoneme>, but in practice it is too
// unreliable to offer as a Pronounce button, so it is opt-in:
// ATerm.safariSpeech = true.
let safariSpeech = false;

// Can something speak from IPA alone (no recording)?
function hasEngine() {
  return !!window.__aTermAdapter ||
    (safariSpeech && IS_SAFARI && typeof speechSynthesis !== 'undefined');
}

const audioCache = new Map();
const warned = new Set();   // "term|variant" already reported

// ── Template ──────────────────────────────────────────────────────────────

// Button content for a pronunciation that has a recording but no IPA.
const SPEAKER_ICON =
  '<svg viewBox="0 0 16 16" width="1.1em" height="1.1em" aria-hidden="true" focusable="false">' +
  '<path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor"/>' +
  '<path d="M11.2 5.6a3.4 3.4 0 0 1 0 4.8M12.9 3.9a5.8 5.8 0 0 1 0 8.2" fill="none" ' +
  'stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
// A term and its pronunciation never wrap apart: the host is nowrap (a
// line break next to the button would otherwise be allowed whatever
// precedes it), and the space before the IPA is a no-break space for good
// measure. Lines still break freely before and after an <a-term>.

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `<style>
  :host { display: inline; white-space: nowrap; }

  #extra { display: none; }

  /* Style query against the host's inherited custom property. */
  @container style(--a-term-pronunciation: inline) {
    #extra { display: inline; }
    #extra.unresolved { display: none; }
  }

  /* IPA always reads left to right. dir="ltr" on these elements also
     isolates them, so on a right-to-left page the slashes stay on the
     correct side and the IPA doesn't reorder the surrounding text. */
  #ipa-text, #speak-btn {
    unicode-bidi: isolate;
    font-family: 'Charis SIL', 'Doulos SIL', 'Noto Sans', 'Lucida Sans Unicode', 'DejaVu Sans', sans-serif;
    font-size: .85em;
    letter-spacing: .02em;
    color: var(--a-term-ipa-color, #6b7280);
    white-space: nowrap;
  }

  /* When speech is available the IPA itself is the Pronounce button. */
  #speak-btn {
    all: unset;
    font-family: 'Charis SIL', 'Doulos SIL', 'Noto Sans', 'Lucida Sans Unicode', 'DejaVu Sans', sans-serif;
    font-size: .85em;
    letter-spacing: .02em;
    white-space: nowrap;
    color: var(--a-term-ipa-color, #4b5563);
    background: var(--a-term-ipa-bg, #f3f4f6);
    border-radius: .4em;
    padding: .05em .4em;
    cursor: pointer;
    transition: background .15s, color .15s;
  }
  #speak-btn:hover,
  #speak-btn:focus-visible {
    background: var(--a-term-ipa-bg-hover, #e5e7eb);
    color: var(--a-term-ipa-color-hover, #111827);
  }
  #speak-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  #speak-btn.speaking { animation: pulse .9s ease-in-out infinite alternate; }
  #speak-btn.error { color: #b91c1c; background: #fee2e2; }
  #speak-btn.icon svg { display: inline-block; vertical-align: -0.2em; }
  [hidden] { display: none !important; }

  @keyframes pulse {
    from { box-shadow: 0 0 0 0   rgba(55,65,81,.35); }
    to   { box-shadow: 0 0 0 4px rgba(55,65,81,0);   }
  }
  @media (prefers-reduced-motion: reduce) {
    #speak-btn, #speak-btn.speaking { animation: none; transition: none; }
  }
</style><span id="term" part="term"><slot></slot></span><span id="extra">\u00a0<span id="ipa-text" part="ipa" translate="no" dir="ltr" aria-hidden="true"></span><button id="speak-btn" part="ipa button" type="button" translate="no" dir="ltr"></button></span>`;

// ── Element ────────────────────────────────────────────────────────────────

export class ATerm extends HTMLElement {
  static observedAttributes = ['ipa', 'variant', 'lang', 'audio-src'];
  static pronunciations = pronunciations;

  /** Use Safari's built-in speech when nothing else can play. Default false. */
  static get safariSpeech() { return safariSpeech; }
  static set safariSpeech(on) {
    safariSpeech = !!on;
    for (const fn of listeners) fn();   // connected terms update their buttons
  }

  #extra; #ipaText; #speakBtn; #internals;
  #resolved = { term: '', lang: '', ipa: '' };
  #refresh = () => this.#update();

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(TEMPLATE.content.cloneNode(true));
    this.#extra    = root.getElementById('extra');
    this.#ipaText  = root.getElementById('ipa-text');
    this.#speakBtn = root.getElementById('speak-btn');
    this.#speakBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.#speak();
    });
  }

  connectedCallback() {
    listeners.add(this.#refresh);
    this.#update();
  }

  disconnectedCallback() {
    listeners.delete(this.#refresh);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#update();
  }

  /** The pronunciation this element currently resolves to. */
  get pronunciation() { return { ...this.#resolved }; }

  #resolve() {
    const term = this.textContent.trim();
    const lang = this.closest('[lang]')?.getAttribute('lang') || 'en';
    const ipa  = this.getAttribute('ipa');
    if (ipa) return { term, lang, ipa: norm(ipa) };

    const variant = this.getAttribute('variant') || undefined;
    const hit = lookup(term, { lang, variant });

    // Unknown variant of a term that HAS pronunciations: an authoring
    // mistake. (A term with no entry at all isn't reported, because the
    // pronunciations may simply not have loaded yet.)
    if (!hit && variant) {
      const ids = variantIds(term);
      const key = `${norm(term).toLowerCase()}|${variant}`;
      if (ids.length && !warned.has(key)) {
        warned.add(key);
        console.warn(`<a-term>: "${term}" has no variant "${variant}" ` +
          `(it has ${ids.map(id => `"${id}"`).join(', ')}); showing no pronunciation.`, this);
      }
    }
    return {
      term, lang,
      ipa: hit?.pronunciation?.ipa ?? '',
      audio: hit?.pronunciation?.audio,
      variant: hit?.variant,
    };
  }

  #update() {
    this.#resolved = this.#resolve();
    const { term, ipa, audio } = this.#resolved;
    const shown     = ipa ? `/${ipa}/` : '';
    const recording = this.hasAttribute('audio-src') || !!audio;
    // A recording plays without IPA; an adapter or Safari needs IPA to speak.
    const canPlay   = recording || (!!ipa && hasEngine());
    const resolved  = !!ipa || recording;
    this.#extra.classList.toggle('unresolved', !resolved);
    try {
      if (resolved) this.#internals.states.delete('unresolved');
      else          this.#internals.states.add('unresolved');
    } catch { /* CustomStateSet unsupported: the state is just unavailable */ }

    // Speech available: the IPA is a button named "Pronounce <term>".
    // Otherwise: the IPA is plain text.
    // Screen readers never read the IPA itself: read aloud it is a string of
    // symbol names ("slash, s, m, open o…"), not information. The button's
    // name replaces it, and plain-text IPA is aria-hidden in the template.
    // With a recording but no IPA, the button is a speaker icon.
    this.#ipaText.textContent  = canPlay ? '' : shown;
    this.#ipaText.hidden       = canPlay;
    if (canPlay && !ipa) this.#speakBtn.innerHTML = SPEAKER_ICON;
    else                 this.#speakBtn.textContent = canPlay ? shown : '';
    this.#speakBtn.classList.toggle('icon', canPlay && !ipa);
    this.#speakBtn.hidden      = !canPlay;
    this.#speakBtn.setAttribute('aria-label', `Pronounce ${term}`);
  }

  async #speak() {
    const { term, lang, ipa, variant, audio } = this.#resolved;
    const src = this.getAttribute('audio-src') || audio;
    const cacheKey = src || `${ipa}|${lang}`;

    const body = ipa
      ? `<phoneme alphabet="ipa" ph="${xml(ipa)}">${xml(term)}</phoneme>`
      : xml(term);
    const ssml =
      `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xml(lang)}">` +
      `\n  <p>${body}</p>` +
      `\n</speak>`;

    this.dispatchEvent(new CustomEvent('a-term-ssml', {
      bubbles: true, composed: true,
      detail: { ssml, ipa, term, lang, variant },
    }));

    this.#speakBtn.classList.remove('error');
    this.#speakBtn.classList.add('speaking');

    try {
      if (src || window.__aTermAdapter) {
        if (!audioCache.has(cacheKey)) {
          audioCache.set(cacheKey, src
            ? await fetchAudio(src)
            : await window.__aTermAdapter.synthesise({ ssml, lang, term, ipa }));
        }
        await playArrayBuffer(audioCache.get(cacheKey));
      } else {
        // Safari (only when ATerm.safariSpeech is on): SSML <phoneme>
        // honoured natively; nothing to cache.
        await new Promise((resolve, reject) => {
          speechSynthesis.cancel();
          const u   = new SpeechSynthesisUtterance(ssml);
          u.lang    = lang;
          u.rate    = 0.82;
          u.onend   = resolve;
          u.onerror = ev => reject(new Error(ev.error));
          speechSynthesis.speak(u);
        });
      }
    } catch (err) {
      console.warn('<a-term>:', err.message);
      this.#speakBtn.classList.add('error');
    } finally {
      this.#speakBtn.classList.remove('speaking');
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function xml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

async function fetchAudio(src) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status} ${res.statusText}`);
  return res.arrayBuffer();
}

// Slice before wrapping so the cached buffer can be replayed.
function playArrayBuffer(buffer) {
  const blob = new Blob([buffer.slice(0)], { type: 'audio/mpeg' });
  const url  = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Playback failed')); };
    audio.play().catch(reject);
  });
}

customElements.define('a-term', ATerm);
