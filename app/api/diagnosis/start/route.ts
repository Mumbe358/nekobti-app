import { NextResponse } from "next/server";
import { buildQuestionSet } from "@/app/lib/server/diagnosis-engine";

export async function GET() {
  try {
    const questions = buildQuestionSet();
    return NextResponse.json({ ok: true, questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
