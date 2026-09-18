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

const filterAll =
    document.getElementById('filter-all');

const filterComplete =
    document.getElementById('filter-complete');

const filterPartial =
    document.getElementById('filter-partial');

const filterPractice =
    document.getElementById('filter-practice');

const favoriteSection =
    document.getElementById('favorite-section');

const favoriteArtists =
    document.getElementById('favorite-artists');

const menuPanel =
    document.getElementById('menu-panel');

const songSearch =
    document.getElementById('song-search');

const searchClear =
    document.getElementById('search-clear');


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
let favoriteMode = null;
let favoriteArtistList = [];
let completeFilter = 'all';
let searchQuery = '';

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
        'か': 'かきくけこがぎぐげご',
        'さ': 'さしすせそざじずぜぞ',
        'た': 'たちつてとだぢづでど',
        'な': 'なにぬねの',
        'は': 'はひふへほばびぶべぼぱぴぷぺぽ',
        'ま': 'まみむめも',
        'や': 'やゆよ',
        'ら': 'らりるれろ',
        'わ': 'わをん'
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

    let key = text
        .normalize('NFC')
        .replace(
            /[\u30A1-\u30F6]/g,
            char =>
                String.fromCharCode(
                    char.charCodeAt(0) - 0x60
                )
        );

    // =========================
    // 伸ばし棒の母音変換
    // =========================

    const vowelMap = {
        // あ段
        'あ': 'あ', 'か': 'あ', 'が': 'あ', 'さ': 'あ', 'ざ': 'あ', 'た': 'あ', 'だ': 'あ', 'な': 'あ', 'は': 'あ', 'ば': 'あ', 'ぱ': 'あ', 'ま': 'あ', 'や': 'あ', 'ら': 'あ', 'わ': 'あ',
        // い段
        'い': 'い', 'き': 'い', 'ぎ': 'い', 'し': 'い', 'じ': 'い', 'ち': 'い', 'ぢ': 'い', 'に': 'い', 'ひ': 'い', 'び': 'い', 'ぴ': 'い', 'み': 'い', 'り': 'い',
        // う段
        'う': 'う', 'く': 'う', 'ぐ': 'う', 'す': 'う', 'ず': 'う', 'つ': 'う', 'づ': 'う', 'ぬ': 'う', 'ふ': 'う', 'ぶ': 'う', 'ぷ': 'う', 'む': 'う', 'ゆ': 'う', 'る': 'う',
        // え段
        'え': 'え', 'け': 'え', 'げ': 'え', 'せ': 'え', 'ぜ': 'え', 'て': 'え', 'で': 'え', 'ね': 'え', 'へ': 'え', 'べ': 'え', 'ぺ': 'え', 'め': 'え', 'れ': 'え',
        // お段
        'お': 'お', 'こ': 'お', 'ご': 'お', 'そ': 'お', 'ぞ': 'お', 'と': 'お', 'ど': 'お', 'の': 'お', 'ほ': 'お', 'ぼ': 'お', 'ぽ': 'お', 'も': 'お', 'よ': 'お', 'ろ': 'お', 'を': 'お'
    };

    // =========================
    // 拗音
    // =========================

    const smallVowelMap = {
        'ゃ': 'あ',
        'ゅ': 'う',
        'ょ': 'お'
    };

    let result = '';
    let previousMainChar = null;

    for (const char of key) {
        if (char === 'ー') {
            if (
                result.length > 0 &&
                smallVowelMap[previousMainChar]
            ) {
                result += smallVowelMap[previousMainChar];
            } else if (
                result.length > 0 &&
                vowelMap[previousMainChar]
            ) {
                result += vowelMap[previousMainChar];
            } else {
                result += 'ー';
            }
            continue;
        }

        result += char;

        if (vowelMap[char]) {
            previousMainChar = char;
        } else if (smallVowelMap[char]) {
            previousMainChar = char;
        } else if (char === 'っ') {
            // 「っ」の前の音を維持
        } else {
            previousMainChar = char;
        }
    }

    return result;
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

    // お気に入りアーティスト・自信曲で絞る
    if (favoriteMode === 'artist') {
        songs = songs.filter(
            song => favoriteArtistList.includes(song.artist)
        );
    }

    if (favoriteMode === 'confident') {
        songs = songs.filter(
            song => song.confident === true
        );
    }

    // 50音で絞る
    if (currentRow) {
        songs = songs.filter(
            song => getRow(song.artist_initial) === currentRow
        );
    }

    // 完成度フィルター
    if (completeFilter === 'complete') {
        songs = songs.filter(
            song => song.complete === true
        );
    }

    if (completeFilter === 'partial') {
        songs = songs.filter(
            song => song.complete === null || song.complete === undefined
        );
    }

    if (completeFilter === 'practice') {
        songs = songs.filter(
            song => song.complete === false
        );
    }

    // 曲名・アーティスト名で検索
    if (searchQuery) {
        const query = searchQuery.toLowerCase();

        songs = songs.filter(song => {
            const artist = (song.artist || '').toLowerCase();
            const title = (song.title || '').toLowerCase();
            const artistInitial = (song.artist_initial || '').toLowerCase();
            const titleInitial = (song.title_initial || '').toLowerCase();

            return (
                artist.includes(query) ||
                title.includes(query) ||
                artistInitial.includes(query) ||
                titleInitial.includes(query)
            );
        });
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
            const artistDiv = document.createElement('div');
            artistDiv.textContent = song.artist;
            artistDiv.className = 'artist';

            // ★ このアーティスト専用の曲入れ
            const newArtistSongs = document.createElement('div');
            newArtistSongs.className = 'artist-songs';

            // 最初の開閉状態（「一覧」選択時のみ最初から開く）
            const shouldOpen =
                !searchQuery &&
                currentRow === null &&
                favoriteMode === null &&
                completeFilter === 'all';

            if (shouldOpen) {
                newArtistSongs.classList.remove('collapsed');
                artistDiv.classList.remove('collapsed');
            } else {
                newArtistSongs.classList.add('collapsed');
                artistDiv.classList.add('collapsed');
            }

            // アーティスト名を押したら開閉
            artistDiv.addEventListener('click', () => {
                artistDiv.classList.toggle('collapsed');
                newArtistSongs.classList.toggle('collapsed');
                updateSongCount();
            });

            list.appendChild(artistDiv);
            list.appendChild(newArtistSongs);

            artistSongs = newArtistSongs;
        }

        // 曲名
        const songDiv = document.createElement('div');
        songDiv.className = 'song';

        const titleDiv = document.createElement('div');
        titleDiv.textContent =
            song.title + (song.complete ? ' *' : '');

        songDiv.appendChild(titleDiv);
        artistSongs.appendChild(songDiv);
    });
}


