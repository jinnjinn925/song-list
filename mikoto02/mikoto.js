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

//let currentFavoriteArtist = null;
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
        'あ': 'あ',
        'か': 'あ',
        'が': 'あ',
        'さ': 'あ',
        'ざ': 'あ',
        'た': 'あ',
        'だ': 'あ',
        'な': 'あ',
        'は': 'あ',
        'ば': 'あ',
        'ぱ': 'あ',
        'ま': 'あ',
        'や': 'あ',
        'ら': 'あ',
        'わ': 'あ',

        // い段
        'い': 'い',
        'き': 'い',
        'ぎ': 'い',
        'し': 'い',
        'じ': 'い',
        'ち': 'い',
        'ぢ': 'い',
        'に': 'い',
        'ひ': 'い',
        'び': 'い',
        'ぴ': 'い',
        'み': 'い',
        'り': 'い',

        // う段
        'う': 'う',
        'く': 'う',
        'ぐ': 'う',
        'す': 'う',
        'ず': 'う',
        'つ': 'う',
        'づ': 'う',
        'ぬ': 'う',
        'ふ': 'う',
        'ぶ': 'う',
        'ぷ': 'う',
        'む': 'う',
        'ゆ': 'う',
        'る': 'う',

        // え段
        'え': 'え',
        'け': 'え',
        'げ': 'え',
        'せ': 'え',
        'ぜ': 'え',
        'て': 'え',
        'で': 'え',
        'ね': 'え',
        'へ': 'え',
        'べ': 'え',
        'ぺ': 'え',
        'め': 'え',
        'れ': 'え',

        // お段
        'お': 'お',
        'こ': 'お',
        'ご': 'お',
        'そ': 'お',
        'ぞ': 'お',
        'と': 'お',
        'ど': 'お',
        'の': 'お',
        'ほ': 'お',
        'ぼ': 'お',
        'ぽ': 'お',
        'も': 'お',
        'よ': 'お',
        'ろ': 'お',
        'を': 'お'
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

        // -------------------------
        // 伸ばし棒
        // -------------------------

        if (char === 'ー') {

            // 直前が「ゃ・ゅ・ょ」なら
            // その小文字の母音を使う
            if (
                result.length > 0 &&
                smallVowelMap[previousMainChar]
            ) {
                result += smallVowelMap[previousMainChar];
            }

            // 通常のかななら、その文字の母音
            else if (
                result.length > 0 &&
                vowelMap[previousMainChar]
            ) {
                result += vowelMap[previousMainChar];
            }

            // 判定できない場合はそのまま
            else {
                result += 'ー';
            }

            continue;
        }


        result += char;


        // -------------------------
        // 通常のかな
        // -------------------------

        if (vowelMap[char]) {
            previousMainChar = char;
        }

        // -------------------------
        // 拗音
        // -------------------------

        else if (smallVowelMap[char]) {
            previousMainChar = char;
        }

        // -------------------------
        // 「っ」など
        // -------------------------

        else if (char === 'っ') {
            // 「っ」の前の音を維持
        }

        else {
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


    // お気に入りアーティストで絞る

    if (favoriteMode === 'artist') {

    	songs = songs.filter(
        	song =>
            	favoriteArtistList.includes(
                	song.artist
            	)
    	);

	}


	if (favoriteMode === 'confident') {

    	songs = songs.filter(
        	song =>
            	song.confident === true
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

		const query =
			  searchQuery.toLowerCase();

		songs = songs.filter(song => {

			const artist =
				  (song.artist || '')
						.toLowerCase();

			const title =
				  (song.title || '')
						.toLowerCase();

			const artistInitial =
				  (song.artist_initial || '')
						.toLowerCase();

			const titleInitial =
				  (song.title_initial || '')
						.toLowerCase();

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
			
			
			// =========================
			// 最初の開閉状態
			// =========================

			// 「一覧」のときだけ最初から開く
			const shouldOpen =
				!searchQuery &&
				currentRow === null &&
				favoriteMode === null &&
				completeFilter === 'all';

			if (shouldOpen) {

				// 一覧だけ開く
				newArtistSongs.classList.remove(
					'collapsed'
				);

				artistDiv.classList.remove(
					'collapsed'
				);

			} else {

				// 50音・好きな歌手・自信曲・
				// 最後まで・練習中・検索は閉じる
				newArtistSongs.classList.add(
					'collapsed'
				);

				artistDiv.classList.add(
					'collapsed'
				);
			}

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
					
					updateSongCount();

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

		songDiv.className =
    		'song';

		// 曲名
		const titleDiv =
    		document.createElement('div');

		titleDiv.textContent =
    		song.title +
    		(song.complete ? ' *' : '');

		songDiv.appendChild(titleDiv);

		// 歌いだし（登録されている場合だけ）
		

		artistSongs.appendChild(songDiv);

    });
}


// =========================
// 曲数表示
// =========================

function updateSongCount() {

    const total =
        data.length;

    // 現在、画面上で開いている曲だけを数える
    const visible =
        document.querySelectorAll(
            '.artist-songs:not(.collapsed) .song'
        ).length;

    const complete =
        data.filter(
            song => song.complete === true
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
// 最後まで歌えるフィルター
// =========================

filterAll.addEventListener(
    'click',
    () => {
        completeFilter = 'all';

        filterAll.classList.add('active');
        filterComplete.classList.remove('active');
        filterPartial.classList.remove('active');
        filterPractice.classList.remove('active');

        render();
    }
);

filterComplete.addEventListener(
    'click',
    () => {
        completeFilter = 'complete';

        filterAll.classList.remove('active');
        filterComplete.classList.add('active');
        filterPartial.classList.remove('active');
        filterPractice.classList.remove('active');

        render();
    }
);

// ▼ ここに console.log を追加します
filterPartial.addEventListener(
    'click',
    () => {
        // console.log('途中までボタンが押されました。現在のデータ:', data); // ← ★この1行を追加

        completeFilter = 'partial';

        filterAll.classList.remove('active');
        filterComplete.classList.remove('active');
        filterPartial.classList.add('active');
        filterPractice.classList.remove('active');

        render();
    }
);

filterPractice.addEventListener(
    'click',
    () => {
        completeFilter = 'practice';

        filterAll.classList.remove('active');
        filterComplete.classList.remove('active');
        filterPartial.classList.remove('active');
        filterPractice.classList.add('active');

        render();
    }
);


// =========================
// お気に入りアーティスト表示
// =========================

// =========================
// お気に入りアーティスト表示
// =========================

// =========================
// お気に入りアーティスト表示
// =========================

// =========================
// お気に入りアーティスト表示
// =========================

function displayFavoriteArtists(favoriteList) {

    favoriteArtistList = favoriteList || [];

    // `#favorite-artists` 内（前回生成されたボタン）をクリア
    favoriteArtists.innerHTML = '';

    // セクション全体を常に表示
    favoriteSection.style.display = 'block';


    // -------------------------
    // 好きな歌手ボタン（常に表示）
    // -------------------------
    const artistButton = document.createElement('button');
    artistButton.textContent = '好きな歌手';
    artistButton.className = 'favorite-button';

    artistButton.addEventListener('click', () => {
        if (favoriteMode === 'artist') {
            favoriteMode = null;
        } else {
            favoriteMode = 'artist';
        }

        currentRow = null;

        document.querySelectorAll('#artist-nav button').forEach(navButton => {
            navButton.classList.remove('active');
        });

        artistButton.classList.toggle('active', favoriteMode === 'artist');
        confidentButton.classList.remove('active');

        render();
    });

    favoriteArtists.appendChild(artistButton);


    // -------------------------
    // 自信曲ボタン（常に表示）
    // -------------------------
    const confidentButton = document.createElement('button');
    confidentButton.textContent = '自信曲';
    confidentButton.className = 'favorite-button';

    confidentButton.addEventListener('click', () => {
        if (favoriteMode === 'confident') {
            favoriteMode = null;
        } else {
            favoriteMode = 'confident';
        }

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

    filterAll.classList.toggle(
        'active',
        completeFilter === 'all'
    );

    filterComplete.classList.toggle(
        'active',
        completeFilter === 'complete'
    );

    filterPartial.classList.toggle(
        'active',
        completeFilter === 'partial'
    );

    filterPractice.classList.toggle(
        'active',
        completeFilter === 'practice'
    );
}

// =========================
// 現在の条件で再表示
// =========================

function render() {
    const visibleSongs =
        getVisibleSongs();

    displaySongs(visibleSongs);

    updateCompleteButton();
    updateSongCount();
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

                favoriteMode = null;


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

            favoriteMode = null;


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

filterAll.addEventListener(
    'click',
    () => {

        completeFilter = 'all';

        filterAll.classList.add('active');
        filterComplete.classList.remove('active');
        filterPractice.classList.remove('active');

        render();

    }
);

filterComplete.addEventListener(
    'click',
    () => {

        completeFilter = 'complete';

        filterAll.classList.remove('active');
        filterComplete.classList.add('active');
        filterPractice.classList.remove('active');

        render();

    }
);

filterPractice.addEventListener(
    'click',
    () => {

        completeFilter = 'practice';

        filterAll.classList.remove('active');
        filterComplete.classList.remove('active');
        filterPractice.classList.add('active');

        render();

    }
);


// =========================
// 曲を読み込む
// =========================

async function loadSongs() {

    const params =
		new URLSearchParams(window.location.search);

	const urlId =
		params.get('streamer');


    // =========================
    // ストリーマー情報
    // =========================

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


    // =========================
    // ストリーマー名
    // =========================

    streamerName.textContent =
        streamer.name;
	
	// 背景画像を設定
	if (streamer.background_image) {
	  document.body.style.backgroundImage = `url('${streamer.background_image}')`;
	  document.body.style.backgroundSize = 'cover';
	  document.body.style.backgroundPosition = 'center';
	  document.body.style.backgroundAttachment = 'fixed';
	}
	
	
	
	// =========================
	// ストリーマーごとのデザイン
	// =========================

	if (streamer.font_family) {
		document.body.style.fontFamily =
			streamer.font_family;
	}

	if (streamer.text_color) {
		document.documentElement.style.setProperty(
			'--text-color',
			streamer.text_color
		);
	}

	if (streamer.theme_color) {
		document.documentElement.style.setProperty(
			'--theme-color',
			streamer.theme_color
		);
	}

	if (streamer.background_image) {
		document.body.style.backgroundImage =
			`url("${streamer.background_image}")`;

		document.body.style.backgroundSize =
			'cover';

		document.body.style.backgroundAttachment =
			'fixed';

		document.body.style.backgroundPosition =
			'center';
	}
	


    // =========================
    // お気に入り
    // =========================

    displayFavoriteArtists(
        streamer.favorite_artists || []
    );


    // =========================
    // 曲情報
    // streamer_songs
    //   ↓
    // songs_new
    //   ↓
    // artists
    // =========================

    const {
        data: streamerSongs,
        error: songsError
    } =
        await supabaseClient
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


    // =========================
    // 今までの data と同じ形にする
    // =========================

    const songs =
        streamerSongs
            .filter(
                row =>
                    row.song &&
                    row.song.artist
            )
            .map(
                row => {

                    return {

                        // 曲そのもの
                        id:
                            row.song.id,

                        title:
                            row.song.title,

                        title_initial:
                            row.song.title_initial,

                        

                        // アーティスト
                        artist:
                            row.song.artist.name,

                        artist_initial:
                            row.song.artist.artist_initial,

                        // ストリーマーごとの情報
                        complete:
                            row.complete,

                        confident:
                            row.confident

                    };

                }
            );


    // =========================
    // 曲を並び替え
    // =========================

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


    // =========================
    // データを保存
    // =========================

    data = songs;


    // =========================
    // 曲数表示
    // =========================

    updateSongCount();


    // =========================
    // 最初は一覧
    // =========================

    document
        .querySelector(
            '#artist-nav button'
        )
        .classList.add('active');


    // =========================
    // 表示
    // =========================

    render();
}

// =========================
// 検索メニュー
// =========================




songSearch.addEventListener(
    'input',
    () => {

        searchQuery =
            songSearch.value.trim();
		
		searchClear.classList.toggle(
			'visible',
			searchQuery.length > 0
		);

        // 検索したら50音・お気に入りを解除

        if (searchQuery) {

            currentRow = null;

            currentFavoriteArtist = null;


            document
                .querySelectorAll(
                    '.favorite-button'
                )
                .forEach(
                    button => {
                        button.classList.remove(
                            'active'
                        );
                    }
                );


            document
                .querySelectorAll(
                    '#artist-nav button'
                )
                .forEach(
                    button => {
                        button.classList.remove(
                            'active'
                        );
                    }
                );

        }

        render();

    }
);


searchClear.addEventListener(
    'click',
    () => {

        songSearch.value = '';

        searchQuery = '';
		
		searchClear.classList.remove('visible');

        render();

        songSearch.focus();

    }
);




// =========================
// 実行
// =========================

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', () => {
  // URLに streamer パラメータがない場合のフォールバック（初期値指定）
  const params = new URLSearchParams(window.location.search);
  if (!params.get('streamer')) {
    // 例: デフォルトで 'mikoto' を表示したい場合
    // urlParamsを補完するか、リダイレクトなどの処理を行えます
  }
  
  loadSongs();
});