// JavaScript Document

// Supabaseの接続情報（プロジェクトの設定に合わせて変更してください）
const SUPABASE_URL = 'https://dgssybbbgnnygmccjltn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('add-streamer-form');
const messageEl = document.getElementById('streamer-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('streamer-name').value.trim();
    const urlId = document.getElementById('streamer-url-id').value.trim();
    const bgUrl = document.getElementById('streamer-bg').value.trim();

    // 送信ボタンの二重連打防止
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '登録中...';
    
    messageEl.style.display = 'none';
    messageEl.className = 'message';

    try {
        // Supabaseの streamers テーブルへ新規挿入
        const { data, error } = await supabase
            .from('streamers')
            .insert([
                {
                    name: name,
                    url_id: urlId,
                    bg_image_url: bgUrl || null
                }
            ]);

        if (error) throw error;

        // 成功メッセージ表示＆フォームリセット
        messageEl.textContent = `配信者「${name}」を正常に登録しました！`;
        messageEl.classList.add('success');
        messageEl.style.display = 'block';
        form.reset();

    } catch (err) {
        console.error('登録エラー:', err);
        messageEl.textContent = '登録に失敗しました: ' + err.message;
        messageEl.classList.add('error');
        messageEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '配信者を登録する';
    }
});