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
let existingArtists = [];
let favoriteArtistNames = [];

const favoriteArtistsSelected = document.getElementById('favorite-artists-selected');
const favoriteArtistSearch = document.getElementById('favorite-artist-search');
const favoriteArtistsList = document.getElementById('favorite-artists-list');
const saveFavoriteArtistsBtn = document.getElementById('save-favorite-artists-btn');
const favoriteArtistsMessage = document.getElementById('favorite-artists-message');

// ========================================
// 文字列整形のヘルパー関数
// ========================================

// 1. 照合・検索用（全角半角スペースを全て除外して小文字化）
function normalizeName(str) {
    if (!str) return '';
    return str.replace(/[\s\u3000]+/g, '').toLowerCase();
}

// 2. 表示・保存用（連続スペースを「半角スペース1つ」に統一して端を削る）
function formatName(str) {
    if (!str) return '';
    return str.replace(/[\s\u3000]+/g, ' ').trim();
}

// ========================================
// アーティストデータ取得・管理
// ========================================

async function loadExistingArtists() {
    const { data, error } = await supabaseClient
        .from('artists')
        .select(`id, name, artist_initial`)
        .order('name', { ascending: true });

    if (error) {
        console.error('アーティスト一覧の取得に失敗しました。', error);
        return;
    }
    existingArtists = data || [];
}

function createArtistDatalist() {
    let datalist = document.getElementById('artist-list');
    if (datalist) datalist.remove();

    datalist = document.createElement('datalist');
    datalist.id = 'artist-list';

    existingArtists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist.name;
        datalist.appendChild(option);
    });

    document.body.appendChild(datalist);
}

// ========================================
// 好きなアーティスト表示関連
// ========================================

function renderFavoriteArtists() {
    if (!favoriteArtistsSelected) return;
    favoriteArtistsSelected.innerHTML = '';

    if (favoriteArtistNames.length === 0) {
        favoriteArtistsSelected.textContent = 'まだ選択されていません。';
        return;
    }

    favoriteArtistNames.forEach(artistName => {
        const chip = document.createElement('span');
        chip.className = 'favorite-chip';
        chip.textContent = artistName;
        favoriteArtistsSelected.appendChild(chip);
    });
}

function renderFavoriteArtistList() {
    if (!favoriteArtistsList) return;

    const searchText = favoriteArtistSearch ? favoriteArtistSearch.value.trim().toLowerCase() : '';
    favoriteArtistsList.innerHTML = '';

    const filteredArtists = existingArtists.filter(artist => {
        if (!searchText) return true;
        return artist.name.toLowerCase().includes(searchText);
    });

    if (filteredArtists.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'favorite-artist-item';
        empty.textContent = '該当するアーティストがありません。';
        favoriteArtistsList.appendChild(empty);
        return;
    }

    filteredArtists.forEach(artist => {
        const item = document.createElement('div');
        item.className = 'favorite-artist-item';
        item.textContent = artist.name;

        if (favoriteArtistNames.includes(artist.name)) {
            item.classList.add('selected');
        }

        item.addEventListener('click', () => {
            const index = favoriteArtistNames.indexOf(artist.name);
            if (index >= 0) {
                favoriteArtistNames.splice(index, 1);
            } else {
                favoriteArtistNames.push(artist.name);
            }
            renderFavoriteArtists();
            renderFavoriteArtistList();
        });

        favoriteArtistsList.appendChild(item);
    });
}

if (favoriteArtistSearch) {
    favoriteArtistSearch.addEventListener('input', renderFavoriteArtistList);
}

const inputBody = document.getElementById('input-body');
const previewBody = document.getElementById('preview-body');
const inputSection = document.getElementById('input-section');
const previewSection = document.getElementById('preview-section');
const message = document.getElementById('message');

// ========================================
// プレースホルダーの動的更新（「同上」表示）
// ========================================

