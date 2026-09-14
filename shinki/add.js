const supabaseUrl =
    'https://dgssybbbgnnygmccjltn.supabase.co';

const supabaseKey =
    'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';

const supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );

const FURIGANA_FUNCTION_URL =
    `${supabaseUrl}/functions/v1/furigana`;

let generatedRows = [];

const inputBody =
    document.getElementById('input-body');

const previewBody =
    document.getElementById('preview-body');

const inputSection =
    document.getElementById('input-section');

const previewSection =
    document.getElementById('preview-section');

const message =
    document.getElementById('message');


// =========================
// 驟堺ｿ｡閠・D
// =========================

window.addEventListener('load', () => {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const streamerId =
        urlParams.get('id');

    if (streamerId) {

        document.getElementById(
            'streamer-id'
        ).value = streamerId;

    } else {

        alert(
            'URL縺ｫ驟堺ｿ｡閠・D・・id=1 縺ｪ縺ｩ・峨′莉倥＞縺ｦ縺・∪縺帙ｓ縲・
        );

    }

    // 譛蛻昴°繧・陦檎畑諢・
    for (let i = 0; i < 5; i++) {
        addInputRow();
    }

});


// =========================
// 豁後∴繧狗憾諷・
// =========================

function createStatusSelect(
    value = 'complete'
) {

    const select =
        document.createElement('select');

    select.className =
        'row-complete';

    select.innerHTML = `
        <option value="complete">
            譛蠕後∪縺ｧ豁後∴繧・
        </option>

        <option value="partial">
            騾比ｸｭ縺ｾ縺ｧ豁後∴繧・
        </option>

        <option value="practice">
            邱ｴ鄙剃ｸｭ
        </option>
    `;

    select.value = value;

    return select;
}


// =========================
// 蜈･蜉幄｡後ｒ霑ｽ蜉
// =========================

function addInputRow(
    artist = '',
    title = '',
    complete = 'complete',
    confident = false,
    intro = ''
) {

    const tr =
        document.createElement('tr');


    // 繧｢繝ｼ繝・ぅ繧ｹ繝・

    const artistTd =
        document.createElement('td');

    const artistInput =
        document.createElement('input');

    artistInput.type =
        'text';

    artistInput.className =
        'row-artist';

    artistInput.placeholder =
        '繧｢繝ｼ繝・ぅ繧ｹ繝・;

    artistInput.value =
        artist;

    artistTd.appendChild(
        artistInput
    );


    // 譖ｲ蜷・

    const titleTd =
        document.createElement('td');

    const titleInput =
        document.createElement('input');

    titleInput.type =
        'text';

    titleInput.className =
        'row-title';

    titleInput.placeholder =
        '譖ｲ蜷・;

    titleInput.value =
        title;

    titleTd.appendChild(
        titleInput
    );


    // 豁後∴繧狗憾諷・

    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            complete
        )
    );


    // 閾ｪ菫｡譖ｲ

    const confidentTd =
        document.createElement('td');

    confidentTd.className =
        'checkbox-cell';

    const confidentInput =
        document.createElement('input');

    confidentInput.type =
        'checkbox';

    confidentInput.className =
        'row-confident';

    confidentInput.checked =
        confident;

    confidentTd.appendChild(
        confidentInput
    );


    // 繧､繝ｳ繝医Ο

    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type =
        'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        '莉ｻ諢・;

    introInput.value =
        intro;

    introTd.appendChild(
        introInput
    );


    // 蜑企勁

    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        'ﾃ・;

    deleteButton.className =
        'delete-button';

    deleteButton.addEventListener(
        'click',
        () => {

            tr.remove();

            // 譛菴・陦後・谿九☆
            if (
                inputBody.children.length === 0
            ) {

                addInputRow();

            }

        }
    );

    deleteTd.appendChild(
        deleteButton
    );


    tr.appendChild(
        artistTd
    );

    tr.appendChild(
        titleTd
    );

    tr.appendChild(
        completeTd
    );

    tr.appendChild(
        confidentTd
    );

    tr.appendChild(
        introTd
    );

    tr.appendChild(
        deleteTd
    );

    inputBody.appendChild(
        tr
    );

}


// =========================
// 蜈･蜉帛・螳ｹ繧貞叙蠕・
// =========================

