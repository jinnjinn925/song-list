const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const SHIRABE_URL = "https://shirabe.dev/api/v1/text/tokenize";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function katakanaToHiragana(src: string) {
  return src.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function isAsciiLetterOrDigit(ch: string) {
  return /^[A-Za-z0-9]$/.test(ch);
}

// A conservative fallback for ASCII characters.
// English artist names cannot be reliably pronounced from spelling alone,
// so these are intentionally simple and remain editable in the preview.
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

// Convert UTF-8 byte offsets returned by Shirabe into JS string offsets.
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

    const surface = String(token.surface ?? "");
    const reading = token.reading ? katakanaToHiragana(String(token.reading)) : surface;

    // Only take the token when it is fully/mostly inside this field.
    result += reading;
  }

  // If the tokenizer didn't return anything, keep the original.
  return result || fullText.slice(start, end);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : null;

    if (!rows || rows.length === 0) {
      return json({ error: "rows がありません。" }, 400);
    }
    if (rows.length > 300) {
      return json({ error: "一度に処理できるのは300件までです。" }, 400);
    }

    // Put all fields into one text request. One Shirabe request = the whole paste.
    // Each field gets a unique marker so byte ranges can be separated reliably.
    const marker = "\n§§§ROW§§§\n";
    const chunks: { artist: string; title: string; artistStart: number; artistEnd: number; titleStart: number; titleEnd: number; }[] = [];
    let fullText = "";

    for (let i = 0; i < rows.length; i++) {
      const artist = String(rows[i]?.artist ?? "").trim();
      const title = String(rows[i]?.title ?? "").trim();

      const artistStart = new TextEncoder().encode(fullText).length;
      fullText += artist;
      const artistEnd = new TextEncoder().encode(fullText).length;

      fullText += "\n";

      const titleStart = new TextEncoder().encode(fullText).length;
      fullText += title;
      const titleEnd = new TextEncoder().encode(fullText).length;

      chunks.push({ artist, title, artistStart, artistEnd, titleStart, titleEnd });

      if (i !== rows.length - 1) fullText += marker;
    }

    const shirabeRes = await fetch(SHIRABE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText }),
    });

    const shirabe = await shirabeRes.json();

    if (!shirabeRes.ok) {
      return json({
        error: `Shirabe API error: ${shirabe?.error?.message || `HTTP ${shirabeRes.status}`}`,
      }, shirabeRes.status);
    }

    const tokens = Array.isArray(shirabe.tokens) ? shirabe.tokens : [];

    const result = chunks.map(c => {
      let artistInitial = readingForRange(fullText, c.artistStart, c.artistEnd, tokens);
      let titleInitial = readingForRange(fullText, c.titleStart, c.titleEnd, tokens);

      // Convert remaining katakana and basic ASCII fallback.
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