// =========================
// 曲数表示
// =========================

function updateSongCount() {
    const total = data.length;

    // 現在、画面上で開いている曲だけを数える
    const visible = document.querySelectorAll(
        '.artist-songs:not(.collapsed) .song'
    ).length;

    if (searchQuery) {
        songCount.textContent =
            `「${searchQuery}」を含む ${visible}曲 / ${total}曲`;
    } else if (
        currentRow !== null ||
        favoriteMode ||
        completeFilter !== 'all'
    ) {
        songCount.textContent =
            `${visible}曲 / ${total}曲`;
    } else {
        songCount.textContent =
            `曲数：${visible}曲`;
    }
}


// =========================
// 完成度フィルターイベント
// =========================

filterAll.addEventListener('click', () => {
    completeFilter = 'all';
    render();
});

filterComplete.addEventListener('click', () => {
    completeFilter = 'complete';
    render();
});

filterPartial.addEventListener('click', () => {
    completeFilter = 'partial';
    render();
});

filterPractice.addEventListener('click', () => {
    completeFilter = 'practice';
    render();
});


// =========================
// お気に入りアーティスト表示
// =========================

function displayFavoriteArtists(favoriteList) {
    favoriteArtistList = favoriteList || [];

    favoriteArtists.innerHTML = '';
    favoriteSection.style.display = 'block';

    // 好きな歌手ボタン
    const artistButton = document.createElement('button');
    artistButton.textContent = '好きな歌手';
    artistButton.className = 'favorite-button';

    artistButton.addEventListener('click', () => {
        favoriteMode = (favoriteMode === 'artist') ? null : 'artist';
        currentRow = null;

        document.querySelectorAll('#artist-nav button').forEach(navButton => {
            navButton.classList.remove('active');
        });

        artistButton.classList.toggle('active', favoriteMode === 'artist');
        confidentButton.classList.remove('active');

        render();
    });

    favoriteArtists.appendChild(artistButton);

    // 自信曲ボタン
    const confidentButton = document.createElement('button');
    confidentButton.textContent = '自信曲';
    confidentButton.className = 'favorite-button';

    confidentButton.addEventListener('click', () => {
        favoriteMode = (favoriteMode === 'confident') ? null : 'confident';
        currentRow = null;

        document.querySelectorAll('#artist-nav button').forEach(navButton => {
            navButton.classList.remove('active');
        });

        confidentButton.classList.toggle('active', favoriteMode === 'confident');
        artistButton.classList.remove('active');

        render();
    });

    favoriteArtists.appendChild(confidentButton);
}


// =========================
// フィルターボタン表示状態の更新
// =========================

function updateCompleteButton() {
    filterAll.classList.toggle('active', completeFilter === 'all');
    filterComplete.classList.toggle('active', completeFilter === 'complete');
    filterPartial.classList.toggle('active', completeFilter === 'partial');
    filterPractice.classList.toggle('active', completeFilter === 'practice');
}


// =========================
// 現在の条件で再表示
// =========================

function render() {
    const visibleSongs = getVisibleSongs();
    displaySongs(visibleSongs);
    updateCompleteButton();
    updateSongCount();
}


// =========================
// 50音ボタン生成
// =========================

