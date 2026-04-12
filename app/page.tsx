"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

type CatType =
  | "しずかねこ"
  | "きれものねこ"
  | "ボスねこ"
  | "わくわくねこ"
  | "びびり慎重ねこ"
  | "あまえんぼねこ"
  | "きまぐれねこ"
  | "マイペースねこ";

type QuestionOption = {
  label: string;
  scores: Partial<Record<CatType, number>>;
};

type Question = {
  id: number;
  text: string;
  options: QuestionOption[];
};

const questions: Question[] = [
  {
    id: 1,
    text: "知らない人が来たとき、いちばん近い反応は？",
    options: [
      { label: "すぐ隠れる", scores: { "びびり慎重ねこ": 3, "しずかねこ": 1 } },
      { label: "距離を取って様子を見る", scores: { "しずかねこ": 2, "きれものねこ": 1, "びびり慎重ねこ": 1 } },
      { label: "少しずつ近づく", scores: { "きれものねこ": 1, "わくわくねこ": 1, "きまぐれねこ": 1 } },
      { label: "普通に出てくる", scores: { "ボスねこ": 2, "わくわくねこ": 1 } },
    ],
  },
  {
    id: 2,
    text: "名前を呼ばれたときは？",
    options: [
      { label: "聞こえていても動かない", scores: { "マイペースねこ": 2, "しずかねこ": 1 } },
      { label: "気が向いたら反応する", scores: { "きまぐれねこ": 2, "マイペースねこ": 1 } },
      { label: "タイミングを見て来る", scores: { "きれものねこ": 2, "しずかねこ": 1 } },
      { label: "すぐ来る", scores: { "あまえんぼねこ": 2, "わくわくねこ": 1 } },
    ],
  },
  {
    id: 3,
    text: "おもちゃを出したときの反応は？",
    options: [
      { label: "あまり興味を示さない", scores: { "マイペースねこ": 2, "しずかねこ": 1 } },
      { label: "少し様子を見てから動く", scores: { "きれものねこ": 2, "びびり慎重ねこ": 1 } },
      { label: "気分が合えば遊ぶ", scores: { "きまぐれねこ": 2, "わくわくねこ": 1 } },
      { label: "すぐ飛びつく", scores: { "わくわくねこ": 3, "あまえんぼねこ": 1 } },
    ],
  },
  {
    id: 4,
    text: "甘え方として近いのは？",
    options: [
      { label: "ほとんど甘えない", scores: { "しずかねこ": 2, "マイペースねこ": 1 } },
      { label: "そっと近くに来る", scores: { "しずかねこ": 2, "あまえんぼねこ": 1 } },
      { label: "気分でかなり差がある", scores: { "きまぐれねこ": 3 } },
      { label: "わかりやすく甘える", scores: { "あまえんぼねこ": 3, "わくわくねこ": 1 } },
    ],
  },
  {
    id: 5,
    text: "家の中で好きな場所は？",
    options: [
      { label: "静かな隅や狭い場所", scores: { "びびり慎重ねこ": 2, "しずかねこ": 1 } },
      { label: "全体を見渡せる場所", scores: { "きれものねこ": 2, "ボスねこ": 1 } },
      { label: "その時々で変わる", scores: { "マイペースねこ": 1, "きまぐれねこ": 2 } },
      { label: "いちばん目立つ・快適な場所", scores: { "ボスねこ": 3 } },
    ],
  },
  {
    id: 6,
    text: "初めての物を見つけたときは？",
    options: [
      { label: "近づかず警戒する", scores: { "びびり慎重ねこ": 3 } },
      { label: "安全そうか観察する", scores: { "きれものねこ": 3, "しずかねこ": 1 } },
      { label: "少し触ってみる", scores: { "わくわくねこ": 2, "きれものねこ": 1 } },
      { label: "気分が乗れば行く", scores: { "きまぐれねこ": 2, "マイペースねこ": 1 } },
    ],
  },
  {
    id: 7,
    text: "飼い主との距離感は？",
    options: [
      { label: "近すぎるのは苦手", scores: { "しずかねこ": 2, "マイペースねこ": 1 } },
      { label: "ほどよい距離を保つ", scores: { "きれものねこ": 2, "しずかねこ": 1 } },
      { label: "自分から近くにいたがる", scores: { "あまえんぼねこ": 3 } },
      { label: "自分が主導権を握る感じ", scores: { "ボスねこ": 2, "きまぐれねこ": 1 } },
    ],
  },
  {
    id: 8,
    text: "普段の行動でいちばん近いのは？",
    options: [
      { label: "静かに過ごすことが多い", scores: { "しずかねこ": 3 } },
      { label: "周囲をよく見て動く", scores: { "きれものねこ": 3 } },
      { label: "よく動いてテンション高め", scores: { "わくわくねこ": 3 } },
      { label: "自分のペースでぶれない", scores: { "マイペースねこ": 3 } },
    ],
  },
  {
    id: 9,
    text: "他の猫や人との関わり方は？",
    options: [
      { label: "慎重で受け身", scores: { "びびり慎重ねこ": 2, "しずかねこ": 1 } },
      { label: "相手を見て合わせる", scores: { "きれものねこ": 2, "きまぐれねこ": 1 } },
      { label: "すぐ関わりにいく", scores: { "わくわくねこ": 2, "あまえんぼねこ": 1 } },
      { label: "自然と中心になる", scores: { "ボスねこ": 3 } },
    ],
  },
  {
    id: 10,
    text: "全体として、いちばん近い印象は？",
    options: [
      { label: "静かで落ち着いている", scores: { "しずかねこ": 2, "マイペースねこ": 1 } },
      { label: "賢く空気を読む", scores: { "きれものねこ": 3 } },
      { label: "気分屋で読めない", scores: { "きまぐれねこ": 3 } },
      { label: "存在感が強く堂々としている", scores: { "ボスねこ": 2, "わくわくねこ": 1 } },
    ],
  },
];

