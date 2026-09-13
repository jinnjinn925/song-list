import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

const SHIRABE_URL = "https://shirabe.dev/api/v1/text/tokenize";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function katakanaToHiragana(src: string) {
  return src.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

const letterReading: Record<string, string> = {
  A:"えー", B:"びー", C:"しー", D:"でぃー", E:"いー", F:"えふ",
  G:"じー", H:"えいち", I:"あい", J:"じぇい", K:"けー", L:"える",
  M:"えむ", N:"えぬ", O:"おー", P:"ぴー", Q:"きゅー", R:"あーる",
  S:"えす", T:"てぃー", U:"ゆー", V:"ぶい", W:"だぶりゅー",
  X:"えっくす", Y:"わい", Z:"ぜっと",
};

function asciiFallback(text: string) {
  let out = "";
  for (const ch of text) {
    if (letterReading[ch.toUpperCase()]) {
      out += letterReading[ch.toUpperCase()];
    } else if (/^[0-9]$/.test(ch)) {
      const nums = ["ぜろ","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"];
      out += nums[Number(ch)];
    } else {
      out += ch;
    }
  }
  return out;
}

function byteOffsetToCharIndex(text: string, targetBytes: number) {
  const encoder = new TextEncoder();
  let bytes = 0;
  let i = 0;
  for (const ch of text) {
    if (bytes >= targetBytes) break;
    bytes += encoder.encode(ch).length;
    i++;
  }
  return i;
}

function readingForRange(
  fullText: string,
  startByte: number,
  endByte: number,
  tokens: any[]
) {
  const start = byteOffsetToCharIndex(fullText, startByte);
  const end = byteOffsetToCharIndex(fullText, endByte);

  let result = "";
  for (const token of tokens) {
    const tokenStart = Number(token.byte_start ?? 0);
    const tokenEnd = Number(token.byte_end ?? tokenStart);

    if (tokenEnd <= startByte || tokenStart >= endByte) continue;

    const reading = token.reading
      ? katakanaToHiragana(String(token.reading))
      : String(token.surface ?? "");

    result += reading;
  }

  return result || fullText.slice(start, end);
}

Deno.serve(async (req) => {
  // Supabase's CORS preflight must return a successful response before POST.
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : null;

    if (!rows || rows.length === 0) {
      return json({ error: "rows がありません。" }, 400);
    }

    if (rows.length > 300) {
      return json({ error: "一度に処理できるのは300件までです。" }, 400);
    }

    // All pasted rows are combined into ONE Shirabe request.
    const marker = "\n§§§ROW§§§\n";
    const chunks: {
      artist: string;
      title: string;
      artistStart: number;
      artistEnd: number;
      titleStart: number;
      titleEnd: number;
    }[] = [];
    let fullText = "";
    const encoder = new TextEncoder();

    for (let i = 0; i < rows.length; i++) {
      const artist = String(rows[i]?.artist ?? "").trim();
      const title = String(rows[i]?.title ?? "").trim();

      const artistStart = encoder.encode(fullText).length;
      fullText += artist;
      const artistEnd = encoder.encode(fullText).length;

      fullText += "\n";

      const titleStart = encoder.encode(fullText).length;
      fullText += title;
      const titleEnd = encoder.encode(fullText).length;

      chunks.push({ artist, title, artistStart, artistEnd, titleStart, titleEnd });

      if (i !== rows.length - 1) fullText += marker;
    }

    const shirabeRes = await fetch(SHIRABE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText }),
    });

    let shirabe: any = null;
    try {
      shirabe = await shirabeRes.json();
    } catch (_) {
      // handled below
    }

    if (!shirabeRes.ok) {
      return json({
        error: `Shirabe API error: ${shirabe?.error?.message || `HTTP ${shirabeRes.status}`}`,
      }, shirabeRes.status);
    }

    const tokens = Array.isArray(shirabe?.tokens) ? shirabe.tokens : [];

    const result = chunks.map((c) => {
      let artistInitial = readingForRange(fullText, c.artistStart, c.artistEnd, tokens);
      let titleInitial = readingForRange(fullText, c.titleStart, c.titleEnd, tokens);

      artistInitial = asciiFallback(katakanaToHiragana(artistInitial));
      titleInitial = asciiFallback(katakanaToHiragana(titleInitial));

      return {
        artist: c.artist,
        artist_initial: artistInitial,
        title: c.title,
        title_initial: titleInitial,
      };
    });

    return json({ rows: result });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
