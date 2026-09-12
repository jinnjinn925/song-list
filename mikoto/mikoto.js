// JavaScript Do // Supabaseへの接続
const supabaseUrl = 'https://dgssybbbgnnygmccjltn.supabase.co';

const supabaseKey =
    'sb_publishable_JNz1mi6gysaFjOa0I4I5ow_iDe3PQbd';

const supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );


const list = document.getElementById('song-list');
const nav = document.getElementById('artist-nav');


// ==============================
// 50音ボタン
// ==============================

const initials = [
    '一覧',
    'あ', 'か', 'さ', 'た', 'な',
    'は', 'ま', 'や', 'ら', 'わ'
];


// ==============================
// 50音の分類
// ==============================

// 濁音・半濁音を清音に変換
function normalizeForRow(text) {

    return text
        .replace(/が/g, 'か')
        .replace(/ぎ/g, 'き')
        .replace(/ぐ/g, 'く')
        .replace(/げ/g, 'け')
        .replace(/ご/g, 'こ')

        .replace(/ざ/g, 'さ')
        .replace(/じ/g, 'し')
        .replace(/ず/g, 'す')
        .replace(/ぜ/g, 'せ')
        .replace(/ぞ/g, 'そ')

        .replace(/だ/g, 'た')
        .replace(/ぢ/g, 'ち')
        .replace(/づ/g, 'つ')
        .replace(/で/g, 'て')
        .replace(/ど/g, 'と')

        .replace(/ば/g, 'は')
        .replace(/び/g, 'ひ')
        .replace(/ぶ/g, 'ふ')
        .replace(/べ/g, 'へ')
        .replace(/ぼ/g, 'ほ')

        .replace(/ぱ/g, 'は')
        .replace(/ぴ/g, 'ひ')
        .replace(/ぷ/g, 'ふ')
        .replace(/ぺ/g, 'へ')
        .replace(/ぽ/g, 'ほ');
}


// 各行に属する最初の文字
const rowMap = {

    'あ': 'あいうえお',
    'か': 'かきくけこ',
    'さ': 'さしすせそ',
    'た': 'たちつてと',
    'な': 'なにぬねの',
    'は': 'はひふへほ',
    'ま': 'まみむめも',
    'や': 'やゆよ',
    'ら': 'らりるれろ',
    'わ': 'わをん'

};


// 指定した文字が何行か調べる
function getRow(text) {

    if (!text) {
        return '';
    }

    const first =
        normalizeForRow(text).charAt(0);

    for (const row in rowMap) {

        if (rowMap[row].includes(first)) {
            return row;
        }

    }

    return '';
}


// ==============================
// 50音順ソート
// ==============================

// 日本語の読みを比較するためのCollator
const collator =
    new Intl.Collator('ja', {
        sensitivity: 'base',
        numeric: false
    });


// 読みをソート用に整える
function createSortKey(text) {

    if (!text) {
        return '';
    }

    return text
        // カタカナ → ひらがな
        .replace(/[\u30a1-\u30f6]/g, char =>
            String.fromCharCode(
                char.charCodeAt(0) - 0x60
            )
        )

        // 長音「ー」は直前の母音として扱いやすくする
        .replace(/ー/g, '');

}


// 読み順を比較
function compareReading(a, b) {

    const keyA = createSortKey(a);
    const keyB = createSortKey(b);

    return collator.compare(keyA, keyB);

}


// ==============================
// 曲表示
// ==============================

function displaySongs(songs) {

    list.innerHTML = '';

    let currentArtist = '';


    songs.forEach(song => {

        // アーティストが変わったら見出し
        if (song.artist !== currentArtist) {

            currentArtist = song.artist;

            const artistDiv =
                document.createElement('div');

            artistDiv.textContent =
                song.artist;

            artistDiv.className =
                'artist';

            list.appendChild(artistDiv);
        }


        // 曲名
        const songDiv =
            document.createElement('div');

        songDiv.textContent =
            song.title +
            (song.complete ? ' ★' : '');

        songDiv.className =
            'song';

        list.appendChild(songDiv);

    });

}


// ==============================
// 50音ボタンを作る
// ==============================

initials.forEach(initial => {

    const button =
        document.createElement('button');

    button.textContent =
        initial;


    button.addEventListener('click', () => {

        // 一覧
        if (initial === '一覧') {

            displaySongs(data);

            return;
        }


        // 50音の行で絞り込み
        const filtered =
            data.filter(song => {

                return getRow(
                    song.artist_initial
                ) === initial;

            });


        displaySongs(filtered);

    });


    nav.appendChild(button);

});


// ==============================
// Supabaseから曲を取得
// ==============================

async function loadSongs() {

    // URLからurl_idを取得
    const path =
        window.location.pathname;

    const urlId =
        path
            .split('/')
            .filter(Boolean)
            .pop()
            .replace('.html', '');


    // ==========================
    // ストリーマー取得
    // ==========================

    const {
        data: streamer,
        error: streamerError
    } = await supabaseClient

        .from('streamers')

        .select('*')

        .eq(
            'url_id',
            urlId
        )

        .single();


    if (streamerError || !streamer) {

        console.error(
            streamerError
        );

        list.textContent =
            'ストリーマーが見つかりません';

        return;

    }


    // ==========================
    // 曲取得
    // ==========================

    const {
        data: songs,
        error: songsError
    } = await supabaseClient

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


    // ==========================
    // 並び替え
    // ==========================

    songs.sort((a, b) => {

        // アーティストの読み順
        const artistResult =
            compareReading(
                a.artist_initial,
                b.artist_initial
            );


        if (artistResult !== 0) {

            return artistResult;

        }


        // 同じアーティストなら
        // 曲名の読み順
        const titleResult =
            compareReading(
                a.title_initial,
                b.title_initial
            );


        if (titleResult !== 0) {

            return titleResult;

        }


        // 読みが同じなら表示名
        return collator.compare(
            a.title,
            b.title
        );

    });


    // データ保存
    window.data = songs;


    // 最初は全部表示
    displaySongs(data);

}


// ==============================
// 実行
// ==============================

loadSongs();