// JavaScript Do // Supabaseへの接続
const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';

const supabaseKey =
    'sb_publishable_JNz1mi6gysaFjOa0A4I5ow_iDe3PQbd';

// =========================
// Supabaseへの接続
// =========================



const supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );


// =========================
// HTMLの要素を取得
// =========================

const list =
    document.getElementById('song-list');

const nav =
    document.getElementById('artist-nav');

const streamerName =
    document.getElementById('streamer-name');

const songCount =
    document.getElementById('song-count');

const completeFilter =
    document.getElementById('complete-filter');

const favoriteSection =
    document.getElementById('favorite-section');

const favoriteArtists =
    document.getElementById('favorite-artists');


// =========================
// 50音
// =========================

const initials = [
    '一覧',
    'あ',
    'か',
    'さ',
    'た',
    'な',
    'は',
    'ま',
    'や',
    'ら',
    'わ'
];


// =========================
// 現在の表示状態
// =========================

let data = [];

let currentRow = null;

let currentFavoriteArtist = null;

let showCompleteOnly = false;


// =========================
// 50音用の読みを整理
// =========================

function normalizeForRow(text) {

    if (!text) return '';

    return text
        .normalize('NFC')
        .replace(
            /[\u30A1-\u30F6]/g,
            char =>
                String.fromCharCode(
                    char.charCodeAt(0) - 0x60
                )
        );
}


// =========================
// 何行か判定
// =========================

function getRow(text) {

    if (!text) return '';

    text = normalizeForRow(text);

    const first = text.charAt(0);

    const rowMap = {

        'あ': 'あいうえお',

        'か':
            'かきくけこがぎぐげご',

        'さ':
            'さしすせそざじずぜぞ',

        'た':
            'たちつてとだぢづでど',

        'な':
            'なにぬねの',

        'は':
            'はひふへほばびぶべぼぱぴぷぺぽ',

        'ま':
            'まみむめも',

        'や':
            'やゆよ',

        'ら':
            'らりるれろ',

        'わ':
            'わをん'
    };

    for (const row in rowMap) {

        if (rowMap[row].includes(first)) {
            return row;
        }

    }

    return '';
}


// =========================
// 日本語の並び順
// =========================

const collator =
    new Intl.Collator('ja', {
        sensitivity: 'base',
        numeric: false
    });


// =========================
// 並び替え用の読み
// =========================

function createSortKey(text) {

    if (!text) return '';

    return text
        .normalize('NFC')
        .replace(
            /[\u30A1-\u30F6]/g,
            char =>
                String.fromCharCode(
                    char.charCodeAt(0) - 0x60
                )
        );
}


// =========================
// 読みを比較
// =========================

function compareReading(a, b) {

    return collator.compare(
        createSortKey(a),
        createSortKey(b)
    );
}


// =========================
// 表示する曲を決定
// =========================

function getVisibleSongs() {

    let songs = [...data];


    // お気に入りアーティストで絞る

    if (currentFavoriteArtist) {

        songs = songs.filter(
            song =>
                song.artist ===
                currentFavoriteArtist
        );

    }


    // 50音で絞る

    if (currentRow) {

        songs = songs.filter(
            song =>
                getRow(song.artist_initial) ===
                currentRow
        );

    }


    // 最後まで歌える曲だけ

    if (showCompleteOnly) {

        songs = songs.filter(
            song => song.complete === true
        );

    }


    return songs;
}


// =========================
// 曲一覧を表示
// =========================

function displaySongs(songs) {

    list.innerHTML = '';

    if (songs.length === 0) {
        list.textContent = '該当する曲がありません';
        return;
    }

    let currentArtist = '';
    let artistSongs = null;

    songs.forEach(song => {

        // 新しいアーティスト
        if (song.artist !== currentArtist) {

            currentArtist = song.artist;

            // アーティスト名
            const artistDiv =
                document.createElement('div');

            artistDiv.textContent =
                song.artist;

            artistDiv.className =
                'artist';


            // ★ このアーティスト専用の曲入れ
            const newArtistSongs =
                document.createElement('div');

            newArtistSongs.className =
                'artist-songs';
			
			
			// 最初は閉じた状態
			newArtistSongs.classList.add('collapsed');
			artistDiv.classList.add('collapsed');


            // アーティスト名を押したら開閉
            artistDiv.addEventListener(
                'click',
                () => {

                    artistDiv.classList.toggle(
                        'collapsed'
                    );

                    newArtistSongs.classList.toggle(
                        'collapsed'
                    );

                }
            );


            list.appendChild(artistDiv);

            list.appendChild(newArtistSongs);


            // 次の曲をこの箱に入れる
            artistSongs = newArtistSongs;
        }


        // 曲名
        const songDiv =
            document.createElement('div');

        songDiv.textContent =
            song.title +
            (song.complete ? ' ★' : '');

        songDiv.className =
            'song';


        artistSongs.appendChild(songDiv);

    });
}


// =========================
// 曲数表示
// =========================

function updateSongCount() {

    const total =
        data.length;

    const complete =
        data.filter(
            song => song.complete === true
        ).length;


    songCount.textContent =
        `曲数：${total}曲`
        + `　★最後まで：${complete}曲`;
}


// =========================
// フィルターボタン表示
// =========================

