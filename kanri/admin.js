import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://dgssybbbgnnygmccjltn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd'; // ご自身の anon key に書き換えてください

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-streamer-form');
    const messageEl = document.getElementById('streamer-message');
    const streamerListEl = document.getElementById('streamer-list');

    // --- 配信者一覧を取得して画面に表示する関数 ---
    async function fetchStreamers() {
        if (!streamerListEl) return;

        try {
            const { data, error } = await supabase
                .from('streamers')
                .select('*')
                .order('id', { ascending: false }); // 新しい順に並べ替え

            if (error) throw error;

            if (!data || data.length === 0) {
                streamerListEl.innerHTML = '<li>登録されている配信者はまだいません。</li>';
                return;
            }

            // HTMLのリストを作成して注入
            streamerListEl.innerHTML = data.map(s => `
                <li class="streamer-item">
                    <div class="streamer-info">
                        <span class="streamer-name">${escapeHtml(s.name)}</span>
                        <span class="streamer-url-id">ID: ${escapeHtml(s.url_id)}</span>
                    </div>
                </li>
            `).join('');

        } catch (err) {
            console.error('配信者一覧取得エラー:', err);
            streamerListEl.innerHTML = `<li style="color: red;">一覧の読み込みに失敗しました: ${err.message}</li>`;
        }
    }

    // XSS対策用の簡易エスケープ関数
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // 初回読み込み時に配信者一覧を取得
    fetchStreamers();

    // --- 新規配信者登録処理 ---
    if (form) {
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
                            background_image: bgUrl || null
                        }
                    ]);

                if (error) throw error;

                messageEl.textContent = `配信者「${name}」を正常に登録しました！`;
                messageEl.classList.add('success');
                messageEl.style.display = 'block';
                form.reset();

                // 登録成功後に配信者一覧を再取得して更新
                fetchStreamers();

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
    }
});