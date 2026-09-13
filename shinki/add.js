const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let tokenizer = null;
let tokenizerPromise = null;

const DIC_PATH = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

const $ = (id) => document.getElementById(id);

function setMessage(text, color = '') {
    $('message').textContent = text;
    $('message').style.color = color;
}

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

function fourDigitsToJapanese(n) {
    const units = ['', 'じゅう', 'ひゃく', 'せん'];
    const small = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
    let result = '';
    for (let i = 3; i >= 0; i--) {
        const d = Math.floor(n / Math.pow(10, i)) % 10;
        if (!d) continue;
        if (i === 3) result += d === 3 ? 'さんぜん' : d === 8 ? 'はっせん' : small[d] + 'せん';
        else if (i === 2) result += d === 3 ? 'さんびゃく' : d === 6 ? 'ろっぴゃく' : d === 8 ? 'はっぴゃく' : small[d] + 'ひゃく';
        else if (i === 1) result += d === 1 ? 'じゅう' : small[d] + 'じゅう';
        else result += small[d];
    }
    return result;
}

function integerToJapaneseDigits(s) {
    if (!/^\d+$/.test(s)) return '';
    const normalized = s.replace(/^0+(?=\d)/, '');
    if (normalized.length > 12) {
        return [...s].map(x => DIGIT_READING[x]).join('');
    }
    const groups = [];
    let rest = Number(normalized);
    let groupIndex = 0;
    while (rest > 0) {
        const group = rest % 10000;
        if (group) {
            const part = fourDigitsToJapanese(group);
            groups.unshift({
                text: part,
                unit: ['', 'まん', 'おく'][groupIndex] || ''
            });
        }
        rest = Math.floor(rest / 10000);
        groupIndex++;
    }
    return groups.length ? groups.map(g => g.text + g.unit).join('') : 'ぜろ';
}

function asciiRunToHiragana(run) {
    if (/^\d+$/.test(run)) return integerToJapaneseDigits(run);
    return run.toUpperCase().split('').map(ch => LETTER_READING[ch] || ch).join('');
}

/*
 * Kuromojiに日本語部分を読ませ、英字・数字は明示的にひらがなへ変換する。
 * 例:
 *   東京都  -> とうきょうと
 *   366     -> さんびゃくろくじゅうろく
 *   ABC     -> えーびーしー
 */
function toHiragana(text) {
    if (!text) return '';

    const parts = [];
    const re = /[A-Za-z0-9]+|[^A-Za-z0-9]+/g;
    const chunks = text.match(re) || [];

    for (const chunk of chunks) {
        if (/^[A-Za-z0-9]+$/.test(chunk)) {
            parts.push(asciiRunToHiragana(chunk));
            continue;
        }

        if (tokenizer) {
            const tokens = tokenizer.tokenize(chunk);
            for (const token of tokens) {
                const reading = token.reading || token.surface_form || '';
                parts.push(katakanaToHiragana(reading));
            }
        } else {
            parts.push(katakanaToHiragana(chunk));
        }
    }

    return parts.join('');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
}

function parseLine(line) {
    const s = line.trim();
    if (!s) return null;

    // タブ、半角/全角カンマに対応
    const parts = s.split(/[\t,，]/);

    if (parts.length >= 2) {
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(',').trim()
        };
    }

    // 区切りが無い場合は連続空白を区切りとして試す
    const ws = s.split(/\s{2,}/);
    if (ws.length >= 2) {
        return { artist: ws[0].trim(), title: ws.slice(1).join(' ').trim() };
    }

    return null;
}

function buildPreviewRow(artist, title) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="padding:6px;">
            <input type="text" class="row-artist" value="${escapeHtml(artist)}" style="width:100%;">
        </td>
        <td style="padding:6px;">
            <input type="text" class="row-artist-initial" value="${escapeHtml(toHiragana(artist))}" style="width:100%;">
        </td>
        <td style="padding:6px;">
            <input type="text" class="row-title" value="${escapeHtml(title)}" style="width:100%;">
        </td>
        <td style="padding:6px;">
            <input type="text" class="row-title-initial" value="${escapeHtml(toHiragana(title))}" style="width:100%;">
        </td>
    `;
    return tr;
}

function loadTokenizer() {
    if (tokenizer) return Promise.resolve(tokenizer);
    if (tokenizerPromise) return tokenizerPromise;

    tokenizerPromise = new Promise((resolve, reject) => {
        if (typeof kuromoji === 'undefined') {
            reject(new Error('Kuromoji.js が読み込めませんでした。'));
            return;
        }

        setMessage('日本語辞書を読み込んでいます。初回だけ少し時間がかかります…');

        kuromoji.builder({ dicPath: DIC_PATH }).build((err, builtTokenizer) => {
            if (err) {
                console.error('Kuromoji dictionary error:', err);
                reject(err);
                return;
            }

            tokenizer = builtTokenizer;
            console.log('Kuromoji 準備完了');
            resolve(tokenizer);
        });
    });

    return tokenizerPromise;
}

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('id');

    if (streamerId) {
        $('streamer-id').value = streamerId;
    } else {
        setMessage('URLに配信者ID（?id=1 など）が付いていません。', 'red');
    }

    try {
        await loadTokenizer();
        setMessage('日本語辞書の準備が完了しました。');
    } catch (err) {
        console.error(err);
        setMessage(
            '日本語辞書の読み込みに失敗しました。ページを再読み込みしてください。',
            'red'
        );
    }
});

$('parse-btn').addEventListener('click', async () => {
    const textInput = $('csv-input').value.trim();
    if (!textInput) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    try {
        await loadTokenizer();
    } catch (err) {
        console.error(err);
        alert('日本語辞書の準備に失敗しています。ページを再読み込みしてください。');
        return;
    }

    const lines = textInput.split(/\r?\n/);
    const previewBody = $('preview-body');
    previewBody.innerHTML = '';

    let count = 0;
    let skipped = 0;

    for (const line of lines) {
        const parsed = parseLine(line);
        if (!parsed || !parsed.artist || !parsed.title) {
            if (line.trim()) skipped++;
            continue;
        }

        previewBody.appendChild(buildPreviewRow(parsed.artist, parsed.title));
        count++;
    }

    if (!count) {
        $('step-2').style.display = 'none';
        setMessage('読み取れる「アーティスト,曲名」の行がありません。', 'red');
        return;
    }

    $('step-2').style.display = 'block';
    setMessage(
        `${count} 件を解析しました。読みを確認してください。` +
        (skipped ? `（${skipped} 行は形式を認識できず無視しました）` : ''),
        'green'
    );
});

$('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt($('streamer-id').value, 10);

    if (!Number.isInteger(streamerId)) {
        alert('配信者IDが正しくありません。URLを確認してください。');
        return;
    }

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
        alert('登録できる曲がありません。');
        return;
    }

    const button = $('submit-all-btn');
    button.disabled = true;
    button.style.opacity = '0.6';
    setMessage('Supabaseへ登録中…');

    try {
        const { error } = await supabaseClient.from('songs').insert(insertData);

        if (error) {
            throw error;
        }

        setMessage(`🎉 ${insertData.length} 件を一括登録しました！`, 'green');
        $('csv-input').value = '';
        $('preview-body').innerHTML = '';
        $('step-2').style.display = 'none';
    } catch (error) {
        console.error('Supabase insert error:', error);
        setMessage('登録エラー: ' + (error.message || error), 'red');
    } finally {
        button.disabled = false;
        button.style.opacity = '';
    }
});
