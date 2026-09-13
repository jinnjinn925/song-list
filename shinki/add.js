const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const $ = id => document.getElementById(id);
let worker = null;
let workerReady = false;
let requestId = 0;
const pending = new Map();

function setMessage(text, color = '') {
    $('message').textContent = text;
    $('message').style.color = color;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
}

function parseLine(line) {
    const s = line.trim();
    if (!s) return null;

    const parts = s.split(/[\t,，]/);
    if (parts.length >= 2) {
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(',').trim()
        };
    }

    const ws = s.split(/\s{2,}/);
    if (ws.length >= 2) {
        return {
            artist: ws[0].trim(),
            title: ws.slice(1).join(' ').trim()
        };
    }

    return null;
}

function startWorker() {
    if (worker) return;

    worker = new Worker('furigana-worker.js');

    worker.onmessage = event => {
        const data = event.data || {};

        if (data.type === 'starting') {
            setMessage('日本語辞書を読み込んでいます。初回は少し時間がかかります…');
            return;
        }

        if (data.type === 'ready') {
            workerReady = true;
            setMessage('日本語辞書の準備が完了しました。');
            return;
        }

        if (data.type === 'result' || data.type === 'error') {
            const p = pending.get(data.id);
            if (!p) return;
            pending.delete(data.id);

            if (data.type === 'error') p.reject(new Error(data.message));
            else p.resolve(data.reading);
        }
    };

    worker.onerror = event => {
        console.error('Furigana Worker error:', event);
        workerReady = false;
        setMessage('ふりがなエンジンの読み込みに失敗しました。CDNへの接続を確認してください。', 'red');
        for (const p of pending.values()) p.reject(new Error('Worker error'));
        pending.clear();
    };
}

function waitForWorkerReady(timeoutMs = 60000) {
    startWorker();

    if (workerReady) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const start = Date.now();

        const timer = setInterval(() => {
            if (workerReady) {
                clearInterval(timer);
                resolve();
                return;
            }
            if (Date.now() - start >= timeoutMs) {
                clearInterval(timer);
                reject(new Error('辞書の読み込みがタイムアウトしました。'));
            }
        }, 100);
    });
}

function convertToHiragana(text) {
    return new Promise((resolve, reject) => {
        const id = ++requestId;
        pending.set(id, { resolve, reject });
        worker.postMessage({ type: 'convert', id, text });
    });
}

function buildRow(artist, artistReading, title, titleReading) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="padding:6px;">
            <input type="text" class="row-artist" value="${escapeHtml(artist)}" style="width:100%;">
        </td>
        <td style="padding:6px;">
            <input type="text" class="row-artist-initial" value="${escapeHtml(artistReading)}" style="width:100%;">
        </td>
        <td style="padding:6px;">
            <input type="text" class="row-title" value="${escapeHtml(title)}" style="width:100%;">
        </td>
        <td style="padding:6px;">
            <input type="text" class="row-title-initial" value="${escapeHtml(titleReading)}" style="width:100%;">
        </td>
    `;
    return tr;
}

window.addEventListener('load', () => {
    const streamerId = new URLSearchParams(location.search).get('id');

    if (streamerId) {
        $('streamer-id').value = streamerId;
    } else {
        setMessage('URLに配信者ID（?id=1 など）が付いていません。', 'red');
    }

    // ここでは辞書をロードしない。
    // ボタンを押した時だけWorkerを起動するので、ページが固まらない。
});

$('parse-btn').addEventListener('click', async () => {
    const textInput = $('csv-input').value.trim();
    if (!textInput) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    const lines = textInput.split(/\r?\n/);
    const parsedRows = [];
    let skipped = 0;

    for (const line of lines) {
        const parsed = parseLine(line);
        if (!parsed || !parsed.artist || !parsed.title) {
            if (line.trim()) skipped++;
            continue;
        }
        parsedRows.push(parsed);
    }

    if (!parsedRows.length) {
        setMessage('「アーティスト,曲名」の形式で入力してください。', 'red');
        return;
    }

    const parseButton = $('parse-btn');
    parseButton.disabled = true;
    parseButton.style.opacity = '0.6';

    try {
        await waitForWorkerReady();

        const body = $('preview-body');
        body.innerHTML = '';

        for (let i = 0; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            setMessage(`ふりがなを生成中… ${i + 1} / ${parsedRows.length}`);

            const [artistReading, titleReading] = await Promise.all([
                convertToHiragana(row.artist),
                convertToHiragana(row.title)
            ]);

            body.appendChild(buildRow(
                row.artist, artistReading,
                row.title, titleReading
            ));
        }

        $('step-2').style.display = 'block';
        setMessage(
            `${parsedRows.length} 件を解析しました。読みを確認してください。` +
            (skipped ? `（${skipped} 行は形式を認識できず無視）` : ''),
            'green'
        );
    } catch (err) {
        console.error(err);
        setMessage('ふりがなの生成に失敗しました: ' + err.message, 'red');
    } finally {
        parseButton.disabled = false;
        parseButton.style.opacity = '';
    }
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
        if (error) throw error;

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
