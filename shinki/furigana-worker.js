// furigana-worker.js
// Kuromojiの辞書ロード・解析をメインスレッドから分離するWorker
importScripts('https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js');

const DIC_PATH = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';
let tokenizer = null;

function katakanaToHiragana(text) {
    return String(text || '').replace(/[\u30A1-\u30F6]/g,
        ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

const LETTER_READING = {
    A:'えー', B:'びー', C:'しー', D:'でぃー', E:'いー', F:'えふ',
    G:'じー', H:'えいち', I:'あい', J:'じぇい', K:'けー', L:'える',
    M:'えむ', N:'えぬ', O:'おー', P:'ぴー', Q:'きゅー', R:'あーる',
    S:'えす', T:'てぃー', U:'ゆー', V:'ぶい', W:'だぶりゅー',
    X:'えっくす', Y:'わい', Z:'ぜっと'
};

const DIGIT_READING = {
    '0':'ぜろ','1':'いち','2':'に','3':'さん','4':'よん',
    '5':'ご','6':'ろく','7':'なな','8':'はち','9':'きゅう'
};

function fourDigits(n) {
    const small = ['', 'いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
    let r = '';
    const d4 = Math.floor(n / 1000) % 10;
    const d3 = Math.floor(n / 100) % 10;
    const d2 = Math.floor(n / 10) % 10;
    const d1 = n % 10;

    if (d4) r += d4 === 3 ? 'さんぜん' : d4 === 8 ? 'はっせん' : (d4 === 1 ? 'せん' : small[d4] + 'せん');
    if (d3) r += d3 === 3 ? 'さんびゃく' : d3 === 6 ? 'ろっぴゃく' : d3 === 8 ? 'はっぴゃく' : (d3 === 1 ? 'ひゃく' : small[d3] + 'ひゃく');
    if (d2) r += d2 === 1 ? 'じゅう' : small[d2] + 'じゅう';
    if (d1) r += small[d1];
    return r;
}

function numberToReading(s) {
    if (!/^\d+$/.test(s)) return '';
    if (s.length > 12) return [...s].map(d => DIGIT_READING[d]).join('');

    s = s.replace(/^0+(?=\d)/, '');
    if (s === '0') return 'ぜろ';

    let n = Number(s);
    const oku = Math.floor(n / 100000000);
    n %= 100000000;
    const man = Math.floor(n / 10000);
    const rest = n % 10000;

    let r = '';
    if (oku) r += fourDigits(oku) + 'おく';
    if (man) r += fourDigits(man) + 'まん';
    if (rest) r += fourDigits(rest);
    return r || 'ぜろ';
}

function asciiReading(s) {
    if (/^\d+$/.test(s)) return numberToReading(s);
    return s.toUpperCase().split('').map(c => LETTER_READING[c] || c).join('');
}

function convert(text) {
    const chunks = text.match(/[A-Za-z0-9]+|[^A-Za-z0-9]+/g) || [];
    let result = '';

    for (const chunk of chunks) {
        if (/^[A-Za-z0-9]+$/.test(chunk)) {
            result += asciiReading(chunk);
        } else {
            const tokens = tokenizer.tokenize(chunk);
            for (const token of tokens) {
                result += katakanaToHiragana(token.reading || token.surface_form || '');
            }
        }
    }
    return result;
}

postMessage({ type: 'starting' });

kuromoji.builder({ dicPath: DIC_PATH }).build((err, built) => {
    if (err) {
        postMessage({ type: 'error', message: String(err && err.message ? err.message : err) });
        return;
    }
    tokenizer = built;
    postMessage({ type: 'ready' });
});

self.onmessage = event => {
    const data = event.data || {};
    if (data.type !== 'convert') return;

    try {
        if (!tokenizer) {
            postMessage({ type: 'error', id: data.id, message: '辞書の準備がまだ完了していません。' });
            return;
        }
        postMessage({
            type: 'result',
            id: data.id,
            reading: convert(String(data.text || ''))
        });
    } catch (e) {
        postMessage({
            type: 'error',
            id: data.id,
            message: String(e && e.message ? e.message : e)
        });
    }
};
