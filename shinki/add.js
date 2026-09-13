const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const FURIGANA_API = 'https://shirabe.dev/api/v1/text/furigana';
const API_INTERVAL_MS = 1100; // Shirabe Free は 1 req/s

// カタカナ → ひらがな
function katakanaToHiragana(src) {
    return String(src || '').replace(/[\u30a1-\u30f6]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
}

// 英字を「文字の日本語読み」にするフォールバック。
// APIが英字をそのまま返した場合でも、最終結果を必ずひらがなにする。
const LETTER_READING = {
    A:'えー', B:'びー', C:'しー', D:'でぃー', E:'いー', F:'えふ',
    G:'じー', H:'えいち', I:'あい', J:'じぇい', K:'けー', L:'える',
    M:'えむ', N:'えぬ', O:'おー', P:'ぴー', Q:'きゅー', R:'あーる',
    S:'えす', T:'てぃー', U:'ゆー', V:'ぶい', W:'だぶりゅー', X:'えっくす',
    Y:'わい', Z:'ぜっと'
};

function spellAsciiLetters(text) {
    return String(text).replace(/[A-Za-z]+/g, word =>
        [...word.toUpperCase()].map(ch => LETTER_READING[ch] || ch).join('')
    );
}

// 整数の日本語読み（0〜999999999999程度）
const DIGIT = ['ぜろ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
const SMALL_UNIT = ['', 'じゅう', 'ひゃく', 'せん'];
const LARGE_UNIT = ['', 'まん', 'おく', 'ちょう'];

function readFourDigits(n) {
    if (n === 0) return '';
    let out = '';
    const s = String(n).padStart(4, '0');
    for (let i = 0; i < 4; i++) {
        const d = Number(s[i]);
        if (!d) continue;
        const pos = 3 - i;
        if (d === 1 && pos > 0) {
            out += SMALL_UNIT[pos];
        } else {
            out += DIGIT[d] + SMALL_UNIT[pos];
        }
    }
    return out;
}

function numberToJapanese(n) {
    n = Number(n);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return String(n).split('').map(ch => DIGIT[Number(ch)] ?? ch).join('');
    }
    if (n === 0) return 'ぜろ';

    let out = '';
    let groupIndex = 0;
    while (n > 0) {
        const group = n % 10000;
        if (group) {
            out = readFourDigits(group) + LARGE_UNIT[groupIndex] + out;
        }
        n = Math.floor(n / 10000);
        groupIndex++;
    }
    return out;
}

// 連続する数字を日本語読みへ。
// 例: 366 → さんびゃくろくじゅうろく
function spellNumbers(text) {
    return String(text).replace(/\d+/g, m => {
        if (m.length > 12) {
            return [...m].map(ch => DIGIT[Number(ch)]).join('');
        }
        return numberToJapanese(m);
    });
}

function normalizeReading(text) {
    let s = katakanaToHiragana(text || '');

    // APIが英字・数字をそのまま返した場合の最終処理
    s = spellNumbers(s);
    s = spellAsciiLetters(s);

    // ひらがな・記号以外に残ったカタカナも念のため変換
    s = katakanaToHiragana(s);
    return s;
}

// APIを1回呼んで、artist｜title の2部分をまとめて取得。
// 1曲につき1リクエストなので、Freeの1 req/s制限にも対応しやすい。
async function fetchReadingPair(artist, title) {
    const separator = '｜';
    const response = await fetch(FURIGANA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${artist}${separator}${title}` })
    });

    if (!response.ok) {
        let detail = '';
        try {
            const err = await response.json();
            detail = err?.error?.message ? `: ${err.error.message}` : '';
        } catch (_) {}
        throw new Error(`読みAPIエラー (${response.status})${detail}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.tokens)) {
        throw new Error('読みAPIの応答形式が不正です。');
    }

    // separator を境界として、tokenごとのreadingを結合
    let left = '';
    let right = '';
    let seenSeparator = false;

    for (const token of data.tokens) {
        const surface = token.surface ?? '';
        const reading = token.reading ?? surface;

        if (!seenSeparator && surface === separator) {
            seenSeparator = true;
            continue;
        }

        if (seenSeparator) {
            right += reading;
        } else {
            left += reading;
        }
    }

    // APIが区切り記号を独立tokenにしなかった場合の保険
    if (!seenSeparator) {
        const reconstructed = data.tokens
            .map(t => t.surface ?? '')
            .join('');
        const idx = reconstructed.indexOf(separator);

        if (idx >= 0) {
            let leftReading = '';
            let rightReading = '';
            let pos = 0;
            for (const token of data.tokens) {
                const surface = token.surface ?? '';
                const reading = token.reading ?? surface;
                const end = pos + surface.length;

                if (end <= idx) {
                    leftReading += reading;
                } else if (pos >= idx + separator.length) {
                    rightReading += reading;
                }
                pos = end;
            }
            left = leftReading;
            right = rightReading;
        }
    }

    return {
        artist: normalizeReading(left),
        title: normalizeReading(right)
    };
}

