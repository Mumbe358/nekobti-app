"use client";

import { useMemo, useState } from "react";

type CatType =
  | "quiet"
  | "clever"
  | "excited"
  | "boss"
  | "timid"
  | "clingy"
  | "moody"
  | "pace";

type QuestionOption = {
  label: string;
  scores: Partial<Record<CatType, number>>;
};

type Question = {
  id: number;
  text: string;
  options: QuestionOption[];
};

const typeLabels: Record<CatType, string> = {
  quiet: "しずかねこ",
  clever: "きれものねこ",
  excited: "わくわくねこ",
  boss: "ボスねこ",
  timid: "びびり慎重ねこ",
  clingy: "あまえんぼねこ",
  moody: "きまぐれねこ",
  pace: "マイペースねこ",
};

const resultMeta: Record<
  CatType,
  { sub: string; emoji: string; description: string }
> = {
  quiet: {
    sub: "静かで落ち着いた空気を持つタイプ",
    emoji: "🌙",
    description: "物音や空気の変化に敏感で、自分の落ち着ける時間を大切にするタイプ。",
  },
  clever: {
    sub: "観察力が高く、空気を読むタイプ",
    emoji: "🧠",
    description: "周囲をよく見ながら動き、賢く距離感を取れるタイプ。",
  },
  excited: {
    sub: "好奇心が強く、毎日を楽しむタイプ",
    emoji: "🎈",
    description: "新しい物や遊びにすぐ反応し、明るくエネルギッシュなタイプ。",
  },
  boss: {
    sub: "堂々として存在感のあるタイプ",
    emoji: "👑",
    description: "自分の居場所やペースをしっかり持ち、自然と主役感が出るタイプ。",
  },
  timid: {
    sub: "慎重でやさしい警戒タイプ",
    emoji: "🌿",
    description: "初めは慎重だけど、安心できる相手には少しずつ心を開くタイプ。",
  },
  clingy: {
    sub: "人との距離が近い甘えんぼタイプ",
    emoji: "💞",
    description: "そばにいたい気持ちが強く、ぬくもりや安心感を大事にするタイプ。",
  },
  moody: {
    sub: "気分で魅力が変わる自由タイプ",
    emoji: "🎭",
    description: "読めない魅力があり、その日の気分で見せる表情が変わるタイプ。",
  },
  pace: {
    sub: "自分のペースを守る安定タイプ",
    emoji: "🐾",
    description: "周囲に流されすぎず、自分らしいリズムで過ごすことが得意なタイプ。",
  },
};

