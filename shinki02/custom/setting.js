const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. DOM要素の取得
    const streamerIdInput = document.getElementById('streamer-id');
    const fontSelect = document.getElementById('font-family');
    const themeInput = document.getElementById('theme-color');
    const themeCodeInput = document.getElementById('theme-color-code');
    const textInput = document.getElementById('text-color');
    const textCodeInput = document.getElementById('text-color-code');
    const previewArea = document.getElementById('preview-area');
    const previewBtn = document.getElementById('preview-btn');
    const form = document.getElementById('custom-form');
    const messageEl = document.getElementById('status-message');

    // 2. プレビューのリアルタイム反映処理
    function updatePreview() {
        if (!previewArea || !previewBtn) return;
        if (fontSelect) previewArea.style.fontFamily = fontSelect.value;
        if (textInput) previewArea.style.color = textInput.value;
        if (themeInput) previewBtn.style.backgroundColor = themeInput.value;
    }

    // ★★★ ここに同期・プリセット用の処理を挿入します ★★★

    // テーマカラー同期
    function syncThemeColor(color) {
        if (themeInput) themeInput.value = color;
        if (themeCodeInput) themeCodeInput.value = color;
        updatePreview();
    }
    if (themeInput) themeInput.addEventListener('input', (e) => syncThemeColor(e.target.value));
    if (themeCodeInput) themeCodeInput.addEventListener('input', (e) => syncThemeColor(e.target.value));

    // 文字色同期
    function syncTextColor(color) {
        if (textInput) textInput.value = color;
        if (textCodeInput) textCodeInput.value = color;
        updatePreview();
    }
    if (textInput) textInput.addEventListener('input', (e) => syncTextColor(e.target.value));
    if (textCodeInput) textCodeInput.addEventListener('input', (e) => syncTextColor(e.target.value));

    // プリセットチップクリック時の挙動
    document.querySelectorAll('.color-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const target = chip.dataset.target;
            const color = chip.dataset.color;

            if (target === 'theme') {
                syncThemeColor(color);
            } else if (target === 'text') {
                syncTextColor(color);
            }
        });
    });

    if (fontSelect) fontSelect.addEventListener('change', updatePreview);

    // 3. Supabaseから既存データを読み込む関数
    async function loadCurrentDesign(id) {
        const { data, error } = await supabaseClient
            .from('streamers')
            .select('font_family, theme_color, text_color')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('デザイン取得エラー:', error);
            return;
        }

        if (data) {
            if (fontSelect && data.font_family) fontSelect.value = data.font_family;
            if (data.theme_color) syncThemeColor(data.theme_color);
            if (data.text_color) syncTextColor(data.text_color);
        }
    }

    // 4. URLパラメータ取得と初期データロード
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = parseInt(urlParams.get('id'), 10);

    if (streamerId) {
        if (streamerIdInput) streamerIdInput.value = streamerId;
        await loadCurrentDesign(streamerId);
    } else {
        alert('URLに配信者ID (?id=) が指定されていません。');
    }

    // 5. 保存処理（フォーム送信）
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const managementKey = document.getElementById('management-key').value.trim();
            if (!managementKey) {
                alert('管理キーを入力してください。');
                return;
            }

            const saveBtn = document.getElementById('save-design-btn');
            if (saveBtn) saveBtn.disabled = true;
            if (messageEl) messageEl.style.display = 'none';

            try {
                const response = await fetch(`${supabaseUrl}/functions/v1/management`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update_design',
                        streamer_id: streamerId,
                        management_key: managementKey,
                        design: {
                            font_family: fontSelect ? fontSelect.value : 'sans-serif',
                            theme_color: themeInput ? themeInput.value : '#007bff',
                            text_color: textInput ? textInput.value : '#333333'
                        }
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'デザインの更新に失敗しました。');

                if (messageEl) {
                    messageEl.style.backgroundColor = '#d4edda';
                    messageEl.style.color = '#155724';
                    messageEl.textContent = 'デザイン設定を保存しました！';
                    messageEl.style.display = 'block';
                }

            } catch (err) {
                console.error(err);
                if (messageEl) {
                    messageEl.style.backgroundColor = '#f8d7da';
                    messageEl.style.color = '#721c24';
                    messageEl.textContent = 'エラー: ' + err.message;
                    messageEl.style.display = 'block';
                }
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
        });
    }
});