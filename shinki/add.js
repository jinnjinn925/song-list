const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';

let supabaseClient = null;

function showMessage(text, color = '') {
    const el = document.getElementById('message');
    el.textContent = text;
    el.style.color = color;
}

window.addEventListener('DOMContentLoaded', () => {
    const streamerId = new URLSearchParams(window.location.search).get('id');

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

document.getElementById('parse-btn').addEventListener('click', () => {
    const input = document.getElementById('csv-input').value.trim();

    if (!input) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    const body = document.getElementById('preview-body');
    body.innerHTML = '';

    let count = 0;

    input.split(/\r?\n/).forEach(line => {
        if (!line.trim()) return;

        // 半角カンマ・タブ・全角カンマに対応
        const parts = line.trim().split(/[,\t，]/);

        const artist = (parts[0] || '').trim();
        const title = parts.slice(1).join(',').trim();

        if (!artist || !title) return;

        const tr = document.createElement('tr');

        addInputCell(tr, 'artist', artist);
        addInputCell(tr, 'artist-initial', '');
        addInputCell(tr, 'title', title);
        addInputCell(tr, 'title-initial', '');

        body.appendChild(tr);
        count++;
    });

    if (!count) {
        alert('「アーティスト名,曲名」の形式で入力してください。');
        return;
    }

    document.getElementById('step-2').style.display = 'block';
    showMessage(
        `${count} 件を読み込みました。読みを入力・確認してください。`,
        'green'
    );
});

function addInputCell(tr, className, value) {
    const td = document.createElement('td');
    const input = document.createElement('input');

    input.type = 'text';
    input.className = className;
    input.value = value;

    td.appendChild(input);
    tr.appendChild(td);
}

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
        showMessage('配信者IDが正しくありません。URLの ?id=数字 を確認してください。', 'red');
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
            artist: artist,
            artist_initial: artistInitial,
            title: title,
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
        showMessage('通信エラーが発生しました。Consoleを確認してください。', 'red');
    } finally {
        button.disabled = false;
    }
});