const questions: Question[] = [
  {
    id: 1,
    text: "知らない人が来たとき、いちばん近い反応は？",
    options: [
      { label: "すぐ隠れる", scores: { timid: 3, quiet: 1 } },
      { label: "距離を取って様子を見る", scores: { quiet: 2, clever: 1, timid: 1 } },
      { label: "少しずつ近づく", scores: { clever: 1, excited: 1, moody: 1 } },
      { label: "普通に出てくる", scores: { boss: 2, excited: 1 } },
    ],
  },
  {
    id: 2,
    text: "名前を呼ばれたときは？",
    options: [
      { label: "聞こえていても動かない", scores: { pace: 2, quiet: 1 } },
      { label: "気が向いたら反応する", scores: { moody: 2, pace: 1 } },
      { label: "タイミングを見て来る", scores: { clever: 2, quiet: 1 } },
      { label: "すぐ来る", scores: { clingy: 2, excited: 1 } },
    ],
  },
  {
    id: 3,
    text: "おもちゃを出したときの反応は？",
    options: [
      { label: "あまり興味を示さない", scores: { pace: 2, quiet: 1 } },
      { label: "少し様子を見てから動く", scores: { clever: 2, timid: 1 } },
      { label: "気分が合えば遊ぶ", scores: { moody: 2, excited: 1 } },
      { label: "すぐ飛びつく", scores: { excited: 3, clingy: 1 } },
    ],
  },
  {
    id: 4,
    text: "甘え方として近いのは？",
    options: [
      { label: "ほとんど甘えない", scores: { quiet: 2, pace: 1 } },
      { label: "そっと近くに来る", scores: { quiet: 2, clingy: 1 } },
      { label: "気分でかなり差がある", scores: { moody: 3 } },
      { label: "わかりやすく甘える", scores: { clingy: 3, excited: 1 } },
    ],
  },
  {
    id: 5,
    text: "家の中で好きな場所は？",
    options: [
      { label: "静かな隅や狭い場所", scores: { timid: 2, quiet: 1 } },
      { label: "全体を見渡せる場所", scores: { clever: 2, boss: 1 } },
      { label: "その時々で変わる", scores: { pace: 1, moody: 2 } },
      { label: "いちばん目立つ・快適な場所", scores: { boss: 3 } },
    ],
  },
  {
    id: 6,
    text: "初めての物を見つけたときは？",
    options: [
      { label: "近づかず警戒する", scores: { timid: 3 } },
      { label: "安全そうか観察する", scores: { clever: 3, quiet: 1 } },
      { label: "少し触ってみる", scores: { excited: 2, clever: 1 } },
      { label: "気分が乗れば行く", scores: { moody: 2, pace: 1 } },
    ],
  },
  {
    id: 7,
    text: "飼い主との距離感は？",
    options: [
      { label: "近すぎるのは苦手", scores: { quiet: 2, pace: 1 } },
      { label: "ほどよい距離を保つ", scores: { clever: 2, quiet: 1 } },
      { label: "自分から近くにいたがる", scores: { clingy: 3 } },
      { label: "自分が主導権を握る感じ", scores: { boss: 2, moody: 1 } },
    ],
  },
  {
    id: 8,
    text: "普段の行動でいちばん近いのは？",
    options: [
      { label: "静かに過ごすことが多い", scores: { quiet: 3 } },
      { label: "周囲をよく見て動く", scores: { clever: 3 } },
      { label: "よく動いてテンション高め", scores: { excited: 3 } },
      { label: "自分のペースでぶれない", scores: { pace: 3 } },
    ],
  },
  {
    id: 9,
    text: "他の猫や人との関わり方は？",
    options: [
      { label: "慎重で受け身", scores: { timid: 2, quiet: 1 } },
      { label: "相手を見て合わせる", scores: { clever: 2, moody: 1 } },
      { label: "すぐ関わりにいく", scores: { excited: 2, clingy: 1 } },
      { label: "自然と中心になる", scores: { boss: 3 } },
    ],
  },
  {
    id: 10,
    text: "全体として、いちばん近い印象は？",
    options: [
      { label: "静かで落ち着いている", scores: { quiet: 2, pace: 1 } },
      { label: "賢く空気を読む", scores: { clever: 3 } },
      { label: "気分屋で読めない", scores: { moody: 3 } },
      { label: "存在感が強く堂々としている", scores: { boss: 2, excited: 1 } },
    ],
  },
];

const initialScores: Record<CatType, number> = {
  quiet: 0,
  clever: 0,
  excited: 0,
  boss: 0,
  timid: 0,
  clingy: 0,
  moody: 0,
  pace: 0,
};