const resultMeta: Record<
  CatType,
  {
    emoji: string;
    sub: string;
    desc: string;
    traits: string;
    match: string;
  }
> = {
  "しずかねこ": {
    emoji: "🌙",
    sub: "SILENT CAT",
    desc: "警戒心と繊細さを持ちながら、安心した相手にはやさしく心を開くタイプ。",
    traits: "静けさ / 繊細 / 落ち着き",
    match: "ボスねこ / きれものねこ",
  },
  "きれものねこ": {
    emoji: "🧠",
    sub: "SMART CAT",
    desc: "状況を見る力が高く、空気や距離感を読みながら上手に立ち回るタイプ。",
    traits: "観察 / 判断 / スマート",
    match: "しずかねこ / わくわくねこ",
  },
  "ボスねこ": {
    emoji: "👑",
    sub: "BOSS CAT",
    desc: "自分のペースを崩さず、自然と存在感を放つ。空間の主役になりやすいタイプ。",
    traits: "主導権 / 余裕 / 圧",
    match: "しずかねこ / きれものねこ",
  },
  "わくわくねこ": {
    emoji: "✨",
    sub: "ACTIVE CAT",
    desc: "反応が素直で好奇心いっぱい。楽しいことに全身で向かっていくタイプ。",
    traits: "好奇心 / 素直 / 元気",
    match: "きれものねこ / あまえんぼねこ",
  },
  "びびり慎重ねこ": {
    emoji: "🫣",
    sub: "TIMID CAT",
    desc: "慎重で繊細。安全が確認できてから少しずつ動く、守りに強いタイプ。",
    traits: "警戒心 / 慎重 / 防御",
    match: "しずかねこ / あまえんぼねこ",
  },
  "あまえんぼねこ": {
    emoji: "💞",
    sub: "CLINGY CAT",
    desc: "大好きな相手にはまっすぐ甘える。ぬくもりと一体感を大切にするタイプ。",
    traits: "甘え / 密着 / 愛情表現",
    match: "わくわくねこ / しずかねこ",
  },
  "きまぐれねこ": {
    emoji: "🎭",
    sub: "MOODY CAT",
    desc: "気分によって距離感や反応が変わる。読めなさも魅力の自由なタイプ。",
    traits: "気分屋 / 自由 / ムラ",
    match: "ボスねこ / マイペースねこ",
  },
  "マイペースねこ": {
    emoji: "🍵",
    sub: "PACE CAT",
    desc: "外の空気に流されず、自分のテンポで心地よさを守るタイプ。",
    traits: "自分軸 / のんびり / 安定",
    match: "きまぐれねこ / しずかねこ",
  },
};

const typeList: CatType[] = [
  "ボスねこ",
  "きれものねこ",
  "しずかねこ",
  "わくわくねこ",
  "びびり慎重ねこ",
  "あまえんぼねこ",
  "きまぐれねこ",
  "マイペースねこ",
];

