// JavaScript Document
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://dgssybbbgnnygmccjltn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd'; // ご自身の anon key を設定してください

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const selectEl = document.getElementById('streamer-select');
    const fontSelect = document.getElementById('font-family');
    const themeInput = document.getElementById('theme-color');
    const textInput = document.getElementById('text-color');

    const themeCode = document.getElementById('theme-color-code');
    const textCode = document.getElementById('text-color-code');

    const previewArea = document.getElementById('preview-area');
    const previewBtn = document.getElementById('preview-btn');
    const form = document.getElementById('custom-form');
    const messageEl = document.getElementById('status-message');

    let streamersData = [];

    // 1. 配信者一覧を取得
    try {
        const { data, error } = await supabase
            .from('streamers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        streamersData = data;
        selectEl.innerHTML = '<option value="">配信者を選択してください</option>' + 
            data.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (@${escapeHtml(s.url_id)})</option>`).join('');

    } catch (err) {
        console.error('配信者取得エラー:', err);
        selectEl.innerHTML = '<option value="">読み込み失敗</option>';
    }

    // 2. プレビューのリアルタイム更新
    function updatePreview() {
        const fontVal = fontSelect.value;
        const themeVal = themeInput.value;
        const textVal = textInput.value;

        themeCode.textContent = themeVal;
        textCode.textContent = textVal;

        previewArea.style.fontFamily = fontVal;
        previewArea.style.color = textVal;
        previewBtn.style.backgroundColor = themeVal;
    }

    fontSelect.addEventListener('change', updatePreview);
    themeInput.addEventListener('input', updatePreview);
    textInput.addEventListener('input', updatePreview);

    // 3. 配信者切替時にDBから取得した値を反映
    selectEl.addEventListener('change', () => {
        const selectedId = selectEl.value;
        const streamer = streamersData.find(s => String(s.id) === String(selectedId));

        if (streamer) {
            fontSelect.value = streamer.font_family || 'sans-serif';
            themeInput.value = streamer.theme_color || '#007bff';
            textInput.value = streamer.text_color || '#333333';
            updatePreview();
        }
    });

    // 4. 設定の保存（UPDATE）
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const streamerId = selectEl.value;
        if (!streamerId) {
            alert('配信者を選択してください。');
            return;
        }

        messageEl.style.display = 'none';

        try {
            const { error } = await supabase
                .from('streamers')
                .update({
                    font_family: fontSelect.value,
                    theme_color: themeInput.value,
                    text_color: textInput.value
                })
                .eq('id', streamerId);

            if (error) throw error;

            messageEl.textContent = 'デザイン設定を保存しました！';
            messageEl.className = 'message success';
            messageEl.style.display = 'block';

            // キャッシュデータ更新
            const target = streamersData.find(s => String(s.id) === String(streamerId));
            if (target) {
                target.font_family = fontSelect.value;
                target.theme_color = themeInput.value;
                target.text_color = textInput.value;
            }

        } catch (err) {
            console.error('保存エラー:', err);
            messageEl.textContent = '保存に失敗しました: ' + err.message;
            messageEl.className = 'message error';
            messageEl.style.display = 'block';
        }
    });

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
});