function collectInputRows() {

    const rows =
        document.querySelectorAll(
            '#input-body tr'
        );

    const result = [];


    rows.forEach(tr => {

        const artist =
            tr.querySelector(
                '.row-artist'
            ).value.trim();

        const title =
            tr.querySelector(
                '.row-title'
            ).value.trim();

        const complete =
            tr.querySelector(
                '.row-complete'
            ).value;

        const confident =
            tr.querySelector(
                '.row-confident'
            ).checked;

        const intro =
            tr.querySelector(
                '.row-intro'
            ).value.trim();


        // 螳悟・縺ｫ遨ｺ縺ｮ陦後・辟｡隕・

        if (
            !artist &&
            !title
        ) {

            return;

        }


        result.push({

            artist,
            title,
            complete,
            confident,
            intro

        });

    });


    return result;

}


// =========================
// 縺ｲ繧峨′縺ｪ逕滓・
// =========================

async function generateReadings(rows) {

    const requestRows =
        rows.map(row => ({

            artist:
                row.artist,

            title:
                row.title

        }));


    const response =
        await fetch(
            FURIGANA_FUNCTION_URL,
            {

                method:
                    'POST',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body:
                    JSON.stringify({

                        rows:
                            requestRows

                    })

            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        console.error(
            'JSON隗｣譫舌お繝ｩ繝ｼ:',
            error
        );

    }


    if (!response.ok) {

        const detail =
            data?.error ||
            `HTTP ${response.status}`;

        throw new Error(
            detail
        );

    }


    if (
        !Array.isArray(
            data?.rows
        )
    ) {

        throw new Error(
            'Edge Function縺九ｉ豁｣縺励＞蠖｢蠑上・邨先棡縺瑚ｿ斐＆繧後∪縺帙ｓ縺ｧ縺励◆縲・
        );

    }


    return data.rows;

}


// =========================
// 繝励Ξ繝薙Η繝ｼ陦後ｒ菴懈・
// =========================

function createPreviewRow(
    row,
    reading
) {

    const tr =
        document.createElement('tr');


    // 繧｢繝ｼ繝・ぅ繧ｹ繝・

    const artistTd =
        document.createElement('td');

    const artistInput =
        document.createElement('input');

    artistInput.type =
        'text';

    artistInput.className =
        'row-artist';

    artistInput.value =
        row.artist;

    artistTd.appendChild(
        artistInput
    );


    // 繧｢繝ｼ繝・ぅ繧ｹ繝郁ｪｭ縺ｿ

    const artistInitialTd =
        document.createElement('td');

    const artistInitialInput =
        document.createElement('input');

    artistInitialInput.type =
        'text';

    artistInitialInput.className =
        'row-artist-initial';

    artistInitialInput.value =
        reading.artist_initial || '';

    artistInitialTd.appendChild(
        artistInitialInput
    );


    // 譖ｲ蜷・

    const titleTd =
        document.createElement('td');

    const titleInput =
        document.createElement('input');

    titleInput.type =
        'text';

    titleInput.className =
        'row-title';

    titleInput.value =
        row.title;

    titleTd.appendChild(
        titleInput
    );


    // 譖ｲ蜷崎ｪｭ縺ｿ

    const titleInitialTd =
        document.createElement('td');

    const titleInitialInput =
        document.createElement('input');

    titleInitialInput.type =
        'text';

    titleInitialInput.className =
        'row-title-initial';

    titleInitialInput.value =
        reading.title_initial || '';

    titleInitialTd.appendChild(
        titleInitialInput
    );


    // 豁後∴繧狗憾諷・

    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            row.complete
        )
    );


    // 閾ｪ菫｡譖ｲ

    const confidentTd =
        document.createElement('td');

    confidentTd.className =
        'checkbox-cell';

    const confidentInput =
        document.createElement('input');

    confidentInput.type =
        'checkbox';

    confidentInput.className =
        'row-confident';

    confidentInput.checked =
        row.confident;

    confidentTd.appendChild(
        confidentInput
    );


    // 繧､繝ｳ繝医Ο

    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type =
        'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        '莉ｻ諢・;

    introInput.value =
        row.intro;

    introTd.appendChild(
        introInput
    );


    // 蜑企勁

    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        'ﾃ・;

    deleteButton.className =
        'delete-button';

    deleteButton.addEventListener(
        'click',
        () => {

            tr.remove();

        }
    );

    deleteTd.appendChild(
        deleteButton
    );


    tr.appendChild(
        artistTd
    );

    tr.appendChild(
        artistInitialTd
    );

    tr.appendChild(
        titleTd
    );

    tr.appendChild(
        titleInitialTd
    );

    tr.appendChild(
        completeTd
    );

    tr.appendChild(
        confidentTd
    );

    tr.appendChild(
        introTd
    );

    tr.appendChild(
        deleteTd
    );


    previewBody.appendChild(
        tr
    );

}


