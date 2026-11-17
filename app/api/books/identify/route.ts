import Anthropic from "@anthropic-ai/sdk";
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

/**
 * Stable error codes returned as `code`, grouped by stage. The client logs the code to the
 * browser console; the Hebrew `error` text is what the seller sees.
 */
type Stage = "auth" | "parse" | "rate_limit" | "resize" | "upload" | "ai" | "lookup";
type ErrorCode =
  | "unauthorized" | "auth_failed"
  | "parse_failed" | "no_image" | "unsupported_type" | "too_large"
  | "rate_limited" | "rate_limit_failed"
  | "resize_failed" | "image_unreadable"
  | "upload_failed"
  | "ai_auth" | "ai_billing" | "ai_model" | "ai_rate_limited" | "ai_bad_response" | "ai_failed"
  | "lookup_failed";

/** Logs stage, error name and message only: never the request body, the image or the API key. */
function logStage(stage: Stage, code: ErrorCode, err: unknown) {
  if (err instanceof Anthropic.APIError) {
    console.error(
      `[books/identify] stage=${stage} code=${code} ${err.name} status=${err.status ?? "-"} request_id=${err.requestID ?? "-"}: ${err.message}`
    );
  } else if (err instanceof Error) {
    console.error(`[books/identify] stage=${stage} code=${code} ${err.name}: ${err.message}`);
  } else {
    console.error(`[books/identify] stage=${stage} code=${code}: ${String(err)}`);
  }
}

function errorResponse(code: ErrorCode, status: number, error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ code, error, ...extra }, { status });
}

// Created lazily so a missing key only fails this route, never the build.
let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from the server env
  return client;
}

class BadModelOutput extends Error {
  name = "BadModelOutput";
}

function parseIdentified(text: string): Identified {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new BadModelOutput("no JSON object in model output");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new BadModelOutput("model output is not valid JSON");
  }
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

function classifyAiError(err: unknown): ErrorCode {
  if (err instanceof BadModelOutput) return "ai_bad_response";
  if (err instanceof Anthropic.APIError) {
    const type = (err.error as { error?: { type?: string } } | undefined)?.error?.type;
    if (err.status === 401 || err.status === 403) return "ai_auth";
    if (err.status === 402 || type === "billing_error" || /credit balance|billing/i.test(err.message)) return "ai_billing";
    if (err.status === 404 || (err.status === 400 && /model/i.test(err.message))) return "ai_model";
    if (err.status === 429) return "ai_rate_limited";
    return "ai_failed";
  }
  // Errors raised before any request is sent: missing key, or a key with invalid characters.
  if (err instanceof Error && /api[_ ]?key|auth|ByteString/i.test(err.message)) return "ai_auth";
  return "ai_failed";
}

