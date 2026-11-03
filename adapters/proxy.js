/**
 * a-term adapter: proxy (your own word-tip-audio server)
 *
 * Routes synthesis requests through your own word-tip-audio server, which
 * holds the speech service's credentials, picks the provider and caches each
 * result. (Calling a speech service straight from the page would expose its
 * API key to every visitor, so a-term has no adapter that does that.)
 *
 * Use it to speak terms live, or while authoring: everything it synthesises
 * lands in the server's cache as {lang}/{term}-{ipa}.mp3, ready to publish as
 * static files for adapters/audio.js or to name in pronunciations.
 *
 * Setup:
 *   1. Run the word-tip-audio server (../word-tip-audio, `npm start`).
 *   2. Include this adapter in <head> before a-term.js:
 *
 *      <meta name="a-term-proxy-url" content="https://your-proxy.example.com">
 *      <script type="module" src="adapters/proxy.js"></script>
 *      <script type="module" src="a-term.js"></script>
 *
 *   The meta tag value is the base URL of your proxy — no trailing slash,
 *   no path. The adapter appends /synthesize automatically.
 *
 *   Alternatively, set the URL in JS before loading this script:
 *
 *      <script>window.__aTermProxyUrl = 'https://your-proxy.example.com';</script>
 */

function getUrl() {
  const url =
    window.__aTermProxyUrl ??
    document.querySelector('meta[name="a-term-proxy-url"]')?.content;

  if (!url) throw new Error(
    '[a-term/proxy] No proxy URL found. ' +
    'Add <meta name="a-term-proxy-url" content="https://your-proxy"> ' +
    'or set window.__aTermProxyUrl before loading this script.'
  );

  return url.replace(/\/$/, '') + '/synthesize';
}

async function synthesise({ ssml, lang, term, ipa }) {
  const res = await fetch(getUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // The server builds its own SSML from term/ipa/lang.
    body: JSON.stringify({ term, ipa, lang }),
  });

  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(`[a-term/proxy] ${res.status}: ${msg?.error ?? res.statusText}`);
  }

  return res.arrayBuffer();
}

window.__aTermAdapter = { synthesise, _name: 'proxy' };
