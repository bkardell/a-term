/**
 * a-term adapter: audio (pre-recorded MP3 files)
 *
 * Plays an MP3 from a URL you choose instead of synthesising speech. The URL is
 * built for each pronunciation from a template, so a folder of recordings works
 * without adding an audio-src attribute to every <a-term>.
 *
 * Setup:
 *   Include this adapter in <head> before a-term.js:
 *
 *      <meta name="a-term-audio-url" content="audio/{lang}/{term}-{ipa}.mp3">
 *      <script type="module" src="adapters/audio.js"></script>
 *      <script type="module" src="a-term.js"></script>
 *
 *   Placeholders, each URL-encoded when substituted:
 *     {term}  the term, lower-cased, e.g. "Lonely Mountain" → lonely%20mountain
 *     {lang}  the element's resolved language, e.g. en-GB
 *     {ipa}   the resolved IPA, e.g. smɔːɡ → sm%C9%94%CB%90%C9%A1
 *
 *   So with the template above, Smaug in an en-GB page is looked up as
 *   audio/en-GB/smaug-smɔːɡ.mp3 on disk. The term is always lower-cased
 *   (also for a function template), so "Tomato" at the start of a sentence
 *   and "tomato" mid-sentence share one file, as they share a pronunciation entry.
 *
 *   Alternatively, set the template, or a function that returns the URL, in
 *   JS before loading this script:
 *
 *      <script>window.__aTermAudioUrl = 'audio/{lang}/{term}-{ipa}.mp3';</script>
 *      <script>window.__aTermAudioUrl = ({ term, lang, ipa }) => `…`;</script>
 *
 * Why term, lang and ipa:
 *   The IPA tells two variants of one term apart (tomato təˈmeɪtoʊ / təˈmɑːtəʊ).
 *   The language is needed too, because the same IPA string is not always the
 *   same sound in two languages: /t/, /r/ and /e/ differ between English,
 *   French and Spanish. The term is there so a person can find the file.
 *
 * Language fallback:
 *   If a file is not found (404, or 403 as some static hosts send for missing
 *   files), the adapter retries with progressively shorter language tags, the
 *   same way pronunciations match variants: en-GB-oxendict → en-GB → en.
 *   So one audio/en/ folder can serve every English page, with regional
 *   folders only where a recording differs. When nothing is found, the
 *   Pronounce button shows its error state.
 *
 * An audio-src attribute on an element still takes precedence over this adapter.
 */

function getTemplate() {
  const tpl =
    window.__aTermAudioUrl ??
    document.querySelector('meta[name="a-term-audio-url"]')?.content;

  if (!tpl) throw new Error(
    '[a-term/audio] No URL template found. ' +
    'Add <meta name="a-term-audio-url" content="audio/{lang}/{term}-{ipa}.mp3"> ' +
    'or set window.__aTermAudioUrl before loading this script.'
  );
  return tpl;
}

function buildUrl(tpl, values) {
  if (typeof tpl === 'function') return tpl(values);
  return tpl.replace(/\{(term|lang|ipa)\}/g, (_, k) => encodeURIComponent(values[k] ?? ''));
}

// en-GB-oxendict → ['en-GB-oxendict', 'en-GB', 'en']
function langChain(lang) {
  const chain = [];
  for (let tag = lang || ''; tag; tag = tag.includes('-') ? tag.slice(0, tag.lastIndexOf('-')) : '') {
    chain.push(tag);
  }
  return chain.length ? chain : [''];
}

// synthesise() — returns an ArrayBuffer of MP3 bytes.
// a-term.js owns playback and caching; the adapter only fetches.
async function synthesise({ term, lang, ipa }) {
  const tpl = getTemplate();
  term = String(term).normalize('NFC').toLowerCase();
  const tried = [];
  let last;

  for (const tag of langChain(lang)) {
    const url = buildUrl(tpl, { term, lang: tag, ipa });
    if (tried.includes(url)) continue;   // template doesn't use {lang}
    tried.push(url);

    last = await fetch(url);
    if (last.ok) return last.arrayBuffer();
    if (last.status !== 404 && last.status !== 403) break;   // a real error: don't keep trying
  }

  throw new Error(
    `[a-term/audio] ${last.status} ${last.statusText}: tried ${tried.join(', ')}`
  );
}

window.__aTermAdapter = { synthesise, _name: 'audio' };
