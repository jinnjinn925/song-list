レパートリー一括登録 — Shirabe + Supabase Edge Function版

この版はKuromojiをブラウザで読み込みません。
GitHub Pages → Supabase Edge Function → Shirabe Text API の順に処理します。

重要:
1. supabase/functions/furigana/index.ts をSupabaseプロジェクトへデプロイしてください。
2. Edge FunctionはShirabeへ「貼り付けた全曲」を1リクエストで送ります。
3. GitHub Pages側からShirabeへ直接アクセスしないため、以前のCORS問題を避けます。
4. Shirabeの匿名Free枠は月10,000リクエスト、1 req/sです。
5. 英字アーティスト名はスペルだけでは正確な発音を判定できないため、単純な文字読みになる場合があります。プレビューで修正できます。

Supabase CLI例:
  supabase functions deploy furigana

GitHub PagesのHTMLは既存の ?id=1 等をそのまま使います。
