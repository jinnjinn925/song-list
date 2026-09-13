const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';

let supabaseClient = null;

const FURIGANA_API = 'https://shirabe.dev/api/v1/text/furigana';
const SEPARATOR = '｜';

function showMessage(text, color = '') {
    const el = document.getElementById('message');
    el.textContent = text;
    el.style.color = color;
}

function katakanaToHiragana(text) {
    return text.replace(/[\u30a1-\u30f6]/g,
        ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function localReading(text) {
    if (!text) return '';
    // APIが読みを返さない英字・数字・記号・かなはそのまま。
    return katakanaToHiragana(text);
}

/*
 * コピペされた1行を
 *   アーティスト / 曲名
 * に分離する。
 *
 * 優先順位：
 * 1. タブ
 * 2. 半角/全角カンマ
 * 3. 2個以上の空白
 * 4. 最初の空白（最後の保険）
 */
function splitLine(line) {
    const cleaned = line
        .replace(/\u00a0/g, ' ')
        .replace(/\u3000/g, '　')
        .trim();

    if (!cleaned) return null;

    // タブ
    if (cleaned.includes('\t')) {
        const p = cleaned.split(/\t+/).map(v => v.trim()).filter(Boolean);
        if (p.length >= 2) {
            return { artist: p[0], title: p.slice(1).join(' '), ok: true };
        }
    }

    // カンマ
    const comma = cleaned.split(/[,，]/);
    if (comma.length >= 2) {
        const artist = comma.shift().trim();
        const title = comma.join(',').trim();
        if (artist && title) {
            return { artist, title, ok: true };
        }
    }

    // 2個以上の半角/全角スペース
    const wideSpace = cleaned.split(/\s{2,}|　{1,}/).map(v => v.trim()).filter(Boolean);
    if (wideSpace.length >= 2) {
        return { artist: wideSpace[0], title: wideSpace.slice(1).join(' '), ok: true };
    }

    // 最後の保険：最初の空白で分ける。
    // 例「ヨルシカ 言え。」「Hump Back 拝啓、少年よ」
    const oneSpace = cleaned.match(/^(\S+)\s+(.+)$/);
    if (oneSpace) {
        return {
            artist: oneSpace[1].trim(),
            title: oneSpace[2].trim(),
            ok: true
        };
    }

    return { artist: cleaned, title: '', ok: false };
}

/*
 * アーティスト＋区切り＋曲名を1回のAPI呼び出しで解析する。
 * Shirabeはトークンごとのreadingを返すので、
 * 区切り文字の前後をそれぞれ結合する。
 */
async function makeReadings(artist, title) {
    const combined = artist + SEPARATOR + title;

    const response = await fetch(FURIGANA_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: combined })
    });

    if (!response.ok) {
        throw new Error(`ふりがなAPI HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || 'ふりがなAPIエラー');
    }

    if (!Array.isArray(data.tokens)) {
        throw new Error('ふりがなAPIの応答形式が不正です');
    }

    let artistReading = '';
    let titleReading = '';
    let afterSeparator = false;

    for (const token of data.tokens) {
        const surface = token.surface ?? '';

        if (surface === SEPARATOR) {
            afterSeparator = true;
            continue;
        }

        const reading = token.reading
            ? katakanaToHiragana(token.reading)
            : localReading(surface);

        if (afterSeparator) {
            titleReading += reading;
        } else {
            artistReading += reading;
        }
    }

    return {
        artist: artistReading,
        title: titleReading
    };
}

function addInputCell(tr, className, value) {
    const td = document.createElement('td');
    const input = document.createElement('input');

    input.type = 'text';
    input.className = className;
    input.value = value || '';

    td.appendChild(input);
    tr.appendChild(td);
}

function addPreviewRow(item) {
    const tr = document.createElement('tr');

    addInputCell(tr, 'artist', item.artist);
    addInputCell(tr, 'artist-initial', item.artistReading);
    addInputCell(tr, 'title', item.title);
    addInputCell(tr, 'title-initial', item.titleReading);

    document.getElementById('preview-body').appendChild(tr);
}

window.addEventListener('DOMContentLoaded', () => {
    const streamerId = new URLSearchParams(location.search).get('id');

    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
        showMessage('URLに配信者ID（?id=1 など）が付いていません。', 'red');
    }

    if (!window.supabase) {
        showMessage('Supabaseの読み込みに失敗しました。', 'red');
        return;
    }

    supabaseClient = window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );

    showMessage('準備完了。曲リストを貼り付けてください。', 'green');
});

document.getElementById('parse-btn').addEventListener('click', async () => {
    const raw = document.getElementById('csv-input').value.trim();

    if (!raw) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    const lines = raw.split(/\r?\n/);
    const parsed = [];
    const invalid = [];

    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const item = splitLine(lines[i]);

        if (!item || !item.ok) {
            invalid.push(i + 1);
            if (document.getElementById('keep-invalid').checked) {
                parsed.push({
                    artist: lines[i].trim(),
                    title: '',
                    artistReading: '',
                    titleReading: ''
                });
            }
            continue;
        }

        parsed.push({
            artist: item.artist,
            title: item.title,
            artistReading: '',
            titleReading: ''
        });
    }

    if (!parsed.length) {
        alert('曲名を読み取れる行がありませんでした。');
        return;
    }

    const button = document.getElementById('parse-btn');
    button.disabled = true;

    const body = document.getElementById('preview-body');
    body.innerHTML = '';

    let completed = 0;

    try {
        for (const item of parsed) {
            if (!item.title) {
                addPreviewRow(item);
                continue;
            }

            showMessage(
                `読み仮名を生成しています… ${completed + 1} / ${parsed.filter(x => x.title).length}`
            );

            try {
                const readings = await makeReadings(item.artist, item.title);
                item.artistReading = readings.artist;
                item.titleReading = readings.title;
            } catch (error) {
                console.error(error);
                // API失敗時も入力自体は残す。
                item.artistReading = localReading(item.artist);
                item.titleReading = localReading(item.title);
            }

            addPreviewRow(item);
            completed++;
        }

        document.getElementById('step-2').style.display = 'block';

        let message = `${parsed.length} 件を読み込みました。読み仮名を確認してください。`;

        if (invalid.length) {
            message += `（${invalid.length} 行は区切りを判定できませんでした）`;
        }

        showMessage(message, 'green');

    } finally {
        button.disabled = false;
    }
});

document.getElementById('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt(
        document.getElementById('streamer-id').value,
        10
    );

    if (!supabaseClient) {
        showMessage('Supabaseの準備ができていません。', 'red');
        return;
    }

    if (!Number.isInteger(streamerId)) {
        showMessage(
            '配信者IDが正しくありません。URLの ?id=数字 を確認してください。',
            'red'
        );
        return;
    }

    const insertData = [];

    document.querySelectorAll('#preview-body tr').forEach(tr => {
        const artist = tr.querySelector('.artist').value.trim();
        const artistInitial = tr.querySelector('.artist-initial').value.trim();
        const title = tr.querySelector('.title').value.trim();
        const titleInitial = tr.querySelector('.title-initial').value.trim();

        if (!artist || !title) return;

        insertData.push({
            streamer_id: streamerId,
            artist,
            artist_initial: artistInitial,
            title,
            title_initial: titleInitial,
            complete: true,
            confident: false
        });
    });

    if (!insertData.length) {
        showMessage('登録できる曲がありません。', 'red');
        return;
    }

    const button = document.getElementById('submit-all-btn');
    button.disabled = true;
    showMessage(`${insertData.length} 件を登録中…`);

    try {
        const { error } = await supabaseClient
            .from('songs')
            .insert(insertData);

        if (error) {
            console.error(error);
            showMessage('登録エラー: ' + error.message, 'red');
            return;
        }

        showMessage(
            `🎉 ${insertData.length} 件を一括登録しました！`,
            'green'
        );

        document.getElementById('csv-input').value = '';
        document.getElementById('preview-body').innerHTML = '';
        document.getElementById('step-2').style.display = 'none';

    } catch (error) {
        console.error(error);
        showMessage(
            '通信エラーが発生しました。Consoleを確認してください。',
            'red'
        );
    } finally {
        button.disabled = false;
    }
});
