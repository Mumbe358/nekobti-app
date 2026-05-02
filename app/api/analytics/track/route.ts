import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/server/supabase-admin";

type TrackPayload = {
  event_name?: string;
  session_id?: string;
  visitor_id?: string;
  page_path?: string;
  page_url?: string;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  user_agent?: string;
  timezone?: string;
  result_type?: string | null;
  mbti?: string | null;
  gender?: string | null;
  coat?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackPayload;

    if (!body?.event_name || typeof body.event_name !== "string") {
      return NextResponse.json(
        { ok: false, error: "event_name is required" },
        { status: 400 },
      );
    }

    if (process.env.VERCEL_ENV !== "production") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "non-production environment",
        env: process.env.VERCEL_ENV ?? "unknown",
      });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("events").insert({
      event_name: body.event_name,
      session_id: body.session_id ?? "",
      visitor_id: body.visitor_id ?? "",
      page_path: body.page_path ?? "",
      page_url: body.page_url ?? "",
      referrer: body.referrer ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      user_agent: body.user_agent ?? request.headers.get("user-agent") ?? "",
      timezone: body.timezone ?? "",
      result_type: body.result_type ?? null,
      mbti: body.mbti ?? null,
      gender: body.gender ?? null,
      coat: body.coat ?? null,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
