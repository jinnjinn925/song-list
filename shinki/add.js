```js
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

let inputRows = [];
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
            '\u914d\u4fe1\u8005ID\u304c\u3042\u308a\u307e\u305b\u3093\u3002'
        );

    }

    for (let i = 0; i < 5; i++) {
        addInputRow();
    }

});


function escapeHtml(value) {

    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

}


function createStatusSelect(
    value = 'complete'
) {

    const select =
        document.createElement('select');

    select.className =
        'row-complete';

    select.innerHTML = `
        <option value="complete">
            \u6700\u5f8c\u307e\u3067\u6b4c\u3048\u308b
        </option>

        <option value="partial">
            \u9014\u4e2d\u307e\u3067\u6b4c\u3048\u308b
        </option>

        <option value="practice">
            \u7df4\u7fd2\u4e2d
        </option>
    `;

    select.value = value;

    return select;
}


function addInputRow(
    artist = '',
    title = '',
    complete = 'complete',
    confident = false,
    intro = ''
) {

    const tr =
        document.createElement('tr');


    const artistTd =
        document.createElement('td');

    const artistInput =
        document.createElement('input');

    artistInput.type = 'text';
    artistInput.className = 'row-artist';
    artistInput.placeholder =
        '\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8';
    artistInput.value = artist;

    artistTd.appendChild(
        artistInput
    );


    const titleTd =
        document.createElement('td');

    const titleInput =
        document.createElement('input');

    titleInput.type = 'text';
    titleInput.className = 'row-title';
    titleInput.placeholder =
        '\u66f2\u540d';
    titleInput.value = title;

    titleTd.appendChild(
        titleInput
    );


    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(complete)
    );


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


    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type = 'text';
    introInput.className =
        'row-intro';

    introInput.placeholder =
        '\u4efb\u610f';

    introInput.value =
        intro;

    introTd.appendChild(
        introInput
    );


    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        '\u00d7';

    deleteButton.className =
        'delete-button';

    deleteButton.addEventListener(
        'click',
        () => {

            tr.remove();

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


    tr.appendChild(artistTd);
    tr.appendChild(titleTd);
    tr.appendChild(completeTd);
    tr.appendChild(confidentTd);
    tr.appendChild(introTd);
    tr.appendChild(deleteTd);

    inputBody.appendChild(tr);

}


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


        if (!artist && !title) {
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


async function generateReadings(rows) {

    const requestRows =
        rows.map(row => ({
            artist: row.artist,
            title: row.title
        }));


    const response =
        await fetch(
            FURIGANA_FUNCTION_URL,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    rows: requestRows
                })
            }
        );


    let data = null;

    try {

        data =
            await response.json();

    } catch (_) {
    }


    if (!response.ok) {

        const detail =
            data?.error ||
            `HTTP ${response.status}`;

        throw new Error(detail);
    }


    if (!Array.isArray(data?.rows)) {

        throw new Error(
            '\u8aad\u307f\u306e\u751f\u6210\u7d50\u679c\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093\u3002'
        );

    }


    return data.rows;

}


function createPreviewRow(
    row,
    reading
) {

    const tr =
        document.createElement('tr');


    const artistTd =
        document.createElement('td');

    const artistInput =
        document.createElement('input');

    artistInput.type = 'text';
    artistInput.className =
        'row-artist';

    artistInput.value =
        row.artist;

    artistTd.appendChild(
        artistInput
    );


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


    const titleTd =
        document.createElement('td');

    const titleInput =
        document.createElement('input');

    titleInput.type = 'text';

    titleInput.className =
        'row-title';

    titleInput.value =
        row.title;

    titleTd.appendChild(
        titleInput
    );


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


    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            row.complete
        )
    );


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


    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type = 'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        '\u4efb\u610f';

    introInput.value =
        row.intro;

    introTd.appendChild(
        introInput
    );


    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        '\u00d7';

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


    tr.appendChild(artistTd);
    tr.appendChild(artistInitialTd);
    tr.appendChild(titleTd);
    tr.appendChild(titleInitialTd);
    tr.appendChild(completeTd);
    tr.appendChild(confidentTd);
    tr.appendChild(introTd);
    tr.appendChild(deleteTd);


    previewBody.appendChild(tr);

}


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
                    behavior: 'smooth',
                    block: 'center'
                });

        }
    );


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
                    '\u66f2\u30ea\u30b9\u30c8\u3092\u8cbc\u308a\u4ed8\u3051\u3066\u304f\u3060\u3055\u3044\u3002'
                );

                return;
            }


            const lines =
                text.split(/\r?\n/);

            let addedCount = 0;


            lines.forEach(line => {

                const trimmed =
                    line.trim();

                if (!trimmed) {
                    return;
                }


                const parts =
                    trimmed.split(
                        /\t|,|C/
                    );


                const artist =
                    (parts[0] || '').trim();

                const title =
                    parts
                        .slice(1)
                        .join(',')
                        .trim();


                if (!artist && !title) {
                    return;
                }


                addInputRow(
                    artist,
                    title
                );

                addedCount++;

            });


            document.getElementById(
                'csv-input'
            ).value = '';


            message.style.color =
                'green';

            message.textContent =
                `${addedCount}\u66f2\u3092\u8868\u306b\u8ffd\u52a0\u3057\u307e\u3057\u305f\u3002`;

        }
    );


document
    .getElementById('generate-btn')
    .addEventListener(
        'click',
        async () => {

            const rows =
                collectInputRows();


            if (!rows.length) {

                alert(
                    '\u66f2\u3092\u0031\u66f2\u4ee5\u4e0a\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
                );

                return;
            }


            const invalidRow =
                rows.find(
                    row =>
                        !row.artist ||
                        !row.title
                );


            if (invalidRow) {

                alert(
                    '\u30a2\u30fc\u30c6\u30a3\u30b9\u30c8\u3068\u66f2\u540d\u306e\u4e21\u65b9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
                );

                return;
            }


            const button =
                document.getElementById(
                    'generate-btn'
                );

            button.disabled = true;


            message.style.color =
                '';

            message.textContent =
                `${rows.length}\u66f2\u306e\u8aad\u307f\u3092\u751f\u6210\u3057\u3066\u3044\u307e\u3059...`;


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
                        '\u751f\u6210\u3055\u308c\u305f\u8aad\u307f\u306e\u4ef6\u6570\u304c\u66f2\u6570\u3068\u4e00\u81f4\u3057\u307e\u305b\u3093\u3002'
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
                    `${rows.length}\u662f\u306e\u8aad\u307f\u3092\u751f\u6210\u3057\u307e\u3057\u305f\u3002\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002`;


                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });


            } catch (error) {

                console.error(error);

                message.style.color =
                    'red';

                message.textContent =
                    '\u8aad\u307f\u306e\u751f\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\uff1a' +
                    error.message;

            } finally {

                button.disabled =
                    false;

            }

        }
    );


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
                top: 0,
                behavior: 'smooth'
            });

        }
    );


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
                    '\u914d\u4fe1\u8005ID\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093\u3002'
                );

                return;
            }


            const rows =
                document.querySelectorAll(
                    '#preview-body tr'
                );

            const insertData = [];


            rows.forEach(tr => {

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


                if (!artist || !title) {
                    return;
                }


                let complete = null;


                if (
                    completeValue ===
                    'complete'
                ) {

                    complete = true;

                } else if (
                    completeValue ===
                    'practice'
                ) {

                    complete = false;

                } else {

                    complete = null;

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

            });


            if (!insertData.length) {

                alert(
                    '\u767b\u9332\u3067\u304d\u308b\u66f2\u304c\u3042\u308a\u307e\u305b\u3093\u3002'
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
                `${insertData.length}\u66f2\u3092\u767b\u9332\u3057\u3066\u3044\u307e\u3059...`;


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
                    `\ud83c\udf89 ${insertData.length}\u662f\u3092\u4e00\u62ec\u767b\u9332\u3057\u307e\u3057\u305f\uff01`;


                inputBody.innerHTML =
                    '';

                previewBody.innerHTML =
                    '';

                generatedRows =
                    [];


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
                    top: 0,
                    behavior: 'smooth'
                });


            } catch (error) {

                console.error(error);

                message.style.color =
                    'red';

                message.textContent =
                    '\u767b\u9332\u30a8\u30e9\u30fc\uff1a' +
                    error.message;

            } finally {

                button.disabled =
                    false;

            }

        }
    );
```
