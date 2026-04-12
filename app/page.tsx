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

type Segment = "EI" | "SN" | "TF" | "JP";

type Question = {
  id: number;
  text: string;
  segment: Segment;
  options: [QuestionOption, QuestionOption];
};

const questionPool: Record<Segment, Question[]> = {
  EI: [
    { id: 1, text: "知らない人が来たら？", segment: "EI", options: [{ label: "近づいて様子を見る", axis: "E" }, { label: "物陰から観察する", axis: "I" }] },
    { id: 2, text: "新しいおもちゃを見つけたら？", segment: "EI", options: [{ label: "すぐ飛びつく", axis: "E" }, { label: "しばらく様子を見る", axis: "I" }] },
    { id: 3, text: "お気に入りの場所は？", segment: "EI", options: [{ label: "みんながいる場所", axis: "E" }, { label: "静かで落ち着く場所", axis: "I" }] },
    { id: 4, text: "他の猫がいたら？", segment: "EI", options: [{ label: "関わろうとする", axis: "E" }, { label: "距離を保つ", axis: "I" }] },
    { id: 5, text: "来客の気配を感じたら？", segment: "EI", options: [{ label: "自分から見に行く", axis: "E" }, { label: "安全な場所で様子を見る", axis: "I" }] },
    { id: 6, text: "部屋の中心にいたい？", segment: "EI", options: [{ label: "目立つ場所が好き", axis: "E" }, { label: "すみっこが落ち着く", axis: "I" }] },
  ],
  SN: [
    { id: 7, text: "遊び方は？", segment: "SN", options: [{ label: "全力で追いかける", axis: "S" }, { label: "タイミングを見て狙う", axis: "N" }] },
    { id: 8, text: "気になる音がしたら？", segment: "SN", options: [{ label: "すぐ確認しに行く", axis: "S" }, { label: "じっと様子を見る", axis: "N" }] },
    { id: 9, text: "高い場所は？", segment: "SN", options: [{ label: "特にこだわらない", axis: "S" }, { label: "好き", axis: "N" }] },
    { id: 10, text: "窓の外を見るときは？", segment: "SN", options: [{ label: "動くものを追う", axis: "S" }, { label: "ぼんやり景色に浸る", axis: "N" }] },
    { id: 11, text: "おもちゃを前にすると？", segment: "SN", options: [{ label: "まず触って確かめる", axis: "S" }, { label: "動きを読んで狙う", axis: "N" }] },
    { id: 12, text: "新しい場所では？", segment: "SN", options: [{ label: "足元から順に確かめる", axis: "S" }, { label: "先に全体を見渡す", axis: "N" }] },
  ],
  TF: [
    { id: 13, text: "飼い主との距離感は？", segment: "TF", options: [{ label: "よく近くにいる", axis: "F" }, { label: "気が向いたときだけ", axis: "T" }] },
    { id: 14, text: "遊びに誘われたら？", segment: "TF", options: [{ label: "すぐ乗る", axis: "F" }, { label: "気分次第", axis: "T" }] },
    { id: 15, text: "縄張り意識は？", segment: "TF", options: [{ label: "強い", axis: "T" }, { label: "あまり気にしない", axis: "F" }] },
    { id: 16, text: "飼い主の指示には？", segment: "TF", options: [{ label: "わりと従う", axis: "F" }, { label: "基本マイペース", axis: "T" }] },
    { id: 17, text: "甘えたい気分のときは？", segment: "TF", options: [{ label: "すぐ伝える", axis: "F" }, { label: "伝えず様子を見る", axis: "T" }] },
    { id: 18, text: "ごはんを分けるなら？", segment: "TF", options: [{ label: "みんなと穏やかに", axis: "F" }, { label: "自分の分を守る", axis: "T" }] },
  ],
  JP: [
    { id: 19, text: "ごはんの時間がズレたら？", segment: "JP", options: [{ label: "気にせず待つ", axis: "P" }, { label: "しっかり主張する", axis: "J" }] },
    { id: 20, text: "新しい環境では？", segment: "JP", options: [{ label: "すぐ探検する", axis: "P" }, { label: "慎重に動く", axis: "J" }] },
    { id: 21, text: "くつろぐときは？", segment: "JP", options: [{ label: "どこでもリラックス", axis: "P" }, { label: "決まった場所がいい", axis: "J" }] },
    { id: 22, text: "眠いときは？", segment: "JP", options: [{ label: "その場で寝る", axis: "P" }, { label: "落ち着く場所に移動", axis: "J" }] },
    { id: 23, text: "行動パターンは？", segment: "JP", options: [{ label: "気分で変わる", axis: "P" }, { label: "ある程度決まっている", axis: "J" }] },
    { id: 24, text: "お気に入りルートは？", segment: "JP", options: [{ label: "毎回違っても平気", axis: "P" }, { label: "いつもの順番が安心", axis: "J" }] },
  ],
};

