# a-term

`<a-term>` is a custom element for marking terms the page knows something special about (for now, that something is how the word is pronounced).  This is useful for names, invented words and specialist vocabulary.  It is often useful in similar cases as the [spellcheck custom dictionary proposal](https://github.com/Igalia/explainers/blob/main/spell-check-dictionary/README.md) ([whatwg/html#12590](https://github.com/whatwg/html/pull/12590)) which lets a page add its own words to the browser's spellchecker, and so is designed to work collaboratively.  Pronunciation entries use the same `word` shape as that proposal, so the two lists can share words where they overlap.   Generally, all you need to do is add some pronunciations in your script, something like...

```js
import { pronunciations } from './a-term.js';

pronunciations.add([
  { word: 'Niamh', pronunciation: { ipa: 'niːv', audio: 'audio/ga/niamh.mp3' } },
  { word: 'tomato', variant: '1', lang: 'en-US', pronunciation: { ipa: 'təˈmeɪtoʊ' } },
  { word: 'tomato', variant: '2', lang: 'en-GB', pronunciation: { ipa: 'təˈmɑːtəʊ' } },
]);
```

And then in your HTML...

```html
<a-term>Niamh</a-term>
```

By default this does nothing obviously user observable because often this would add a lot of visual and screen reader noise and annoying extra tab stops.  This is controllable by setting `--a-term-pronunciation: inline` which causes it to show the IPA after each term; 

You can add the `<a-term-toggle>` element which gives readers a checkbox and keyboard shortcut for toggling it. When speech is available, the IPA itself is the Pronounce button.

The demo uses, and we recommend, providing the `audio` field in each pronunciation entry and the mp3 yourself as it is consistent, reliable, safe, private and cheaply and efficiently hosted and used.  However, there is a companion project which can be used along with several providers to generate the audio speech for use here.


## Other notes..

### Speech: 
the first that applies of: an `audio-src` MP3 on the occurrence; a recording named in the term's pronunciation entry (`pronunciation: { ipa, audio: 'audio/niamh.mp3' }`); an adapter (`adapters/`: pre-recorded MP3s from a URL template, or live speech from your own server). Safari's built-in speech, which honours SSML `<phoneme>`, can be enabled with `ATerm.safariSpeech = true`; it is off by default because it is unreliable in practice.

### Variants: (optional) 
Rarely, the same word can have several pronunciations which could be valid in the same document. Each can have its own pronunciation entry with a `variant` id. `variant="…"` on an occurrence picks one by id (ids are arbitrary keys, such as `1` and `2`; an unknown id shows no pronunciation and warns in the console), and `ipa="…"` is a one-off override. the demo contains examples.

## Run the demo

The demo loads ES modules, so serve it over HTTP rather than opening the file:

```
python3 -m http.server 8000
open http://localhost:8000/index.html
```

The demo uses `adapters/audio.js`, which plays MP3s from `audio/{lang}/{term}-{ipa}.mp3`, for example `audio/en/smaug-smɔːɡ.mp3` (the term is always lower-cased). If a file is missing, it retries with shorter language tags (`en-GB` → `en`). Without the files, IPA still displays, but Pronounce shows its error state.

## Getting recordings

Recordings are plain MP3 files, so the safest setup has no speech service at request time: name each file in its pronunciation entry (`pronunciation.audio`) or let `adapters/audio.js` find it by template.

To make them, use the sibling [`word-tip-audio`](../word-tip-audio) server. It holds the Azure, Google or Polly credentials, speaks a term from its IPA and caches the MP3 as `{lang}/{term}-{ipa}.mp3`, the same layout `adapters/audio.js` reads. Its `/new` page creates recordings one at a time, and the cache can be published as static files. To speak terms live instead, point `adapters/proxy.js` at the server.

There are deliberately no adapters that call a speech service straight from the page: any API key a page can read, every visitor can read and use.

## Files

- `a-term.js`: the element and the `pronunciations` API
- `a-term-toggle.js`: `<a-term-toggle>`, a "Show pronunciations" checkbox with an Alt+Shift+1 shortcut that sets `--a-term-pronunciation` for the page (or a `target` element)
- `adapters/`: `audio.js`, which plays pre-recorded MP3s from a URL template, and `proxy.js`, which asks your own [`word-tip-audio`](../word-tip-audio) server for speech
- `index.html`, `demo-pronunciations.js`: the demo

## With the spellcheck custom dictionary

The [spellcheck custom dictionary proposal](https://github.com/Igalia/explainers/blob/main/spell-check-dictionary/README.md) ([whatwg/html#12590](https://github.com/whatwg/html/pull/12590)) lets a page add its own words to the browser's spellchecker. The words a reader needs help pronouncing are usually the ones a spellchecker flags, and both lists use the same shape, a `word`, so the simplest thing is to give it the same list:

```js
import { pronunciations } from './a-term.js';

const entries = [
  { word: 'Niamh', pronunciation: { ipa: 'niːv', audio: 'audio/ga/niamh.mp3' } },
  // …
];

pronunciations.add(entries);
// The same words stop being flagged as misspelled.
document.spellCheckCustomDictionary?.addWords(entries.map(e => e.word));
```

They are separate lists, though, and could differ: a page might accept spellings it doesn't pronounce, or pronounce words that are already spelled correctly. Passing those along anyway does no harm.

Pronunciation entries are flat, one per pronunciation. A plain string is also a valid entry, and fields `<a-term>` doesn't know about are kept. The demo's "Spellcheck" section shows this with a live text box.
