"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Noto_Sans_JP } from "next/font/google";

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
  weight: number;
};

type Segment = "EI" | "SN" | "TF" | "JP";

type Question = {
  id: number;
  text: string;
  segment: Segment;
  options: [QuestionOption, QuestionOption];
};

type GenderOption = "" | "male" | "female";
type CoatOption = "" | "white" | "black" | "gray" | "tabby" | "calico" | "brown" | "blackwhite";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});


const VISITOR_ID_STORAGE_KEY = "nekobti_visitor_id";
const SESSION_ID_STORAGE_KEY = "nekobti_session_id";

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (existing) return existing;

  const next = safeUuid();
  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, next);
  return next;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";

  const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const next = safeUuid();
  window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, next);
  return next;
}

function getTrackingMeta() {
  if (typeof window === "undefined") {
    return {
      session_id: "",
      visitor_id: "",
      page_path: "",
      page_url: "",
      referrer: null as string | null,
      utm_source: null as string | null,
      utm_medium: null as string | null,
      utm_campaign: null as string | null,
      user_agent: "",
      timezone: "",
    };
  }

  const url = new URL(window.location.href);

  return {
    session_id: getOrCreateSessionId(),
    visitor_id: getOrCreateVisitorId(),
    page_path: window.location.pathname,
    page_url: window.location.href,
    referrer: document.referrer || null,
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
    user_agent: navigator.userAgent || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  };
}

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

