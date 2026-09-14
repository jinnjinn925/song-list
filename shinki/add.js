const supabaseUrl =
    'https://dgssybbbgnnygmccjltn.supabase.co';

const supabaseKey =
    'sb_publishable_JNz1mi6gysaFjOa0I4I5ow_iDe3PQbd';

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
// 配信者ID
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
            'URLに配信者ID（?id=1 など）が付いていません。'
        );

    }

    // 最初から5行用意
    for (let i = 0; i < 5; i++) {
        addInputRow();
    }

});


// =========================
// 歌える状態
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
            最後まで歌える
        </option>

        <option value="partial">
            途中まで歌える
        </option>

        <option value="practice">
            練習中
        </option>
    `;

    select.value = value;

    return select;
}


// =========================
// 入力行を追加
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


    // アーティスト

    const artistTd =
        document.createElement('td');

    const artistInput =
        document.createElement('input');

    artistInput.type =
        'text';

    artistInput.className =
        'row-artist';

    artistInput.placeholder =
        'アーティスト';

    artistInput.value =
        artist;

    artistTd.appendChild(
        artistInput
    );


    // 曲名

    const titleTd =
        document.createElement('td');

    const titleInput =
        document.createElement('input');

    titleInput.type =
        'text';

    titleInput.className =
        'row-title';

    titleInput.placeholder =
        '曲名';

    titleInput.value =
        title;

    titleTd.appendChild(
        titleInput
    );


    // 歌える状態

    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            complete
        )
    );


    // 自信曲

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


    // イントロ

    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type =
        'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        '任意';

    introInput.value =
        intro;

    introTd.appendChild(
        introInput
    );


    // 削除

    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        '×';

    deleteButton.className =
        'delete-button';

    deleteButton.addEventListener(
        'click',
        () => {

            tr.remove();

            // 最低1行は残す
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
// 入力内容を取得
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


        // 完全に空の行は無視

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
// ひらがな生成
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
            'JSON解析エラー:',
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
            'Edge Functionから正しい形式の結果が返されませんでした。'
        );

    }


    return data.rows;

}


// =========================
// プレビュー行を作成
// =========================

function createPreviewRow(
    row,
    reading
) {

    const tr =
        document.createElement('tr');


    // アーティスト

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


    // アーティスト読み

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


    // 曲名

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


    // 曲名読み

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


    // 歌える状態

    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            row.complete
        )
    );


    // 自信曲

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


    // イントロ

    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type =
        'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        '任意';

    introInput.value =
        row.intro;

    introTd.appendChild(
        introInput
    );


    // 削除

    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        '×';

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
// ＋行を追加
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
// CSV貼り付け
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
                    '曲リストを貼り付けてください。'
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


                    // タブ・半角カンマ・全角カンマ

                    const parts =
                        trimmed.split(
                            /\t|,|，/
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
                `${addedCount}曲を表に追加しました。`;

        }
    );


// =========================
// 全曲のひらがな生成
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
                    '曲を1曲以上入力してください。'
                );

                return;

            }


            // 空欄が混ざっていないか確認

            const invalidRow =
                rows.find(
                    row =>
                        !row.artist ||
                        !row.title
                );


            if (invalidRow) {

                alert(
                    'アーティストと曲名の両方を入力してください。'
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
                `${rows.length}曲の読みを生成しています…`;


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
                        '生成された読みの件数が曲数と一致しません。'
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
                    `${rows.length}曲の読みを生成しました。確認してください。`;


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
                    '読みの生成に失敗しました：' +
                    error.message;


            } finally {

                button.disabled =
                    false;

            }

        }
    );


// =========================
// 入力に戻る
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
// Supabaseへ一括登録
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
                    '配信者IDが正しくありません。'
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


                    // DBのcompleteは
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
                    '登録できる曲がありません。'
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
                `${insertData.length}曲を登録しています…`;


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
                    `🎉 ${insertData.length}曲を一括登録しました！`;


                // 入力をリセット

                inputBody.innerHTML =
                    '';

                previewBody.innerHTML =
                    '';

                generatedRows =
                    [];


                // 5行に戻す

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
                    '登録エラー：' +
                    error.message;


            } finally {

                button.disabled =
                    false;

            }

        }
    );