function updateCompleteButton() {

    if (showCompleteOnly) {

        completeFilter.textContent =
            '★ 最後まで歌える曲だけ表示中';

        completeFilter.classList.add(
            'active'
        );

    } else {

        completeFilter.textContent =
            '★ 最後まで歌える曲だけ表示';

        completeFilter.classList.remove(
            'active'
        );
    }
}


// =========================
// お気に入りアーティスト表示
// =========================

function displayFavoriteArtists(
    favoriteList
) {

    favoriteArtists.innerHTML = '';


    if (
        !favoriteList ||
        favoriteList.length === 0
    ) {

        favoriteSection.style.display =
            'none';

        return;
    }


    favoriteSection.style.display =
        'block';


    favoriteList.forEach(artistName => {

        const button =
            document.createElement('button');

        button.textContent =
            artistName;

        button.className =
            'favorite-button';


        button.addEventListener(
            'click',
            () => {

                // 同じボタンをもう一度押すと解除

                if (
                    currentFavoriteArtist ===
                    artistName
                ) {

                    currentFavoriteArtist =
                        null;

                    button.classList.remove(
                        'active'
                    );

                } else {

                    currentFavoriteArtist =
                        artistName;

                    currentRow = null;


                    // 他のお気に入りの選択を解除

                    document
                        .querySelectorAll(
                            '.favorite-button'
                        )
                        .forEach(
                            otherButton => {

                                otherButton.classList.remove(
                                    'active'
                                );

                            }
                        );


                    button.classList.add(
                        'active'
                    );

                }


                // 50音ボタンの選択を解除

                document
                    .querySelectorAll(
                        '#artist-nav button'
                    )
                    .forEach(
                        navButton => {

                            navButton.classList.remove(
                                'active'
                            );

                        }
                    );


                render();

            }
        );


        favoriteArtists.appendChild(
            button
        );

    });
}


// =========================
// 現在の条件で再表示
// =========================

function render() {

    const visibleSongs =
        getVisibleSongs();

    displaySongs(visibleSongs);

    updateCompleteButton();
}


// =========================
// 50音ボタン
// =========================

initials.forEach(initial => {

    const button =
        document.createElement('button');

    button.textContent =
        initial;


    button.addEventListener(
        'click',
        () => {


            // 一覧

            if (initial === '一覧') {

                currentRow = null;

                currentFavoriteArtist = null;


                document
                    .querySelectorAll(
                        '.favorite-button'
                    )
                    .forEach(
                        favoriteButton => {

                            favoriteButton.classList.remove(
                                'active'
                            );

                        }
                    );


                document
                    .querySelectorAll(
                        '#artist-nav button'
                    )
                    .forEach(
                        navButton => {

                            navButton.classList.remove(
                                'active'
                            );

                        }
                    );


                button.classList.add(
                    'active'
                );


                render();

                return;
            }


            // 50音を選択

            currentRow = initial;

            currentFavoriteArtist = null;


            // お気に入り選択を解除

            document
                .querySelectorAll(
                    '.favorite-button'
                )
                .forEach(
                    favoriteButton => {

                        favoriteButton.classList.remove(
                            'active'
                        );

                    }
                );


            // 50音ボタンの選択状態

            document
                .querySelectorAll(
                    '#artist-nav button'
                )
                .forEach(
                    navButton => {

                        navButton.classList.remove(
                            'active'
                        );

                    }
                );


            button.classList.add(
                'active'
            );


            render();

        }
    );


    nav.appendChild(button);

});


// =========================
// 最後まで歌えるフィルター
// =========================

completeFilter.addEventListener(
    'click',
    () => {

        showCompleteOnly =
            !showCompleteOnly;

        render();

    }
);


// =========================
// 曲を読み込む
// =========================

async function loadSongs() {

    const path =
        window.location.pathname;


    const urlId =
        path
            .split('/')
            .filter(Boolean)
            .pop()
            .replace('.html', '');


    // ストリーマー情報

    const {
        data: streamer,
        error: streamerError
    } =
        await supabaseClient
            .from('streamers')
            .select('*')
            .eq('url_id', urlId)
            .single();


    if (
        streamerError ||
        !streamer
    ) {

        console.error(
            streamerError
        );

        list.textContent =
            'ストリーマーが見つかりません';

        return;
    }


    // ストリーマー名

    streamerName.textContent =
        streamer.name;


    // お気に入り

    displayFavoriteArtists(
        streamer.favorite_artists || []
    );


    // 曲情報

    const {
        data: songs,
        error: songsError
    } =
        await supabaseClient
            .from('songs')
            .select('*')
            .eq(
                'streamer_id',
                streamer.id
            );


    if (songsError) {

        console.error(
            songsError
        );

        list.textContent =
            '曲の読み込みに失敗しました';

        return;
    }


    // 曲を並び替え

    songs.sort((a, b) => {

        const artistResult =
            compareReading(
                a.artist_initial,
                b.artist_initial
            );


        if (artistResult !== 0) {
            return artistResult;
        }


        const titleResult =
            compareReading(
                a.title_initial,
                b.title_initial
            );


        if (titleResult !== 0) {
            return titleResult;
        }


        return collator.compare(
            a.title,
            b.title
        );

    });


    // データを保存

    data = songs;


    // 曲数表示

    updateSongCount();


    // 最初は一覧

    document
        .querySelector(
            '#artist-nav button'
        )
        .classList.add('active');


    // 表示

    render();
}


// =========================
// 実行
// =========================

loadSongs();