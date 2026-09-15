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

const managementKeyInput =
    document.getElementById('management-key');


// ========================================
// Get streamer ID from URL
// ========================================

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
            'Streamer ID is missing from the URL.'
        );

    }

    for (let i = 0; i < 5; i++) {
        addInputRow();
    }
	
	loadRegisteredSongs();

});


// ========================================
// Create complete status select
// ========================================

function createStatusSelect(
    value = 'complete'
) {

    const select =
        document.createElement('select');

    select.className =
        'row-complete';

    const optionComplete =
        document.createElement('option');

    optionComplete.value =
        'complete';

    optionComplete.textContent =
        '最後まで';

    const optionPartial =
        document.createElement('option');

    optionPartial.value =
        'partial';

    optionPartial.textContent =
        '途中まで';

    const optionPractice =
        document.createElement('option');

    optionPractice.value =
        'practice';

    optionPractice.textContent =
        '練習中';

    select.appendChild(
        optionComplete
    );

    select.appendChild(
        optionPartial
    );

    select.appendChild(
        optionPractice
    );

    select.value =
        value;

    return select;
}

// ========================================
// Add input row
// ========================================

function addInputRow(
    artist = '',
    title = '',
    complete = 'complete',
    confident = false,
    intro = ''
) {

    const tr =
        document.createElement('tr');


    // Artist

    const artistTd =
        document.createElement('td');

    const artistInput =
        document.createElement('input');

    artistInput.type =
        'text';

    artistInput.className =
        'row-artist';

    artistInput.placeholder =
        'Artist';

    artistInput.value =
        artist;

    artistTd.appendChild(
        artistInput
    );


    // Title

    const titleTd =
        document.createElement('td');

    const titleInput =
        document.createElement('input');

    titleInput.type =
        'text';

    titleInput.className =
        'row-title';

    titleInput.placeholder =
        'Title';

    titleInput.value =
        title;

    titleTd.appendChild(
        titleInput
    );


    // Complete status

    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            complete
        )
    );


    // Confident

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


    // Intro

    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type =
        'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        'Optional';

    introInput.value =
        intro;

    introTd.appendChild(
        introInput
    );


    // Delete

    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        'X';

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


// ========================================
// Collect input rows
// ========================================

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


        if (
            !artist &&
            !title
        ) {

            return;

        }


        result.push({

            artist:
                artist,

            title:
                title,

            complete:
                complete,

            confident:
                confident,

            intro:
                intro

        });

    });


    return result;

}


// ========================================
// Generate readings
// ========================================

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
            'Invalid response from furigana function.'
        );

    }


    return data.rows;

}


// ========================================
// Create preview row
// ========================================

function createPreviewRow(
    row,
    reading
) {

    const tr =
        document.createElement('tr');


    // Artist

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


    // Artist reading

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


    // Title

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


    // Title reading

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


    // Complete status

    const completeTd =
        document.createElement('td');

    completeTd.appendChild(
        createStatusSelect(
            row.complete
        )
    );


    // Confident

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


    // Intro

    const introTd =
        document.createElement('td');

    const introInput =
        document.createElement('input');

    introInput.type =
        'text';

    introInput.className =
        'row-intro';

    introInput.placeholder =
        'Optional';

    introInput.value =
        row.intro || '';

    introTd.appendChild(
        introInput
    );


    // Delete

    const deleteTd =
        document.createElement('td');

    deleteTd.className =
        'delete-cell';

    const deleteButton =
        document.createElement('button');

    deleteButton.type =
        'button';

    deleteButton.textContent =
        'X';

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


// ========================================
// Add row button
// ========================================

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

            if (
                rows.length > 0
            ) {

                rows[
                    rows.length - 1
                ].scrollIntoView({

                    behavior:
                        'smooth',

                    block:
                        'center'

                });

            }

        }
    );



// ========================================
// Generate all readings
// ========================================