function buildQuestionSet() {
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


type AruaruSet = {
  text: string;
  quote: string;
};

const traitsMap: Record<CatType, string[]> = {
  "規律番ねこ": ["ルールに正確", "いつも通りが安心", "確認してから動く"],
  "よりそい守りねこ": ["そっと寄りそう", "安心感つよめ", "気づくと守ってる"],
  "しずか哲学ねこ": ["静かに見てる", "空気を深読み", "一人時間が主戦場"],
  "戦略きれものねこ": ["先読みが早い", "無駄がきらい", "一手先で動く"],
  "無口クラフトねこ": ["手で試したい", "静かに職人肌", "触って理解する"],
  "ふわアートねこ": ["感覚で決める", "好きがはっきり", "世界観を持ってる"],
  "ゆめふわロマンねこ": ["自分の世界が濃い", "繊細さMAX", "距離感が独特"],
  "ひらめき遊びねこ": ["発想が独特", "仕組みが気になる", "考え出すと止まらない"],
  "突撃アクティブねこ": ["先に飛びこむ", "勢いで突破", "危なそうほど行く"],
  "きらきらパーティーねこ": ["楽しさに敏感", "人の輪に入る", "場が明るくなる"],
  "わくわく自由ねこ": ["好奇心が暴れる", "飽きるのも早い", "次がすぐ気になる"],
  "いたずら天才ねこ": ["試したがり", "反応を見るの好き", "遊び方を発明する"],
  "しきり屋リーダーねこ": ["仕切るのが自然", "乱れが気になる", "全体を回したい"],
  "みんな大好きねこ": ["人懐っこさMAX", "誰とでも近い", "好かれ力つよめ"],
  "導きカリスマねこ": ["気配りの達人", "自然に導く", "寄りそい上手"],
  "覇王ボスねこ": ["主役ポジを取る", "迷わず決める", "圧があるのに強い"],
};

const bestMatchMap: Record<CatType, string> = {
  "規律番ねこ": "きらきらパーティーねこ",
  "よりそい守りねこ": "きらきらパーティーねこ",
  "しずか哲学ねこ": "わくわく自由ねこ",
  "戦略きれものねこ": "わくわく自由ねこ",
  "無口クラフトねこ": "みんな大好きねこ",
  "ふわアートねこ": "導きカリスマねこ",
  "ゆめふわロマンねこ": "導きカリスマねこ",
  "ひらめき遊びねこ": "覇王ボスねこ",
  "突撃アクティブねこ": "よりそい守りねこ",
  "きらきらパーティーねこ": "よりそい守りねこ",
  "わくわく自由ねこ": "しずか哲学ねこ",
  "いたずら天才ねこ": "しずか哲学ねこ",
  "しきり屋リーダーねこ": "ふわアートねこ",
  "みんな大好きねこ": "無口クラフトねこ",
  "導きカリスマねこ": "ゆめふわロマンねこ",
  "覇王ボスねこ": "ゆめふわロマンねこ",
};

const aruaruMap: Record<CatType, AruaruSet[]> = {
  "しずか哲学ねこ": [
    { text: "夜になると急に活動し始める。昼は静かなのに、暗くなった部屋のすみでじっと何か考えてる顔をしている。呼ぶと少し間をおいてから来る。", quote: `いま考えてるにゃ。
あとで行くにゃ。` },
    { text: "窓の外を長い時間見ている。鳥も虫もいないのに、なぜか真剣な顔でずっと一点を見つめている。話しかけると、ゆっくりだけ振り向く。", quote: `まだ見てるにゃ。
少し待つにゃ。` },
    { text: "みんなが騒いでいる時は少し離れた場所にいる。でも静かになった瞬間だけ、すっと近くに来て隣に座る。落ち着いた空気を選んで動くタイプ。", quote: `いまなら行くにゃ。
ここでいいにゃ。` },
    { text: "お気に入りの場所がいつも同じ。しかも部屋の真ん中じゃなく、少し端の落ち着く位置を選ぶ。誰かが座ると別の静かな場所へ移動する。", quote: `ここが落ち着くにゃ。
静かにするにゃ。` },
  ],
  "よりそい守りねこ": [
    { text: "誰かが横になると、いつの間にかその近くに来ている。ぴったりくっつくわけじゃないのに、手を伸ばせば触れられる距離に必ずいる。", quote: `ここにいるにゃ。
そばにいるにゃ。` },
    { text: "元気がなさそうな人のところにだけ寄っていく。他の人には行かないのに、その人の足元や横に静かに座り続ける。", quote: `大丈夫にゃ。
ここにいるにゃ。` },
    { text: "寝ている人の足元に丸くなる。邪魔にならない絶妙な位置で落ち着いていて、起きてもすぐには離れない。", quote: `ここで見るにゃ。
まだいるにゃ。` },
    { text: "怒られても完全には離れない。少し距離を取って座り直して、それでも同じ部屋には残っている。", quote: `離れないにゃ。
気にしてるにゃ。` },
  ],
  "規律番ねこ": [
    { text: "ごはんの時間が少しでも遅れると、決まった場所で待ち始める。鳴くタイミングまで毎日ほぼ同じで、時計を見ているみたいに正確。", quote: `時間にゃ。
もう分かってるにゃ。` },
    { text: "トイレや寝床の位置が変わるとすぐ気づく。いつもの位置に戻るまで落ち着かず、変わったものにはなかなか近づかない。", quote: `違うにゃ。
元に戻すにゃ。` },
    { text: "部屋を移動するルートがいつも同じ。椅子の横を通って棚の前で止まって、そのあと窓際に行く流れまで毎回ほとんど変わらない。", quote: `ここ通るにゃ。
決まってるにゃ。` },
    { text: "新しい物が置かれるとすぐには触らない。遠くから見て、安全そうだと分かってからやっと近づいて匂いを確認する。", quote: `まだ早いにゃ。
確認するにゃ。` },
  ],
  "戦略きれものねこ": [
    { text: "高い場所に登る時、無駄な試行をほとんどしない。一度だけ周りを見て、踏み台にする場所を決めたらそのまま最短で成功する。", quote: `そこ行けるにゃ。
もう見えたにゃ。` },
    { text: "ドアや引き出しの仕組みを観察している。人が開けるのを何度か見たあと、自分でも前足で同じ場所を触り始める。", quote: `こうするにゃ。
分かったにゃ。` },
    { text: "おもちゃをすぐには追わない。まず相手の動きや落ちる場所を見て、狙いを定めてから一番いいタイミングで飛びつく。", quote: `まだ行かないにゃ。
今にするにゃ。` },
    { text: "他の猫が騒いでいても、少し離れた場所から様子を見ている。危なくないか確認してから、自分に必要な時だけ動く。", quote: `先に見るにゃ。
それから行くにゃ。` },
  ],
  "無口クラフトねこ": [
    { text: "段ボールや袋を見ると、とりあえず中に入る。ただ入るだけじゃなく、中で向きを変えたり前足で押したりして、自分の落ち着く形に整えている。", quote: `これ使うにゃ。
ちょうどいいにゃ。` },
    { text: "ヒモや細いおもちゃだけやたら得意。他のおもちゃには見向きもしないのに、それだけは何回投げても正確に仕留める。", quote: `それ貸すにゃ。
やってみるにゃ。` },
    { text: "壊れたおもちゃも捨てずに遊ぶ。取れた部品や紐の端だけで、元より面白そうな遊び方を見つけている。", quote: `まだいけるにゃ。
直して使うにゃ。` },
    { text: "静かだと思ったら、家具のすき間や見慣れない場所を前足でずっと触っている。何があるか、どう動くかを確かめている感じがある。", quote: `ちょっと触るにゃ。
分かるまでやるにゃ。` },
  ],
  "ふわアートねこ": [
    { text: "カーテン越しの光や床の反射をじっと見ている。何もないのに、急に前足を出して追いかけ始めて、満足すると静かに座り直す。", quote: `これきれいにゃ。
ちょっと追うにゃ。` },
    { text: "寝る場所を見た目じゃなく触り心地で選ぶ。ふわふわの毛布、やわらかい服、少しあたたかいクッションにだけ長くいる。", quote: `ここいいにゃ。
落ち着くにゃ。` },
    { text: "急に走り出したと思ったら、次の瞬間には窓辺で止まっている。予定がある感じじゃなく、その時の気分で全部決めている動き。", quote: `いま行くにゃ。
もういいにゃ。` },
    { text: "小さな音への反応が早い。袋の音や引き出しの音にすぐ耳が向いて、少しだけ近づいて様子を見る。", quote: `いまの何にゃ？
気になるにゃ。` },
  ],
  "ゆめふわロマンねこ": [
    { text: "何もない壁や空中をじっと見ている。呼んでもすぐには反応しないのに、二回目でゆっくり振り向いてくる。自分の世界に入っている時間が長い。", quote: `いま見てたにゃ。
あとで行くにゃ。` },
    { text: "お気に入りの場所に入ると長時間ほとんど動かない。丸くなっているわけでもなく、ぼんやり起きたまま静かに過ごしている。", quote: `ここがいいにゃ。
そのままでいいにゃ。` },
    { text: "甘えてくる時は急に距離が近い。でも満足すると、こちらが追う前にすっと離れていく。近づき方も離れ方も独特。", quote: `ちょっと行くにゃ。
やっぱ戻るにゃ。` },
    { text: "他の猫や人と完全には離れないけど、ぴったりもくっつかない。少し離れたところで同じ空間にいたがる。", quote: `そこにいるにゃ。
ここでいいにゃ。` },
  ],
  "ひらめき遊びねこ": [
    { text: "普通のおもちゃでも、みんなと違う遊び方を始める。転がすより止めたり、追うよりひっくり返したりして仕組みを見ている感じがある。", quote: `これ違うにゃ。
こうするにゃ。` },
    { text: "同じ動きを何回も繰り返す。前足で押す、止まる、また押すを延々と続けていて、本人だけずっと真剣。", quote: `もう一回にゃ。
試すにゃ。` },
    { text: "他の猫が興味を示さない物にだけ反応する。コードの影、箱の角、転がらない部品みたいな微妙なものに夢中になる。", quote: `これ面白いにゃ。
続けるにゃ。` },
    { text: "おもちゃを壊して中身を見たがる。遊ぶより、どうできているか確かめているような動きになる。", quote: `中見るにゃ。
知りたいにゃ。` },
  ],
  "突撃アクティブねこ": [
    { text: "閉まりかけたドアを見ると、そのまま突っ込んでいく。間に合うか考える前に動いていて、止めても勢いが勝つ。", quote: `いけるにゃ！
そのまま行くにゃ！` },
    { text: "高い場所からのジャンプにためらいがない。下をちょっと見たらすぐ飛んで、着地してから何事もなかった顔をしている。", quote: `飛ぶにゃ！
あとで考えるにゃ！` },
    { text: "危なそうな場所ほど先に行く。棚のすき間、ドアの向こう、知らない部屋に一番最初に入るのはだいたいこのタイプ。", quote: `先行くにゃ！
大丈夫にゃ！` },
    { text: "急にスイッチが入って部屋を全力で走り回る。一直線に一周して、満足したら急に止まって毛づくろいを始める。", quote: `いまにゃ！
止まらないにゃ！` },
  ],
  "きらきらパーティーねこ": [
    { text: "人が集まっている場所に必ず入ってくる。気づいたら一番触られやすい真ん中の位置を取っていて、そのまま場の中心にいる。", quote: `こっち楽しいにゃ！
混ざるにゃ！` },
    { text: "笑い声やにぎやかな音がすると、別の部屋からでもすぐ来る。何が起きているか分からなくても、その空気だけで参加しにくる。", quote: `なんかあるにゃ！
行くにゃ！` },
    { text: "誰かが遊んでいると、そのすぐ近くに座る。自分も完全に参加しているつもりで、ずっと楽しそうに見ている。", quote: `それやるにゃ！
一緒にいるにゃ！` },
    { text: "静かな場所に長くいない。音や動きのある方へ自然に流れていって、気づいたらまた人のいる場所に戻っている。", quote: `いまにゃ！
そっち行くにゃ！` },
  ],
  "わくわく自由ねこ": [
    { text: "新しいおもちゃや箱を見ると真っ先に飛びつく。少し遊んだだけで満足して、次の瞬間には別の物に興味が移っている。", quote: `それいいにゃ！
次いくにゃ！` },
    { text: "人が移動するとすぐ後をついていく。でも途中で別の音や物に気を取られて、目的地まで行かずに寄り道する。", quote: `そっち行くにゃ！
やっぱこっちにゃ！` },
    { text: "遊び始めると一気にテンションが上がる。全力で楽しんでいたのに、数分後には急に落ち着いて別の場所で座っている。", quote: `楽しいにゃ！
もういいにゃ！` },
    { text: "同時にいろんなものが気になる。箱にも行くし、ヒモも見るし、人にも絡むしで、一つに集中するより全部触りたい動きになる。", quote: `これもにゃ！
あれもにゃ！` },
  ],
  "いたずら天才ねこ": [
    { text: "テーブルの端にある物を、わざと少しずつ前足で押す。一回落として終わりじゃなく、こちらの反応を見てもう一回やる。", quote: `どうなるにゃ？
もう一回やるにゃ。` },
    { text: "入っちゃダメな場所ほど行きたがる。見られているタイミングを選んでわざと乗るあたり、かなり確信犯っぽい。", quote: `それダメにゃ？
試すにゃ。` },
    { text: "他の猫や人にちょっかいを出して反応を見る。逃げたら追いかけるし、反応が大きいほど楽しそうになる。", quote: `いま行くにゃ。
遊ぶにゃ。` },
    { text: "普通のおもちゃを独自ルールで使い始める。本来の遊び方より、自分で新しい遊び方を作る方が面白いタイプ。", quote: `これ違うにゃ。
こうするにゃ。` },
  ],
  "しきり屋リーダーねこ": [
    { text: "他の猫が落ち着かない動きをしていると、近くまで行って止めに入る。自分のペースに周りを合わせようとする感じが強い。", quote: `順番にゃ。
こっち来るにゃ。` },
    { text: "寝る場所や座る場所を先に決めてしまう。あとから来た相手がいても譲らず、その場のルールを自分で作っている。", quote: `ここ使うにゃ。
決めるにゃ。` },
    { text: "騒がしいとすぐ様子を見に行く。ただ混ざるというより、何が起きてるか確認して収めに入る動きになる。", quote: `それやめるにゃ。
落ち着くにゃ。` },
    { text: "人の動線や部屋の流れをよく見ていて、邪魔な物や乱れた空気があるとそこに自分から入って整えにいく。", quote: `これで行くにゃ。
まとめるにゃ。` },
  ],
  "みんな大好きねこ": [
    { text: "来客があると一番最初に玄関の近くまで見に行く。少し様子を見たあと、平気な相手だと分かるとそのまま距離を詰めていく。", quote: `そっちいくにゃ。
そこ座るにゃ。` },
    { text: "部屋にいる人全員に順番に甘える。一人のところに少し寄って、また別の人のところに行って、全員にちゃんと絡む。", quote: `こっちもにゃ。
そっちも行くにゃ。` },
    { text: "優しそうな人を見つけるのが早い。その人の近くを行ったり来たりして、触ってもらえるまで自然に距離を詰めていく。", quote: `そこいいにゃ。
ちょっと寄るにゃ。` },
    { text: "誰かが帰ろうとすると後ろをついていく。ドアの前まで見送りに来て、まだ行くの？みたいな顔で立ち止まる。", quote: `まだ行くにゃ。
ついてくにゃ。` },
  ],
  "導きカリスマねこ": [
    { text: "元気がなさそうな人がいると、その人の近くにだけ座る。他の人には行かないのに、その時だけはピンポイントで寄り添う。", quote: `ここにいるにゃ。
大丈夫にゃ。` },
    { text: "にぎやかな空気の中でも、場の変化にすぐ気づく。誰かが静かになったり空気が落ちた瞬間に、自然とその方向へ動いていく。", quote: `いま行くにゃ。
見てるにゃ。` },
    { text: "複数人いると、順番に顔を見て回る。誰が何してるか全部分かっているみたいな動きで、その場全体を把握している感じがある。", quote: `そっちもにゃ。
ちゃんと見るにゃ。` },
    { text: "誰かが移動すると後ろからついていく。でも前に出るわけじゃなく、少し後ろを歩いて見守るような距離感を取る。", quote: `ついてくにゃ。
そのままでいいにゃ。` },
  ],
  "覇王ボスねこ": [
    { text: "人が座っていたクッションや椅子を、当然みたいな顔で取りにいく。少しどかされてもまた戻ってきて、最終的にその場所を自分のものにする。", quote: `そこ使うにゃ。
もう決まってるにゃ。` },
    { text: "部屋の中で一番高い場所や見渡せる場所を選ぶ。そこに座るとしばらく動かず、全体を見ている感じになる。", quote: `ここが上にゃ。
ここにいるにゃ。` },
    { text: "歩き出すと他の猫や人が自然に道をあける。急いでいなくても、自分が通る前提でまっすぐ進んでくる。", quote: `通るにゃ。
あけるにゃ。` },
    { text: "人が集まると、その中央か一番目立つ位置を取る。誰より先にいい場所を押さえて、最後までそこを譲らない。", quote: `ここにするにゃ。
動かないにゃ。` },
  ],
};

const cardCopyMap: Record<CatType, string[]> = {
  "しずか哲学ねこ": [
    `夜だけ急に
動き出すやつ`,
    `何もないとこ
ずっと見てるやつ`,
    `静かになったら
近くに来るやつ`,
    `いつもの隅っこ
ちゃんとキープするやつ`,
  ],
  "よりそい守りねこ": [
    `気づいたら
そばにいるやつ`,
    `元気ない人にだけ
寄ってくるやつ`,
    `足元のベスト位置
分かってるやつ`,
    `怒られても
同じ部屋にいるやつ`,
  ],
  "規律番ねこ": [
    `ごはんの時間
一番正確なやつ`,
    `配置変わると
すぐ気づくやつ`,
    `通るルート
毎回だいたい同じやつ`,
    `新しいものは
まず確認するやつ`,
  ],
  "戦略きれものねこ": [
    `一回見たら
最短で決めるやつ`,
    `人のやり方
見て覚えてるやつ`,
    `今じゃないって
待てるやつ`,
    `先に様子見てから
必要な時だけ動くやつ`,
  ],
  "無口クラフトねこ": [
    `箱に入ったあと
中を整えるやつ`,
    `ヒモだけ急に
職人になるやつ`,
    `壊れたおもちゃも
使いこなすやつ`,
    `すき間ずっと
触ってるやつ`,
  ],
  "ふわアートねこ": [
    `光とか影とか
急に追いかけるやつ`,
    `触り心地で
寝床決めるやつ`,
    `急に走って
急に止まるやつ`,
    `小さい音だけ
ちゃんと聞いてるやつ`,
  ],
  "ゆめふわロマンねこ": [
    `何もないとこ
見つめてるやつ`,
    `お気に入りの場所で
ずっとぼんやりしてるやつ`,
    `甘えに来たのに
急に戻るやつ`,
    `近すぎず遠すぎず
同じ空間にいるやつ`,
  ],
  "ひらめき遊びねこ": [
    `普通のおもちゃを
違う遊び方するやつ`,
    `同じ動き
延々試してるやつ`,
    `誰も見ないものに
夢中なやつ`,
    `おもちゃ壊して
中見たいだけのやつ`,
  ],
  "突撃アクティブねこ": [
    `閉まりかけでも
そのまま行くやつ`,
    `飛んでから考える
タイプのやつ`,
    `危なそうな場所ほど
先に行くやつ`,
    `急に部屋中
走り出すやつ`,
  ],
  "きらきらパーティーねこ": [
    `人が集まるとこ
絶対行くやつ`,
    `にぎやかな音で
すぐ来るやつ`,
    `楽しそうだと
すぐ混ざるやつ`,
    `静かな場所より
人のいる方行くやつ`,
  ],
  "わくわく自由ねこ": [
    `飛びついて
すぐ次行くやつ`,
    `ついてきたのに
途中で寄り道するやつ`,
    `全力で遊んで
急に終わるやつ`,
    `全部気になって
全部触りたいやつ`,
  ],
  "いたずら天才ねこ": [
    `落とす前に
こっち見てくるやつ`,
    `ダメな場所ほど
乗りたがるやつ`,
    `反応見たくて
ちょっかい出すやつ`,
    `遊び方を
勝手に発明するやつ`,
  ],
  "しきり屋リーダーねこ": [
    `落ち着いてないと
止めに入るやつ`,
    `場所のルール
先に決めるやつ`,
    `騒がしいと
確認しに来るやつ`,
    `乱れてる空気
整えに行くやつ`,
  ],
  "みんな大好きねこ": [
    `来客あると
最初に見に行くやつ`,
    `全員に順番に
甘えるやつ`,
    `優しそうな人
見つけるの早いやつ`,
    `帰る人の後ろ
ついていくやつ`,
  ],
  "導きカリスマねこ": [
    `元気ない人にだけ
寄りそうやつ`,
    `空気変わると
すぐ気づくやつ`,
    `その場の全員
ちゃんと見てるやつ`,
    `ちょい後ろから
ついてくるやつ`,
  ],
  "覇王ボスねこ": [
    `そこ使うって顔で
取りにくるやつ`,
    `一番上から
見渡してるやつ`,
    `道あける前提で
まっすぐ来るやつ`,
    `気づいたら
一番いい場所取ってるやつ`,
  ],
};

function getCardCopy(type: CatType, aruaru: AruaruSet | null) {
  if (!aruaru) return `${type}タイプ`;
  const aruaruIndex = aruaruMap[type].findIndex((item) => item.text === aruaru.text);
  if (aruaruIndex >= 0) {
    return cardCopyMap[type][aruaruIndex] ?? `${type}タイプ`;
  }
  return cardCopyMap[type][0] ?? `${type}タイプ`;
}

function getRandomAruaru(type: CatType) {
  const list = aruaruMap[type];
  return list[Math.floor(Math.random() * list.length)];
}

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
    features: ['ごはんや寝る時間のズレに敏感', 'いつもの流れがいちばん落ち着く', '自分の場所と順番を守る', '変化より安定が好き'],
    patterns: ['毎日ほぼ同じ時間に動く', 'お気に入りの場所に戻る', '見慣れない変化はまず観察', '決まったルートで見回る'],
  },
  "よりそい守りねこ": {
    emoji: "🤍",
    description: "やさしく寄り添いながら相手を見守る。空気を乱さず、安心感で場を包む癒やし役タイプ。",
    features: ['そっと近くにいてくれる', '空気を乱さず寄り添う', 'やさしい距離感を保つ', '安心感をつくる存在'],
    patterns: ['静かに隣に座る', '困っていると近くに来る', '騒がしいと少し距離をとる', '信頼すると長くそばにいる'],
  },
  "しずか哲学ねこ": {
    emoji: "🌙",
    description: "静かに深く考え、表には出しすぎない。でも内面には強い世界観を持つ哲学者タイプ。",
    features: ['じっと観察して考える', '簡単には動かない', '内側に強い世界を持つ', '静かな存在感'],
    patterns: ['高い場所から全体を見る', '動く前に長く考える', '人の様子をよく見ている', '気づくと核心をついている'],
  },
  "戦略きれものねこ": {
    emoji: "🧠",
    description: "先を読んで動く設計者。感情より構造を見て、最適な流れを静かに組み立てるタイプ。",
    features: ['無駄のない動き', '効率よく目的を達成する', '感情より最適解', '冷静で計画的'],
    patterns: ['最短ルートで移動する', '必要な時だけ動く', '状況を見て位置を変える', '狙った場所を確実に取る'],
  },
  "無口クラフトねこ": {
    emoji: "🛠️",
    description: "多くを語らず、必要な時だけ動く。手を動かしながら答えを見つける職人気質タイプ。",
    features: ['静かに手を動かす', '実際に触って理解する', '余計なことはしない', '職人タイプ'],
    patterns: ['物を前足で確かめる', '気づくと何か作業している', '必要な分だけ動く', '終わるとすっと離れる'],
  },
  "ふわアートねこ": {
    emoji: "🎨",
    description: "感性のままに世界を受け取る。やわらかく穏やかな空気で、自分らしさを大切にするタイプ。",
    features: ['感覚を大事にする', '心地よさに敏感', 'やわらかい雰囲気', '自分の世界を持つ'],
    patterns: ['日なたを見つけてくつろぐ', '気分で場所を変える', '好きな人にはそっと近づく', 'イヤな空気は静かに避ける'],
  },
  "ゆめふわロマンねこ": {
    emoji: "✨",
    description: "現実よりも心の中の世界を大切にする。理想やときめきにまっすぐなロマン派タイプ。",
    features: ['やさしくて繊細', '理想や雰囲気を大切にする', '内面の世界が豊か', '感情で動く'],
    patterns: ['ぼーっと遠くを見る', '気分で甘えに来る', '好きなものに深くハマる', '静かな時間を好む'],
  },
  "ひらめき遊びねこ": {
    emoji: "💡",
    description: "考えること自体が遊び。ひらめきと仕組みが大好きな、知的いたずら好きタイプ。",
    features: ['考えることが楽しい', '仕組みに興味がある', '一人遊びが得意', '知的好奇心が強い'],
    patterns: ['動くものをじっと観察', '仕組みを理解しようとする', '一人で遊び続ける', '納得すると満足して離れる'],
  },
  "突撃アクティブねこ": {
    emoji: "⚡",
    description: "迷う前に飛び込む、瞬発力の冒険家。体感で世界をつかみにいくタイプ。",
    features: ['迷う前に動く', 'スピード重視', '体で覚えるタイプ', '刺激が好き'],
    patterns: ['見つけたらすぐ飛びつく', '高いところにも一気にジャンプ', 'その場で判断して動く', '失敗してもすぐ次へ'],
  },
  "きらきらパーティーねこ": {
    emoji: "🎉",
    description: "場の空気を明るくする人気者。楽しさを見つけるのが上手で、人を笑顔にするタイプ。",
    features: ['場を明るくする', '人と一緒が好き', '楽しいこと最優先', '感情豊か'],
    patterns: ['人の輪の中心にいる', '遊びにすぐ参加する', 'リアクションが大きい', '楽しそうな方へ移動する'],
  },
  "わくわく自由ねこ": {
    emoji: "🌈",
    description: "好奇心いっぱいで、自由に世界を広げる。ワクワクを原動力に動くタイプ。",
    features: ['好奇心が止まらない', '自由に動き回る', '新しいものが好き', '束縛が苦手'],
    patterns: ['新しい場所を探検する', '気になるものを全部試す', 'すぐ別の興味に移る', '自由に行動範囲を広げる'],
  },
  "いたずら天才ねこ": {
    emoji: "🃏",
    description: "発想でひっくり返すトリックスター。頭の回転が速く、遊びながら場を変えていくタイプ。",
    features: ['思いついたらすぐ試す', '遊びながら変化を起こす', 'ルールに縛られない', '発想がユニーク'],
    patterns: ['引き出しは必ず開ける', '「これ触ったらどうなる？」で動く', 'すぐ次の遊びに移る', '気づくと周りを巻き込んでいる'],
  },
  "しきり屋リーダーねこ": {
    emoji: "📣",
    description: "しっかり仕切って全体を動かす現場統率者。頼られると強い、実務派リーダータイプ。",
    features: ['全体を仕切るのが得意', 'ルールを回す', '責任感が強い', '実行力がある'],
    patterns: ['他の猫の動きを気にする', '場の流れを整える', '自分から動き出す', '決めたことはやりきる'],
  },
  "みんな大好きねこ": {
    emoji: "💗",
    description: "愛され上手で空気をあたためる。まわりを気づかいながら関係を育てるタイプ。",
    features: ['人との関係を大切にする', '面倒見がいい', '空気をあたためる', '安心感がある'],
    patterns: ['人の近くに集まる', '撫でられると嬉しそう', '周りの様子をよく見る', 'みんなと一緒に行動する'],
  },
  "導きカリスマねこ": {
    emoji: "🌟",
    description: "人を導くやさしい影響力。周囲の気持ちを動かしながら、前へ進めるカリスマタイプ。",
    features: ['自然と人を引っ張る', '影響力がある', '理想を共有する', '情熱的'],
    patterns: ['先に動いて周りを導く', '他の猫を引き寄せる', '空気を前向きに変える', '目的に向かって進む'],
  },
  "覇王ボスねこ": {
    emoji: "👑",
    description: "堂々と采配し、全体を前へ進める王者。圧倒的な存在感で空間を支配するタイプ。",
    features: ['圧倒的な存在感', '迷わず決める', '主導権を握る', '結果を出す'],
    patterns: ['一番いい場所を取る', '他の猫が道をあける', '迷わず動く', '全体を支配するように振る舞う'],
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

function getResultImagePath(mbti: string, gender: GenderOption, coat: CoatOption) {
  if (!gender || !coat) return "/images/silhouette.png";
  return `/images/cats/${mbti}_${gender}_${coat}.png`;
}

function getResultTypeTitleClass(type: CatType) {
  const length = type.length;

  if (length >= 10) {
    return "text-[24px] sm:text-[34px]";
  }

  if (length >= 8) {
    return "text-[28px] sm:text-[38px]";
  }

  return "text-[28px] sm:text-[42px]";
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(() => buildQuestionSet());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(QuestionOption | null)[]>(() =>
    Array(16).fill(null)
  );
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAruaru, setSelectedAruaru] = useState<AruaruSet | null>(null);
  const [selectedGender, setSelectedGender] = useState<GenderOption>("");
  const [selectedCoat, setSelectedCoat] = useState<CoatOption>("");
  const [resultImageSrc, setResultImageSrc] = useState("/images/silhouette.png");
  const [typeShares, setTypeShares] = useState<Record<string, number>>({});
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = useState(false);
  const [isOpeningSharePreview, setIsOpeningSharePreview] = useState(false);
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [isPreparingShareImage, setIsPreparingShareImage] = useState(false);
  const [isNativeSharing, setIsNativeSharing] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);
  const [shareImageError, setShareImageError] = useState<string | null>(null);
  const pageViewTrackedRef = useRef(false);
  const transitionLockRef = useRef(false);
  const stepTimerRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const justWentBackRef = useRef(false);

  const trackEvent = async (
    eventName: string,
    extra: Partial<{
      result_type: string;
      mbti: string;
      gender: string;
      coat: string;
    }> = {},
  ) => {
    const meta = getTrackingMeta();

    const { error } = await supabase.from("events").insert({
      event_name: eventName,
      session_id: meta.session_id,
      visitor_id: meta.visitor_id,
      page_path: meta.page_path,
      page_url: meta.page_url,
      referrer: meta.referrer,
      utm_source: meta.utm_source,
      utm_medium: meta.utm_medium,
      utm_campaign: meta.utm_campaign,
      user_agent: meta.user_agent,
      timezone: meta.timezone,
      result_type: extra.result_type ?? null,
      mbti: extra.mbti ?? null,
      gender: extra.gender ?? null,
      coat: extra.coat ?? null,
    });

    if (error) {
      console.error(`event track failed: ${eventName}`, error);
    }
  };

  const loadingMessages = useMemo(
    () => ["猫らしさを分析中...", "行動パターンを整理中...", "タイプを判定しています..."],
    []
  );

  useEffect(() => {
    if (isOpen || isTypeListOpen || isAboutOpen || isPrivacyOpen || isSharePreviewOpen || isOpeningSharePreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isTypeListOpen, isAboutOpen, isPrivacyOpen, isSharePreviewOpen, isOpeningSharePreview]);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
      if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (shareImageUrl) {
        URL.revokeObjectURL(shareImageUrl);
      }
    };
  }, [shareImageUrl]);

  useEffect(() => {
    if (pageViewTrackedRef.current) return;

    pageViewTrackedRef.current = true;
    void trackEvent("page_view");
  }, []);

  const totalQuestions = currentQuestions.length;
  const totalSteps = totalQuestions + 1;
  const answeredCount = answers.filter(Boolean).length;
  const isAppearanceStep = step === totalQuestions;

  const result = useMemo(() => {
    if (answeredCount !== totalQuestions) return null;

    const scores = { ...initialScores };

    answers.forEach((answer) => {
      if (!answer) return;
      scores[answer.axis] += answer.weight;
    });

    const mbtiResult = getMbtiType(scores, currentQuestions, answers);
    const mainType = catTypeMap[mbtiResult.mbti];
    const decisiveQuestionId = getDecisiveQuestionId(mbtiResult.mbti, currentQuestions, answers);

    return {
      scores,
      mbti: mbtiResult.mbti,
      mainType,
      closeSegments: mbtiResult.closeSegments,
      tiedSegments: mbtiResult.tiedSegments,
      decisiveQuestionId,
    };
  }, [answers, answeredCount, currentQuestions, totalQuestions]);

  const cardCopy = useMemo(() => {
    if (!result) return "";
    return getCardCopy(result.mainType, selectedAruaru);
  }, [result, selectedAruaru]);

  useEffect(() => {
    if (!showResult || !result) return;

    const list = aruaruMap[result.mainType];
    const baseIndex = result.decisiveQuestionId ? (result.decisiveQuestionId - 1) % list.length : 0;
    setSelectedAruaru(list[baseIndex] ?? list[0]);
  }, [showResult, result]);

  useEffect(() => {
    if (!result) return;

    setResultImageSrc(getResultImagePath(result.mbti, selectedGender, selectedCoat));
  }, [result, selectedGender, selectedCoat]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectMobile = () => {
      const ua = navigator.userAgent || "";
      const mobileByUa = /iPhone|Android.+Mobile|iPod|Windows Phone|webOS|BlackBerry/i.test(ua);
      const mobileByViewport = window.innerWidth <= 768 && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
      setIsMobileClient(mobileByUa || mobileByViewport);
    };

    detectMobile();
    window.addEventListener("resize", detectMobile);
    return () => window.removeEventListener("resize", detectMobile);
  }, []);

  const openDiagnosis = () => {
    void trackEvent("diagnosis_started");
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
    setSelectedAruaru(null);
    setSelectedGender("");
    setSelectedCoat("");
    setResultImageSrc("/images/silhouette.png");
  };

  const closeDiagnosis = () => {
    setIsOpen(false);
    setSelectedLabel(null);
    setAnimating(false);
    setIsCalculating(false);
    setLoadingMessageIndex(0);
    setShowResult(false);
  };

  const fetchTypeShares = async () => {
    const { data, error } = await supabase
      .from("diagnosis_type_share")
      .select("result_type, percentage");

    if (error) {
      console.error("type share fetch failed:", error);
      return;
    }

    const next: Record<string, number> = {};

    (data ?? []).forEach((row: { result_type: string; percentage: number | string }) => {
      next[row.result_type] = Number(row.percentage);
    });

    setTypeShares(next);
  };

  const openTypeList = async () => {
    setIsTypeListOpen(true);
    await fetchTypeShares();
  };

  const closeTypeList = () => {
    setIsTypeListOpen(false);
  };

  const openAbout = () => {
    setIsAboutOpen(true);
  };

  const closeAbout = () => {
    setIsPrivacyOpen(false);
    setIsAboutOpen(false);
  };

  const openPrivacy = () => {
    setIsPrivacyOpen(true);
  };

  const closePrivacy = () => {
    setIsPrivacyOpen(false);
  };

  const handleAnswer = (option: QuestionOption) => {
    if (selectedLabel || animating || isCalculating || transitionLockRef.current) return;

    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);

    transitionLockRef.current = true;
    setSelectedLabel(option.label);
    setDirection("next");
    setAnimating(true);

    const advanceDelay = justWentBackRef.current ? 0 : 180;
    justWentBackRef.current = false;

    stepTimerRef.current = window.setTimeout(() => {
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = option;
        return next;
      });

      setSelectedLabel(null);

      if (step < totalQuestions - 1) {
        setStep((prev) => prev + 1);
      } else {
        setStep(totalQuestions);
      }

      unlockTimerRef.current = window.setTimeout(() => {
        setAnimating(false);
        transitionLockRef.current = false;
      }, 320);
    }, advanceDelay);
  };

  const handlePrev = () => {
    if (step === 0 || selectedLabel || animating || transitionLockRef.current) return;

    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);

    transitionLockRef.current = true;
    justWentBackRef.current = true;
    setSelectedLabel(null);
    setDirection("prev");
    setAnimating(true);

    setAnswers((prev) => {
      const next = [...prev];
      for (let i = step - 1; i < next.length; i += 1) {
        next[i] = null;
      }
      return next;
    });

    setStep((prev) => prev - 1);

    unlockTimerRef.current = window.setTimeout(() => {
      setAnimating(false);
      transitionLockRef.current = false;
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
    setSelectedAruaru(null);
    setSelectedGender("");
    setSelectedCoat("");
    setResultImageSrc("/images/silhouette.png");
  };

  const saveDiagnosisResult = async () => {
    if (!result || !selectedGender || !selectedCoat || isSavingResult) return;

    try {
      setIsSavingResult(true);

      const meta = getTrackingMeta();

      const { error } = await supabase.from("diagnosis_results").insert({
        result_type: result.mainType,
        mbti: result.mbti,
        gender: selectedGender,
        coat: selectedCoat,
        session_id: meta.session_id,
        visitor_id: meta.visitor_id,
        page_path: meta.page_path,
        referrer: meta.referrer,
        utm_source: meta.utm_source,
        utm_medium: meta.utm_medium,
        utm_campaign: meta.utm_campaign,
        user_agent: meta.user_agent,
        timezone: meta.timezone,
      });

      if (error) {
        console.error("result save failed:", error);
        return;
      }

      await trackEvent("diagnosis_completed", {
        result_type: result.mainType,
        mbti: result.mbti,
        gender: selectedGender,
        coat: selectedCoat,
      });

      await fetchTypeShares();
    } finally {
      setIsSavingResult(false);
    }
  };

  const handleAppearanceNext = () => {
    if (animating || isCalculating || isSavingResult) return;

    setIsCalculating(true);
    setLoadingMessageIndex(0);

    window.setTimeout(() => {
      setLoadingMessageIndex(1);
    }, 700);

    window.setTimeout(() => {
      setLoadingMessageIndex(2);
    }, 1400);

    window.setTimeout(async () => {
      await saveDiagnosisResult();
      setIsCalculating(false);
      setShowResult(true);
    }, 2200);
  };

const getShareText = () =>
  result
    ? `うちの猫のタイプは「${result.mainType}」でした🐱
診断してみてね
${getShareUrl()}`
    : `うちの猫のタイプ診断をやってみた🐱
${getShareUrl()}`;

  const getShareUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ) => {
    const paragraphs = text.split("\n");
    const lines: string[] = [];

    paragraphs.forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }

      let current = "";
      for (const ch of paragraph) {
        const next = current + ch;
        if (ctx.measureText(next).width <= maxWidth || current.length === 0) {
          current = next;
        } else {
          lines.push(current);
          current = ch;
        }
      }
      if (current) lines.push(current);
    });

    return lines;
  };

  const loadImageForCanvas = async (src: string) => {
    const img = new Image();
    img.decoding = "sync";
    img.loading = "eager";
    img.src = `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}`;

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.onload = done;
      img.onerror = done;
    });

    if ("decode" in img) {
      try {
        await img.decode();
      } catch {}
    }

    return img;
  };

  const generateShareImage = async () => {
    if (!result) return null;

    try {
      setIsPreparingShareImage(true);
      setShareImageError(null);

      if (typeof document !== "undefined" && "fonts" in document) {
        try {
          await document.fonts.ready;
          try {
            await document.fonts.load("200 88px 'Kiwami'");
          } catch {}
        } catch {}
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // title
      ctx.fillStyle = "#8a6a57";
      ctx.font = "700 48px 'Noto Sans JP', sans-serif";
      ctx.fillText("うちの子は…", width / 2, 54);

      // copy
      ctx.fillStyle = "#2b2b2b";
      ctx.font = "200 88px 'Kiwami'";
      const copyLines = wrapCanvasText(ctx, cardCopy, 880).slice(0, 3);
      let copyY = 140;
      copyLines.forEach((line) => {
        ctx.font = "200 88px 'Kiwami'";
        ctx.fillText(line, width / 2, copyY);
        copyY += 102;
      });

      // image
      const img = await loadImageForCanvas(resultImageSrc);
      const imgBox = Math.round(width * 0.72);
      const imgY = copyY + 8;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const scale = Math.min(imgBox / img.naturalWidth, imgBox / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        ctx.drawImage(img, width / 2 - drawW / 2, imgY + (imgBox - drawH) / 2, drawW, drawH);
      }

      // type name
      ctx.fillStyle = "#000000";
      ctx.font = "200 76px 'Kiwami'";
      ctx.fillText(result.mainType, width / 2, imgY + imgBox + 18);

      // type label
      ctx.fillStyle = "#4b4b4b";
      ctx.font = "700 28px 'Noto Sans JP', sans-serif";
      ctx.fillText("タイプ", width / 2, imgY + imgBox + 100);

      // copyright / brand (footer)
      ctx.fillStyle = "#9a7d69";
      ctx.font = "700 36px 'Noto Sans JP', sans-serif";
      ctx.fillText("©ねこびーてぃあい", width / 2, height - 70);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((value) => resolve(value), "image/png");
      });
      if (!blob) return null;

      const file = new File([blob], "nekobti-result.png", { type: "image/png" });
      const objectUrl = URL.createObjectURL(blob);
      return { file, objectUrl };
    } catch (error) {
      console.error(error);
      setShareImageError("共有画像の生成に失敗しました");
      return null;
    } finally {
      setIsPreparingShareImage(false);
    }
  };

  const openSharePreview = async () => {
    if (!isMobileClient || isPreparingShareImage || isNativeSharing || isOpeningSharePreview || !result) return;

    setIsOpeningSharePreview(true);
    setShareImageError(null);
    setIsSharePreviewOpen(false);

    setShareImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setShareImageFile(null);

    try {
      const generated = await generateShareImage();
      if (!generated) return;

      setShareImageUrl(generated.objectUrl);
      setShareImageFile(generated.file);
      setIsSharePreviewOpen(true);
    } finally {
      setIsOpeningSharePreview(false);
    }
  };

  const closeSharePreview = () => {
    if (isPreparingShareImage || isNativeSharing || isOpeningSharePreview) return;
    setIsSharePreviewOpen(false);
  };

  const handleNativeShare = async () => {
    if (isPreparingShareImage || isNativeSharing || isOpeningSharePreview) return;

    const shareText = getShareText();
    const shareUrl = getShareUrl();
    const file = shareImageFile;

    if (!file) {
      alert("共有画像を準備中です。少し待ってからもう一度押してください。");
      return;
    }

    try {
      setIsNativeSharing(true);

      if (typeof navigator !== "undefined" && "share" in navigator) {
        const nav = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
          share: (data?: ShareData) => Promise<void>;
          clipboard?: { writeText: (value: string) => Promise<void> };
        };

        if (nav.canShare?.({ files: [file] })) {
          await nav.share({
            files: [file],
            text: shareText,
          });

          await trackEvent("share_clicked", {
            result_type: result?.mainType,
            mbti: result?.mbti,
            gender: selectedGender || undefined,
            coat: selectedCoat || undefined,
          });
          return;
        }

        await nav.share({
          text: shareText,
        });

        await trackEvent("share_clicked", {
          result_type: result?.mainType,
          mbti: result?.mbti,
          gender: selectedGender || undefined,
          coat: selectedCoat || undefined,
        });
        return;
      }

      const clipboard = (navigator as Navigator & {
        clipboard?: { writeText: (value: string) => Promise<void> };
      }).clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(`${shareText}
${shareUrl}`);
        await trackEvent("share_clicked", {
          result_type: result?.mainType,
          mbti: result?.mbti,
          gender: selectedGender || undefined,
          coat: selectedCoat || undefined,
        });
        alert("共有テキストをコピーしました");
        return;
      }

      alert("この端末では共有できませんでした");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error(error);
        alert("共有に失敗しました");
      }
    } finally {
      setIsNativeSharing(false);
    }
  };


  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#2b2b2b]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
        <div className="mb-6 inline-flex w-fit items-center rounded-full border border-[#e8d8cb] bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm">
          ねこびーてぃあい　べーた
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

      <div className="border-t border-[#f0dfd3] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl justify-center">
          <button
            onClick={openAbout}
            className="text-sm font-semibold text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4 transition hover:text-[#5f4739]"
          >
            ねこびーてぃあいについて
          </button>
        </div>
      </div>

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
                  <h2 className="text-3xl font-bold">
                    {
                       step === 0
                        ? "まずは "
                        : step < totalQuestions * 0.7
                        ? "次は "
                        : "あと少し "
                    }
                    {step + 1}問目
                 </h2>
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
                    {Array.from({ length: totalSteps }).map((_, index) => (
                      <Paw key={index} active={index < answeredCount || (isAppearanceStep && index === totalQuestions)} />
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
                  {!isAppearanceStep ? (
                    <>
                      <div className="mb-6 min-h-[84px]">
                        <p className="break-words text-lg font-semibold leading-7">
                          {currentQuestions[step].text}
                        </p>
                      </div>
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
                              className={`w-full rounded-2xl border px-4 py-4 font-bold text-left break-words transition sm:px-5 ${
                                isSelected
                                  ? "scale-[0.99] border-[#c28f71] bg-[#fff0e4] shadow-sm"
                                  : "border-[#ead8ca] bg-[#fffdfb] md:hover:bg-[#fff3ea]"
                              }`}
                            >
                              <span className="block break-words leading-8">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-6 break-words text-lg font-semibold leading-9 sm:leading-8">
                        性別と毛色を選んでください
                      </p>

                      <div className="grid gap-4">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-[#7a5c48]">性別</span>
                          <select
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value as GenderOption)}
                            className="w-full rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-4 py-4 text-left text-base text-[#2b2b2b] outline-none transition focus:border-[#c28f71]"
                          >
                            <option value="">性別を選択</option>
                            <option value="male">男の子</option>
                            <option value="female">女の子</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-[#7a5c48]">毛色</span>
                          <select
                            value={selectedCoat}
                            onChange={(e) => setSelectedCoat(e.target.value as CoatOption)}
                            className="w-full rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-4 py-4 text-left text-base text-[#2b2b2b] outline-none transition focus:border-[#c28f71]"
                          >
                            <option value="">毛色を選択</option>
                            <option value="tabby">キジトラ</option>
                            <option value="blackwhite">黒白</option>
                            <option value="brown">茶トラ</option>
                            <option value="black">黒</option>
                            <option value="calico">三毛</option>
                            <option value="white">白</option>
                            <option value="gray">サバトラ</option>
                          </select>
                        </label>

                        <button
                          onClick={handleAppearanceNext}
                          disabled={!selectedGender || !selectedCoat}
                          className="mt-2 w-full rounded-2xl bg-[#2b2b2b] px-4 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          結果を見る
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={step === 0 || selectedLabel !== null || animating || transitionLockRef.current || transitionLockRef.current}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none ${
                      step === 0 || selectedLabel !== null || animating
                        ? "pointer-events-none cursor-not-allowed bg-[#f3ebe5] text-[#c0a997] shadow-none"
                        : "bg-white text-[#7a5c48] shadow-sm md:hover:bg-[#fff3ea]"
                    }`}
                                      style={{ WebkitTapHighlightColor: "transparent" }}>
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

              <div className="rounded-3xl bg-white p-5 ring-1 ring-[#f2e5dc] sm:p-6">
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

              <div className="rounded-3xl bg-white px-3 py-3 ring-1 ring-[#f2e5dc] sm:px-4 sm:py-4">
                <div className="mb-3 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] px-3 py-3 ring-1 ring-[#f3e3d8]">
                  <p className="mb-2 text-center text-sm text-[#7a5c48]">うちの子は…</p>
                  <div className="mb-3 overflow-hidden rounded-[24px] bg-white p-2 ring-1 ring-[#f1e4da]">
                    <img
                      src={resultImageSrc}
                      alt={result.mainType}
                      onError={(e) => {
                        e.currentTarget.src = "/images/silhouette.png";
                      }}
                      className="mx-auto aspect-square w-full max-w-[320px] rounded-[18px] object-cover"
                    />
                  </div>

                  <div className="mb-3 flex min-h-[52px] items-center justify-center overflow-hidden">
                    <h3
                      className={`max-w-full text-center leading-none tracking-tight text-[#2b2b2b] whitespace-normal break-keep ${getResultTypeTitleClass(result.mainType)}`}
                      style={{ fontFamily: "'Kiwami', 'Noto Sans JP', sans-serif", fontWeight: 200 }}
                    >
                      {result.mainType}
                    </h3>
                  </div>

                  <div className="mb-2 rounded-2xl bg-white/70 px-3 py-3 pb-8 ring-1 ring-[#f1e4da]">
                    <p className="mb-2 text-sm font-bold text-[#9a7d69]">特徴</p>
                    <div className="space-y-0 text-base leading-tight text-[#4e433d] sm:text-[17px]">
                      {traitsMap[result.mainType].map((trait) => (
                        <p key={trait} className="font-bold">・{trait}</p>
                      ))}
                    </div>
                  </div>

                  {selectedAruaru && (
                    <div className="mb-2 rounded-2xl bg-white/70 px-3 py-3 pb-8 ring-1 ring-[#f1e4da]">
                      <p className="mb-2 text-sm font-bold text-[#9a7d69]">あるある</p>
                      <p className="text-base font-bold leading-tight text-[#4e433d] sm:text-[17px]">{selectedAruaru.text}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="mt-8 mb-1 text-sm font-bold text-[#9a7d69]">飼いぬしとの相性</p>
                    <div className="space-y-2 text-[#5c5c5c]">
                      {ownerCompatibility[result.mainType].map((item) => (
                        <p key={item.type} className="text-[13px] font-medium leading-tight sm:text-sm">
                          {item.type}（{ownerMbtiLabelMap[item.type]}） <span className="text-[12px]">{renderHearts(item.hearts)}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <p className="mt-2 text-center text-xs text-[#9a7d69]">#ねこびーてぃあい</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={restartDiagnosis}
                    className="rounded-full bg-[#2b2b2b] px-5 py-3 text-base font-semibold text-white transition hover:opacity-90"
                  >
                    もう一度診断する
                  </button>
                  <button
                    onClick={closeDiagnosis}
                    className="rounded-full border border-[#d8c1b1] bg-white px-5 py-3 text-base font-semibold text-[#7a5c48] transition hover:bg-[#fff4ec]"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={() => {
                      void openSharePreview();
                    }}
                    disabled={!isMobileClient || isOpeningSharePreview || isPreparingShareImage}
                    className={`rounded-full px-5 py-3 text-base font-semibold transition ${
                      isMobileClient
                        ? "bg-[#f1e3d6] text-[#7a5c48] hover:opacity-90"
                        : "cursor-not-allowed border border-[#e7d8cc] bg-[#f7f1ec] text-[#b59a88]"
                    }`}
                  >
                    {!isMobileClient ? "シェア（スマホ専用）" : isOpeningSharePreview ? "共有画像を準備中…" : "シェア"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {(isOpeningSharePreview || (isSharePreviewOpen && result)) && (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center bg-black/45 p-4"
          onClick={(e) => {
            if (isPreparingShareImage || isNativeSharing || isOpeningSharePreview) return;
            if (e.target === e.currentTarget) closeSharePreview();
          }}
        >
          {isOpeningSharePreview ? (
            <div className="w-full max-w-[340px] rounded-[28px] bg-white px-6 py-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#ead8ca] border-t-[#7a5c48]" />
              <p className="text-base font-bold text-[#4e433d]">共有画像を準備中…</p>
              <p className="mt-2 text-sm leading-relaxed text-[#8a6a57]">少し待ってから共有カードを表示します</p>
            </div>
          ) : (
            <div className="w-full max-w-[380px]" onClick={(e) => e.stopPropagation()}>
              <div className="overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-[#f1e4da]">
                <div className="bg-[#fffdfb] p-3">
                  {shareImageUrl ? (
                    <img src={shareImageUrl} alt="共有カード" className="block w-full rounded-[24px]" />
                  ) : (
                    <div className="flex min-h-[520px] items-center justify-center rounded-[24px] bg-[#fffaf6] px-6 text-center text-sm text-[#8a6a57]">
                      共有画像を準備できませんでした
                    </div>
                  )}
                </div>

                <div className="border-t border-[#f1e4da] bg-white p-4">
                  {shareImageError ? (
                    <p className="mb-3 text-center text-sm font-semibold text-[#c2644f]">{shareImageError}</p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        void handleNativeShare();
                      }}
                      disabled={isPreparingShareImage || isNativeSharing || !shareImageFile}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#f4e7dc] px-3 py-4 text-[#7a5c48] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="text-2xl">↗</span>
                      <span className="text-xs font-semibold">シェア</span>
                    </button>

                    <button
                      onClick={closeSharePreview}
                      disabled={isPreparingShareImage || isNativeSharing}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#ead8ca] bg-white px-3 py-4 text-[#7a5c48] transition hover:bg-[#fff4ec] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="text-2xl">✕</span>
                      <span className="text-xs font-semibold">閉じる</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`fixed inset-0 z-40 overflow-y-auto overflow-x-hidden bg-black/25 px-4 transition-all duration-300 ${
          isAboutOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeAbout}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,640px)] max-w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
            isAboutOpen ? "scale-100 blur-0" : "scale-95 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">ABOUT</p>
              <h2 className="text-3xl font-bold">ねこびーてぃあいについて</h2>
            </div>

            <button
              onClick={closeAbout}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#f1e4da]">
            <h3 className="mb-5 text-xl font-bold text-[#2b2b2b]">運営情報</h3>

            <div className="space-y-5 text-[15px] leading-8 text-[#4e433d] sm:text-base">
              <div>
                <p className="text-sm font-bold text-[#9a7d69]">サービス名</p>
                <p>ねこびーてぃあい（NEKOBTI）</p>
              </div>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">内容</p>
                <p>猫タイプ診断コンテンツの企画・運営</p>
              </div>

<div>
  <p className="text-sm font-bold text-[#9a7d69]">運営</p>
  <div className="mt-2 flex justify-center">
    <img
      src="/images/nekobee-logo.png"
      alt="NEKOBEE logo"
      className="h-24 w-auto object-contain"
    />
  </div>
</div>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">お問い合わせ</p>
                <a
                  href="https://your-site.com/contact"
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4"
                >
                  https://your-site.com/contact
                </a>
              </div>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">プライバシーポリシー</p>
                <button
                  type="button"
                  onClick={openPrivacy}
                  className="break-all text-left text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4 transition hover:text-[#5f4739]"
                >
                  プライバシーポリシーを見る
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fff7f1] px-4 py-4 text-sm leading-7 text-[#7a5c48] ring-1 ring-[#f1e4da]">
              <p>※本サービスはエンターテインメントを目的としています。</p>
              <p className="mt-2">© NEKOBEE All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-black/35 px-4 transition-all duration-300 ${
          isPrivacyOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closePrivacy}
      >
        <div
          className={`mx-auto my-6 w-[min(92vw,640px)] max-w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto overflow-x-hidden rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-5 shadow-2xl transition-all duration-300 sm:my-8 sm:p-8 ${
            isPrivacyOpen ? "scale-100 blur-0" : "scale-95 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">PRIVACY POLICY</p>
              <h2 className="text-3xl font-bold">プライバシーポリシー</h2>
            </div>

            <button
              onClick={closePrivacy}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#f1e4da]">
            <div className="space-y-5 text-[15px] leading-8 text-[#4e433d] sm:text-base">
              <p>
                ねこびーてぃあい（以下、「本サービス」）は、診断結果の表示、サービス改善、不正利用防止、お問い合わせ対応のため、利用状況や端末情報等を取得することがあります。
              </p>

              <p>
                本サービスでは、利便性向上やアクセス解析のため、Cookie等を利用する場合があります。
              </p>

              <p>
                取得した情報は、法令に基づく場合等を除き、本人の同意なく第三者に提供しません。
              </p>

              <p>
                本サービスは、必要な範囲で外部サービスを利用することがあります。
              </p>

              <p>
                本サービスはエンターテインメントを目的として提供しており、診断結果は医学的・心理学的判断を行うものではありません。
              </p>

              <p>
                本ポリシーは、必要に応じて改定されることがあります。
              </p>

              <div>
                <p className="text-sm font-bold text-[#9a7d69]">お問い合わせ</p>
                <a
                  href="https://your-site.com/contact"
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#7a5c48] underline decoration-[#d8c1b1] underline-offset-4"
                >
                  https://your-site.com/contact
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fff7f1] px-4 py-4 text-sm leading-7 text-[#7a5c48] ring-1 ring-[#f1e4da]">
              <p>制定日：2026年4月19日</p>
              <p className="mt-2">運営：NEKOBEE</p>
            </div>
          </div>
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
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-bold">{type}</h3>
                  <div className="shrink-0 rounded-full bg-[#fff3ea] px-3 py-1 text-sm font-semibold text-[#b07d62]">
                    {typeShares[type] !== undefined ? `${typeShares[type].toFixed(1)}%` : "--.-%"}
                  </div>
                </div>

                <p className="text-sm leading-7 text-[#4e433d]">
                  {resultMeta[type].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
