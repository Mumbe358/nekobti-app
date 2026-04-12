"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

type Axis = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

type CatType =
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

type QuestionOption = {
  label: string;
  axis: Axis;
};

type Question = {
  id: number;
  text: string;
  options: [QuestionOption, QuestionOption];
};

const questions: Question[] = [
  { id: 1, text: "知らない人が来たら？", options: [{ label: "近づいて様子を見る", axis: "E" }, { label: "物陰から観察する", axis: "I" }] },
  { id: 2, text: "新しいおもちゃを見つけたら？", options: [{ label: "すぐ飛びつく", axis: "E" }, { label: "しばらく様子を見る", axis: "I" }] },
  { id: 3, text: "お気に入りの場所は？", options: [{ label: "みんながいる場所", axis: "E" }, { label: "静かで落ち着く場所", axis: "I" }] },
  { id: 4, text: "ごはんの時間がズレたら？", options: [{ label: "気にせず待つ", axis: "P" }, { label: "しっかり主張する", axis: "J" }] },
  { id: 5, text: "遊び方は？", options: [{ label: "全力で追いかける", axis: "S" }, { label: "タイミングを見て狙う", axis: "N" }] },
  { id: 6, text: "飼い主との距離感は？", options: [{ label: "よく近くにいる", axis: "F" }, { label: "気が向いたときだけ", axis: "T" }] },
  { id: 7, text: "新しい環境では？", options: [{ label: "すぐ探検する", axis: "P" }, { label: "慎重に動く", axis: "J" }] },
  { id: 8, text: "他の猫がいたら？", options: [{ label: "関わろうとする", axis: "E" }, { label: "距離を保つ", axis: "I" }] },
  { id: 9, text: "くつろぐときは？", options: [{ label: "どこでもリラックス", axis: "P" }, { label: "決まった場所がいい", axis: "J" }] },
  { id: 10, text: "気になる音がしたら？", options: [{ label: "すぐ確認しに行く", axis: "S" }, { label: "じっと様子を見る", axis: "N" }] },
  { id: 11, text: "遊びに誘われたら？", options: [{ label: "すぐ乗る", axis: "F" }, { label: "気分次第", axis: "T" }] },
  { id: 12, text: "高い場所は？", options: [{ label: "好き", axis: "N" }, { label: "特にこだわらない", axis: "S" }] },
  { id: 13, text: "眠いときは？", options: [{ label: "その場で寝る", axis: "P" }, { label: "落ち着く場所に移動", axis: "J" }] },
  { id: 14, text: "縄張り意識は？", options: [{ label: "強い", axis: "T" }, { label: "あまり気にしない", axis: "F" }] },
  { id: 15, text: "行動パターンは？", options: [{ label: "ある程度決まっている", axis: "J" }, { label: "気分で変わる", axis: "P" }] },
  { id: 16, text: "飼い主の指示には？", options: [{ label: "わりと従う", axis: "F" }, { label: "基本マイペース", axis: "T" }] },
];

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

const mbtiSubMap: Record<CatType, string> = {
  "規律番ねこ": "ISTJ",
  "よりそい守りねこ": "ISFJ",
  "しずか哲学ねこ": "INFJ",
  "戦略きれものねこ": "INTJ",
  "無口クラフトねこ": "ISTP",
  "ふわアートねこ": "ISFP",
  "ゆめふわロマンねこ": "INFP",
  "ひらめき遊びねこ": "INTP",
  "突撃アクティブねこ": "ESTP",
  "きらきらパーティーねこ": "ESFP",
  "わくわく自由ねこ": "ENFP",
  "いたずら天才ねこ": "ENTP",
  "しきり屋リーダーねこ": "ESTJ",
  "みんな大好きねこ": "ESFJ",
  "導きカリスマねこ": "ENFJ",
  "覇王ボスねこ": "ENTJ",
};

