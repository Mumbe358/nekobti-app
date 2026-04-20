import "server-only";

export type Axis = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type CatType =
  | "規律番ねこ"
  | "よりそい守りねこ"
  | "しずか哲学ねこ"
  | "戦略きれものねこ"
  | "無口クラフトねこ"
  | "ふわアートねこ"
  | "ゆめふわロマンねこ"
  | "ひらめき遊びねこ"
  | "突撃アクティブねこ"
  | "きらきらパーティーねこ"
  | "わくわく自由ねこ"
  | "いたずら天才ねこ"
  | "しきり屋リーダーねこ"
  | "みんな大好きねこ"
  | "導きカリスマねこ"
  | "覇王ボスねこ";

export type QuestionOption = {
  label: string;
  axis: Axis;
  weight: number;
};

export type Segment = "EI" | "SN" | "TF" | "JP";

export type Question = {
  id: number;
  text: string;
  segment: Segment;
  options: [QuestionOption, QuestionOption];
};

export type DiagnosisResult = {
  mbti: string;
  mainType: CatType;
  closeSegments: Segment[];
  tiedSegments: Segment[];
  decisiveQuestionId: number | null;
};

const catTypeMap: Record<string, CatType> = {
  ISTJ: "規律番ねこ",
  ISFJ: "よりそい守りねこ",
  INFJ: "しずか哲学ねこ",
  INTJ: "戦略きれものねこ",
  ISTP: "無口クラフトねこ",
  ISFP: "ふわアートねこ",
  INFP: "ゆめふわロマンねこ",
  INTP: "ひらめき遊びねこ",
  ESTP: "突撃アクティブねこ",
  ESFP: "きらきらパーティーねこ",
  ENFP: "わくわく自由ねこ",
  ENTP: "いたずら天才ねこ",
  ESTJ: "しきり屋リーダーねこ",
  ESFJ: "みんな大好きねこ",
  ENFJ: "導きカリスマねこ",
  ENTJ: "覇王ボスねこ",
};

const initialScores: Record<Axis, number> = {
  E: 0,
  I: 0,
  S: 0,
  N: 0,
  T: 0,
  F: 0,
  J: 0,
  P: 0,
};

function resolveSegmentLetter(
  segment: Segment,
  left: Axis,
  right: Axis,
  scores: Record<Axis, number>,
  currentQuestions: Question[],
  answers: (QuestionOption | null)[]
) {
  const leftScore = scores[left];
  const rightScore = scores[right];
  const diff = Math.abs(leftScore - rightScore);

  if (leftScore > rightScore) {
    return { letter: left, close: diff <= 0.35, tied: false };
  }

  if (rightScore > leftScore) {
    return { letter: right, close: diff <= 0.35, tied: false };
  }

  const ranked = currentQuestions
    .map((question, index) => ({ question, answer: answers[index] }))
    .filter(
      (item): item is { question: Question; answer: QuestionOption } =>
        item.question.segment === segment && !!item.answer
    )
    .sort((a, b) => {
      if (b.answer.weight !== a.answer.weight) return b.answer.weight - a.answer.weight;
      return a.question.id - b.question.id;
    });

  const tiedLetter = ranked[0]?.answer.axis === right ? right : left;
  return { letter: tiedLetter, close: true, tied: true };
}

function getMbtiType(
  scores: Record<Axis, number>,
  currentQuestions: Question[],
  answers: (QuestionOption | null)[]
) {
  const ei = resolveSegmentLetter("EI", "E", "I", scores, currentQuestions, answers);
  const sn = resolveSegmentLetter("SN", "S", "N", scores, currentQuestions, answers);
  const tf = resolveSegmentLetter("TF", "T", "F", scores, currentQuestions, answers);
  const jp = resolveSegmentLetter("JP", "J", "P", scores, currentQuestions, answers);

  return {
    mbti: `${ei.letter}${sn.letter}${tf.letter}${jp.letter}`,
    closeSegments: ([
      ei.close ? "EI" : null,
      sn.close ? "SN" : null,
      tf.close ? "TF" : null,
      jp.close ? "JP" : null,
    ].filter(Boolean) as Segment[]),
    tiedSegments: ([
      ei.tied ? "EI" : null,
      sn.tied ? "SN" : null,
      tf.tied ? "TF" : null,
      jp.tied ? "JP" : null,
    ].filter(Boolean) as Segment[]),
  };
}

function getDecisiveQuestionId(
  mbti: string,
  currentQuestions: Question[],
  answers: (QuestionOption | null)[]
) {
  const mbtiAxes = new Set<Axis>(mbti.split("") as Axis[]);

  const ranked = currentQuestions
    .map((question, index) => ({ question, answer: answers[index] }))
    .filter(
      (item): item is { question: Question; answer: QuestionOption } =>
        !!item.answer && mbtiAxes.has(item.answer.axis)
    )
    .sort((a, b) => {
      if (b.answer.weight !== a.answer.weight) return b.answer.weight - a.answer.weight;
      return a.question.id - b.question.id;
    });

  return ranked[0]?.question.id ?? null;
}

export function calculateDiagnosisResult(
  currentQuestions: Question[],
  answers: (QuestionOption | null)[]
): DiagnosisResult | null {
  if (!currentQuestions.length || currentQuestions.length !== answers.length) return null;

  const scores = { ...initialScores };

  answers.forEach((answer) => {
    if (!answer) return;
    scores[answer.axis] += answer.weight;
  });

  const mbtiResult = getMbtiType(scores, currentQuestions, answers);
  const mainType = catTypeMap[mbtiResult.mbti];
  const decisiveQuestionId = getDecisiveQuestionId(mbtiResult.mbti, currentQuestions, answers);

  return {
    mbti: mbtiResult.mbti,
    mainType,
    closeSegments: mbtiResult.closeSegments,
    tiedSegments: mbtiResult.tiedSegments,
    decisiveQuestionId,
  };
}
