const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // URLから streamerId を取得 (例: setting.html?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = parseInt(urlParams.get('id'), 10);

    const streamerIdInput = document.getElementById('streamer-id');
    if (streamerId) {
        streamerIdInput.value = streamerId;
        await loadCurrentDesign(streamerId);
    } else {
        alert('URLに配信者ID (?id=) が指定されていません。');
    }

    const fontSelect = document.getElementById('font-family');
    const themeInput = document.getElementById('theme-color');
    const textInput = document.getElementById('text-color');
    const themeCode = document.getElementById('theme-color-code');
    const textCode = document.getElementById('text-color-code');
    const previewArea = document.getElementById('preview-area');
    const previewBtn = document.getElementById('preview-btn');
    const form = document.getElementById('custom-form');
    const messageEl = document.getElementById('status-message');

    // プレビューリアルタイム反映
    function updatePreview() {
        previewArea.style.fontFamily = fontSelect.value;
        previewArea.style.color = textInput.value;
        previewBtn.style.backgroundColor = themeInput.value;
        themeCode.textContent = themeInput.value;
        textCode.textContent = textInput.value;
    }

    fontSelect.addEventListener('change', updatePreview);
    themeInput.addEventListener('input', updatePreview);
    textInput.addEventListener('input', updatePreview);

    // 既存のデザイン設定を Supabase から取得
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
            fontSelect.value = data.font_family || 'sans-serif';
            themeInput.value = data.theme_color || '#007bff';
            textInput.value = data.text_color || '#333333';
            updatePreview();
        }
    }

    // 保存処理（管理キーの検証付き）
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const managementKey = document.getElementById('management-key').value.trim();
        if (!managementKey) {
            alert('管理キーを入力してください。');
            return;
        }

        const saveBtn = document.getElementById('save-design-btn');
        saveBtn.disabled = true;
        messageEl.style.display = 'none';

        try {
            // Edge Function経由で管理キー認証を行ってデザイン更新する例
            const response = await fetch(`${supabaseUrl}/functions/v1/management`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_design', // Edge Function側の分岐用アクション名
                    streamer_id: streamerId,
                    management_key: managementKey,
                    design: {
                        font_family: fontSelect.value,
                        theme_color: themeInput.value,
                        text_color: textInput.value
                    }
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'デザインの更新に失敗しました。');

            messageEl.style.backgroundColor = '#d4edda';
            messageEl.style.color = '#155724';
            messageEl.textContent = 'デザイン設定を保存しました！';
            messageEl.style.display = 'block';

        } catch (err) {
            console.error(err);
            messageEl.style.backgroundColor = '#f8d7da';
            messageEl.style.color = '#721c24';
            messageEl.textContent = 'エラー: ' + err.message;
            messageEl.style.display = 'block';
        } finally {
            saveBtn.disabled = false;
        }
    });
});