const initialScores: Record<CatType, number> = {
  "しずかねこ": 0,
  "きれものねこ": 0,
  "ボスねこ": 0,
  "わくわくねこ": 0,
  "びびり慎重ねこ": 0,
  "あまえんぼねこ": 0,
  "きまぐれねこ": 0,
  "マイペースねこ": 0,
};

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(QuestionOption | null)[]>(
    Array(questions.length).fill(null)
  );
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  const loadingMessages = useMemo(
    () => ["猫らしさを分析中...", "行動パターンを整理中...", "タイプを判定しています..."],
    []
  );

  useEffect(() => {
    if (isOpen || isTypeListOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isTypeListOpen]);

  const totalSteps = questions.length;
  const answeredCount = answers.filter(Boolean).length;

  const result = useMemo(() => {
    if (answeredCount !== totalSteps) return null;

    const scores = { ...initialScores };

    answers.forEach((answer) => {
      if (!answer) return;
      Object.entries(answer.scores).forEach(([type, value]) => {
        scores[type as CatType] += value ?? 0;
      });
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return {
      scores,
      mainType: sorted[0][0] as CatType,
      subType: sorted[1][0] as CatType,
    };
  }, [answers, answeredCount, totalSteps]);

  const openDiagnosis = () => {
    setIsOpen(true);
    setStep(0);
    setAnswers(Array(questions.length).fill(null));
    setSelectedLabel(null);
    setAnimating(false);
    setDirection("next");
    setIsCalculating(false);
    setLoadingMessageIndex(0);
    setShowResult(false);
  };

  const closeDiagnosis = () => {
    setIsOpen(false);
    setSelectedLabel(null);
    setAnimating(false);
    setIsCalculating(false);
    setLoadingMessageIndex(0);
    setShowResult(false);
  };

  const openTypeList = () => {
    setIsTypeListOpen(true);
  };

  const closeTypeList = () => {
    setIsTypeListOpen(false);
  };

  const handleAnswer = (option: QuestionOption) => {
    if (selectedLabel || animating || isCalculating) return;

    setSelectedLabel(option.label);
    setDirection("next");
    setAnimating(true);

    window.setTimeout(() => {
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = option;
        return next;
      });

      setSelectedLabel(null);

      if (step < totalSteps - 1) {
        setStep((prev) => prev + 1);
        window.setTimeout(() => {
          setAnimating(false);
        }, 320);
      } else {
        setAnimating(false);
        setIsCalculating(true);
        setLoadingMessageIndex(0);

        window.setTimeout(() => {
          setLoadingMessageIndex(1);
        }, 700);

        window.setTimeout(() => {
          setLoadingMessageIndex(2);
        }, 1400);

        window.setTimeout(() => {
          setIsCalculating(false);
          setShowResult(true);
        }, 2200);
      }
    }, 180);
  };

  const handlePrev = () => {
    if (step === 0 || selectedLabel || animating) return;

    setDirection("prev");
    setAnimating(true);

    setAnswers((prev) => {
      const next = [...prev];
      next[step - 1] = null;
      return next;
    });

    setStep((prev) => prev - 1);

    window.setTimeout(() => {
      setAnimating(false);
    }, 320);
  };

  const restartDiagnosis = () => {
    setStep(0);
    setAnswers(Array(questions.length).fill(null));
    setSelectedLabel(null);
    setAnimating(false);
    setDirection("next");
    setIsCalculating(false);
    setLoadingMessageIndex(0);
    setShowResult(false);
  };


  const generateResultPng = async () => {
    if (!resultCardRef.current) return null;
    try {
      return await toPng(resultCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleSaveImage = async () => {
    const dataUrl = await generateResultPng();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "nekobti-result.png";
    link.click();
  };

  const handleShare = async () => {
    const dataUrl = await generateResultPng();
    const shareText = result
      ? `うちの猫のタイプは「${result.mainType}」でした🐱\n診断してみて👇`
      : "うちの猫のタイプ診断をやってみた🐱";
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    if (dataUrl) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "nekobti-result.png", { type: "image/png" });

        if (
          typeof navigator !== "undefined" &&
          "share" in navigator &&
          "canShare" in navigator &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            text: `${shareText}\n${shareUrl}`,
            files: [file],
          });
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          text: `${shareText}\n${shareUrl}`,
        });
        return;
      } catch (error) {
        console.error(error);
      }
    }

    const fallbackText = `${shareText}\n${shareUrl}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(fallbackText);
      } catch (error) {
        console.error(error);
      }
    }

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(fallbackText)}`,
      "_blank"
    );
  };

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#2b2b2b]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
        <div className="mb-6 inline-flex w-fit items-center rounded-full border border-[#e8d8cb] bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm">
          ねこびーてぃあい
        </div>

        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#b07d62]">
              CAT TYPE DIAGNOSIS
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              うちの猫のタイプ、
              <br />
              ちゃんと知ってる？
            </h1>

            <p className="mb-8 max-w-xl text-base leading-8 text-[#5f5f5f] md:text-lg">
              性格を人間に当てはめるのではなく、
              猫らしさのまま読み解く新しい診断。
              やわらかく触れたくなる体験から、
              うちの子らしさを言葉にしていく。
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={openDiagnosis}
                className="rounded-full bg-[#2b2b2b] px-6 py-4 text-base font-semibold text-white transition hover:opacity-90"
              >
                診断をはじめる
              </button>

              <button
                onClick={openTypeList}
                className="rounded-full border border-[#d8c1b1] bg-white px-6 py-4 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]"
              >
                タイプ一覧を見る
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">きれものねこ</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">しずかねこ</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">わくわくねこ</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 -top-4 h-32 w-32 rounded-full bg-[#ffe8d9] blur-2xl" />
            <div className="absolute -bottom-8 -right-2 h-40 w-40 rounded-full bg-[#f9d8c2] blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-[#f0dfd3] bg-white p-8 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#a3826b]">Preview</p>
                  <h2 className="text-2xl font-bold">猫タイプカード</h2>
                </div>
                <div className="rounded-full bg-[#fff3ea] px-4 py-2 text-sm font-semibold text-[#b07d62]">
                  BETA
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-6 ring-1 ring-[#f3e3d8]">
                <div className="mb-6 aspect-[4/5] rounded-[28px] bg-[#f8eee7] p-6">
                  <div className="flex h-full flex-col justify-between rounded-[24px] border border-dashed border-[#d9bca8] p-6 text-center">
                    <div>
                      <p className="mb-3 text-sm tracking-[0.2em] text-[#b07d62]">
                        CAT MBTI STYLE
                      </p>
                      <h3 className="text-3xl font-bold">ボスねこ</h3>
                    </div>

                    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-white text-6xl shadow-sm">
                      🐈
                    </div>

                    <p className="text-sm leading-7 text-[#6c625b]">
                      堂々としていて、自分のペースを崩さない。
                      空気を読むより、空間を支配するタイプ。
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm text-[#9a7d69]">特徴</p>
                    <p className="font-semibold">主導権 / 余裕 / 圧</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm text-[#9a7d69]">相性</p>
                    <p className="font-semibold">しずかねこ / きれものねこ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`fixed inset-0 z-50 overflow-y-auto bg-black/30 px-4 transition-all duration-500 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDiagnosis}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,680px)] max-w-[680px] max-h-[calc(100dvh-48px)] overflow-y-auto rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-500 sm:my-8 sm:p-8 ${
            isOpen ? "scale-100 blur-0" : "scale-90 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {!showResult && !isCalculating ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                    DIAGNOSIS START
                  </p>
                  <h2 className="text-3xl font-bold">まずは{step + 1}問目</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white p-4 ring-1 ring-[#f2e5dc] sm:p-6">
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    {questions.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                          index <= step ? "bg-[#b07d62]" : "bg-[#eadfd6]"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-sm text-[#9a7d69]">
                    {step + 1} / {totalSteps} questions
                  </p>
                </div>

                <div
                  key={step}
                  className={`transition-all duration-300 ${
                    direction === "next"
                      ? "animate-[slideInRight_.28s_ease-out]"
                      : "animate-[slideInLeft_.28s_ease-out]"
                  }`}
                >
                  <p className="mb-6 break-words text-lg font-semibold leading-9 sm:leading-8">
                    {questions[step].text}
                  </p>

                  <div className="grid gap-3">
                    {questions[step].options.map((option) => {
                      const isSelected = selectedLabel === option.label;
                      const isAnsweredThisStep = answers[step] !== null;

                      return (
                        <button
                          key={option.label}
                          onClick={() => {
                            if (!isAnsweredThisStep) {
                              handleAnswer(option);
                            }
                          }}
                          disabled={selectedLabel !== null || animating}
                          className={`w-full rounded-2xl border px-4 py-4 text-left break-words transition sm:px-5 ${
                            isSelected
                              ? "scale-[0.99] border-[#c28f71] bg-[#fff0e4] shadow-sm"
                              : "border-[#ead8ca] bg-[#fffdfb] hover:bg-[#fff3ea]"
                          }`}
                        >
                          <span className="block break-words leading-8">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={handlePrev}
                      disabled={step === 0 || selectedLabel !== null || animating}
                      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                        step === 0 || selectedLabel !== null || animating
                          ? "cursor-not-allowed bg-[#f3ebe5] text-[#c0a997]"
                          : "bg-white text-[#7a5c48] shadow-sm hover:bg-[#fff3ea]"
                      }`}
                    >
                      戻る
                    </button>

                    <div className="text-sm text-[#9a7d69]">ゆっくり選んでOK</div>
                  </div>
                </div>
              </div>
            </>
          ) : isCalculating ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                    ANALYZING
                  </p>
                  <h2 className="text-3xl font-bold">診断中...</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div ref={resultCardRef} className="rounded-3xl bg-white p-5 ring-1 ring-[#f2e5dc] sm:p-6">
                <div className="flex flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] px-6 py-12 text-center ring-1 ring-[#f3e3d8]">
                  <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#eadfd6] border-t-[#b07d62]" />
                  <p className="text-lg font-semibold text-[#2b2b2b]">
                    {loadingMessages[loadingMessageIndex]}
                  </p>
                  <p className="mt-2 text-sm text-[#9a7d69]">
                    うちの子のタイプを読み解いています
                  </p>

                  <div className="mt-6 flex gap-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d2b8a7] [animation-delay:-0.2s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d2b8a7] [animation-delay:-0.1s]" />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#d2b8a7]" />
                  </div>
                </div>
              </div>
            </>
          ) : result ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">RESULT</p>
                  <h2 className="text-3xl font-bold">診断結果</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="rounded-3xl bg-white p-5 ring-1 ring-[#f2e5dc] sm:p-6">
                <div className="mb-6 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-6 text-center ring-1 ring-[#f3e3d8]">
                  <p className="mb-2 text-sm tracking-[0.22em] text-[#b07d62]">
                    {resultMeta[result.mainType].sub}
                  </p>
                  <div className="mb-4 text-7xl">{resultMeta[result.mainType].emoji}</div>
                  <h3 className="mb-3 text-3xl font-bold sm:text-4xl">{result.mainType}</h3>
                  <p className="mb-3 text-sm font-medium text-[#9a7d69]">
                    サブ傾向：{result.subType}
                  </p>
                  <p className="mx-auto max-w-md text-sm leading-7 text-[#6c625b] sm:text-base">
                    {resultMeta[result.mainType].desc}
                  </p>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-1 text-sm text-[#9a7d69]">特徴</p>
                    <p className="font-semibold">{resultMeta[result.mainType].traits}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-1 text-sm text-[#9a7d69]">相性</p>
                    <p className="font-semibold">{resultMeta[result.mainType].match}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={restartDiagnosis}
                    className="rounded-full bg-[#2b2b2b] px-6 py-4 text-base font-semibold text-white transition hover:opacity-90"
                  >
                    もう一度診断する
                  </button>
                  <button
                    onClick={closeDiagnosis}
                    className="rounded-full border border-[#d8c1b1] bg-white px-6 py-4 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]"
                  >
                    閉じる
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleSaveImage}
                    className="rounded-full border border-[#d8c1b1] bg-white px-6 py-4 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]"
                  >
                    画像を保存
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-full bg-[#f1e3d6] px-6 py-4 text-base font-semibold text-[#7a5c48] transition hover:opacity-90"
                  >
                    SNSで共有
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 overflow-y-auto bg-black/25 px-4 transition-all duration-300 ${
          isTypeListOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeTypeList}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,760px)] max-w-[760px] max-h-[calc(100dvh-48px)] overflow-y-auto rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
            isTypeListOpen ? "scale-100 blur-0" : "scale-95 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">TYPE LIST</p>
              <h2 className="text-3xl font-bold">猫タイプ一覧</h2>
            </div>

            <button
              onClick={closeTypeList}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {typeList.map((type) => (
              <div
                key={type}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]"
              >
                <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                  {resultMeta[type].sub}
                </p>
                <div className="mb-3 text-5xl">{resultMeta[type].emoji}</div>
                <h3 className="mb-3 text-2xl font-bold">{type}</h3>
                <p className="mb-4 text-sm leading-7 text-[#6c625b]">{resultMeta[type].desc}</p>

                <div className="grid gap-3">
                  <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-1 text-sm text-[#9a7d69]">特徴</p>
                    <p className="font-semibold">{resultMeta[type].traits}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-1 text-sm text-[#9a7d69]">相性</p>
                    <p className="font-semibold">{resultMeta[type].match}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
