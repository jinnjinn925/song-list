const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. DOM要素の取得
    const streamerIdInput = document.getElementById('streamer-id');
    const fontSelect = document.getElementById('font-family');
    const themeInput = document.getElementById('theme-color');
    const themeCodeInput = document.getElementById('theme-color-code');
    
    // 【文字色】タイトル用（DBの title_color に対応）
    const titleTextInput = document.getElementById('title-text-color') || document.getElementById('text-color');
    const titleTextCodeInput = document.getElementById('title-text-color-code') || document.getElementById('text-color-code');
    
    // 【文字色】アーティスト・曲名用（DBの artist_color に対応）
    const artistTextInput = document.getElementById('artist-text-color');
    const artistTextCodeInput = document.getElementById('artist-text-color-code');

    const bgFileInput = document.getElementById('bg-file-input');
    const bgUrlInput = document.getElementById('background-url');
    const removeBgBtn = document.getElementById('remove-bg-btn');
    const previewArea = document.getElementById('preview-area');
    const previewBtn = document.getElementById('preview-btn');
    const form = document.getElementById('custom-form');
    const messageEl = document.getElementById('status-message');

    // 2. プレビューのリアルタイム反映処理
    function updatePreview() {
        if (!previewArea) return;

        const currentTitle = document.getElementById('preview-title');
        const currentArtist = document.getElementById('preview-artist');

        if (fontSelect) previewArea.style.fontFamily = fontSelect.value;
        if (themeInput && previewBtn) previewBtn.style.backgroundColor = themeInput.value;

        // タイトル文字色
        if (titleTextInput && currentTitle) {
            currentTitle.style.color = titleTextInput.value;
        }

        // アーティスト・曲名文字色
        if (artistTextInput && currentArtist) {
            currentArtist.style.color = artistTextInput.value;
        }

        // 背景画像
        if (bgUrlInput && bgUrlInput.value.trim()) {
            previewArea.style.backgroundImage = `url('${bgUrlInput.value.trim()}')`;
            previewArea.style.backgroundSize = 'cover';
            previewArea.style.backgroundPosition = 'center';
        } else {
            previewArea.style.backgroundImage = 'none';
        }
    }

    // 3. 同期用ヘルパー関数
    function syncThemeColor(color) {
        if (themeInput) themeInput.value = color;
        if (themeCodeInput) themeCodeInput.value = color;
        updatePreview();
    }

    function syncTitleTextColor(color) {
        if (titleTextInput) titleTextInput.value = color;
        if (titleTextCodeInput) titleTextCodeInput.value = color;
        updatePreview();
    }

    function syncArtistTextColor(color) {
        if (artistTextInput) artistTextInput.value = color;
        if (artistTextCodeInput) artistTextCodeInput.value = color;
        updatePreview();
    }

    // イベントリスナーのセット
    if (themeInput) themeInput.addEventListener('input', (e) => syncThemeColor(e.target.value));
    if (themeCodeInput) themeCodeInput.addEventListener('input', (e) => syncThemeColor(e.target.value));
    
    if (titleTextInput) titleTextInput.addEventListener('input', (e) => syncTitleTextColor(e.target.value));
    if (titleTextCodeInput) titleTextCodeInput.addEventListener('input', (e) => syncTitleTextColor(e.target.value));
    if (artistTextInput) artistTextInput.addEventListener('input', (e) => syncArtistTextColor(e.target.value));
    if (artistTextCodeInput) artistTextCodeInput.addEventListener('input', (e) => syncArtistTextColor(e.target.value));
    
    if (fontSelect) fontSelect.addEventListener('change', updatePreview);

    // プリセットチップのクリック処理
    document.querySelectorAll('.color-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const target = chip.dataset.target;
            const color = chip.dataset.color;
            if (target === 'theme') syncThemeColor(color);
            if (target === 'title-text' || target === 'text') syncTitleTextColor(color);
            if (target === 'artist-text') syncArtistTextColor(color);
        });
    });

    // 4. 背景画像ファイルの Supabase Storage アップロード処理
    if (bgFileInput) {
        bgFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const streamerId = streamerIdInput ? streamerIdInput.value : null;
            if (!streamerId) {
                alert('配信者IDが読み込まれていません。');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const filePath = `streamer_${streamerId}_${Date.now()}.${fileExt}`;

            try {
                const { error: uploadError } = await supabaseClient
                    .storage
                    .from('background')
                    .upload(filePath, file, { cacheControl: '3600', upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabaseClient
                    .storage
                    .from('background')
                    .getPublicUrl(filePath);

                if (bgUrlInput) bgUrlInput.value = publicUrlData.publicUrl;
                updatePreview();

            } catch (err) {
                console.error('画像アップロードエラー:', err);
                alert('画像のアップロードに失敗しました: ' + err.message);
            }
        });
    }

    if (removeBgBtn) {
        removeBgBtn.addEventListener('click', () => {
            if (bgFileInput) bgFileInput.value = '';
            if (bgUrlInput) bgUrlInput.value = '';
            updatePreview();
        });
    }

    // 5. Supabaseから既存デザイン設定の取得
    async function loadCurrentDesign(id) {
        // DBのカラム名: title_color を指定
        const { data, error } = await supabaseClient
            .from('streamers')
            .select('font_family, theme_color, title_color, artist_color, background_image')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('デザイン取得エラー:', error);
            return;
        }

        if (data) {
            if (fontSelect && data.font_family) fontSelect.value = data.font_family;
            if (data.theme_color) syncThemeColor(data.theme_color);
            if (data.title_color) syncTitleTextColor(data.title_color);
            if (data.artist_color) syncArtistTextColor(data.artist_color);
            if (bgUrlInput && data.background_image) bgUrlInput.value = data.background_image;
            updatePreview();
        }
    }

    // 6. URLパラメータ取得 & 初期表示
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = parseInt(urlParams.get('id'), 10);

    if (streamerId) {
        if (streamerIdInput) streamerIdInput.value = streamerId;
        await loadCurrentDesign(streamerId);
    } else {
        alert('URLに配信者ID (?id=) が指定されていません。');
    }

    // 7. 保存処理（Edge Function呼び出し）
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
                            title_color: titleTextInput ? titleTextInput.value : '#333333', // ★ここも title_color に統一
                            artist_color: artistTextInput ? artistTextInput.value : '#666666',
                            background_image: bgUrlInput ? bgUrlInput.value.trim() : ''
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