document
    .getElementById('generate-btn')
    .addEventListener(
        'click',
        async () => {

            const rows =
                collectInputRows();


            if (!rows.length) {

                alert(
                    'Please enter at least one song.'
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
                    'Both artist and title are required.'
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
                'Generating readings...';


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
                        'Reading count does not match song count.'
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
                    'Readings generated. Please review them.';


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
                    'Reading generation failed: ' +
                    error.message;


            } finally {

                button.disabled =
                    false;

            }

        }
    );


// ========================================
// Back button
// ========================================

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


// ========================================
// Insert into Supabase
// ========================================

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
                    'Streamer ID is invalid.'
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


                    let complete =
                        null;


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
                    'There are no songs to register.'
                );

                return;

            }


            const button =
                document.getElementById(
                    'submit-all-btn'
                );

			const submitError =
    			document.getElementById(
        			'submit-error'
    			);

			submitError.textContent = '';
			submitError.style.color = '';


            button.disabled =
                true;


            message.style.color =
                '';


            message.textContent =
                'Registering...';


            try {

                const managementKey =
    				document.getElementById(
        				'management-key'
    				).value.trim();

				if (!managementKey) {

    				submitError.textContent =
        				'管理キーを入力してください。';

    				return;

				}

				const streamerId =
    				document.getElementById(
        				'streamer-id'
    				).value;

				const response =
    				await fetch(
        				`${supabaseUrl}/functions/v1/management`,
        				{
            				method: 'POST',

            				headers: {
                				'Content-Type':
                    				'application/json'
            				},

            				body: JSON.stringify({
                				action: 'insert',

                				streamer_id:
                    				Number(streamerId),

                				management_key:
                    				managementKey,

                				songs:
                    				insertData
            				})
        				}
    				);

				const result =
    				await response.json();

				if (!response.ok) {

    				submitError.textContent =
        				result.error ||
        				'曲の登録に失敗しました。';

    				return;
				}


                submitError.style.color =
    				'green';

				submitError.textContent =
    				insertData.length +
    				'曲を登録しました。';


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
                    'Registration error: ' +
                    error.message;


            } finally {

                button.disabled =
                    false;

            }

        }
    );


// ========================================
// Load registered songs
// ========================================

const registeredBody =
    document.getElementById(
        'registered-body'
    );

const selectAllSongs =
    document.getElementById(
        'select-all-songs'
    );

const reloadSongsBtn =
    document.getElementById(
        'reload-songs-btn'
    );

const deleteSelectedBtn =
    document.getElementById(
        'delete-selected-btn'
    );


// ----------------------------------------
// Complete status label
// ----------------------------------------

function getStatusLabel(complete) {

    if (complete === true) {
        return '最後まで';
    }

    if (complete === false) {
        return '練習中';
    }

    return '途中まで';
}


// ----------------------------------------
// Load songs
// ----------------------------------------

