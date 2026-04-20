import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/server/supabase-admin";
import {
  calculateDiagnosisResult,
  type Question,
  type QuestionOption,
} from "@/app/lib/server/diagnosis-engine";
import {
  getCardCopy,
  getRandomAruaru,
  getResultPresentation,
} from "@/app/lib/server/diagnosis-content";

type FinalizePayload = {
  gender?: string;
  coat?: string;
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
  current_questions?: Question[];
  answers?: (QuestionOption | null)[];
};

type ShareRow = {
  result_type: string;
  percentage: number | string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FinalizePayload;

    if (!body?.gender || !body?.coat) {
      return NextResponse.json(
        { ok: false, error: "Missing required appearance fields" },
        { status: 400 },
      );
    }

    if (!body.current_questions?.length || !body.answers?.length) {
      return NextResponse.json(
        { ok: false, error: "Missing diagnosis answers" },
        { status: 400 },
      );
    }

    const result = calculateDiagnosisResult(body.current_questions, body.answers);

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Failed to calculate diagnosis result" },
        { status: 400 },
      );
    }

    const selectedAruaru = getRandomAruaru(result.mainType);
    const cardCopy = getCardCopy(result.mainType, selectedAruaru);
    const presentation = getResultPresentation(result.mainType);

    const supabase = getSupabaseAdmin();

    const { error: resultError } = await supabase.from("diagnosis_results").insert({
      result_type: result.mainType,
      mbti: result.mbti,
      gender: body.gender,
      coat: body.coat,
      session_id: body.session_id ?? "",
      visitor_id: body.visitor_id ?? "",
      page_path: body.page_path ?? "",
      referrer: body.referrer ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      user_agent: body.user_agent ?? request.headers.get("user-agent") ?? "",
      timezone: body.timezone ?? "",
    });

    if (resultError) {
      return NextResponse.json(
        { ok: false, error: resultError.message },
        { status: 500 },
      );
    }

    const { error: eventError } = await supabase.from("events").insert({
      event_name: "diagnosis_completed",
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
      result_type: result.mainType,
      mbti: result.mbti,
      gender: body.gender,
      coat: body.coat,
    });

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message },
        { status: 500 },
      );
    }

    const { data: shares, error: shareError } = await supabase
      .from("diagnosis_type_share")
      .select("result_type, percentage");

    if (shareError) {
      return NextResponse.json(
        { ok: false, error: shareError.message },
        { status: 500 },
      );
    }

    const typeShares = (shares ?? []).reduce<Record<string, number>>((acc, row) => {
      const item = row as ShareRow;
      acc[item.result_type] = Number(item.percentage);
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      typeShares,
      result: {
        ...result,
        selectedAruaru,
        cardCopy,
        emoji: presentation.emoji,
        description: presentation.description,
        traits: presentation.traits,
        compatibility: presentation.compatibility,
        bestMatch: presentation.bestMatch,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
