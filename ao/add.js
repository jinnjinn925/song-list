const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let tokenizer = null;

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('id');

    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
        alert('URLに配信者ID (?id=1 など) が付いていません。');
    }

    // kuromoji の存在確認
    if (typeof kuromoji === 'undefined') {
        console.error("kuromoji.js が読み込まれていません。");
        document.getElementById('message').textContent = 'ライブラリの読み込みに失敗しました。';
        return;
    }

    // ★ cdnjs の辞書フォルダ（dict/）を指定
    kuromoji.builder({
    		dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
	}).build((err, _tokenizer) => {
    	if (err) {
        	console.error("kuromoji読み込み失敗:", err);
        	document.getElementById('message').textContent =
            	'辞書の読み込みに失敗しました。';
    	} else {
        	tokenizer = _tokenizer;
        	console.log("kuromoji 準備完了！");
        	document.getElementById('message').textContent = '';
    	}
	});
});

// カタカナをひらがなに直す補助関数
function katakanaToHiragana(src) {
    return src.replace(/[\u30a1-\u30f6]/g, match => String.fromCharCode(match.charCodeAt(0) - 0x60));
}

// 漢字をひらがなに変換する関数
function toHiragana(text) {
    if (!text) return '';
    if (!tokenizer) return katakanaToHiragana(text); // 準備前ならそのまま返す

    const tokens = tokenizer.tokenize(text);
    let result = '';
    tokens.forEach(token => {
        result += katakanaToHiragana(token.reading ? token.reading : token.surface_form);
    });
    return result;
}

// 2. 「ふりがなを自動生成して確認する」ボタンが押された時
document.getElementById('parse-btn').addEventListener('click', () => {
    if (!tokenizer) {
        alert('辞書データを準備中です。数秒待ってからもう一度押してください。');
        return;
    }

    const textInput = document.getElementById('csv-input').value.trim();
    if (!textInput) {
        alert('曲リストを貼り付けてください。');
        return;
    }

    const lines = textInput.split('\n');
    const previewBody = document.getElementById('preview-body');
    previewBody.innerHTML = '';
    let count = 0;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // カンマ、読点、タブのどれで区切られていても対応
        const parts = trimmed.split(/[,,\t]/);
        const artist = parts[0] ? parts[0].trim() : '';
        const title = parts[1] ? parts[1].trim() : '';

        if (!artist && !title) return;

        // kuromojiで自動読み上げ作成
        const artistInitial = toHiragana(artist);
        const titleInitial = toHiragana(title);

        // 表の行を作成（各入力欄は手修正可能）
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:6px;"><input type="text" class="row-artist" value="${artist}" style="width:90%;"></td>
            <td style="padding:6px;"><input type="text" class="row-artist-initial" value="${artistInitial}" style="width:90%;"></td>
            <td style="padding:6px;"><input type="text" class="row-title" value="${title}" style="width:90%;"></td>
            <td style="padding:6px;"><input type="text" class="row-title-initial" value="${titleInitial}" style="width:90%;"></td>
        `;
        previewBody.appendChild(tr);
        count++;
    });

    if (count > 0) {
        document.getElementById('step-2').style.display = 'block';
        document.getElementById('message').textContent = `${count} 件を解析しました。読みを確認してください。`;
        document.getElementById('message').style.color = 'green';
    }
});

// 3. Supabaseへ一括送信
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
                artist: artist,
                artist_initial: artistInitial,
                title: title,
                title_initial: titleInitial,
                complete: true,
                confident: false
            });
        }
    });

    document.getElementById('message').textContent = '送信中...';

    const { error } = await supabaseClient.from('songs').insert(insertData);

    if (error) {
        document.getElementById('message').style.color = 'red';
        document.getElementById('message').textContent = 'エラー: ' + error.message;
    } else {
        document.getElementById('message').style.color = 'green';
        document.getElementById('message').textContent = `🎉 ${insertData.length} 件を一括登録しました！`;
        document.getElementById('csv-input').value = '';
        document.getElementById('step-2').style.display = 'none';
    }
});