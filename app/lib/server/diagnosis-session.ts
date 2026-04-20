import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { Question, QuestionOption } from "@/app/lib/server/diagnosis-engine";

export const DIAGNOSIS_SESSION_COOKIE = "nekobti_diagnosis_session";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

type DiagnosisSession = {
  questions: Question[];
  answers: (QuestionOption | null)[];
  currentStep: number;
  createdAt: number;
};

function getSessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createHash("sha256").update(secret).digest();
}

function encodeSession(session: DiagnosisSession) {
  const iv = randomBytes(12);
  const key = getSessionSecret();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.from(JSON.stringify(session), "utf8");
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decodeSession(token: string): DiagnosisSession | null {
  try {
    const raw = Buffer.from(token, "base64url");

    if (raw.length <= 28) return null;

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const key = getSessionSecret();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return JSON.parse(decrypted) as DiagnosisSession;
  } catch {
    return null;
  }
}

export function createDiagnosisSession(questions: Question[]): DiagnosisSession {
  return {
    questions,
    answers: Array(questions.length).fill(null),
    currentStep: 0,
    createdAt: Date.now(),
  };
}

export function getDiagnosisSession(request: NextRequest): DiagnosisSession | null {
  const token = request.cookies.get(DIAGNOSIS_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export function setDiagnosisSessionCookie(response: NextResponse, session: DiagnosisSession) {
  response.cookies.set({
    name: DIAGNOSIS_SESSION_COOKIE,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearDiagnosisSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: DIAGNOSIS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function applyDiagnosisAnswer(
  session: DiagnosisSession,
  step: number,
  questionId: number,
  optionIndex: number,
) {
  const question = session.questions[step];

  if (!question) {
    throw new Error("Question step is out of range");
  }

  if (question.id !== questionId) {
    throw new Error("Question mismatch");
  }

  if (optionIndex !== 0 && optionIndex !== 1) {
    throw new Error("Invalid option index");
  }

  const answers = [...session.answers];
  answers[step] = question.options[optionIndex];

  for (let i = step + 1; i < answers.length; i += 1) {
    answers[i] = null;
  }

  const nextStep = step + 1;
  const nextQuestion = nextStep < session.questions.length ? session.questions[nextStep] : null;

  return {
    session: {
      ...session,
      answers,
      currentStep: nextStep,
    },
    nextStep,
    nextQuestion,
    totalQuestions: session.questions.length,
    isAppearanceStep: nextStep >= session.questions.length,
  };
}

export function getSessionQuestionsAndAnswers(session: DiagnosisSession) {
  return {
    currentQuestions: session.questions,
    answers: session.answers,
  };
}