async function loadRegisteredSongs() {

    const streamerId =
        parseInt(
            document.getElementById(
                'streamer-id'
            ).value,
            10
        );

    if (!Number.isInteger(streamerId)) {
        return;
    }

    registeredBody.innerHTML = '';

    registeredBody.innerHTML =
        '<tr><td colspan="6">読み込み中...</td></tr>';

    const {
        data: songs,
        error
    } =
        await supabaseClient
            .from('songs')
            .select(
                'id, artist, title, complete, confident, intro'
            )
            .eq(
                'streamer_id',
                streamerId
            )
            .order(
                'artist',
                { ascending: true }
            )
            .order(
                'title',
                { ascending: true }
            );

    if (error) {

        console.error(error);

        registeredBody.innerHTML =
            '<tr><td colspan="6">曲一覧の取得に失敗しました。</td></tr>';

        message.style.color = 'red';

        message.textContent =
            '曲一覧の取得に失敗しました：' +
            error.message;

        return;
    }


    registeredBody.innerHTML = '';


    if (!songs || songs.length === 0) {

        registeredBody.innerHTML =
            '<tr><td colspan="6">登録されている曲はありません。</td></tr>';

        selectAllSongs.checked = false;

        return;
    }


    songs.forEach(song => {

        const tr =
            document.createElement('tr');


        // --------------------------------
        // Checkbox
        // --------------------------------

        const checkTd =
            document.createElement('td');

        checkTd.className =
            'checkbox-cell';

        const checkbox =
            document.createElement('input');

        checkbox.type =
            'checkbox';

        checkbox.className =
            'registered-song-checkbox';

        checkbox.dataset.id =
            song.id;

        checkTd.appendChild(
            checkbox
        );


        // --------------------------------
        // Artist
        // --------------------------------

        const artistTd =
            document.createElement('td');

        artistTd.textContent =
            song.artist || '';


        // --------------------------------
        // Title
        // --------------------------------

        const titleTd =
            document.createElement('td');

        titleTd.textContent =
            song.title || '';


        // --------------------------------
        // Status
        // --------------------------------

        const statusTd =
            document.createElement('td');

        statusTd.textContent =
            getStatusLabel(
                song.complete
            );


        // --------------------------------
        // Confident
        // --------------------------------

        const confidentTd =
            document.createElement('td');

        confidentTd.className =
            'checkbox-cell';

        confidentTd.textContent =
            song.confident === true
                ? '✓'
                : '';


        // --------------------------------
        // Intro
        // --------------------------------

        const introTd =
            document.createElement('td');

        introTd.textContent =
            song.intro || '';


        tr.appendChild(
            checkTd
        );

        tr.appendChild(
            artistTd
        );

        tr.appendChild(
            titleTd
        );

        tr.appendChild(
            statusTd
        );

        tr.appendChild(
            confidentTd
        );

        tr.appendChild(
            introTd
        );


        registeredBody.appendChild(
            tr
        );

    });


    selectAllSongs.checked = false;
}


// ========================================
// Select all
// ========================================

selectAllSongs.addEventListener(
    'change',
    () => {

        const checkboxes =
            document.querySelectorAll(
                '.registered-song-checkbox'
            );

        checkboxes.forEach(
            checkbox => {

                checkbox.checked =
                    selectAllSongs.checked;

            }
        );

    }
);


// ========================================
// Reload
// ========================================

reloadSongsBtn.addEventListener(
    'click',
    async () => {

        await loadRegisteredSongs();

    }
);


// ========================================
// Delete selected songs
// ========================================

deleteSelectedBtn.addEventListener(
    'click',
    async () => {

        const selected =
            Array.from(
                document.querySelectorAll(
                    '.registered-song-checkbox:checked'
                )
            );


        if (selected.length === 0) {

            alert(
                '削除する曲を選択してください。'
            );

            return;
        }


        const ids =
            selected.map(
                checkbox =>
                    parseInt(
                        checkbox.dataset.id,
                        10
                    )
            );


        const confirmed =
            confirm(
                `${ids.length}曲を削除します。\n\nこの操作は元に戻せません。`
            );


        if (!confirmed) {
            return;
        }


        deleteSelectedBtn.disabled =
            true;


        message.style.color = '';

        message.textContent =
            '削除しています...';


        try {

            const managementKey =
                document.getElementById(
                    'management-key'
                ).value.trim();


            if (!managementKey) {

                throw new Error(
                    '管理キーを入力してください。'
                );

            }


            const streamerId =
                document.getElementById(
                    'streamer-id'
                ).value;


            const response =
                await fetch(
                    `${supabaseUrl}/functions/v1/management`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            action:
                                'delete',

                            streamer_id:
                                Number(streamerId),

                            management_key:
                                managementKey,

                            song_ids:
                                ids

                        })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    '曲の削除に失敗しました。'
                );

            }


            message.style.color =
                'green';

            message.textContent =
                `${ids.length}曲を削除しました。`;


            await loadRegisteredSongs();


        } catch (error) {

            console.error(error);

            message.style.color =
                'red';

            message.textContent =
                '削除に失敗しました：' +
                error.message;

        } finally {

            deleteSelectedBtn.disabled =
                false;

        }

    }
);