function updateArtistPlaceholders() {
    const rows = inputBody.querySelectorAll('tr');
    let currentArtist = '';

    rows.forEach(tr => {
        const artistInput = tr.querySelector('.row-artist');
        const val = formatName(artistInput.value);

        if (val) {
            currentArtist = val;
            artistInput.placeholder = 'アーティスト';
        } else {
            if (currentArtist) {
                artistInput.placeholder = `（同上: ${currentArtist}）`;
            } else {
                artistInput.placeholder = 'アーティスト';
            }
        }
    });
}

// リアルタイム入力イベントの監視
if (inputBody) {
    inputBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('row-artist')) {
            updateArtistPlaceholders();
        }
    });
}

// ========================================
// 初期化
// ========================================

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamerId = urlParams.get('id');

    if (streamerId) {
        document.getElementById('streamer-id').value = streamerId;
    } else {
        alert('Streamer ID is missing from the URL.');
    }

    await loadExistingArtists();
    createArtistDatalist();

    for (let i = 0; i < 1; i++) {
        addInputRow();
    }

    loadRegisteredSongs();
});

function createStatusSelect(value = 'complete') {
    const select = document.createElement('select');
    select.className = 'row-complete';

    const optionComplete = document.createElement('option');
    optionComplete.value = 'complete';
    optionComplete.textContent = '最後まで';

    const optionPartial = document.createElement('option');
    optionPartial.value = 'partial';
    optionPartial.textContent = '途中まで';

    const optionPractice = document.createElement('option');
    optionPractice.value = 'practice';
    optionPractice.textContent = '練習中';

    select.appendChild(optionComplete);
    select.appendChild(optionPartial);
    select.appendChild(optionPractice);
    select.value = value;

    return select;
}

// ========================================
// 行追加
// ========================================

function addInputRow(artist = '', title = '', complete = 'complete', confident = false) {
    const tr = document.createElement('tr');

    // 1. Artist の入力欄を生成
    const artistTd = document.createElement('td');
    const artistInput = document.createElement('input');
    artistInput.type = 'text';
    artistInput.className = 'row-artist';
    artistInput.placeholder = 'アーティスト';
    artistInput.value = artist;
    artistInput.setAttribute('list', 'artist-list');
    artistTd.appendChild(artistInput);

    // 2. Title の入力欄と datalist を生成
    const titleTd = document.createElement('td');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'row-title';
    titleInput.placeholder = '曲名';
    titleInput.value = title;

    const songListId = 'song-list-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    titleInput.setAttribute('list', songListId);

    const songDatalist = document.createElement('datalist');
    songDatalist.id = songListId;
    document.body.appendChild(songDatalist);
    titleTd.appendChild(titleInput);

    // 3. 曲名候補リスト（datalist）の更新処理関数
    async function updateSongDatalist() {
        songDatalist.innerHTML = '';

        // 自分の行のアーティスト名を取得
        let targetArtist = formatName(artistInput.value);

        // 自分の行が空なら、上の行を順に遡って直近のアーティスト名を取得（同上判定）
        if (!targetArtist) {
            let prevTr = tr.previousElementSibling;
            while (prevTr) {
                const prevArtistInput = prevTr.querySelector('.row-artist');
                if (prevArtistInput && prevArtistInput.value.trim()) {
                    targetArtist = formatName(prevArtistInput.value);
                    break;
                }
                prevTr = prevTr.previousElementSibling;
            }
        }

        if (!targetArtist) return;

        // 表記揺れを吸収して既存アーティストを検索
        const normArtist = normalizeName(targetArtist);
        const selectedArtist = existingArtists.find(
            item => normalizeName(item.name) === normArtist
        );

        if (!selectedArtist) return;

        // DBから曲一覧を取得して datalist にセット
        const { data, error } = await supabaseClient
            .from('songs')
            .select(`id, title`)
            .eq('artist_id', selectedArtist.id)
            .order('title', { ascending: true });

        if (error) {
            console.error('曲一覧の取得に失敗しました。', error);
            return;
        }

        (data || []).forEach(song => {
            const option = document.createElement('option');
            option.value = song.title;
            songDatalist.appendChild(option);
        });
    }

    // アーティスト変更時 ＆ 曲名フォーカス時に候補を更新
    artistInput.addEventListener('change', updateSongDatalist);
    titleInput.addEventListener('focus', updateSongDatalist);

    // 4. Status (完成度)
    const completeTd = document.createElement('td');
    completeTd.appendChild(createStatusSelect(complete));

    // 5. Confident (自信)
    const confidentTd = document.createElement('td');
    confidentTd.className = 'checkbox-cell';
    const confidentInput = document.createElement('input');
    confidentInput.type = 'checkbox';
    confidentInput.className = 'row-confident';
    confidentInput.checked = confident;
    confidentTd.appendChild(confidentInput);

    // 6. Delete (削除ボタン)
    const deleteTd = document.createElement('td');
    deleteTd.className = 'delete-cell';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'X';
    deleteButton.className = 'delete-button';
    deleteButton.addEventListener('click', () => {
        tr.remove();
        updateArtistPlaceholders();
        if (inputBody.children.length === 0) {
            addInputRow();
        }
    });
    deleteTd.appendChild(deleteButton);

    // 行（tr）要素を組み立てて追加
    tr.appendChild(artistTd);
    tr.appendChild(titleTd);
    tr.appendChild(completeTd);
    tr.appendChild(confidentTd);
    tr.appendChild(deleteTd);

    inputBody.appendChild(tr);

    updateArtistPlaceholders();
}
// ========================================
// 入力行の集計 & 「同上」の自動補完
// ========================================

