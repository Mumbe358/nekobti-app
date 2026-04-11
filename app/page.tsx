"use client";

import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

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
              まずは見た目から、やわらかく触れたくなる体験へ。
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => setIsOpen(true)}
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
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`w-full max-w-xl rounded-[32px] border border-[#eedfd3] bg-[#fffaf6] p-8 shadow-2xl transition-all duration-500 ${
            isOpen ? "scale-100 blur-0" : "scale-90 blur-sm"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="mb-2 text-sm tracking-[0.18em] text-[#b07d62]">
                DIAGNOSIS START
              </p>
              <h2 className="text-3xl font-bold">まずは1問目</h2>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-white px-4 py-2 text-sm text-[#7a5c48] shadow-sm transition hover:bg-[#fff3ea]"
            >
              閉じる
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 ring-1 ring-[#f2e5dc]">
            <p className="mb-4 text-lg font-semibold">
              あなたの猫は、知らない人が来たときどうする？
            </p>

            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-[#b07d62]" />
              <div className="h-2 flex-1 rounded-full bg-[#eadfd6]" />
              <div className="h-2 flex-1 rounded-full bg-[#eadfd6]" />
            </div>

            <p className="mb-6 text-sm text-[#9a7d69]">1 / 3 questions</p>

            <div className="grid gap-3">
              <button className="rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-5 py-4 text-left transition hover:bg-[#fff3ea]">
                すぐ隠れる
              </button>
              <button className="rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-5 py-4 text-left transition hover:bg-[#fff3ea]">
                少し様子を見る
              </button>
              <button className="rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-5 py-4 text-left transition hover:bg-[#fff3ea]">
                普通に近づく
              </button>
              <button className="rounded-2xl border border-[#ead8ca] bg-[#fffdfb] px-5 py-4 text-left transition hover:bg-[#fff3ea]">
                むしろ主役みたいに出てくる
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}