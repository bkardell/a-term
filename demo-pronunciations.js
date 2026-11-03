// Pronunciations for demo.html.
// Entry shape: see a-term.js. Every entry names its recording
// (pronunciation.audio), so the demo plays the same files with or without
// an adapter. Relative URLs resolve against the page.
import { pronunciations } from './a-term.js';

// Exported so the demo can give the same words to the spellchecker.
export const entries = [
  // Irish names
  { word: 'Niamh',      pronunciation: { ipa: 'niːv',      audio: 'audio/ga/niamh-niːv.mp3' } },
  { word: 'Saoirse',    pronunciation: { ipa: 'ˈsɜːrʃə',    audio: 'audio/ga/saoirse-ˈsɜːrʃə.mp3' } },
  { word: 'Cúchulainn', pronunciation: { ipa: 'ˈkuːxəlɪn', audio: 'audio/ga/cúchulainn-ˈkuːxəlɪn.mp3' } },
  { word: 'Tadhg',      pronunciation: { ipa: 'tɪɡ',       audio: 'audio/ga/tadhg-tɪɡ.mp3' } },
  { word: 'Aoife',      pronunciation: { ipa: 'ˈiːfə',     audio: 'audio/ga/aoife-ˈiːfə.mp3' } },

  // Tolkien
  { word: 'Smaug',          pronunciation: { ipa: 'smɔːɡ', audio: 'audio/en/smaug-smɔːɡ.mp3' } },
  { word: 'Gandalf',        pronunciation: { ipa: 'ˈɡændɑːlf', audio: 'audio/en/gandalf-ˈɡændɑːlf.mp3' } },
  { word: 'Bilbo',          pronunciation: { ipa: 'ˈbɪlboʊ', audio: 'audio/en/bilbo-ˈbɪlboʊ.mp3' } },

  // Genesis 1:1 in Hebrew (Modern Hebrew pronunciation). The recordings can
  // be named however you like; these use a simple transliteration.
  { word: 'בְּרֵאשִׁית', pronunciation: { ipa: 'beʁeˈʃit', audio: 'audio/he/bereshit.mp3' } },
  { word: 'בָּרָא', pronunciation: { ipa: 'baˈʁa', audio: 'audio/he/bara.mp3' } },
  { word: 'אֱלֹהִים', pronunciation: { ipa: 'eloˈhim', audio: 'audio/he/elohim.mp3' } },
  { word: 'אֵת', pronunciation: { ipa: 'et', audio: 'audio/he/et.mp3' } },
  { word: 'הַשָּׁמַיִם', pronunciation: { ipa: 'haʃaˈmajim', audio: 'audio/he/hashamayim.mp3' } },
  { word: 'וְאֵת', pronunciation: { ipa: 'veˈʔet', audio: 'audio/he/veet.mp3' } },
  { word: 'הָאָרֶץ', pronunciation: { ipa: 'haˈʔaʁet͡s', audio: 'audio/he/haaretz.mp3' } },

  // Words with more than one accepted pronunciation: one entry each. lang
  // only sets the default; variant="…" on an occurrence picks one
  // explicitly. Variant ids are arbitrary: they say nothing about the sound.
  { word: 'tomato', variant: '1', lang: 'en-US', pronunciation: { ipa: 'təˈmeɪtoʊ', audio: 'audio/en/tomato-təˈmeɪtoʊ.mp3' } },
  { word: 'tomato', variant: '2', lang: 'en-GB', pronunciation: { ipa: 'təˈmɑːtəʊ', audio: 'audio/en/tomato-təˈmɑːtəʊ.mp3' } },
  { word: 'potato', variant: '1', lang: 'en-US', pronunciation: { ipa: 'pəˈteɪtoʊ', audio: 'audio/en/potato-pəˈteɪtoʊ.mp3' } },
  { word: 'potato', variant: '2', lang: 'en-GB', pronunciation: { ipa: 'pəˈtɑːtəʊ', audio: 'audio/en/potato-pəˈtɑːtəʊ.mp3' } },
  { word: 'either', variant: '1', pronunciation: { ipa: 'ˈiːðər', audio: 'audio/en/either-ˈiːðər.mp3' } },
  { word: 'either', variant: '2', pronunciation: { ipa: 'ˈaɪðər', audio: 'audio/en/either-ˈaɪðər.mp3' } },
  { word: 'neither', variant: '1', pronunciation: { ipa: 'ˈniːðər', audio: 'audio/en/neither-ˈniːðər.mp3' } },
  { word: 'neither', variant: '2', pronunciation: { ipa: 'ˈnaɪðər', audio: 'audio/en/neither-ˈnaɪðər.mp3' } },

  // Medical
  { word: 'aorta',            pronunciation: { ipa: 'eɪˈɔːrtə', audio: 'audio/en/aorta-eɪˈɔːrtə.mp3' } },
  { word: 'thrombocytopenia', pronunciation: { ipa: 'ˌθrɒmboʊˌsaɪtəˈpiːniə', audio: 'audio/en/thrombocytopenia-ˌθrɒmboʊˌsaɪtəˈpiːniə.mp3' } },
  { word: 'fibromyalgia',     pronunciation: { ipa: 'ˌfaɪbroʊmaɪˈældʒiə', audio: 'audio/en/fibromyalgia-ˌfaɪbroʊmaɪˈældʒiə.mp3' } },
  { word: 'dysphagia',        pronunciation: { ipa: 'dɪsˈfeɪdʒiə', audio: 'audio/en/dysphagia-dɪsˈfeɪdʒiə.mp3' } },
  { word: 'dysphasia',        pronunciation: { ipa: 'dɪsˈfeɪʒiə', audio: 'audio/en/dysphasia-dɪsˈfeɪʒiə.mp3' } },
  { word: 'haematologist',    pronunciation: { ipa: 'ˌhiːməˈtɒlədʒɪst', audio: 'audio/en/haematologist-ˌhiːməˈtɒlədʒɪst.mp3' } },
];

pronunciations.add(entries);
