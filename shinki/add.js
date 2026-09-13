const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Supabase Edge Function endpoint.
// Deploy the function in supabase/functions/furigana.
const FURIGANA_FUNCTION_URL =
    `${supabaseUrl}/functions/v1/furigana`;

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('id');

    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
        alert('URLに配信者ID (?id=1 など) が付いていません。');
    }
});

function parseInput(text) {
    return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
        // tab / comma / full-width comma / 2+ spaces
        const parts = line.split(/\t|,|，|\s{2,}/);
        return {
            artist: (parts[0] || '').trim(),
            title: (parts.slice(1).join(',') || '').trim()
        };
    }).filter(row => row.artist || row.title);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function generateReadings(rows) {
    const res = await fetch(FURIGANA_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
    });

    let data = null;
    try {
        data = await res.json();
    } catch (_) {}

    if (!res.ok) {
        const detail = data?.error || `HTTP ${res.status}`;
        throw new Error(detail);
    }

    if (!Array.isArray(data?.rows)) {
        throw new Error('Edge Functionから不正な形式の結果が返りました。');
    }

    return data.rows;
}

document.getElementById('parse-btn').addEventListener('click', async () => {
    const textInput = document.getElementById('csv-input').value.trim();
    if (!textInput) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    const rows = parseInput(textInput);
    if (!rows.length) {
        alert('アーティスト名と曲名を確認してください。');
        return;
    }

    const button = document.getElementById('parse-btn');
    const message = document.getElementById('message');
    button.disabled = true;
    message.style.color = '';
    message.textContent = `${rows.length} 件の読みを生成しています…`;

    try {
        const resultRows = await generateReadings(rows);

        const previewBody = document.getElementById('preview-body');
        previewBody.innerHTML = '';

        resultRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:6px;">
                    <input type="text" class="row-artist" value="${escapeHtml(row.artist)}" style="width:90%;">
                </td>
                <td style="padding:6px;">
                    <input type="text" class="row-artist-initial" value="${escapeHtml(row.artist_initial)}" style="width:90%;">
                </td>
                <td style="padding:6px;">
                    <input type="text" class="row-title" value="${escapeHtml(row.title)}" style="width:90%;">
                </td>
                <td style="padding:6px;">
                    <input type="text" class="row-title-initial" value="${escapeHtml(row.title_initial)}" style="width:90%;">
                </td>
            `;
            previewBody.appendChild(tr);
        });

        document.getElementById('step-2').style.display = 'block';
        message.style.color = 'green';
        message.textContent = `${resultRows.length} 件を解析しました。読みを確認してください。`;
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = '読みの生成に失敗しました: ' + error.message;
    } finally {
        button.disabled = false;
    }
});

document.getElementById('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    if (!Number.isInteger(streamerId)) {
        alert('配信者IDが正しくありません。');
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

    const message = document.getElementById('message');
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