const ownerCompatibility: Record<CatType, { type: string; hearts: number }[]> = {
  "規律番ねこ": [
    { type: "ESTJ", hearts: 5 },
    { type: "ESFJ", hearts: 4 },
    { type: "ENFJ", hearts: 4 },
  ],
  "よりそい守りねこ": [
    { type: "ESFJ", hearts: 5 },
    { type: "ISFJ", hearts: 5 },
    { type: "ENFJ", hearts: 4 },
  ],
  "しずか哲学ねこ": [
    { type: "INFJ", hearts: 5 },
    { type: "INTJ", hearts: 4 },
    { type: "ENFJ", hearts: 4 },
  ],
  "戦略きれものねこ": [
    { type: "ENTJ", hearts: 5 },
    { type: "INTJ", hearts: 5 },
    { type: "ESTJ", hearts: 4 },
  ],
  "無口クラフトねこ": [
    { type: "ISTP", hearts: 5 },
    { type: "ISFP", hearts: 4 },
    { type: "ESTP", hearts: 4 },
  ],
  "ふわアートねこ": [
    { type: "ISFP", hearts: 5 },
    { type: "INFP", hearts: 5 },
    { type: "ESFP", hearts: 4 },
  ],
  "ゆめふわロマンねこ": [
    { type: "INFP", hearts: 5 },
    { type: "ENFP", hearts: 4 },
    { type: "ISFP", hearts: 4 },
  ],
  "ひらめき遊びねこ": [
    { type: "INTP", hearts: 5 },
    { type: "ENTP", hearts: 5 },
    { type: "ENFP", hearts: 4 },
  ],
  "突撃アクティブねこ": [
    { type: "ESTP", hearts: 5 },
    { type: "ESFP", hearts: 5 },
    { type: "ENFP", hearts: 4 },
  ],
  "きらきらパーティーねこ": [
    { type: "ESFP", hearts: 5 },
    { type: "ENFP", hearts: 5 },
    { type: "ESTP", hearts: 4 },
  ],
  "わくわく自由ねこ": [
    { type: "ENFP", hearts: 5 },
    { type: "ENTP", hearts: 5 },
    { type: "ESFP", hearts: 4 },
  ],
  "いたずら天才ねこ": [
    { type: "ENTP", hearts: 5 },
    { type: "INTP", hearts: 5 },
    { type: "ENFP", hearts: 4 },
  ],
  "しきり屋リーダーねこ": [
    { type: "ESTJ", hearts: 5 },
    { type: "ENTJ", hearts: 5 },
    { type: "ESFJ", hearts: 4 },
  ],
  "みんな大好きねこ": [
    { type: "ESFJ", hearts: 5 },
    { type: "ENFJ", hearts: 5 },
    { type: "ISFJ", hearts: 4 },
  ],
  "導きカリスマねこ": [
    { type: "ENFJ", hearts: 5 },
    { type: "INFJ", hearts: 4 },
    { type: "ESFJ", hearts: 4 },
  ],
  "覇王ボスねこ": [
    { type: "ENTJ", hearts: 5 },
    { type: "ESTJ", hearts: 5 },
    { type: "INTJ", hearts: 4 },
  ],
};

const renderHearts = (count: number) => "❤︎".repeat(count) + "♡".repeat(5 - count);