function collectInputRows() {
    const rows = document.querySelectorAll('#input-body tr');
    const result = [];
    let lastArtist = '';

    rows.forEach(tr => {
        let artist = formatName(tr.querySelector('.row-artist').value);
        const title = formatName(tr.querySelector('.row-title').value);
        const complete = tr.querySelector('.row-complete').value;
        const confident = tr.querySelector('.row-confident').checked;

        // 【1】完全空白行は無視
        if (!artist && !title) return;

        // 【2】アーティスト空欄で曲名がある場合は直上を補完
        if (!artist && title) {
            artist = lastArtist;
        } else if (artist) {
            lastArtist = artist;
        }

        result.push({
            artist: artist,
            title: title,
            complete: complete,
            confident: confident
        });
    });

    return result;
}

// ========================================
// 読み仮名の自動生成
// ========================================

async function generateReadings(rows) {
    const results = [];

    for (const row of rows) {
        const artistName = row.artist;
        const titleName = row.title;

        if (!artistName || !titleName) continue;

        const normArtist = normalizeName(artistName);
        const existingArtist = existingArtists.find(
            artist => normalizeName(artist.name) === normArtist
        );

        let artistInitial = '';
        let titleInitial = '';
        let isNewArtist = false;
        let isNewSong = false;

        if (existingArtist) {
            artistInitial = existingArtist.artist_initial || '';

            const { data: existingSong, error: songError } = await supabaseClient
                .from('songs')
                .select('id, title, title_initial')
                .eq('artist_id', existingArtist.id)
                .eq('title', titleName)
                .maybeSingle();

            if (songError) {
                console.error('既存曲の取得に失敗しました。', songError);
                throw songError;
            }

            if (existingSong) {
                titleInitial = existingSong.title_initial || '';
            } else {
                isNewSong = true;
            }
        } else {
            isNewArtist = true;
            isNewSong = true;
        }

        if (isNewArtist || isNewSong) {
            const response = await fetch(FURIGANA_FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artist: isNewArtist ? artistName : '',
                    title: isNewSong ? titleName : ''
                })
            });

            if (!response.ok) {
                throw new Error(`ひらがな生成に失敗しました (${response.status})`);
            }

            const data = await response.json();
            if (isNewArtist) artistInitial = data.artist_initial || '';
            if (isNewSong) titleInitial = data.title_initial || '';
        }

        results.push({
            artist: artistName,
            title: titleName,
            complete: row.complete,
            confident: row.confident,
            isNewArtist: isNewArtist,
            isNewSong: isNewSong,
            reading: {
                artist_initial: artistInitial,
                title_initial: titleInitial
            }
        });
    }

    return results;
}

