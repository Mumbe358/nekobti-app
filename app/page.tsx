"use client";

import { useMemo, useState } from "react";

type CatType = "しずかねこ" | "きれものねこ" | "ボスねこ" | "わくわくねこ";

type Question = {
  id: number;
  text: string;
  options: {
    label: string;
    type: CatType;
  }[];
};

const questions: Question[] = [
  {
    id: 1,
    text: "あなたの猫は、知らない人が来たときどうする？",
    options: [
      { label: "すぐ隠れる", type: "しずかねこ" },
      { label: "少し様子を見る", type: "きれものねこ" },
      { label: "普通に近づく", type: "わくわくねこ" },
      { label: "むしろ主役みたいに出てくる", type: "ボスねこ" },
    ],
  },
  {
    id: 2,
    text: "普段いちばん近い行動は？",
    options: [
      { label: "静かな場所でのんびりしている", type: "しずかねこ" },
      { label: "周囲をよく観察して動く", type: "きれものねこ" },
      { label: "高いところや中心を陣取る", type: "ボスねこ" },
      { label: "おもちゃや人にすぐ反応する", type: "わくわくねこ" },
    ],
  },
  {
    id: 3,
    text: "甘え方として近いのは？",
    options: [
      { label: "気が向いたときだけそっと来る", type: "しずかねこ" },
      { label: "距離感を見ながら賢く寄ってくる", type: "きれものねこ" },
      { label: "当然のように特等席を使う", type: "ボスねこ" },
      { label: "全身で『かまって！』が伝わる", type: "わくわくねこ" },
    ],
  },
];

const resultMeta: Record<
  CatType,
  {
    emoji: string;
    desc: string;
    traits: string;
    match: string;
  }
> = {
  しずかねこ: {
    emoji: "🌙",
    desc: "警戒心と繊細さを持ちながら、安心した相手にはやさしく心を開くタイプ。",
    traits: "静けさ / 繊細 / 落ち着き",
    match: "ボスねこ / きれものねこ",
  },
  きれものねこ: {
    emoji: "🧠",
    desc: "状況を見る力が高く、空気や距離感を読みながら上手に立ち回るタイプ。",
    traits: "観察 / 判断 / スマート",
    match: "しずかねこ / わくわくねこ",
  },
  ボスねこ: {
    emoji: "👑",
    desc: "自分のペースを崩さず、自然と存在感を放つ。空間の主役になりやすいタイプ。",
    traits: "主導権 / 余裕 / 圧",
    match: "しずかねこ / クールねこ",
  },
  わくわくねこ: {
    emoji: "✨",
    desc: "反応が素直で好奇心いっぱい。楽しいことに全身で向かっていくタイプ。",
    traits: "好奇心 / 素直 / 元気",
    match: "きれものねこ / しずかねこ",
  },
};

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CatType[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const totalSteps = questions.length;

  const result = useMemo(() => {
    if (answers.length !== totalSteps) return null;

    const counts: Record<CatType, number> = {
      しずかねこ: 0,
      きれものねこ: 0,
      ボスねこ: 0,
      わくわくねこ: 0,
    };

    answers.forEach((answer) => {
      counts[answer] += 1;
    });

    const ordered: CatType[] = ["ボスねこ", "きれものねこ", "わくわくねこ", "しずかねこ"];

    return ordered.reduce((best, current) => {
      return counts[current] > counts[best] ? current : best;
    }, ordered[0]);
  }, [answers, totalSteps]);

  const openDiagnosis = () => {
    setIsOpen(true);
    setStep(0);
    setAnswers([]);
    setSelectedLabel(null);
  };

  const closeDiagnosis = () => {
    setIsOpen(false);
    setSelectedLabel(null);
  };

  const handleAnswer = (type: CatType, label: string) => {
    if (selectedLabel) return;

    setSelectedLabel(label);

    window.setTimeout(() => {
      const nextAnswers = [...answers, type];
      setAnswers(nextAnswers);
      setSelectedLabel(null);

      if (step < totalSteps - 1) {
        setStep((prev) => prev + 1);
      }
    }, 140);
  };

  const restartDiagnosis = () => {
    setStep(0);
    setAnswers([]);
    setSelectedLabel(null);
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

              <button className="rounded-full border border-[#d8c1b1] bg-white px-6 py-4 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]">
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
                    <p className="font-semibold">しずかねこ / クールねこ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 transition-all duration-500 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDiagnosis}
      >
        <div
          className={`w-full max-w-xl rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-8 shadow-2xl transition-all duration-500 ${
            isOpen ? "scale-100 blur-0" : "scale-90 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {!result ? (
            <>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                    DIAGNOSIS START
                  </p>
                  <h2 className="text-3xl font-bold">まずは{step + 1}問目</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-[#f2e5dc]">
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
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${step * 100}%)` }}
                >
                  {questions.map((question, questionIndex) => (
                    <div key={question.id} className="w-full shrink-0">
                      <p className="mb-6 text-lg font-semibold">{question.text}</p>

                      <div className="grid gap-3">
                        {question.options.map((option) => {
                          const isActiveQuestion = questionIndex === step;
                          const isSelected = selectedLabel === option.label;

                          return (
                            <button
                              key={option.label}
                              onClick={() => {
                                if (isActiveQuestion) {
                                  handleAnswer(option.type, option.label);
                                }
                              }}
                              disabled={!isActiveQuestion || selectedLabel !== null}
                              className={`rounded-2xl border px-5 py-4 text-left transition ${
                                isSelected
                                  ? "border-[#c28f71] bg-[#fff0e4] shadow-sm"
                                  : "border-[#ead8ca] bg-[#fffdfb] hover:bg-[#fff3ea]"
                              } ${!isActiveQuestion ? "pointer-events-none" : ""}`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                    RESULT
                  </p>
                  <h2 className="text-3xl font-bold">診断結果</h2>
                </div>

                <button
                  onClick={closeDiagnosis}
                  className="rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
                >
                  閉じる
                </button>
              </div>

              <div className="rounded-3xl bg-white p-6 ring-1 ring-[#f2e5dc]">
                <div className="mb-6 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-6 text-center ring-1 ring-[#f3e3d8]">
                  <p className="mb-3 text-sm tracking-[0.2em] text-[#b07d62]">
                    CAT MBTI STYLE
                  </p>
                  <div className="mb-4 text-6xl">{resultMeta[result].emoji}</div>
                  <h3 className="mb-3 text-3xl font-bold">{result}</h3>
                  <p className="mx-auto max-w-md text-sm leading-7 text-[#6c625b]">
                    {resultMeta[result].desc}
                  </p>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-1 text-sm text-[#9a7d69]">特徴</p>
                    <p className="font-semibold">{resultMeta[result].traits}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-1 text-sm text-[#9a7d69]">相性</p>
                    <p className="font-semibold">{resultMeta[result].match}</p>
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
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