// =========================
// ・玖｡後ｒ霑ｽ蜉
// =========================

document
    .getElementById('add-row-btn')
    .addEventListener(
        'click',
        () => {

            addInputRow();

            const rows =
                inputBody.querySelectorAll(
                    'tr'
                );

            rows[rows.length - 1]
                ?.scrollIntoView({

                    behavior:
                        'smooth',

                    block:
                        'center'

                });

        }
    );


// =========================
// CSV雋ｼ繧贋ｻ倥￠
// =========================

document
    .getElementById('paste-btn')
    .addEventListener(
        'click',
        () => {

            const text =
                document.getElementById(
                    'csv-input'
                ).value.trim();


            if (!text) {

                alert(
                    '譖ｲ繝ｪ繧ｹ繝医ｒ雋ｼ繧贋ｻ倥￠縺ｦ縺上□縺輔＞縲・
                );

                return;

            }


            const lines =
                text.split(
                    /\r?\n/
                );

            let addedCount = 0;


            lines.forEach(
                line => {

                    const trimmed =
                        line.trim();


                    if (!trimmed) {
                        return;
                    }


                    // 繧ｿ繝悶・蜊願ｧ偵き繝ｳ繝槭・蜈ｨ隗偵き繝ｳ繝・

                    const parts =
                        trimmed.split(
                            /\t|,|・・
                        );


                    const artist =
                        (
                            parts[0] ||
                            ''
                        ).trim();


                    const title =
                        parts
                            .slice(1)
                            .join(',')
                            .trim();


                    if (
                        !artist &&
                        !title
                    ) {

                        return;

                    }


                    addInputRow(
                        artist,
                        title
                    );


                    addedCount++;

                }
            );


            document.getElementById(
                'csv-input'
            ).value = '';


            message.style.color =
                'green';


            message.textContent =
                `${addedCount}譖ｲ繧定｡ｨ縺ｫ霑ｽ蜉縺励∪縺励◆縲Ａ;

        }
    );


// =========================
// 蜈ｨ譖ｲ縺ｮ縺ｲ繧峨′縺ｪ逕滓・
// =========================

document
    .getElementById('generate-btn')
    .addEventListener(
        'click',
        async () => {

            const rows =
                collectInputRows();


            if (!rows.length) {

                alert(
                    '譖ｲ繧・譖ｲ莉･荳雁・蜉帙＠縺ｦ縺上□縺輔＞縲・
                );

                return;

            }


            // 遨ｺ谺・′豺ｷ縺悶▲縺ｦ縺・↑縺・°遒ｺ隱・

            const invalidRow =
                rows.find(
                    row =>
                        !row.artist ||
                        !row.title
                );


            if (invalidRow) {

                alert(
                    '繧｢繝ｼ繝・ぅ繧ｹ繝医→譖ｲ蜷阪・荳｡譁ｹ繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・
                );

                return;

            }


            const button =
                document.getElementById(
                    'generate-btn'
                );


            button.disabled =
                true;


            message.style.color =
                '';


            message.textContent =
                `${rows.length}譖ｲ縺ｮ隱ｭ縺ｿ繧堤函謌舌＠縺ｦ縺・∪縺吮ｦ`;


            try {

                const readings =
                    await generateReadings(
                        rows
                    );


                if (
                    readings.length !==
                    rows.length
                ) {

                    throw new Error(
                        '逕滓・縺輔ｌ縺溯ｪｭ縺ｿ縺ｮ莉ｶ謨ｰ縺梧峇謨ｰ縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
                    );

                }


                generatedRows =
                    rows.map(
                        (row, index) => ({

                            ...row,

                            reading:
                                readings[index]

                        })
                    );


                previewBody.innerHTML =
                    '';


                generatedRows.forEach(
                    item => {

                        createPreviewRow(
                            item,
                            item.reading
                        );

                    }
                );


                inputSection.style.display =
                    'none';

                previewSection.style.display =
                    'block';


                message.style.color =
                    'green';


                message.textContent =
                    `${rows.length}譖ｲ縺ｮ隱ｭ縺ｿ繧堤函謌舌＠縺ｾ縺励◆縲ら｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲Ａ;


                window.scrollTo({

                    top:
                        0,

                    behavior:
                        'smooth'

                });


            } catch (error) {

                console.error(
                    error
                );


                message.style.color =
                    'red';


                message.textContent =
                    '隱ｭ縺ｿ縺ｮ逕滓・縺ｫ螟ｱ謨励＠縺ｾ縺励◆・・ +
                    error.message;


            } finally {

                button.disabled =
                    false;

            }

        }
    );