// ========================================
// プレビュー表示・その他の既存処理
// ========================================

function createPreviewRow(row, reading) {
    const tr = document.createElement('tr');

    const artistTd = document.createElement('td');
    const artistInput = document.createElement('input');
    artistInput.type = 'text';
    artistInput.className = 'row-artist';
    artistInput.value = row.artist;
    artistTd.appendChild(artistInput);

    const artistInitialTd = document.createElement('td');
    const artistInitialInput = document.createElement('input');
    artistInitialInput.type = 'text';
    artistInitialInput.className = 'row-artist-initial';
    artistInitialInput.value = reading.artist_initial || '';
    artistInitialTd.appendChild(artistInitialInput);

    const titleTd = document.createElement('td');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'row-title';
    titleInput.value = row.title;
    titleTd.appendChild(titleInput);

    const titleInitialTd = document.createElement('td');
    const titleInitialInput = document.createElement('input');
    titleInitialInput.type = 'text';
    titleInitialInput.className = 'row-title-initial';
    titleInitialInput.value = reading.title_initial || '';
    titleInitialTd.appendChild(titleInitialInput);

    const completeTd = document.createElement('td');
    completeTd.appendChild(createStatusSelect(row.complete));

    const confidentTd = document.createElement('td');
    confidentTd.className = 'checkbox-cell';
    const confidentInput = document.createElement('input');
    confidentInput.type = 'checkbox';
    confidentInput.className = 'row-confident';
    confidentInput.checked = row.confident;
    confidentTd.appendChild(confidentInput);

    const deleteTd = document.createElement('td');
    deleteTd.className = 'delete-cell';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'X';
    deleteButton.className = 'delete-button';
    deleteButton.addEventListener('click', () => tr.remove());
    deleteTd.appendChild(deleteButton);

    tr.appendChild(artistTd);
    tr.appendChild(artistInitialTd);
    tr.appendChild(titleTd);
    tr.appendChild(titleInitialTd);
    tr.appendChild(completeTd);
    tr.appendChild(confidentTd);
    tr.appendChild(deleteTd);

    previewBody.appendChild(tr);
}

