import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { getActiveSession } from "@/lib/activeSession";
import { prisma } from "@/lib/db";
import { uploadBookCover } from "@/lib/cloudinary";
import { findMatchingBook } from "@/lib/bookMatch";

// Image processing + model call + Cloudinary upload can take a while.
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const AI_MAX_SIDE = 1024;
const COVER_MAX_SIDE = 1600;
const LOW_CONFIDENCE = 0.6;

const PROMPT =
  "Identify the book from this cover photo. Return only JSON. Keep the title and author in the original language as printed. If you cannot read it, return empty strings and confidence 0.\n" +
  'Schema: { "title": string, "author": string, "publisher": string|null, "language": "he"|"en"|"other", "confidence": number between 0 and 1 }';

type Identified = {
  title: string;
  author: string;
  publisher: string | null;
  language: "he" | "en" | "other";
  confidence: number;
};

const EMPTY: Identified = { title: "", author: "", publisher: null, language: "other", confidence: 0 };

// Created lazily so a missing key only fails this route, never the build.
let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from the server env
  return client;
}

function parseIdentified(text: string): Identified {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return EMPTY;
  const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 300) : "");
  const lang = raw.language;
  const conf = typeof raw.confidence === "number" && isFinite(raw.confidence) ? raw.confidence : 0;
  return {
    title: str(raw.title),
    author: str(raw.author),
    publisher: str(raw.publisher) || null,
    language: lang === "he" || lang === "en" ? lang : "other",
    confidence: Math.min(1, Math.max(0, conf)),
  };
}

async function identifyCover(jpeg: Buffer): Promise<Identified> {
  const response = await getClient().messages.create({
    model: process.env.AI_MODEL || "claude-haiku-5-5",
    max_tokens: 2000,
    output_config: { effort: "low" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    console.warn("[books/identify] model refused", response.stop_details?.category ?? "");
    return EMPTY;
  }
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parseIdentified(text);
}

export async function POST(req: Request) {
  const session = await getActiveSession(); // blocked/deleted users come back without userId
  if (!session.userId) {
    return Response.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }
  const userId = session.userId;

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BYTES + 64 * 1024) {
    return Response.json({ error: "התמונה גדולה מדי (מקסימום 8MB)" }, { status: 413 });
  }

  let file: File;
  try {
    const form = await req.formData();
    const entry = form.get("image");
    if (!(entry instanceof File)) {
      return Response.json({ error: "לא התקבלה תמונה" }, { status: 400 });
    }
    file = entry;
  } catch {
    return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "יש להעלות קובץ תמונה בלבד" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "התמונה גדולה מדי (מקסימום 8MB)" }, { status: 413 });
  }

  // DB-backed limit: works across serverless instances, unlike an in-memory counter.
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const used = await prisma.aiIdentifyUsage.count({
    where: { user_id: userId, created_at: { gte: since } },
  });
  if (used >= RATE_LIMIT) {
    return Response.json(
      { error: "הגעת למגבלה של 20 זיהויים בשעה. נסה שוב מאוחר יותר או מלא את פרטי הספר ידנית." },
      { status: 429 }
    );
  }
  await prisma.aiIdentifyUsage.create({ data: { user_id: userId } });

  let aiJpeg: Buffer;
  let coverJpeg: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const base = sharp(input, { failOn: "error" }).rotate(); // apply EXIF orientation
    [aiJpeg, coverJpeg] = await Promise.all([
      base.clone().resize(AI_MAX_SIDE, AI_MAX_SIDE, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(),
      base.clone().resize(COVER_MAX_SIDE, COVER_MAX_SIDE, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(),
    ]);
  } catch (err) {
    console.error("[books/identify] image decode failed:", err instanceof Error ? err.message : String(err));
    return Response.json({ error: "לא הצלחנו לקרוא את התמונה. נסה תמונה אחרת." }, { status: 415 });
  }

  const [aiResult, uploadResult] = await Promise.allSettled([
    identifyCover(aiJpeg),
    uploadBookCover(`data:image/jpeg;base64,${coverJpeg.toString("base64")}`),
  ]);

  if (uploadResult.status === "rejected") {
    const e = uploadResult.reason;
    console.error("[books/identify] cover upload failed:", e instanceof Error ? e.message : String(e));
    return Response.json({ error: "העלאת התמונה נכשלה. אנא נסה שוב." }, { status: 502 });
  }
  const coverUrl = uploadResult.value;

  let identified = EMPTY;
  let aiFailed = false;
  if (aiResult.status === "fulfilled") {
    identified = aiResult.value;
  } else {
    aiFailed = true;
    const e = aiResult.reason;
    // Log status/message only — never the request (which contains the image).
    if (e instanceof Anthropic.APIError) {
      console.error(`[books/identify] Anthropic API error ${e.status}: ${e.message}`);
    } else {
      console.error("[books/identify] identification failed:", e instanceof Error ? e.message : String(e));
    }
  }

  let match: Awaited<ReturnType<typeof findMatchingBook>> = null;
  if (identified.title && identified.author) {
    try {
      match = await findMatchingBook(identified.title, identified.author);
    } catch (err) {
      console.error("[books/identify] book lookup failed:", err instanceof Error ? err.message : String(err));
    }
  }

  const uncertain =
    aiFailed || identified.confidence < LOW_CONFIDENCE || !identified.title || !identified.author;

  return Response.json({ identified, match, coverUrl, uncertain });
}