async function identifyCover(jpeg: Buffer): Promise<Identified> {
  const response = await getClient().messages.create({
    model: process.env.AI_MODEL?.trim() || "claude-haiku-5-5",
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
    console.warn(`[books/identify] stage=ai model refused (${response.stop_details?.category ?? "no category"})`);
    return EMPTY;
  }
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parseIdentified(text);
}

const AI_MESSAGES: Partial<Record<ErrorCode, string>> = {
  ai_rate_limited: "שירות הזיהוי עמוס כרגע.",
  ai_bad_response: "לא הצלחנו לפענח את תוצאת הזיהוי.",
};

export async function POST(req: Request) {
  // ── auth ──
  let userId: string;
  try {
    const session = await getActiveSession(); // blocked/deleted users come back without userId
    if (!session.userId) return errorResponse("unauthorized", 401, "יש להתחבר תחילה");
    userId = session.userId;
  } catch (err) {
    logStage("auth", "auth_failed", err);
    return errorResponse("auth_failed", 500, "שגיאת שרת. אנא נסה שוב.");
  }

  // ── parse ──
  let input: Buffer;
  try {
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BYTES + 64 * 1024) {
      return errorResponse("too_large", 413, "התמונה גדולה מדי (מקסימום 8MB)");
    }
    const form = await req.formData();
    const entry = form.get("image");
    if (!(entry instanceof File)) return errorResponse("no_image", 400, "לא התקבלה תמונה");
    if (!entry.type.startsWith("image/")) return errorResponse("unsupported_type", 415, "יש להעלות קובץ תמונה בלבד");
    if (entry.size > MAX_BYTES) return errorResponse("too_large", 413, "התמונה גדולה מדי (מקסימום 8MB)");
    input = Buffer.from(await entry.arrayBuffer());
  } catch (err) {
    logStage("parse", "parse_failed", err);
    return errorResponse("parse_failed", 400, "בקשה לא תקינה");
  }

  // ── rate limit (DB-backed: works across serverless instances, unlike an in-memory counter) ──
  try {
    const since = new Date(Date.now() - RATE_WINDOW_MS);
    const used = await prisma.aiIdentifyUsage.count({ where: { user_id: userId, created_at: { gte: since } } });
    if (used >= RATE_LIMIT) {
      return errorResponse("rate_limited", 429, "הגעת למגבלה של 20 זיהויים בשעה. נסה שוב מאוחר יותר או מלא את פרטי הספר ידנית.");
    }
    await prisma.aiIdentifyUsage.create({ data: { user_id: userId } });
  } catch (err) {
    logStage("rate_limit", "rate_limit_failed", err);
    return errorResponse("rate_limit_failed", 500, "שגיאת שרת. אנא נסה שוב.");
  }

  // ── resize ── sharp is imported here, not at module level, so a broken native install
  // becomes a `resize_failed` JSON response instead of crashing the whole route.
  let aiJpeg: Buffer;
  let coverJpeg: Buffer;
  {
    let sharp: typeof import("sharp");
    try {
      sharp = (await import("sharp")).default;
    } catch (err) {
      logStage("resize", "resize_failed", err);
      return errorResponse("resize_failed", 500, "עיבוד התמונה נכשל.");
    }
    try {
      const base = sharp(input, { failOn: "error" }).rotate(); // apply EXIF orientation
      [aiJpeg, coverJpeg] = await Promise.all([
        base.clone().resize(AI_MAX_SIDE, AI_MAX_SIDE, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(),
        base.clone().resize(COVER_MAX_SIDE, COVER_MAX_SIDE, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(),
      ]);
    } catch (err) {
      logStage("resize", "image_unreadable", err);
      return errorResponse("image_unreadable", 415, "לא הצלחנו לקרוא את התמונה. נסה תמונה אחרת.");
    }
  }

  // ── upload + ai (in parallel) ──
  const [uploadResult, aiResult] = await Promise.allSettled([
    uploadBookCover(`data:image/jpeg;base64,${coverJpeg.toString("base64")}`),
    identifyCover(aiJpeg),
  ]);

  const coverUrl = uploadResult.status === "fulfilled" ? uploadResult.value : null;
  if (uploadResult.status === "rejected") logStage("upload", "upload_failed", uploadResult.reason);

  let identified = EMPTY;
  let aiCode: ErrorCode | null = null;
  if (aiResult.status === "fulfilled") {
    identified = aiResult.value;
  } else {
    aiCode = classifyAiError(aiResult.reason);
    logStage("ai", aiCode, aiResult.reason);
  }

  // ── lookup ── (non-fatal: without it we just prefill a new book)
  let match: Awaited<ReturnType<typeof findMatchingBook>> = null;
  let lookupCode: ErrorCode | null = null;
  if (identified.title && identified.author) {
    try {
      match = await findMatchingBook(identified.title, identified.author);
    } catch (err) {
      lookupCode = "lookup_failed";
      logStage("lookup", lookupCode, err);
    }
  }

  const uncertain = !!aiCode || identified.confidence < LOW_CONFIDENCE || !identified.title || !identified.author;
  const payload = { identified, match, coverUrl, uncertain, warning: lookupCode ?? undefined };

  if (!coverUrl) {
    // The client falls back to uploading the photo with the listing; it can still use `identified`.
    return errorResponse("upload_failed", 502, "העלאת התמונה נכשלה.", payload);
  }
  if (aiCode) {
    const status = aiCode === "ai_failed" || aiCode === "ai_bad_response" ? 502 : 503;
    return errorResponse(aiCode, status, AI_MESSAGES[aiCode] ?? "הזיהוי האוטומטי לא זמין כרגע.", payload);
  }
  return Response.json(payload);
}