document.getElementById('add-row-btn').addEventListener('click', () => {
    addInputRow();
    const rows = inputBody.querySelectorAll('tr');
    if (rows.length > 0) {
        rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

document.getElementById('generate-btn').addEventListener('click', async () => {
    const rows = collectInputRows();

    if (!rows.length) {
        alert('1曲以上入力してください。');
        return;
    }

    const invalidRow = rows.find(row => !row.artist || !row.title);
    if (invalidRow) {
        alert('アーティスト名または曲名が入力されていません。1行目にはアーティスト名を入力してください。');
        return;
    }

    const button = document.getElementById('generate-btn');
    button.disabled = true;
    message.style.color = '';
    message.textContent = '読み仮名を生成しています...';

    try {
        generatedRows = await generateReadings(rows);
        previewBody.innerHTML = '';
        generatedRows.forEach(item => createPreviewRow(item, item.reading));

        inputSection.style.display = 'none';
        previewSection.style.display = 'block';
        message.style.color = 'green';
        message.textContent = '読み仮名を生成しました。内容を確認してください。';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = '読み仮名の生成に失敗しました: ' + error.message;
    } finally {
        button.disabled = false;
    }
});

document.getElementById('back-btn').addEventListener('click', () => {
    inputSection.style.display = 'block';
    previewSection.style.display = 'none';
    message.style.color = '';
    message.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('submit-all-btn').addEventListener('click', async () => {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    if (!Number.isInteger(streamerId)) {
        alert('Streamer ID is invalid.');
        return;
    }

    const rows = document.querySelectorAll('#preview-body tr');
    const insertData = [];

    rows.forEach(tr => {
        const artist = formatName(tr.querySelector('.row-artist')?.value);
        const artistInitial = formatName(tr.querySelector('.row-artist-initial')?.value);
        const title = formatName(tr.querySelector('.row-title')?.value);
        const titleInitial = formatName(tr.querySelector('.row-title-initial')?.value);
        const completeValue = tr.querySelector('.row-complete')?.value || 'complete';
        const confident = tr.querySelector('.row-confident')?.checked || false;

        if (!artist || !title) return;

        let complete = null;
        if (completeValue === 'complete') complete = true;
        else if (completeValue === 'practice') complete = false;

        insertData.push({
            streamer_id: streamerId,
            artist: artist,
            artist_initial: artistInitial,
            title: title,
            title_initial: titleInitial,
            complete: complete,
            confident: confident
        });
    });

    if (!insertData.length) {
        alert('登録する曲がありません。');
        return;
    }

    const button = document.getElementById('submit-all-btn');
    const submitError = document.getElementById('submit-error');
    submitError.textContent = '';
    submitError.style.color = '';
    button.disabled = true;
    message.style.color = '';
    message.textContent = '登録中...';

    try {
        const managementKey = document.getElementById('management-key').value.trim();
        if (!managementKey) {
            submitError.textContent = '管理キーを入力してください。';
            return;
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/management`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'insert',
                streamer_id: streamerId,
                management_key: managementKey,
                songs: insertData
            })
        });

        const result = await response.json();
        if (!response.ok) {
            submitError.textContent = result.error || '曲の登録に失敗しました。';
            return;
        }

        submitError.style.color = 'green';
        message.textContent = insertData.length + ' 曲の登録が完了しました。';
        submitError.textContent = insertData.length + '曲を登録しました。';

        inputBody.innerHTML = '';
        previewBody.innerHTML = '';
        generatedRows = [];

        await loadExistingArtists();
        createArtistDatalist();
        renderFavoriteArtists();
        renderFavoriteArtistList();

        for (let i = 0; i < 1; i++) {
            addInputRow();
        }

        inputSection.style.display = 'block';
        previewSection.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = '登録エラー: ' + error.message;
    } finally {
        button.disabled = false;
    }
});

// ========================================
// 登録済み曲一覧・削除・管理キー設定
// ========================================

const registeredBody = document.getElementById('registered-body');
const selectAllSongs = document.getElementById('select-all-songs');
const reloadSongsBtn = document.getElementById('reload-songs-btn');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const registeredSearchInput = document.getElementById('registered-search');
const registeredSortSelect = document.getElementById('registered-sort');

function getStatusLabel(complete) {
    if (complete === true) return '最後まで';
    if (complete === false) return '練習中';
    return '途中まで';
}

async function loadRegisteredSongs() {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    if (!Number.isInteger(streamerId)) return;

    registeredBody.innerHTML = '<tr><td colspan="5">読み込み中...</td></tr>';

    // 1. 曲一覧の取得
    const { data: streamerSongs, error } = await supabaseClient
        .from('streamer_songs')
        .select(`
            id,
            complete,
            confident,
            song:songs(
                id,
                title,
                title_initial,
                artist:artists(
                    id,
                    name,
                    artist_initial
                )
            )
        `)
        .eq('streamer_id', streamerId);

    if (error) {
        console.error(error);
        registeredBody.innerHTML = '<tr><td colspan="5">曲一覧の取得に失敗しました。</td></tr>';
        message.style.color = 'red';
        message.textContent = '曲一覧の取得に失敗しました：' + error.message;
        return;
    }

    // 2. 現在保存されている定番アーティスト（favorite_artists）を取得
    const { data: streamerData } = await supabaseClient
        .from('streamers')
        .select('favorite_artists')
        .eq('id', streamerId)
        .maybeSingle();

    const currentFavoriteArtists = streamerData?.favorite_artists || [];

    const songs = (streamerSongs || [])
        .filter(row => row.song && row.song.artist)
        .map(row => ({
            id: row.id,
            artist: row.song.artist.name,
            artist_initial: row.song.artist.artist_initial,
            title: row.song.title,
            title_initial: row.song.title_initial,
            complete: row.complete,
            confident: row.confident,
            song_id: row.song.id
        }));

    // (renderRegisteredSongs などのテーブル描画処理... 中略)

    renderRegisteredSongs();

    if (registeredSearchInput) registeredSearchInput.oninput = renderRegisteredSongs;
    if (registeredSortSelect) registeredSortSelect.onchange = renderRegisteredSongs;
    selectAllSongs.checked = false;

    // 定番アーティスト選択ボックスの描画（保存済み配列を第2引数に渡す）
    renderFavoriteArtistCheckboxes(songs, currentFavoriteArtists);
}

selectAllSongs.addEventListener('change', () => {
    const checkboxes = registeredBody.querySelectorAll('.registered-song-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAllSongs.checked);
});

reloadSongsBtn.addEventListener('click', async () => {
    await loadRegisteredSongs();
});

deleteSelectedBtn.addEventListener('click', async () => {
    const selected = Array.from(registeredBody.querySelectorAll('.registered-song-checkbox:checked'));
    if (selected.length === 0) {
        alert('削除する曲を選択してください。');
        return;
    }

    const ids = selected.map(cb => parseInt(cb.dataset.id, 10));
    if (!confirm(`${ids.length}曲を削除します。\n\nこの操作は元に戻せません。`)) return;

    deleteSelectedBtn.disabled = true;
    message.style.color = '';
    message.textContent = '削除しています...';

    try {
        const managementKey = document.getElementById('management-key').value.trim();
        if (!managementKey) throw new Error('管理キーを入力してください。');

        const streamerId = document.getElementById('streamer-id').value;
        const response = await fetch(`${supabaseUrl}/functions/v1/management`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                streamer_id: Number(streamerId),
                management_key: managementKey,
                song_ids: ids
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '曲の削除に失敗しました。');

        message.style.color = 'green';
        message.textContent = `${ids.length}曲を削除しました。`;
        await loadRegisteredSongs();
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = '削除に失敗しました：' + error.message;
    } finally {
        deleteSelectedBtn.disabled = false;
    }
});

// ========================================
// 管理キー再設定
// ========================================

const showResetBtn = document.getElementById('show-reset-btn');
const resetForm = document.getElementById('reset-form');
const resetManagementKeyBtn = document.getElementById('reset-management-key-btn');

if (showResetBtn) {
    showResetBtn.addEventListener('click', () => {
        resetForm.style.display = resetForm.style.display === 'none' ? 'block' : 'none';
    });
}

if (resetManagementKeyBtn) {
    resetManagementKeyBtn.addEventListener('click', async () => {
        const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
        const resetKey = document.getElementById('reset-key').value.trim();
        const newKey = document.getElementById('new-management-key').value.trim();
        const confirmKey = document.getElementById('new-management-key-confirm').value.trim();
        const resetMessage = document.getElementById('reset-message');

        resetMessage.textContent = '';

        if (!resetKey) {
            resetMessage.textContent = '再設定コードを入力してください。';
            return;
        }
        if (!newKey) {
            resetMessage.textContent = '新しい管理キーを入力してください。';
            return;
        }
        if (newKey !== confirmKey) {
            resetMessage.textContent = '新しい管理キーが一致していません。';
            return;
        }
        if (newKey.length < 8) {
            resetMessage.textContent = '管理キーは8文字以上にしてください。';
            return;
        }

        resetManagementKeyBtn.disabled = true;
        resetMessage.textContent = '再設定しています……';

        try {
            const response = await fetch(`${supabaseUrl}/functions/v1/management`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset',
                    streamer_id: Number(streamerId),
                    reset_key: resetKey,
                    new_management_key: newKey
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || '管理キーの再設定に失敗しました。');

            resetMessage.style.color = 'green';
            resetMessage.textContent = '管理キーを再設定しました。新しい管理キーを使ってください。';

            document.getElementById('management-key').value = newKey;
            document.getElementById('reset-key').value = '';
            document.getElementById('new-management-key').value = '';
            document.getElementById('new-management-key-confirm').value = '';
        } catch (error) {
            console.error(error);
            resetMessage.style.color = 'crimson';
            resetMessage.textContent = error.message;
        } finally {
            resetManagementKeyBtn.disabled = false;
        }
    });
}
											  
											  
											  
// 登録済み曲データから固有のアーティスト一覧を抽出して選択肢を作成する関数
// 登録済み曲データから固有のアーティスト一覧を抽出して選択肢を作成する関数
function renderFavoriteArtistCheckboxes(registeredSongs, currentFavoriteArtists = []) {
    const container = document.getElementById('favorite-artist-checkboxes');
    if (!container) return;

    // 登録済みの曲から重複を除いたアーティスト名リストを取得（昇順ソート）
    const artists = Array.from(new Set(registeredSongs.map(s => s.artist).filter(Boolean))).sort();

    if (artists.length === 0) {
        container.innerHTML = '<span style="color: #999;">登録済みのアーティストがありません。</span>';
        return;
    }

    container.innerHTML = '';
    artists.forEach(artist => {
        const label = document.createElement('label');
        label.className = 'artist-checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'favorite-artist-select';
        checkbox.value = artist;
        
        // すでに保存されているアーティストに含まれていればチェックを入れる
        if (currentFavoriteArtists.includes(artist)) {
            checkbox.checked = true;
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(artist));
        container.appendChild(label);
    });
}

// 保存ボタンのイベント処理
// 1. 定番歌手のみを保存するイベントハンドラ
document.getElementById('update-favorites-btn')?.addEventListener('click', async () => {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    const managementKey = document.getElementById('management-key').value;

    if (!managementKey) {
        alert('管理キーを入力してください');
        return;
    }

    // チェックされた定番歌手を取得
    const favoriteArtists = Array.from(
        document.querySelectorAll('input[name="favorite-artist-select"]:checked')
    ).map(cb => cb.value);

    try {
        const res = await fetch('https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/<FUNCTION_NAME>', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_favorites_and_confident',
                streamer_id: streamerId,
                management_key: managementKey,
                favorite_artists: favoriteArtists
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '更新に失敗しました');

        alert('定番歌手を保存しました');
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// 2. 自信曲のみを保存するイベントハンドラ
document.getElementById('update-confident-btn')?.addEventListener('click', async () => {
    const streamerId = parseInt(document.getElementById('streamer-id').value, 10);
    const managementKey = document.getElementById('management-key').value;

    if (!managementKey) {
        alert('管理キーを入力してください');
        return;
    }

    // テーブル内の自信曲チェックボックスの状態を収集
    const confidentUpdates = Array.from(
        document.querySelectorAll('.confident-checkbox')
    ).map(cb => ({
        id: parseInt(cb.dataset.id, 10),
        confident: cb.checked
    }));

    try {
        const res = await fetch('https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/<FUNCTION_NAME>', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_favorites_and_confident',
                streamer_id: streamerId,
                management_key: managementKey,
                confident_updates: confidentUpdates
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '更新に失敗しました');

        alert('自信曲の設定を保存しました');
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});