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

// HTMLの要素を取得
const list = document.getElementById('song-list');
const streamerName = document.getElementById('streamer-name');
const songCount = document.getElementById('song-count');
const modeMenu = document.getElementById('mode-menu');
const menuButton = document.getElementById('menu-button');
const currentMode = document.getElementById('current-mode');
const artistNav = document.getElementById('artist-nav');
const songSearch = document.getElementById('song-search');
const searchClear = document.getElementById('search-clear');

// 完成度タブボタン
const tabAll = document.getElementById('filter-all');
const tabComplete = document.getElementById('filter-complete');
const tabPartial = document.getElementById('filter-partial');
const tabPractice = document.getElementById('filter-practice');

// クイックフィルター（自信曲・お気に入り）用コンテナ
const favoriteArtistsContainer = document.getElementById('favorite-artists');




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

// 現在の検索・フィルター状態
let data = [];
let currentRow = null;
let searchQuery = '';

// アプローチ1用の状態変数
let statusFilter = 'all';       // 'all' | 'complete' | 'partial' | 'practice'
let isConfidentFilter = false;  // true / false
let isArtistFilter = false;     // true / false
let favoriteArtistList = [];

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

// 表示する曲を決定（掛け合わせ検索）
function getVisibleSongs() {
    let songs = [...data];

    // 1. 完成度フィルター
    if (statusFilter === 'complete') {
        songs = songs.filter(song => song.complete === true);
    } else if (statusFilter === 'partial') {
        songs = songs.filter(song => song.complete === null || song.complete === undefined);
    } else if (statusFilter === 'practice') {
        songs = songs.filter(song => song.complete === false);
    }

    // 2. 自信曲フィルター（ONの場合のみ絞り込む）
    if (isConfidentFilter) {
        songs = songs.filter(song => song.confident === true);
    }

    // 3. 好きな歌手フィルター（ONの場合のみ絞り込む）
    if (isArtistFilter) {
        songs = songs.filter(song => favoriteArtistList.includes(song.artist));
    }

    // 4. 50音フィルター
    if (currentRow) {
        songs = songs.filter(song => getRow(song.artist_initial) === currentRow);
    }

    // 5. 検索キーワード
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
				favoriteMode === 'confident' ||
				(
					!searchQuery &&
					currentRow === null &&
					favoriteMode === null &&
					completeFilter === 'all'
				);

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
	
	modeMenu.classList.remove('open');
});

filterComplete.addEventListener('click', () => {
    completeFilter = 'complete';
    render();
	
	modeMenu.classList.remove('open');
});

filterPartial.addEventListener('click', () => {
    completeFilter = 'partial';
    render();
	
	
	modeMenu.classList.remove('open');
});

filterPractice.addEventListener('click', () => {
    completeFilter = 'practice';
    render();
	
	
	modeMenu.classList.remove('open');
});


// =========================
// お気に入りアーティスト表示
// =========================

// クイックフィルターボタンの描画・イベント設定
function displayFavoriteArtists(favoriteList) {
    favoriteArtistList = favoriteList || [];
    favoriteArtistsContainer.innerHTML = '';

    // 好きな歌手ボタン
    if (favoriteArtistList.length > 0) {
        const artistButton = document.createElement('button');
        artistButton.textContent = '♥ 好きな歌手';
        artistButton.className = 'chip-btn';
        artistButton.addEventListener('click', () => {
            isArtistFilter = !isArtistFilter; // ON/OFFトグル
            artistButton.classList.toggle('active', isArtistFilter);
            render();
        });
        favoriteArtistsContainer.appendChild(artistButton);
    }

    // 自信曲ボタン
    const confidentButton = document.createElement('button');
    confidentButton.textContent = '★ 自信曲';
    confidentButton.className = 'chip-btn';
    confidentButton.addEventListener('click', () => {
        isConfidentFilter = !isConfidentFilter; // ON/OFFトグル
        confidentButton.classList.toggle('active', isConfidentFilter);
        render();
    });
    favoriteArtistsContainer.appendChild(confidentButton);
}

// 完成度タブのイベント登録
tabAll.addEventListener('click', () => { setStatusFilter('all', tabAll); });
tabComplete.addEventListener('click', () => { setStatusFilter('complete', tabComplete); });
tabPartial.addEventListener('click', () => { setStatusFilter('partial', tabPartial); });
tabPractice.addEventListener('click', () => { setStatusFilter('practice', tabPractice); });

function setStatusFilter(type, activeTab) {
    statusFilter = type;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    activeTab.classList.add('active');
    render();
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
// 下部の現在モード表示
// =========================

function updateCurrentMode() {

    if (searchQuery) {
        currentMode.textContent = '検索中';
        return;
    }

    if (favoriteMode === 'artist') {
        currentMode.textContent = '好きな歌手';
        return;
    }

    if (favoriteMode === 'confident') {
        currentMode.textContent = '自信曲';
        return;
    }

    if (completeFilter === 'complete') {
        currentMode.textContent = 'フル';
        return;
    }

    if (completeFilter === 'partial') {
        currentMode.textContent = '途中まで';
        return;
    }

    if (completeFilter === 'practice') {
        currentMode.textContent = '練習中';
        return;
    }

    currentMode.textContent = 'すべて';
}


// =========================
// 現在の条件で再表示
// =========================

function render() {
    const visibleSongs = getVisibleSongs();
	
    displaySongs(visibleSongs);
	
    updateCompleteButton();
	updateCurrentMode();
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
    // 背景画像を設定（CSS変数にセットしてbody::beforeに適用させる）
    if (streamer.background_image) {
        document.documentElement.style.setProperty(
            '--background-image',
            `url('${streamer.background_image}')`
        );
    }

    // デザイン・フォント反映処理
    if (streamer.font_family) {
        const rawFontFamily = streamer.font_family.trim();
        const dynamicStyles = document.getElementById('dynamic-styles');

        if (dynamicStyles) {
            // カンマで区切られた先頭のフォント名を取得し、クォーテーションを除去
            const primaryFont = rawFontFamily.split(',')[0].replace(/['"]/g, '').trim();

            // Webフォント（Google Fonts）の読み込み設定マップ
            const googleFontMap = {
                'M PLUS Rounded 1c': 'family=M+PLUS+Rounded+1c:wght@400;700',
                'Kiwi Maru': 'family=Kiwi+Maru:wght@400;500',
                'Dela Gothic One': 'family=Dela+Gothic+One',
                'Shippori Mincho': 'family=Shippori+Mincho:wght@400;700',
                'Kaisei Tokumin': 'family=Kaisei+Tokumin:wght@400;700'
            };

            let importCss = '';

            // 対象のGoogle Fontが存在する場合、適切なウェイト指定で@importを生成
            if (googleFontMap[primaryFont]) {
                const fontParam = googleFontMap[primaryFont];
                const fontImportUrl = `https://fonts.googleapis.com/css2?${fontParam}&display=swap`;
                importCss = `@import url('${fontImportUrl}');\n`;
            }

            // CSSの適用
            dynamicStyles.textContent = `
                ${importCss}
                body, body *, button, input {
                    font-family: ${rawFontFamily} !important;
                }
            `;
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
// ハンバーガーメニュー
// =========================

menuButton.addEventListener('click', () => {
    artistNav.classList.toggle('open');

    // 状態メニューが開いていたら閉じる
    modeMenu.classList.remove('open');
});



currentMode.addEventListener('click', () => {
    modeMenu.classList.toggle('open');

    // 50音メニューが開いていたら閉じる
    artistNav.classList.remove('open');
});


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