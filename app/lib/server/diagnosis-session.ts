import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { Question } from "@/app/lib/server/diagnosis-engine";
import { getQuestionById, getQuestionsByIds } from "@/app/lib/server/diagnosis-engine";

export const DIAGNOSIS_SESSION_COOKIE = "nekobti_diagnosis_session";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

type AnswerIndex = 0 | 1 | null;

type DiagnosisSession = {
  questionIds: number[];
  answerIndexes: AnswerIndex[];
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
    const parsed = JSON.parse(decrypted) as DiagnosisSession;

    if (!Array.isArray(parsed.questionIds) || !Array.isArray(parsed.answerIndexes)) return null;
    if (parsed.questionIds.length !== parsed.answerIndexes.length) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function createDiagnosisSession(questions: Question[]): DiagnosisSession {
  return {
    questionIds: questions.map((question) => question.id),
    answerIndexes: Array(questions.length).fill(null),
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
  questionId: number,
  optionIndex: number,
) {
  const step = session.currentStep;
  const expectedQuestionId = session.questionIds[step];

  if (typeof expectedQuestionId !== "number") {
    throw new Error("Current question not found");
  }

  if (expectedQuestionId !== questionId) {
    throw new Error("Question mismatch");
  }

  if (optionIndex !== 0 && optionIndex !== 1) {
    throw new Error("Invalid option index");
  }

  const question = getQuestionById(questionId);

  if (!question) {
    throw new Error("Question not found");
  }

  const answerIndexes = [...session.answerIndexes];
  answerIndexes[step] = optionIndex;

  for (let i = step + 1; i < answerIndexes.length; i += 1) {
    answerIndexes[i] = null;
  }

  const nextStep = step + 1;
  const nextQuestionId = nextStep < session.questionIds.length ? session.questionIds[nextStep] : null;
  const nextQuestion = typeof nextQuestionId === "number" ? getQuestionById(nextQuestionId) : null;

  return {
    session: {
      ...session,
      answerIndexes,
      currentStep: nextStep,
    },
    nextStep,
    nextQuestion,
    totalQuestions: session.questionIds.length,
    isAppearanceStep: nextStep >= session.questionIds.length,
  };
}

export function getSessionQuestionsAndAnswers(session: DiagnosisSession) {
  const currentQuestions = getQuestionsByIds(session.questionIds);
  const answers = currentQuestions.map((question, index) => {
    const answerIndex = session.answerIndexes[index];
    if (answerIndex !== 0 && answerIndex !== 1) return null;
    return question.options[answerIndex] ?? null;
  });

  return {
    currentQuestions,
    answers,
  };
}
