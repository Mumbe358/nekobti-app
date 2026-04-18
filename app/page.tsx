"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
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
};

type Segment = "EI" | "SN" | "TF" | "JP";

type Question = {
  id: number;
  text: string;
  segment: Segment;
  options: [QuestionOption, QuestionOption];
};

type GenderOption = "" | "male" | "female";
type CoatOption = "" | "white" | "black" | "gray" | "tabby" | "calico" | "brown";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const questionPool: Record<Segment, Question[]> = {
  EI: [
    { id: 1, text: "初めて会う人が来たら？", segment: "EI", options: [{ label: "自分から近づいて様子を見る", axis: "E" }, { label: "少し離れて観察する", axis: "I" }] },
    { id: 2, text: "新しいおもちゃを見つけたら？", segment: "EI", options: [{ label: "すぐ触って試す", axis: "E" }, { label: "少し様子を見てから触る", axis: "I" }] },
    { id: 3, text: "落ち着く場所は？", segment: "EI", options: [{ label: "みんなの気配がある場所", axis: "E" }, { label: "静かで一人になれる場所", axis: "I" }] },
    { id: 4, text: "他の猫が近くにいたら？", segment: "EI", options: [{ label: "自分から関わりに行く", axis: "E" }, { label: "距離を保つ", axis: "I" }] },
  ],
  SN: [
    { id: 7, text: "遊ぶときはどっちに近い？", segment: "SN", options: [{ label: "まず動いて感覚を確かめる", axis: "S" }, { label: "作戦や流れを考えてから動く", axis: "N" }] },
    { id: 8, text: "気になる音がしたら？", segment: "SN", options: [{ label: "現場を見に行って確かめる", axis: "S" }, { label: "何の音か想像しながら様子を見る", axis: "N" }] },
    { id: 9, text: "高い場所に対しては？", segment: "SN", options: [{ label: "使えそうなら登って確かめる", axis: "S" }, { label: "上から全体を眺めたくなる", axis: "N" }] },
    { id: 10, text: "窓の外を見るときは？", segment: "SN", options: [{ label: "動いているものを目で追う", axis: "S" }, { label: "景色や空気感を味わう", axis: "N" }] },
  ],
  TF: [
    { id: 13, text: "飼い主との距離感は？", segment: "TF", options: [{ label: "よくそばにいる", axis: "F" }, { label: "気が向いたときだけ近づく", axis: "T" }] },
    { id: 14, text: "遊びに誘われたら？", segment: "TF", options: [{ label: "だいたいすぐ乗る", axis: "F" }, { label: "気分で決める", axis: "T" }] },
    { id: 15, text: "自分の場所へのこだわりは？", segment: "TF", options: [{ label: "強いほうだ", axis: "T" }, { label: "あまり気にしない", axis: "F" }] },
    { id: 16, text: "指示を受けたときは？", segment: "TF", options: [{ label: "わりと素直に従う", axis: "F" }, { label: "自分の判断を優先する", axis: "T" }] },
  ],
  JP: [
    { id: 19, text: "ごはんの時間がズレたら？", segment: "JP", options: [{ label: "そのまま待てる", axis: "P" }, { label: "ちゃんと主張する", axis: "J" }] },
    { id: 20, text: "新しい環境では？", segment: "JP", options: [{ label: "気になったらすぐ動く", axis: "P" }, { label: "様子を見てから動く", axis: "J" }] },
    { id: 21, text: "くつろぐときは？", segment: "JP", options: [{ label: "どこでもリラックスできる", axis: "P" }, { label: "決まった場所が落ち着く", axis: "J" }] },
    { id: 22, text: "眠いときは？", segment: "JP", options: [{ label: "その場で寝る", axis: "P" }, { label: "落ち着く場所に移動する", axis: "J" }] },
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

function getMbtiType(scores: Record<Axis, number>) {
  const EI = scores.E >= scores.I ? "E" : "I";
  const SN = scores.S >= scores.N ? "S" : "N";
  const TF = scores.T >= scores.F ? "T" : "F";
  const JP = scores.J >= scores.P ? "J" : "P";
  return `${EI}${SN}${TF}${JP}`;
}

function getResultImagePath(mbti: string, gender: GenderOption, coat: CoatOption) {
  if (!gender || !coat) return "/images/silhouette.png";
  return `/images/cats/${mbti}_${gender}_${coat}.png`;
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeListOpen, setIsTypeListOpen] = useState(false);
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
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [isPreparingShareImage, setIsPreparingShareImage] = useState(false);
  const [isNativeSharing, setIsNativeSharing] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);
  const [shareImageError, setShareImageError] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const transitionLockRef = useRef(false);
  const stepTimerRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const justWentBackRef = useRef(false);

  const loadingMessages = useMemo(
    () => ["猫らしさを分析中...", "行動パターンを整理中...", "タイプを判定しています..."],
    []
  );

  useEffect(() => {
    if (isOpen || isTypeListOpen || isSharePreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isTypeListOpen, isSharePreviewOpen]);

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

  const totalQuestions = currentQuestions.length;
  const totalSteps = totalQuestions + 1;
  const answeredCount = answers.filter(Boolean).length;
  const isAppearanceStep = step === totalQuestions;

  const result = useMemo(() => {
    if (answeredCount !== totalQuestions) return null;

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
  }, [answers, answeredCount, totalQuestions]);

  const cardCopy = useMemo(() => {
    if (!result) return "";
    return getCardCopy(result.mainType, selectedAruaru);
  }, [result, selectedAruaru]);

  useEffect(() => {
    if (showResult && result) {
      setSelectedAruaru(getRandomAruaru(result.mainType));
    }
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

      const ua = navigator.userAgent;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const referrer = document.referrer;

      const { error } = await supabase.from("diagnosis_results").insert({
        result_type: result.mainType,
        mbti: result.mbti,
        gender: selectedGender,
        coat: selectedCoat,
        user_agent: ua,
        timezone,
        referrer,
      });

      if (error) {
        console.error("result save failed:", error);
        return;
      }

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
      ? `うちの猫のタイプは「${result.mainType}」でした🐱\n診断してみてね`
      : "うちの猫のタイプ診断をやってみた🐱";

  const getShareUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const waitForShareCardReady = async () => {
    if (typeof document !== "undefined" && "fonts" in document) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    await new Promise((resolve) => window.setTimeout(resolve, 80));

    const root = shareCardRef.current;
    if (!root) return;

    const images = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }

            const done = () => {
              img.removeEventListener("load", done);
              img.removeEventListener("error", done);
              resolve();
            };

            img.addEventListener("load", done);
            img.addEventListener("error", done);
          }),
      ),
    );

    await new Promise((resolve) =>
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve(undefined))),
    );
  };

  const generateResultPng = async () => {
    if (!shareCardRef.current) return null;

    try {
      setIsPreparingShareImage(true);
      setShareImageError(null);
      await waitForShareCardReady();
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fffdfb",
      });
      const blob = await (await fetch(dataUrl)).blob();
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

  const openSharePreview = () => {
    if (!isMobileClient || isPreparingShareImage || isNativeSharing || !result) return;
    setShareImageError(null);
    setShareImageFile(null);
    setShareImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setIsSharePreviewOpen(true);
  };

  const closeSharePreview = () => {
    if (isPreparingShareImage || isNativeSharing) return;
    setIsSharePreviewOpen(false);
  };

  useEffect(() => {
    if (!isSharePreviewOpen || !result || shareImageFile || shareImageUrl || isPreparingShareImage) return;

    let cancelled = false;

    const prepare = async () => {
      const generated = await generateResultPng();
      if (!generated || cancelled) {
        if (generated?.objectUrl) URL.revokeObjectURL(generated.objectUrl);
        return;
      }

      setShareImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return generated.objectUrl;
      });
      setShareImageFile(generated.file);
    };

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [isSharePreviewOpen, result, shareImageFile, shareImageUrl, isPreparingShareImage]);

  const handleNativeShare = async () => {
    if (isPreparingShareImage || isNativeSharing) return;

    const shareText = getShareText();
    const shareUrl = getShareUrl();

    try {
      setIsNativeSharing(true);

      let file = shareImageFile;
      if (!file) {
        const generated = await generateResultPng();
        if (generated) {
          file = generated.file;
          setShareImageFile(generated.file);
          setShareImageUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return generated.objectUrl;
          });
        }
      }

      if (typeof navigator !== "undefined" && "share" in navigator) {
        if (
          file &&
          "canShare" in navigator &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            files: [file],
            text: shareText,
            url: shareUrl,
          });
          return;
        }

        await navigator.share({
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      const clipboard = (navigator as Navigator & {
        clipboard?: { writeText: (value: string) => Promise<void> };
      }).clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(`${shareText}
${shareUrl}`);
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
                            <option value="white">白</option>
                            <option value="black">黒</option>
                            <option value="gray">グレー</option>
                            <option value="tabby">キジトラ</option>
                            <option value="calico">三毛</option>
                            <option value="brown">茶トラ</option>
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

              <div className="rounded-3xl bg-white p-5 ring-1 ring-[#f2e5dc] sm:p-6">
                <div className="mb-6 rounded-[28px] bg-gradient-to-br from-[#fff4ec] to-[#fffdfb] p-4 ring-1 ring-[#f3e3d8]">
                  <p className="mb-3 text-center text-sm text-[#7a5c48]">うちの子は…</p>
                  <div className="mb-4 overflow-hidden rounded-[24px] bg-white p-3 ring-1 ring-[#f1e4da]">
                    <img
                      src={resultImageSrc}
                      alt={result.mainType}
                      onError={(e) => {
                        e.currentTarget.src = "/images/silhouette.png";
                      }}
                      className="mx-auto aspect-square w-full max-w-[320px] rounded-[18px] object-cover"
                    />
                  </div>
                  <h3 className="mb-5 text-center text-3xl font-bold sm:text-4xl">{result.mainType}</h3>

                  <div className="mb-2 rounded-2xl bg-white/70 p-4 ring-1 ring-[#f1e4da]">
                    <div className="space-y-0 text-sm leading-tight text-[#4e433d] sm:text-base">
                      {traitsMap[result.mainType].map((trait) => (
                        <p key={trait}>・{trait}</p>
                      ))}
                    </div>
                  </div>

                  {selectedAruaru && (
                    <>
                      <div className="mb-2 rounded-2xl bg-white/70 p-4 ring-1 ring-[#f1e4da]">
                        <p className="mb-1 text-sm font-semibold text-[#9a7d69]">あるある</p>
                        <p className="text-sm leading-tight text-[#4e433d] sm:text-base">{selectedAruaru.text}</p>
                      </div>

                      <div className="mb-2 rounded-2xl bg-white/70 p-4 text-[#4e433d] ring-1 ring-[#f1e4da]">
                        <p className="text-left text-base font-bold not-italic text-[#4e433d]">
                          🐾 {selectedAruaru.quote.replace(/\n/g, " ")}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="text-center">
                    <p className="mb-1 text-xs text-[#9a7d69]">相性BEST</p>
                    <p className="text-base font-semibold text-[#4e433d] sm:text-lg">
                      {bestMatchMap[result.mainType]} ★★★★★
                    </p>
                  </div>

                  <p className="mt-2 text-center text-xs text-[#9a7d69]">#ねこびーてぃあい</p>
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
                    onClick={openSharePreview}
                    disabled={!isMobileClient}
                    className={`rounded-full px-6 py-4 text-base font-semibold transition ${
                      isMobileClient
                        ? "bg-[#f1e3d6] text-[#7a5c48] hover:opacity-90"
                        : "cursor-not-allowed border border-[#e7d8cc] bg-[#f7f1ec] text-[#b59a88]"
                    }`}
                  >
                    {isMobileClient ? "シェア" : "シェア（スマホ専用）"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {isSharePreviewOpen && result && (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center bg-black/45 p-4"
          onClick={(e) => {
            if (isPreparingShareImage || isNativeSharing) return;
            if (e.target === e.currentTarget) closeSharePreview();
          }}
        >
          <div className="w-full max-w-[380px]">
            <div
              ref={shareCardRef}
              className={`${notoSans.className} rounded-[32px] bg-[#fffdfb] px-5 pb-6 pt-5 text-[#2b2b2b] shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 text-center text-sm font-semibold tracking-[0.08em] text-[#8a6a57]">うちの子は…</p>

              <div className="mb-4 text-center text-[#2b2b2b]">
                {cardCopy.split("\n").map((line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className={
                      index === 1
                        ? "text-[34px] font-black leading-tight tracking-[-0.04em]"
                        : "text-[24px] font-bold leading-tight tracking-[-0.03em]"
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>

              <div className="mb-4 overflow-hidden rounded-[24px] bg-white p-3 ring-1 ring-[#f1e4da]">
                <img
                  src={resultImageSrc}
                  alt={result.mainType}
                  onError={(e) => {
                    e.currentTarget.src = "/images/silhouette.png";
                  }}
                  className="mx-auto aspect-square w-full max-w-[280px] object-contain"
                />
              </div>

              <p className="text-center text-[24px] font-bold tracking-[-0.02em] text-[#7a5c48]">
                {result.mainType}タイプ
              </p>

              <p className="mt-4 text-right text-xs text-[#9a7d69]">©ねこびーてぃあい</p>
            </div>

            <div
              className="mt-4 rounded-[28px] bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-4 text-center text-sm font-semibold text-[#7a5c48]">共有</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    void handleNativeShare();
                  }}
                  disabled={isPreparingShareImage || isNativeSharing}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#f4e7dc] px-3 py-4 text-[#7a5c48] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-2xl">↗</span>
                  <span className="text-xs font-semibold">navigator.share</span>
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