function calculateResult(selectedOptions: QuestionOption[]) {
  const scores = { ...initialScores };

  for (const option of selectedOptions) {
    for (const [type, value] of Object.entries(option.scores)) {
      scores[type as CatType] += value ?? 0;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return {
    scores,
    mainType: sorted[0][0] as CatType,
    subType: sorted[1][0] as CatType,
  };
}

export default function Page() {
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<QuestionOption[]>([]);
  const [result, setResult] = useState<{
    scores: Record<CatType, number>;
    mainType: CatType;
    subType: CatType;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = useMemo(
    () => ["猫らしさを分析中...", "行動パターンを整理中...", "タイプを判定しています..."],
    []
  );

  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setResult(null);
    setShowResult(false);
    setIsCalculating(false);
    setLoadingMessageIndex(0);
  };

  const handleSelect = (option: QuestionOption) => {
    const nextSelected = [...selectedOptions, option];
    setSelectedOptions(nextSelected);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    setIsCalculating(true);
    setLoadingMessageIndex(0);

    const resultData = calculateResult(nextSelected);

    setTimeout(() => setLoadingMessageIndex(1), 700);
    setTimeout(() => setLoadingMessageIndex(2), 1400);

    setTimeout(() => {
      setResult(resultData);
      setIsCalculating(false);
      setShowResult(true);
    }, 2200);
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setResult(null);
    setShowResult(false);
    setIsCalculating(false);
    setLoadingMessageIndex(0);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="min-h-screen bg-[#f5efe8] px-5 py-6 text-neutral-900">
      <div className="mx-auto w-full max-w-[640px]">
        {!started && (
          <section className="px-0 py-0">
            <div className="mb-10 inline-flex rounded-full border border-[#e7d8cf] bg-white px-6 py-4 text-[18px] tracking-[0.12em] text-[#7e6d63] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
              ねこびーてぃあい
            </div>

            <p className="mb-6 text-[22px] font-semibold tracking-[0.22em] text-[#b58b73]">
              CAT TYPE DIAGNOSIS
            </p>

            <h1 className="text-[72px] font-black leading-[1.06] tracking-[-0.03em] text-[#1f1f23] max-[768px]:text-[34px]">
              うちの猫のタイプ、
              <br />
              ちゃんと知ってる？
            </h1>

            <p className="mt-10 max-w-[920px] text-[26px] leading-[1.95] text-[#5f5b5b] max-[768px]:mt-6 max-[768px]:text-[15px] max-[768px]:leading-[2]">
              性格を人間に当てはめるのではなく、猫らしさのまま読み解く新しい診断。やわらかく触れたくなる体験から、うちの子らしさを言葉にしていく。
            </p>

            <button
              onClick={handleStart}
              className="mt-12 w-full rounded-full bg-[#242427] px-6 py-6 text-[22px] font-bold text-white transition active:scale-[0.99] max-[768px]:mt-10 max-[768px]:py-5 max-[768px]:text-[18px]"
            >
              診断をはじめる
            </button>
          </section>
        )}

        {started && !showResult && !isCalculating && (
          <section className="rounded-[28px] bg-white px-6 py-7 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-neutral-500">
                {currentQuestionIndex + 1} / {questions.length} questions
              </span>
              <button
                onClick={handleRestart}
                className="text-sm font-medium text-neutral-400 underline-offset-4 hover:underline"
              >
                やり直す
              </button>
            </div>

            <div className="mb-7 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-neutral-900 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="animate-[slideInRight_0.28s_ease]">
              <h2 className="text-[24px] font-bold leading-snug">{currentQuestion.text}</h2>

              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleSelect(option)}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-left text-[15px] font-medium text-neutral-800 transition hover:bg-neutral-100 active:scale-[0.99]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {started && isCalculating && (
          <section className="rounded-[28px] bg-white px-6 py-10 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-800" />
              <p className="text-lg font-semibold text-neutral-900">
                {loadingMessages[loadingMessageIndex]}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                うちの子のタイプを読み解いています
              </p>

              <div className="mt-5 flex gap-2">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.1s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-neutral-400" />
              </div>
            </div>
          </section>
        )}

        {started && showResult && result ? (
          <section className="rounded-[28px] bg-white px-6 py-8 shadow-sm">
            <p className="text-sm tracking-[0.18em] text-neutral-500">診断結果</p>

            <div className="mb-6 mt-4 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#f7efe8] px-5 py-6">
              <p className="mb-2 text-sm tracking-[0.22em] text-[#b07d62]">
                {resultMeta[result.mainType].sub}
              </p>
              <div className="mb-4 text-7xl">{resultMeta[result.mainType].emoji}</div>
              <h2 className="text-[30px] font-bold leading-tight text-[#1f1f23]">
                {typeLabels[result.mainType]}
              </h2>
            </div>

            <p className="mt-4 text-[15px] leading-7 text-neutral-600">
              {resultMeta[result.mainType].description}
            </p>

            <div className="mt-6 rounded-2xl bg-neutral-50 px-4 py-4">
              <p className="text-sm text-neutral-500">サブ傾向</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {typeLabels[result.subType]}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {Object.entries(result.scores).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-neutral-200 px-4 py-3">
                  <p className="text-xs text-neutral-500">{typeLabels[key as CatType]}</p>
                  <p className="mt-1 text-lg font-bold text-neutral-900">{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleRestart}
              className="mt-8 w-full rounded-full bg-neutral-900 px-5 py-4 text-base font-semibold text-white transition active:scale-[0.99]"
            >
              もう一度診断する
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