initials.forEach(initial => {
    const button = document.createElement('button');
    button.textContent = initial;

    button.addEventListener('click', () => {
        if (initial === '一覧') {
            currentRow = null;
            favoriteMode = null;

            document.querySelectorAll('.favorite-button').forEach(favoriteButton => {
                favoriteButton.classList.remove('active');
            });

            document.querySelectorAll('#artist-nav button').forEach(navButton => {
                navButton.classList.remove('active');
            });

            button.classList.add('active');
            render();
            return;
        }

        // 50音を選択
        currentRow = initial;
        favoriteMode = null;

        document.querySelectorAll('.favorite-button').forEach(favoriteButton => {
            favoriteButton.classList.remove('active');
        });

        document.querySelectorAll('#artist-nav button').forEach(navButton => {
            navButton.classList.remove('active');
        });

        button.classList.add('active');
        render();
    });

    nav.appendChild(button);
});


// =========================
// 曲を読み込む
// =========================

async function loadSongs() {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('streamer');

    // ストリーマー情報
    const { data: streamer, error: streamerError } = await supabaseClient
        .from('streamers')
        .select('*')
        .eq('url_id', urlId)
        .single();

    if (streamerError || !streamer) {
        console.error(streamerError);
        list.textContent = 'ストリーマーが見つかりません';
        return;
    }

    // ストリーマー名
    streamerName.textContent = streamer.name;

    // 背景画像を設定
    if (streamer.background_image) {
        document.body.style.backgroundImage = `url('${streamer.background_image}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }

    // デザイン反映
    // デザイン反映
    // デザイン反映
    if (streamer.font_family) {
        const fontName = streamer.font_family.trim();
        
        // 1. Google Fonts 用の <link> タグを生成して <head> に追加（@import の構文エラーを防止）
        // スペースを + に変換して URL エンコード
        const formattedFontName = fontName.replace(/ /g, '+');
        const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;700&display=swap`;
        
        const existingLink = document.getElementById('google-font-link');
        if (existingLink) {
            existingLink.href = fontUrl;
        } else {
            const link = document.createElement('link');
            link.id = 'google-font-link';
            link.rel = 'stylesheet';
            link.href = fontUrl;
            document.head.appendChild(link);
        }

        // 2. 全要素にフォントを適用する <style> タグを作成
        const dynamicStyles = document.getElementById('dynamic-styles');
        const fontCSS = `
            body, body * {
                font-family: '${fontName}', "Noto Sans JP", sans-serif !important;
            }
        `;

        if (dynamicStyles) {
            dynamicStyles.textContent = fontCSS;
        } else {
            const style = document.createElement('style');
            style.id = 'dynamic-styles';
            style.textContent = fontCSS;
            document.head.appendChild(style);
        }
    }

    if (streamer.title_color) {
        document.documentElement.style.setProperty(
            '--text-color',
            streamer.title_color
        );
    }

    if (streamer.artist_color) {
        document.documentElement.style.setProperty(
            '--artist-color',
            streamer.artist_color
        );
    }

    if (streamer.theme_color) {
        document.documentElement.style.setProperty(
            '--theme-color',
            streamer.theme_color
        );
    }

    // お気に入り
    displayFavoriteArtists(streamer.favorite_artists || []);

    // 曲情報取得
    const { data: streamerSongs, error: songsError } = await supabaseClient
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
        .eq('streamer_id', streamer.id);

    if (songsError) {
        console.error(songsError);
        list.textContent = '曲の読み込みに失敗しました';
        return;
    }

    // データの成形
    const songs = streamerSongs
        .filter(row => row.song && row.song.artist)
        .map(row => {
            return {
                id: row.song.id,
                title: row.song.title,
                title_initial: row.song.title_initial,
                artist: row.song.artist.name,
                artist_initial: row.song.artist.artist_initial,
                complete: row.complete,
                confident: row.confident
            };
        });

    // 曲を並び替え
    songs.sort((a, b) => {
        const artistResult = compareReading(a.artist_initial, b.artist_initial);
        if (artistResult !== 0) return artistResult;

        const titleResult = compareReading(a.title_initial, b.title_initial);
        if (titleResult !== 0) return titleResult;

        return collator.compare(a.title, b.title);
    });

    data = songs;

    // 初期化表示
    updateSongCount();

    const firstNavButton = document.querySelector('#artist-nav button');
    if (firstNavButton) {
        firstNavButton.classList.add('active');
    }

    render();
}


// =========================
// 検索メニュー
// =========================

songSearch.addEventListener('input', () => {
    searchQuery = songSearch.value.trim();

    searchClear.classList.toggle('visible', searchQuery.length > 0);

    if (searchQuery) {
        currentRow = null;
        favoriteMode = null;

        document.querySelectorAll('.favorite-button').forEach(button => {
            button.classList.remove('active');
        });

        document.querySelectorAll('#artist-nav button').forEach(button => {
            button.classList.remove('active');
        });
    }

    render();
});

searchClear.addEventListener('click', () => {
    songSearch.value = '';
    searchQuery = '';
    searchClear.classList.remove('visible');
    render();
    songSearch.focus();
});


// =========================
// 実行
// =========================

document.addEventListener('DOMContentLoaded', () => {
    loadSongs();
});