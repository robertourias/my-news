import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { generateBriefing } from "@/lib/briefing";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/refresh — dispara a geração do briefing.
 * Protegido por CRON_SECRET (header `Authorization: Bearer <secret>`
 * ou query `?token=<secret>`). Use `?force=1` para ignorar o cache por hash.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("token");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { briefing, status } = await generateBriefing({
      force: url.searchParams.get("force") === "1",
    });
    revalidatePath("/");

    return NextResponse.json({
      status,
      date: briefing.date,
      generatedAt: briefing.generatedAt,
      aiProvider: briefing.aiProvider,
      articles: briefing.stats.articleCount,
      events: briefing.stats.eventCount,
    });
  } catch (err) {
    console.error("[api/refresh]", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
