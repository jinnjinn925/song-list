// Supabaseの接続情報（ご自身のプロジェクトの値に書き換えてください）
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

document.addEventListener('DOMContentLoaded', () => {
    // Supabase SDK の読み込み完了を待つ関数
    const initApp = () => {
        if (!window.supabase) {
            console.warn('Supabase SDK 読み込み待ち...');
            setTimeout(initApp, 100); // 0.1秒後に再試行
            return;
        }

        // クライアントの初期化
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const form = document.getElementById('add-streamer-form');
        const messageEl = document.getElementById('streamer-message');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('streamer-name').value.trim();
            const urlId = document.getElementById('streamer-url-id').value.trim();
            const bgUrl = document.getElementById('streamer-bg').value.trim();

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '登録中...';
            
            messageEl.style.display = 'none';
            messageEl.className = 'message';

            try {
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
    };

    initApp();
});