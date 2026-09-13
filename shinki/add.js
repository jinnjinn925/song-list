const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';

let supabaseClient = null;
let tokenizer = null;

function msg(text, color = '') {
    const el = document.getElementById('message');
    el.textContent = text;
    el.style.color = color;
}

function katakanaToHiragana(src) {
    return src.replace(/[\u30a1-\u30f6]/g,
        m => String.fromCharCode(m.charCodeAt(0) - 0x60));
}

function toHiragana(text) {
    if (!text) return '';
    const tokens = tokenizer.tokenize(text);
    return tokens.map(t =>
        katakanaToHiragana(t.reading || t.surface_form)
    ).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    const streamerId = new URLSearchParams(location.search).get('id');
    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
        msg('URLに配信者ID（?id=1 など）が付いていません。', 'red');
    }

    if (!window.supabase) {
        msg('Supabaseの読み込みに失敗しました。', 'red');
        return;
    }
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    if (typeof kuromoji === 'undefined') {
        msg('Kuromoji.jsの読み込みに失敗しました。', 'red');
        return;
    }

    msg('ふりがな辞書を読み込んでいます…（初回は少し時間がかかります）');

    kuromoji.builder({
        dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/'
    }).build((err, t) => {
        if (err) {
            console.error('Kuromoji辞書エラー:', err);
            msg('ふりがな辞書の読み込みに失敗しました。Consoleを確認してください。', 'red');
            return;
        }
        tokenizer = t;
        document.getElementById('parse-btn').disabled = false;
        msg('ふりがな辞書の準備完了。入力できます。', 'green');
        console.log('kuromoji 準備完了！');
    });
});

document.getElementById('parse-btn').addEventListener('click', () => {
    if (!tokenizer) return;

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

        const parts = line.trim().split(/[,\t，]/);
        const artist = (parts[0] || '').trim();
        const title = parts.slice(1).join(',').trim();

        if (!artist || !title) return;

        const tr = document.createElement('tr');

        [
            ['row-artist', artist],
            ['row-artist-initial', toHiragana(artist)],
            ['row-title', title],
            ['row-title-initial', toHiragana(title)]
        ].forEach(([cls, value]) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = cls;
            input.value = value;
            td.appendChild(input);
            tr.appendChild(td);
        });

        body.appendChild(tr);
        count++;
    });

    if (!count) {
        alert('「アーティスト名,曲名」の形式で入力してください。');
        return;
    }

    document.getElementById('step-2').style.display = 'block';
    msg(`${count} 件を解析しました。読みを確認してください。`, 'green');
});

document.getElementById('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt(
        document.getElementById('streamer-id').value, 10
    );

    if (!supabaseClient || !Number.isInteger(streamerId)) {
        msg('Supabaseまたは配信者IDの準備ができていません。', 'red');
        return;
    }

    const insertData = [];

    document.querySelectorAll('#preview-body tr').forEach(tr => {
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
        msg('登録できる曲がありません。', 'red');
        return;
    }

    const button = document.getElementById('submit-all-btn');
    button.disabled = true;
    msg(`${insertData.length} 件を送信中…`);

    try {
        const { error } = await supabaseClient.from('songs').insert(insertData);
        if (error) {
            console.error(error);
            msg('エラー: ' + error.message, 'red');
            return;
        }

        msg(`🎉 ${insertData.length} 件を一括登録しました！`, 'green');
        document.getElementById('csv-input').value = '';
        document.getElementById('preview-body').innerHTML = '';
        document.getElementById('step-2').style.display = 'none';
    } finally {
        button.disabled = false;
    }
});
