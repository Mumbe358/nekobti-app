import { NextRequest, NextResponse } from "next/server";
import {
  applyDiagnosisAnswer,
  getDiagnosisSession,
  setDiagnosisSessionCookie,
} from "@/app/lib/server/diagnosis-session";

type AnswerPayload = {
  step?: number;
  question_id?: number;
  option_index?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnswerPayload;
    const session = getDiagnosisSession(request);

    if (!session) {
      return NextResponse.json({ ok: false, error: "Diagnosis session not found" }, { status: 400 });
    }

    if (
      typeof body.step !== "number" ||
      typeof body.question_id !== "number" ||
      typeof body.option_index !== "number"
    ) {
      return NextResponse.json({ ok: false, error: "Missing answer payload" }, { status: 400 });
    }

    const result = applyDiagnosisAnswer(session, body.step, body.question_id, body.option_index);
    const response = NextResponse.json({ ok: true, ...result });
    setDiagnosisSessionCookie(response, result.session);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
