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

const mbtiLabelMap: Record<string, string> = {
  ISTJ: "管理者",
  ISFJ: "擁護者",
  INFJ: "提唱者",
  INTJ: "建築家",
  ISTP: "巨匠",
  ISFP: "冒険家",
  INFP: "仲介者",
  INTP: "論理学者",
  ESTP: "起業家",
  ESFP: "エンターテイナー",
  ENFP: "運動家",
  ENTP: "討論者",
  ESTJ: "幹部",
  ESFJ: "領事",
  ENFJ: "主人公",
  ENTJ: "指揮官",
};