const QUESTION_COUNT_PER_SEGMENT = 4;

function shuffleArray<T>(array: T[]) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

function buildQuestionSet() {
  return shuffleArray([
    ...shuffleArray(questionPool.EI).slice(0, QUESTION_COUNT_PER_SEGMENT),
    ...shuffleArray(questionPool.SN).slice(0, QUESTION_COUNT_PER_SEGMENT),
    ...shuffleArray(questionPool.TF).slice(0, QUESTION_COUNT_PER_SEGMENT),
    ...shuffleArray(questionPool.JP).slice(0, QUESTION_COUNT_PER_SEGMENT),
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

const ownerMbtiLabelMap: Record<string, string> = {
  INTJ: "建築家",
  INTP: "論理学者",
  ENTJ: "指揮官",
  ENTP: "討論者",
  INFJ: "提唱者",
  INFP: "仲介者",
  ENFJ: "主人公",
  ENFP: "運動家",
  ISTJ: "管理者",
  ISFJ: "擁護者",
  ESTJ: "幹部",
  ESFJ: "領事",
  ISTP: "巨匠",
  ISFP: "冒険家",
  ESTP: "起業家",
  ESFP: "エンターテイナー",
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
    className={`h-7 w-7 transition-colors duration-300 sm:h-8 sm:w-8 ${
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
    description: string;
    features: string[];
    patterns: string[];
  }
> = {
  "規律番ねこ": {
    emoji: "📋",
    description: "きっちり守って整える。決まったことや日々の流れをしっかり支える、堅実なおうちの番人タイプ。",
    features: ["ルールと秩序を守る", "コツコツ継続する", "安定志向", "信頼されやすい"],
    patterns: ["決めたことをやり抜く", "計画通りに動く", "変化より安定", "責任を重く捉える"],
  },
  "よりそい守りねこ": {
    emoji: "🤍",
    description: "やさしく寄り添いながら相手を見守る。空気を乱さず、安心感で場を包む癒やし役タイプ。",
    features: ["周りを支える優しさ", "安心できる空気を作る", "気配りが細かい", "責任感が強い"],
    patterns: ["困っている人にすぐ気づく", "自分より他人を優先", "静かに行動する", "縁の下の力持ち"],
  },
  "しずか哲学ねこ": {
    emoji: "🌙",
    description: "静かに深く考え、表には出しすぎない。でも内面には強い世界観を持つ哲学者タイプ。",
    features: ["物事の本質をじっと考える", "人の気持ちを静かに読み取る", "深く理解してから動く", "理想を大切にする"],
    patterns: ["一人で考える時間が必要", "直感で本質を掴む", "言葉より空気を読む", "気づけば核心にいる"],
  },
  "戦略きれものねこ": {
    emoji: "🧠",
    description: "先を読んで動く設計者。感情より構造を見て、最適な流れを静かに組み立てるタイプ。",
    features: ["最短ルートを見抜く", "合理的思考", "一人で完成度を高める", "無駄を嫌う"],
    patterns: ["先を読む", "効率を重視", "一人で考える時間が長い", "必要なことだけやる"],
  },
  "無口クラフトねこ": {
    emoji: "🛠️",
    description: "多くを語らず、必要な時だけ動く。手を動かしながら答えを見つける職人気質タイプ。",
    features: ["手を動かして理解する", "無駄を嫌う", "冷静", "実用重視"],
    patterns: ["まず触る", "試しながら覚える", "言葉より行動", "淡々とこなす"],
  },
  "ふわアートねこ": {
    emoji: "🎨",
    description: "感性のままに世界を受け取る。やわらかく穏やかな空気で、自分らしさを大切にするタイプ。",
    features: ["感性が豊か", "自分の世界を大事にする", "優しく繊細", "美しさにこだわる"],
    patterns: ["好きなことに集中", "感覚で判断", "争いを避ける", "自由に動く"],
  },
  "ゆめふわロマンねこ": {
    emoji: "✨",
    description: "現実よりも心の中の世界を大切にする。理想やときめきにまっすぐなロマン派タイプ。",
    features: ["理想を大切にする", "優しく共感力が高い", "感情が豊か", "自分の世界観を持つ"],
    patterns: ["共感で動く", "理想を追う", "一人時間も大事", "静かに深く考える"],
  },
  "ひらめき遊びねこ": {
    emoji: "💡",
    description: "考えること自体が遊び。ひらめきと仕組みが大好きな、知的いたずら好きタイプ。",
    features: ["考えることが楽しい", "論理的思考", "一人で没頭", "探究心が強い"],
    patterns: ["疑問から始まる", "納得するまで考える", "興味で動く", "静かに深掘り"],
  },
  "突撃アクティブねこ": {
    emoji: "⚡",
    description: "迷う前に飛び込む、瞬発力の冒険家。体感で世界をつかみにいくタイプ。",
    features: ["行動力が高い", "スピード重視", "リスクを恐れない", "現場主義"],
    patterns: ["まずやる", "考えるより動く", "その場で判断", "瞬発力が高い"],
  },
  "きらきらパーティーねこ": {
    emoji: "🎉",
    description: "場の空気を明るくする人気者。楽しさを見つけるのが上手で、人を笑顔にするタイプ。",
    features: ["楽しいこと最優先", "明るく社交的", "場を盛り上げる", "感情豊か"],
    patterns: ["ノリで動く", "人と一緒が好き", "今を楽しむ", "直感で判断"],
  },
  "わくわく自由ねこ": {
    emoji: "🌈",
    description: "好奇心いっぱいで、自由に世界を広げる。ワクワクを原動力に動くタイプ。",
    features: ["新しいことが好き", "発想が自由", "感情で動く", "可能性重視"],
    patterns: ["ワクワクで動く", "すぐ興味が移る", "人との繋がり重視", "自由を求める"],
  },
  "いたずら天才ねこ": {
    emoji: "🃏",
    description: "発想でひっくり返すトリックスター。頭の回転が速く、遊びながら場を変えていくタイプ。",
    features: ["思いついたら即実験", "ルールは壊してから考える", "周りを巻き込んで変化を起こす", "いたずら＝クリエイティブ"],
    patterns: ["「これやったらどうなる？」で動く", "飽きたらすぐ次へ", "空気を変える起爆剤", "気づいたら中心にいる"],
  },
  "しきり屋リーダーねこ": {
    emoji: "📣",
    description: "しっかり仕切って全体を動かす現場統率者。頼られると強い、実務派リーダータイプ。",
    features: ["仕切るのが得意", "ルールを回す", "実行力が高い", "結果重視"],
    patterns: ["指示を出す", "計画的に進める", "効率重視", "責任を持つ"],
  },
  "みんな大好きねこ": {
    emoji: "💗",
    description: "愛され上手で空気をあたためる。まわりを気づかいながら関係を育てるタイプ。",
    features: ["人との関係を大切にする", "面倒見がいい", "空気を読む", "調和重視"],
    patterns: ["周りを気にする", "サポートに回る", "安心を優先", "集団で動く"],
  },
  "導きカリスマねこ": {
    emoji: "🌟",
    description: "人を導くやさしい影響力。周囲の気持ちを動かしながら、前へ進めるカリスマタイプ。",
    features: ["人を引っ張る力", "影響力がある", "理想を共有する", "情熱的"],
    patterns: ["人を導く", "周囲を巻き込む", "感情で動かす", "目的意識が強い"],
  },
  "覇王ボスねこ": {
    emoji: "👑",
    description: "堂々と采配し、全体を前へ進める王者。圧倒的な存在感で空間を支配するタイプ。",
    features: ["圧倒的な決断力", "戦略的思考", "支配力が強い", "結果にこだわる"],
    patterns: ["ゴールから逆算", "迷わず決める", "人を動かす", "効率を最大化"],
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
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(() => buildQuestionSet());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(QuestionOption | null)[]>(() =>
    Array(QUESTION_COUNT_PER_SEGMENT * 4).fill(null)
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

  const totalSteps = currentQuestions.length;
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
    const nextQuestions = buildQuestionSet();
    setCurrentQuestions(nextQuestions);
    setAnswers(Array(nextQuestions.length).fill(null));
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
    const nextQuestions = buildQuestionSet();
    setCurrentQuestions(nextQuestions);
    setAnswers(Array(nextQuestions.length).fill(null));
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
        className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/30 px-4 transition-all duration-500 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDiagnosis}
      >
        <div
          className={`mx-auto my-6 flex w-[min(92vw,680px)] max-w-[680px] max-h-[calc(100dvh-48px)] flex-col overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-500 sm:my-8 sm:p-8 ${
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
                    {currentQuestions.map((_, index) => (
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
                    {currentQuestions[step].text}
                  </p>

                  <div className="grid gap-3">
                    {currentQuestions[step].options.map((option) => {
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
                <div ref={resultCardRef} className="mb-6 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-6 ring-1 ring-[#f3e3d8]">
                  <div className="mb-4 text-center text-7xl">{resultMeta[result.mainType].emoji}</div>
                  <h3 className="mb-4 text-center text-3xl font-bold sm:text-4xl">{result.mainType}</h3>
                  <p className="mb-5 text-center text-sm leading-7 text-[#6c625b] sm:text-base">
                    {resultMeta[result.mainType].description}
                  </p>

                  <div className="mb-5 rounded-2xl bg-white/70 p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-3 text-sm font-semibold text-[#9a7d69]">💡 特徴</p>
                    <ul className="space-y-2 text-sm leading-7 text-[#4e433d] sm:text-base">
                      {resultMeta[result.mainType].features.map((feature) => (
                        <li key={feature}>・{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-5 rounded-2xl bg-white/70 p-4 ring-1 ring-[#f1e4da]">
                    <p className="mb-3 text-sm font-semibold text-[#9a7d69]">🧠 行動パターン</p>
                    <ul className="space-y-2 text-sm leading-7 text-[#4e433d] sm:text-base">
                      {resultMeta[result.mainType].patterns.map((pattern) => (
                        <li key={pattern}>・{pattern}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mb-6 rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                  <p className="mb-3 text-sm text-[#9a7d69]">飼い主との相性</p>
                  <div className="space-y-2 text-sm">
                    {ownerCompatibility[result.mainType].map((item) => (
                      <div key={item.type} className="flex items-center justify-between gap-4">
                        <span className="font-bold text-[#4e433d]">
                          {item.type}（{ownerMbtiLabelMap[item.type]}）
                        </span>
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
        className={`fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-black/25 px-4 transition-all duration-300 ${
          isTypeListOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeTypeList}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,760px)] max-w-[760px] max-h-[calc(100dvh-48px)] overflow-y-auto overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
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
                <div className="mb-3 text-5xl">{resultMeta[type].emoji}</div>
                <h3 className="mb-4 text-2xl font-bold">{type}</h3>

                <div className="mb-3 rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                  <p className="mb-2 text-sm text-[#9a7d69]">💡 特徴</p>
                  <ul className="space-y-1 text-sm leading-7 text-[#4e433d]">
                    {resultMeta[type].features.map((feature) => (
                      <li key={feature}>・{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-3 rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                  <p className="mb-2 text-sm text-[#9a7d69]">🔥 性格まとめ</p>
                  <p className="text-sm font-semibold leading-7 text-[#4e433d]">
                    👉 {resultMeta[type].summary}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fffaf6] p-4 ring-1 ring-[#f1e4da]">
                  <p className="mb-2 text-sm text-[#9a7d69]">🧠 行動パターン</p>
                  <ul className="space-y-1 text-sm leading-7 text-[#4e433d]">
                    {resultMeta[type].patterns.map((pattern) => (
                      <li key={pattern}>・{pattern}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
