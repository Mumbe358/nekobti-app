import { NextResponse } from "next/server";
import { buildQuestionSet } from "@/app/lib/server/diagnosis-engine";
import {
  createDiagnosisSession,
  setDiagnosisSessionCookie,
} from "@/app/lib/server/diagnosis-session";

export async function GET() {
  try {
    const questions = buildQuestionSet();
    const session = createDiagnosisSession(questions);

    const response = NextResponse.json({
      ok: true,
      question: questions[0] ?? null,
      totalQuestions: questions.length,
    });

    setDiagnosisSessionCookie(response, session);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
