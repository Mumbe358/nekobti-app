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

const questionPool: Record<Segment, Question[]> = {
  EI: [
    {
      id: 1,
      text: "初めて会う人が家に来た直後、どちらの行動をしやすい？",
      segment: "EI",
      options: [
        { label: "A.ちょっと近くで見るにゃ", axis: "E", weight: 1.35 },
        { label: "B.ここから様子見るにゃ", axis: "I", weight: 1.35 },
      ],
    },
    {
      id: 2,
      text: "見慣れない新しいおもちゃを見つけたとき、まずどちらをしやすい？",
      segment: "EI",
      options: [
        { label: "A.すぐ触ってみるにゃ", axis: "E", weight: 1.15 },
        { label: "B.少し見てから触るにゃ", axis: "I", weight: 1.15 },
      ],
    },
    {
      id: 3,
      text: "家で落ち着いて過ごしたいとき、どちらの場所を選びやすい？",
      segment: "EI",
      options: [
        { label: "A.気配あるとこがいいにゃ", axis: "E", weight: 1.35 },
        { label: "B.静かなとこがいいにゃ", axis: "I", weight: 1.35 },
      ],
    },
    {
      id: 4,
      text: "知らない猫や他の猫が近くにいるとき、どちらの動きをしやすい？",
      segment: "EI",
      options: [
        { label: "A.自分から行ってみるにゃ", axis: "E", weight: 1.15 },
        { label: "B.ちょっと距離とるにゃ", axis: "I", weight: 1.15 },
      ],
    },
  ],
  SN: [
    {
      id: 7,
      text: "遊び始めるとき、まずどちらの動き方になりやすい？",
      segment: "SN",
      options: [
        { label: "A.まず動いてみるにゃ", axis: "S", weight: 1.15 },
        { label: "B.流れ見てから行くにゃ", axis: "N", weight: 1.15 },
      ],
    },
    {
      id: 8,
      text: "別の場所で気になる音がしたとき、最初にどちらをしやすい？",
      segment: "SN",
      options: [
        { label: "A.見に行って確かめるにゃ", axis: "S", weight: 1.35 },
        { label: "B.何か考えて様子見るにゃ", axis: "N", weight: 1.35 },
      ],
    },
    {
      id: 9,
      text: "高い場所や棚の上が気になったとき、どちらの意識が強くなりやすい？",
      segment: "SN",
      options: [
        { label: "A.登れるか試すにゃ", axis: "S", weight: 0.9 },
        { label: "B.上から見たくなるにゃ", axis: "N", weight: 0.9 },
      ],
    },
    {
      id: 10,
      text: "窓の外をじっと見ているとき、どちらの見方になりやすい？",
      segment: "SN",
      options: [
        { label: "A.動くもの追うにゃ", axis: "S", weight: 1.15 },
        { label: "B.空気ごと見てるにゃ", axis: "N", weight: 1.15 },
      ],
    },
  ],
  TF: [
    {
      id: 13,
      text: "飼い主が近くにいるとき、ふだんの距離感はどちらに近い？",
      segment: "TF",
      options: [
        { label: "A.わりとそばにいるにゃ", axis: "F", weight: 0.9 },
        { label: "B.気が向いたら行くにゃ", axis: "T", weight: 0.9 },
      ],
    },
    {
      id: 14,
      text: "飼い主に遊びへ誘われたとき、気分が普通ならどちらを選びやすい？",
      segment: "TF",
      options: [
        { label: "A.すぐ乗ってみるにゃ", axis: "F", weight: 0.9 },
        { label: "B.そのとき決めるにゃ", axis: "T", weight: 0.9 },
      ],
    },
    {
      id: 15,
      text: "自分のお気に入りの場所を使うとき、どちらの傾向が強い？",
      segment: "TF",
      options: [
        { label: "A.そこは譲りたくないにゃ", axis: "T", weight: 1.35 },
        { label: "B.別のとこでもいいにゃ", axis: "F", weight: 1.35 },
      ],
    },
    {
      id: 16,
      text: "飼い主に何かしてほしい合図をされたとき、どちらの反応をしやすい？",
      segment: "TF",
      options: [
        { label: "A.わかったにゃ、やるにゃ", axis: "F", weight: 1.35 },
        { label: "B.自分のタイミングでやるにゃ", axis: "T", weight: 1.35 },
      ],
    },
  ],
  JP: [
    {
      id: 19,
      text: "いつものごはん時間が少し遅れたとき、どちらの反応に近い？",
      segment: "JP",
      options: [
        { label: "A.そのまま待てるにゃ", axis: "P", weight: 1.35 },
        { label: "B.ちゃんと知らせるにゃ", axis: "J", weight: 1.35 },
      ],
    },
    {
      id: 20,
      text: "新しい部屋や初めての場所に入った直後、まずどちらをしやすい？",
      segment: "JP",
      options: [
        { label: "A.気になったら行くにゃ", axis: "P", weight: 1.35 },
        { label: "B.まず様子見るにゃ", axis: "J", weight: 1.35 },
      ],
    },
    {
      id: 21,
      text: "家でくつろぐ場所を決めるとき、どちらになりやすい？",
      segment: "JP",
      options: [
        { label: "A.どこでもくつろぐにゃ", axis: "P", weight: 1.15 },
        { label: "B.いつもの場所がいいにゃ", axis: "J", weight: 1.15 },
      ],
    },
    {
      id: 22,
      text: "眠くなってきたとき、どちらの行動を取りやすい？",
      segment: "JP",
      options: [
        { label: "A.ここで寝るにゃ", axis: "P", weight: 1.15 },
        { label: "B.落ち着く場所行くにゃ", axis: "J", weight: 1.15 },
      ],
    },
  ],
};

function shuffleArray<T>(array: T[]) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

export function buildQuestionSet() {
  return shuffleArray([
    ...questionPool.EI,
    ...questionPool.SN,
    ...questionPool.TF,
    ...questionPool.JP,
  ]);
}

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
