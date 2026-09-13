Shirabe + Supabase Edge Function 版（CORS/JWT修正版）

【今回の修正】
- Supabase公式の corsHeaders を使用
- OPTIONS（CORS preflight）に204を返す
- furigana Function の JWT検証を無効化する config.toml を追加
- 貼り付けた全行を1回のShirabe APIリクエストで処理
- 1回につき最大300件

【配置】
GitHub Pages側：
- addddaodd.html
- add.js
- ao_2.css

Supabase側：
- supabase/functions/furigana/index.ts
- supabase/config.toml

【Supabase CLIでデプロイする場合】
このフォルダをSupabaseプロジェクトのルートに置いて、以下を実行：

supabase functions deploy furigana

config.toml の verify_jwt = false により、ブラウザから直接呼び出せる公開Functionとして動作します。

【重要】
verify_jwt = false にするとFunction URL自体は認証なしで呼び出せます。
このFunctionはShirabeへの読み取得だけを行い、Supabaseのsongsテーブルへ直接書き込みません。

【ブラウザ側】
GitHub Pagesの既存ファイル3つをこのZIPのものに置き換えてください。
Supabase Functionをデプロイ後、ブラウザをハードリロードして確認してください。