// =========================
// 蜈･蜉帙↓謌ｻ繧・
// =========================

document
    .getElementById('back-btn')
    .addEventListener(
        'click',
        () => {

            inputSection.style.display =
                'block';

            previewSection.style.display =
                'none';


            message.style.color =
                '';

            message.textContent =
                '';


            window.scrollTo({

                top:
                    0,

                behavior:
                    'smooth'

            });

        }
    );


// =========================
// Supabase縺ｸ荳諡ｬ逋ｻ骭ｲ
// =========================

document
    .getElementById('submit-all-btn')
    .addEventListener(
        'click',
        async () => {

            const streamerId =
                parseInt(
                    document.getElementById(
                        'streamer-id'
                    ).value,
                    10
                );


            if (
                !Number.isInteger(
                    streamerId
                )
            ) {

                alert(
                    '驟堺ｿ｡閠・D縺梧ｭ｣縺励￥縺ゅｊ縺ｾ縺帙ｓ縲・
                );

                return;

            }


            const rows =
                document.querySelectorAll(
                    '#preview-body tr'
                );


            const insertData = [];


            rows.forEach(
                tr => {

                    const artist =
                        tr.querySelector(
                            '.row-artist'
                        ).value.trim();


                    const artistInitial =
                        tr.querySelector(
                            '.row-artist-initial'
                        ).value.trim();


                    const title =
                        tr.querySelector(
                            '.row-title'
                        ).value.trim();


                    const titleInitial =
                        tr.querySelector(
                            '.row-title-initial'
                        ).value.trim();


                    const completeValue =
                        tr.querySelector(
                            '.row-complete'
                        ).value;


                    const confident =
                        tr.querySelector(
                            '.row-confident'
                        ).checked;


                    const intro =
                        tr.querySelector(
                            '.row-intro'
                        ).value.trim();


                    if (
                        !artist ||
                        !title
                    ) {

                        return;

                    }


                    // DB縺ｮcomplete縺ｯ
                    // true / false / null

                    let complete = null;


                    if (
                        completeValue ===
                        'complete'
                    ) {

                        complete =
                            true;

                    } else if (
                        completeValue ===
                        'practice'
                    ) {

                        complete =
                            false;

                    } else {

                        // partial

                        complete =
                            null;

                    }


                    insertData.push({

                        streamer_id:
                            streamerId,

                        artist:
                            artist,

                        artist_initial:
                            artistInitial,

                        title:
                            title,

                        title_initial:
                            titleInitial,

                        complete:
                            complete,

                        confident:
                            confident,

                        intro:
                            intro || null

                    });

                }
            );


            if (
                !insertData.length
            ) {

                alert(
                    '逋ｻ骭ｲ縺ｧ縺阪ｋ譖ｲ縺後≠繧翫∪縺帙ｓ縲・
                );

                return;

            }


            const button =
                document.getElementById(
                    'submit-all-btn'
                );


            button.disabled =
                true;


            message.style.color =
                '';


            message.textContent =
                `${insertData.length}譖ｲ繧堤匳骭ｲ縺励※縺・∪縺吮ｦ`;


            try {

                const {
                    error
                } =
                    await supabaseClient
                        .from('songs')
                        .insert(
                            insertData
                        );


                if (error) {

                    throw error;

                }


                message.style.color =
                    'green';


                message.textContent =
                    `脂 ${insertData.length}譖ｲ繧剃ｸ諡ｬ逋ｻ骭ｲ縺励∪縺励◆・～;


                // 蜈･蜉帙ｒ繝ｪ繧ｻ繝・ヨ

                inputBody.innerHTML =
                    '';

                previewBody.innerHTML =
                    '';

                generatedRows =
                    [];


                // 5陦後↓謌ｻ縺・

                for (
                    let i = 0;
                    i < 5;
                    i++
                ) {

                    addInputRow();

                }


                inputSection.style.display =
                    'block';

                previewSection.style.display =
                    'none';


                window.scrollTo({

                    top:
                        0,

                    behavior:
                        'smooth'

                });


            } catch (error) {

                console.error(
                    error
                );


                message.style.color =
                    'red';


                message.textContent =
                    '逋ｻ骭ｲ繧ｨ繝ｩ繝ｼ・・ +
                    error.message;


            } finally {

                button.disabled =
                    false;

            }

        }
    );