// APIに失敗した場合のローカル最低限フォールバック。
// 漢字の読みは取得できないが、英字・数字・カタカナはひらがな化する。
function localFallback(text) {
    return normalizeReading(text);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// HTML属性へ安全に入れるためのエスケープ
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// 入力1行を artist/title に分割
function parseLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // まずタブ、半角/全角カンマ
    let parts = trimmed.split(/[\t,，]/);
    if (parts.length >= 2) {
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(',').trim()
        };
    }

    // 全角スペース、2つ以上の半角スペース
    const wsParts = trimmed.split(/(?:　+|\s{2,})/);
    if (wsParts.length >= 2) {
        return {
            artist: wsParts[0].trim(),
            title: wsParts.slice(1).join(' ').trim()
        };
    }

    // 最後の保険：最初の半角スペースで分割
    const firstSpace = trimmed.search(/\s/);
    if (firstSpace >= 0) {
        return {
            artist: trimmed.slice(0, firstSpace).trim(),
            title: trimmed.slice(firstSpace + 1).trim()
        };
    }

    return { artist: trimmed, title: '' };
}

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('id');

    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
        alert('URLに配信者ID (?id=1 など) が付いていません。');
    }
});

document.getElementById('parse-btn').addEventListener('click', async () => {
    const textInput = document.getElementById('csv-input').value.trim();
    if (!textInput) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    const lines = textInput.split(/\r?\n/);
    const items = lines.map(parseLine).filter(item => item && (item.artist || item.title));

    if (!items.length) {
        alert('解析できる曲がありません。');
        return;
    }

    const previewBody = document.getElementById('preview-body');
    const message = document.getElementById('message');
    previewBody.innerHTML = '';
    document.getElementById('step-2').style.display = 'block';

    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
        const { artist, title } = items[i];

        message.style.color = '';
        message.textContent = `読みを生成中… ${i + 1} / ${items.length}`;

        let artistInitial = localFallback(artist);
        let titleInitial = localFallback(title);

        try {
            const reading = await fetchReadingPair(artist, title);
            artistInitial = reading.artist || artistInitial;
            titleInitial = reading.title || titleInitial;
        } catch (error) {
            console.warn(`読み生成失敗 (${artist} / ${title}):`, error);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:6px;"><input type="text" class="row-artist" value="${escapeHtml(artist)}" style="width:90%;"></td>
            <td style="padding:6px;"><input type="text" class="row-artist-initial" value="${escapeHtml(artistInitial)}" style="width:90%;"></td>
            <td style="padding:6px;"><input type="text" class="row-title" value="${escapeHtml(title)}" style="width:90%;"></td>
            <td style="padding:6px;"><input type="text" class="row-title-initial" value="${escapeHtml(titleInitial)}" style="width:90%;"></td>
        `;
        previewBody.appendChild(tr);
        successCount++;

        // Free枠の1 req/sを超えないように待つ（最後の行では不要）
        if (i < items.length - 1) {
            await sleep(API_INTERVAL_MS);
        }
    }

    message.style.color = 'green';
    message.textContent = `${successCount} 件を解析しました。読みを確認してください。`;
});

document.getElementById('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    const rows = document.querySelectorAll('#preview-body tr');
    const insertData = [];

    rows.forEach(tr => {
        const artist = tr.querySelector('.row-artist').value.trim();
        const artistInitial = tr.querySelector('.row-artist-initial').value.trim();
        const title = tr.querySelector('.row-title').value.trim();
        const titleInitial = tr.querySelector('.row-title-initial').value.trim();

        if (artist && title) {
            insertData.push({
                streamer_id: streamerId,
                artist,
                artist_initial: artistInitial,
                title,
                title_initial: titleInitial,
                complete: true,
                confident: false
            });
        }
    });

    if (!insertData.length) {
        alert('登録する曲がありません。');
        return;
    }

    const message = document.getElementById('message');
    message.style.color = '';
    message.textContent = '送信中...';

    const { error } = await supabaseClient.from('songs').insert(insertData);

    if (error) {
        message.style.color = 'red';
        message.textContent = 'エラー: ' + error.message;
    } else {
        message.style.color = 'green';
        message.textContent = `🎉 ${insertData.length} 件を一括登録しました！`;
        document.getElementById('csv-input').value = '';
        document.getElementById('step-2').style.display = 'none';
    }
});
