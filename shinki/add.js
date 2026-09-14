const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';
const supabaseKey = 'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Supabase Edge Function endpoint.
// Deploy the function in supabase/functions/furigana.
const FURIGANA_FUNCTION_URL =
    `${supabaseUrl}/functions/v1/furigana`;

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('id');

    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
    	alert('URLに配信者ID（?id=1 など）が付いていません。');
	}
});

function parseInput(text) {
    return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
        // tab / comma / full-width comma / 2+ spaces
        const parts = line.split(/\t|,|・芸\s{2,}/);
        return {
            artist: (parts[0] || '').trim(),
            title: (parts.slice(1).join(',') || '').trim()
        };
    }).filter(row => row.artist || row.title);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function generateReadings(rows) {
    const res = await fetch(FURIGANA_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
    });

    let data = null;
    try {
        data = await res.json();
    } catch (_) {}

    if (!res.ok) {
        const detail = data?.error || `HTTP ${res.status}`;
        throw new Error(detail);
    }

    if (!Array.isArray(data?.rows)) {
        throw new Error('Edge Function縺九ｉ荳肴ｭ｣縺ｪ蠖｢蠑上・邨先棡縺瑚ｿ斐ｊ縺ｾ縺励◆縲・);
    }

    return data.rows;
}

document
    .getElementById('single-submit-btn')
    .addEventListener('click', async () => {

        const streamerId =
            parseInt(
                document.getElementById('streamer-id').value,
                10
            );

        const artist =
            document
                .getElementById('single-artist')
                .value
                .trim();

        const title =
            document
                .getElementById('single-title')
                .value
                .trim();

        const completeValue =
            document.querySelector(
                'input[name="single-complete"]:checked'
            ).value;

        const confident =
            document.getElementById(
                'single-confident'
            ).checked;

        const intro =
            document
                .getElementById('single-intro')
                .value
                .trim();

        const message =
            document.getElementById(
                'single-message'
            );

        if (!artist || !title) {

            message.textContent =
                'アーティスト名と曲名を入力してください。';

            message.style.color =
                '#c0392b';

            return;
        }

        message.textContent =
            'ふりがなを生成中...';

        message.style.color =
            '#555';

        try {

            const rows = [
                {
                    artist: artist,
                    title: title
                }
            ];

            const result =
                await generateReadings(rows);

            if (
                !result ||
                result.length === 0
            ) {
                throw new Error(
                    'ふりがなの生成結果を取得できませんでした。'
                );
            }

            const reading =
                result[0];

            document
                .getElementById(
                    'single-artist-initial'
                )
                .value =
                reading.artist_initial || '';

            document
                .getElementById(
                    'single-title-initial'
                )
                .value =
                reading.title_initial || '';

            message.textContent =
                'ふりがなを生成しました。内容を確認してから登録してください。';

            message.style.color =
                '#555';

        } catch (error) {

            console.error(error);

            message.textContent =
                'ふりがなの生成に失敗しました：' +
                error.message;

            message.style.color =
                '#c0392b';
        }
    });

document.getElementById('parse-btn').addEventListener('click', async () => {
    const textInput = document.getElementById('csv-input').value.trim();
    if (!textInput) {
        alert('譖ｲ繝ｪ繧ｹ繝医ｒ雋ｼ繧贋ｻ倥￠縺ｦ縺上□縺輔＞縲・);
        return;
    }

    const rows = parseInput(textInput);
    if (!rows.length) {
        alert('繧｢繝ｼ繝・ぅ繧ｹ繝亥錐縺ｨ譖ｲ蜷阪ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
        return;
    }

    const button = document.getElementById('parse-btn');
    const message = document.getElementById('message');
    button.disabled = true;
    message.style.color = '';
    message.textContent = `${rows.length} 莉ｶ縺ｮ隱ｭ縺ｿ繧堤函謌舌＠縺ｦ縺・∪縺吮ｦ`;

    try {
        const resultRows = await generateReadings(rows);

        const previewBody = document.getElementById('preview-body');
        previewBody.innerHTML = '';

        resultRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:6px;">
                    <input type="text" class="row-artist" value="${escapeHtml(row.artist)}" style="width:90%;">
                </td>
                <td style="padding:6px;">
                    <input type="text" class="row-artist-initial" value="${escapeHtml(row.artist_initial)}" style="width:90%;">
                </td>
                <td style="padding:6px;">
                    <input type="text" class="row-title" value="${escapeHtml(row.title)}" style="width:90%;">
                </td>
                <td style="padding:6px;">
                    <input type="text" class="row-title-initial" value="${escapeHtml(row.title_initial)}" style="width:90%;">
                </td>
            `;
            previewBody.appendChild(tr);
        });

        document.getElementById('step-2').style.display = 'block';
        message.style.color = 'green';
        message.textContent = `${resultRows.length} 莉ｶ繧定ｧ｣譫舌＠縺ｾ縺励◆縲りｪｭ縺ｿ繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲Ａ;
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = '隱ｭ縺ｿ縺ｮ逕滓・縺ｫ螟ｱ謨励＠縺ｾ縺励◆: ' + error.message;
    } finally {
        button.disabled = false;
    }
});

document.getElementById('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    if (!Number.isInteger(streamerId)) {
        alert('驟堺ｿ｡閠・D縺梧ｭ｣縺励￥縺ゅｊ縺ｾ縺帙ｓ縲・);
        return;
    }

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
        alert('逋ｻ骭ｲ縺ｧ縺阪ｋ譖ｲ縺後≠繧翫∪縺帙ｓ縲・);
        return;
    }

    const message = document.getElementById('message');
    message.textContent = '騾∽ｿ｡荳ｭ...';

    const { error } = await supabaseClient.from('songs').insert(insertData);

    if (error) {
        message.style.color = 'red';
        message.textContent = '繧ｨ繝ｩ繝ｼ: ' + error.message;
    } else {
        message.style.color = 'green';
        message.textContent = `脂 ${insertData.length} 莉ｶ繧剃ｸ諡ｬ逋ｻ骭ｲ縺励∪縺励◆・～;
        document.getElementById('csv-input').value = '';
        document.getElementById('step-2').style.display = 'none';
    }
});
