const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. DOM要素の取得（※必ず最初に行う）
    const streamerIdInput = document.getElementById('streamer-id');
    const fontSelect = document.getElementById('font-family');
    const themeInput = document.getElementById('theme-color');
    const textInput = document.getElementById('text-color');
    const themeCode = document.getElementById('theme-color-code');
    const textCode = document.getElementById('text-color-code');
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
        if (themeCode && themeInput) themeCode.textContent = themeInput.value;
        if (textCode && textInput) textCode.textContent = textInput.value;
    }

    if (fontSelect) fontSelect.addEventListener('change', updatePreview);
    if (themeInput) themeInput.addEventListener('input', updatePreview);
    if (textInput) textInput.addEventListener('input', updatePreview);

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
            if (themeInput && data.theme_color) themeInput.value = data.theme_color;
            if (textInput && data.text_color) textInput.value = data.text_color;
            updatePreview();
        }
    }

    // 4. URLパラメータ取得とデータロード（※DOM要素宣言の後に実行）
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = parseInt(urlParams.get('id'), 10);

    if (streamerId) {
        if (streamerIdInput) streamerIdInput.value = streamerId;
        await loadCurrentDesign(streamerId);
    } else {
        alert('URLに配信者ID (?id=) が指定されていません。');
    }

    // 5. 保存処理（管理キーのチェック付き）
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