const Paw = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-3.5 w-3.5 transition-colors duration-300 sm:h-4 sm:w-4 ${
      active ? "fill-[#b07d62]" : "fill-[#f3e8df]"
    }`}
    aria-hidden="true"
  >
    <circle cx="12" cy="15" r="4" />
    <circle cx="7" cy="9" r="1.8" />
    <circle cx="10.5" cy="6.5" r="1.8" />
    <circle cx="13.5" cy="6.5" r="1.8" />
    <circle cx="17" cy="9" r="1.8" />
  </svg>
);


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
  "規律番ねこ": {
    emoji: "📋",
    sub: "ISTJ",
    desc: "きっちり守って整える。決まったことや日々の流れをしっかり支える、堅実なおうちの番人タイプ。",
    traits: "規律 / 誠実 / 安定感",
    match: "よりそい守りねこ / 導きカリスマねこ",
  },
  "よりそい守りねこ": {
    emoji: "🤍",
    sub: "ISFJ",
    desc: "やさしく寄り添いながら相手を見守る。空気を乱さず、安心感で場を包む癒やし役タイプ。",
    traits: "思いやり / 献身 / 安心感",
    match: "規律番ねこ / しずか哲学ねこ",
  },
  "しずか哲学ねこ": {
    emoji: "🌙",
    sub: "INFJ",
    desc: "静かに深く考え、表には出しすぎない。でも内面には強い世界観を持つ哲学者タイプ。",
    traits: "静けさ / 深さ / 洞察",
    match: "よりそい守りねこ / 戦略きれものねこ",
  },
  "戦略きれものねこ": {
    emoji: "🧠",
    sub: "INTJ",
    desc: "先を読んで動く設計者。感情より構造を見て、最適な流れを静かに組み立てるタイプ。",
    traits: "戦略 / 設計 / 冷静",
    match: "しずか哲学ねこ / 覇王ボスねこ",
  },
  "無口クラフトねこ": {
    emoji: "🛠️",
    sub: "ISTP",
    desc: "多くを語らず、必要な時だけ動く。手を動かしながら答えを見つける職人気質タイプ。",
    traits: "実践 / 器用 / 無駄がない",
    match: "ふわアートねこ / わくわく自由ねこ",
  },
  "ふわアートねこ": {
    emoji: "🎨",
    sub: "ISFP",
    desc: "感性のままに世界を受け取る。やわらかく穏やかな空気で、自分らしさを大切にするタイプ。",
    traits: "感性 / やわらかさ / 美意識",
    match: "無口クラフトねこ / ゆめふわロマンねこ",
  },
  "ゆめふわロマンねこ": {
    emoji: "✨",
    sub: "INFP",
    desc: "現実よりも心の中の世界を大切にする。理想やときめきにまっすぐなロマン派タイプ。",
    traits: "理想 / 空想 / 純粋さ",
    match: "ふわアートねこ / いたずら天才ねこ",
  },
  "ひらめき遊びねこ": {
    emoji: "💡",
    sub: "INTP",
    desc: "考えること自体が遊び。ひらめきと仕組みが大好きな、知的いたずら好きタイプ。",
    traits: "発想 / 分析 / 遊び心",
    match: "いたずら天才ねこ / 戦略きれものねこ",
  },
  "突撃アクティブねこ": {
    emoji: "⚡",
    sub: "ESTP",
    desc: "迷う前に飛び込む、瞬発力の冒険家。体感で世界をつかみにいくタイプ。",
    traits: "行動力 / 勢い / 勇気",
    match: "わくわく自由ねこ / きらきらパーティーねこ",
  },
  "きらきらパーティーねこ": {
    emoji: "🎉",
    sub: "ESFP",
    desc: "場の空気を明るくする人気者。楽しさを見つけるのが上手で、人を笑顔にするタイプ。",
    traits: "明るさ / 社交性 / 華やかさ",
    match: "突撃アクティブねこ / みんな大好きねこ",
  },
  "わくわく自由ねこ": {
    emoji: "🌈",
    sub: "ENFP",
    desc: "好奇心いっぱいで、自由に世界を広げる。ワクワクを原動力に動くタイプ。",
    traits: "自由 / 好奇心 / 可能性",
    match: "突撃アクティブねこ / いたずら天才ねこ",
  },
  "いたずら天才ねこ": {
    emoji: "🃏",
    sub: "ENTP",
    desc: "発想でひっくり返すトリックスター。頭の回転が速く、遊びながら場を変えていくタイプ。",
    traits: "機転 / いたずら / 知性",
    match: "ひらめき遊びねこ / わくわく自由ねこ",
  },
  "しきり屋リーダーねこ": {
    emoji: "📣",
    sub: "ESTJ",
    desc: "しっかり仕切って全体を動かす現場統率者。頼られると強い、実務派リーダータイプ。",
    traits: "統率 / 実行 / 責任感",
    match: "みんな大好きねこ / 覇王ボスねこ",
  },
  "みんな大好きねこ": {
    emoji: "💗",
    sub: "ESFJ",
    desc: "愛され上手で空気をあたためる。まわりを気づかいながら関係を育てるタイプ。",
    traits: "親しみ / 気配り / 愛され力",
    match: "きらきらパーティーねこ / しきり屋リーダーねこ",
  },
  "導きカリスマねこ": {
    emoji: "🌟",
    sub: "ENFJ",
    desc: "人を導くやさしい影響力。周囲の気持ちを動かしながら、前へ進めるカリスマタイプ。",
    traits: "影響力 / 共感 / 推進力",
    match: "よりそい守りねこ / 覇王ボスねこ",
  },
  "覇王ボスねこ": {
    emoji: "👑",
    sub: "ENTJ",
    desc: "堂々と采配し、全体を前へ進める王者。圧倒的な存在感で空間を支配するタイプ。",
    traits: "支配力 / 決断 / 王者感",
    match: "戦略きれものねこ / しきり屋リーダーねこ",
  },
};

const typeList: CatType[] = [
  "規律番ねこ",
  "よりそい守りねこ",
  "しずか哲学ねこ",
  "戦略きれものねこ",
  "無口クラフトねこ",
  "ふわアートねこ",
  "ゆめふわロマンねこ",
  "ひらめき遊びねこ",
  "突撃アクティブねこ",
  "きらきらパーティーねこ",
  "わくわく自由ねこ",
  "いたずら天才ねこ",
  "しきり屋リーダーねこ",
  "みんな大好きねこ",
  "導きカリスマねこ",
  "覇王ボスねこ",
];

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

function getMbtiType(scores: Record<Axis, number>) {
  const EI = scores.E >= scores.I ? "E" : "I";
  const SN = scores.S >= scores.N ? "S" : "N";
  const TF = scores.T >= scores.F ? "T" : "F";
  const JP = scores.J >= scores.P ? "J" : "P";
  return `${EI}${SN}${TF}${JP}`;
}

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
      scores[answer.axis] += 1;
    });

    const mbti = getMbtiType(scores);
    const mainType = catTypeMap[mbti];

    return {
      scores,
      mbti,
      mainType,
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
      ? `うちの猫のタイプは「${result.mainType}（${result.mbti}）」でした🐱\n診断してみて👇`
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
                <p className="text-lg font-bold">戦略きれものねこ</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">しずか哲学ねこ</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#f1e4da]">
                <p className="mb-2 text-sm text-[#9a7d69]">TYPE</p>
                <p className="text-lg font-bold">覇王ボスねこ</p>
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
                      <h3 className="text-3xl font-bold">覇王ボスねこ</h3>
                    </div>

                    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-white text-6xl shadow-sm">
                      👑
                    </div>

                    <p className="text-sm leading-7 text-[#6c625b]">
                      堂々としていて、決断も早い。
                      空気を読むより、空間そのものを掌握するタイプ。
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm text-[#9a7d69]">特徴</p>
                    <p className="font-semibold">支配力 / 決断 / 王者感</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-1 text-sm text-[#9a7d69]">相性</p>
                    <p className="font-semibold">戦略きれものねこ / しきり屋リーダーねこ</p>
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
                  <div className="mb-3 flex items-center gap-1.5">
                    {questions.map((_, index) => (
                      <Paw key={index} active={index < answeredCount} />
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
                <div ref={resultCardRef} className="mb-6 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-6 text-center ring-1 ring-[#f3e3d8]">
                  <p className="mb-2 text-sm tracking-[0.22em] text-[#b07d62]">
                    {resultMeta[result.mainType].sub}
                  </p>
                  <div className="mb-4 text-7xl">{resultMeta[result.mainType].emoji}</div>
                  <h3 className="mb-3 text-3xl font-bold sm:text-4xl">{result.mainType}</h3>
                  <p className="mb-3 text-sm font-medium text-[#9a7d69]">
                    MBTI：{result.mbti}
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

                <div className="mb-6 rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                  <p className="mb-3 text-sm text-[#9a7d69]">飼い主との相性</p>
                  <div className="space-y-2 text-sm">
                    {ownerCompatibility[result.mainType].map((item) => (
                      <div key={item.type} className="flex items-center justify-between gap-4">
                        <span className="font-medium text-[#4e433d]">{item.type}</span>
                        <span className="whitespace-nowrap text-[#cf7f7f]">{renderHearts(item.hearts)}</span>
                      </div>
                    ))}
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
