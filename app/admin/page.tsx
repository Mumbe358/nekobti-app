"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Noto_Sans_JP } from "next/font/google";

type EventRow = {
  id: number;
  event_name: string | null;
  session_id: string | null;
  result_type: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  created_at: string | null;
};

type DiagnosisResultRow = {
  id: number;
  session_id: string | null;
  result_type: string | null;
  mbti: string | null;
  gender: string | null;
  coat: string | null;
  created_at: string | null;
};

type Overview = {
  pvSessions: number;
  startedSessions: number;
  completedSessions: number;
  sharedSessions: number;
  startRate: number;
  completionRate: number;
  shareRate: number;
};

type DailyRow = {
  date: string;
  pvSessions: number;
  startedSessions: number;
  completedSessions: number;
  sharedSessions: number;
  startRate: number;
  completionRate: number;
  shareRate: number;
};

type TypeRow = {
  resultType: string;
  count: number;
  shareSessions: number;
  shareRate: number;
  ratio: number;
};

type SourceRow = {
  label: string;
  pvSessions: number;
  startedSessions: number;
  completedSessions: number;
  sharedSessions: number;
  completionRate: number;
  shareRate: number;
};

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function toJstDateKey(value: string | null) {
  if (!value) return "不明";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "不明";

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function normalizeSourceLabel(row: EventRow) {
  const source = row.utm_source?.trim();
  const medium = row.utm_medium?.trim();
  const campaign = row.utm_campaign?.trim();
  const referrer = row.referrer?.trim();

  if (source && medium && campaign) return `${source} / ${medium} / ${campaign}`;
  if (source && medium) return `${source} / ${medium}`;
  if (source) return source;
  if (referrer) return referrer;
  return "direct / unknown";
}

function uniqueSessionCount(rows: EventRow[]) {
  return new Set(rows.map((row) => row.session_id).filter(Boolean)).size;
}

function groupByDistinctSession(rows: EventRow[], predicate: (row: EventRow) => boolean) {
  return new Set(rows.filter(predicate).map((row) => row.session_id).filter(Boolean)).size;
}

function sortDailyDesc(rows: DailyRow[]) {
  return [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function AdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [results, setResults] = useState<DiagnosisResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [{ data: eventsData, error: eventsError }, { data: resultsData, error: resultsError }] =
        await Promise.all([
          supabase
            .from("events")
            .select(
              "id, event_name, session_id, result_type, utm_source, utm_medium, utm_campaign, referrer, created_at"
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("diagnosis_results")
            .select("id, session_id, result_type, mbti, gender, coat, created_at")
            .order("created_at", { ascending: false }),
        ]);

      if (!mounted) return;

      if (eventsError || resultsError) {
        setError(eventsError?.message || resultsError?.message || "データ取得に失敗しました。");
        setLoading(false);
        return;
      }

      setEvents((eventsData as EventRow[]) ?? []);
      setResults((resultsData as DiagnosisResultRow[]) ?? []);
      setLoading(false);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const overview = useMemo<Overview>(() => {
    const pvSessions = groupByDistinctSession(events, (row) => row.event_name === "page_view");
    const startedSessions = groupByDistinctSession(events, (row) => row.event_name === "diagnosis_started");
    const completedSessions = groupByDistinctSession(events, (row) => row.event_name === "diagnosis_completed");
    const sharedSessions = groupByDistinctSession(events, (row) => row.event_name === "share_clicked");

    return {
      pvSessions,
      startedSessions,
      completedSessions,
      sharedSessions,
      startRate: pvSessions > 0 ? (startedSessions / pvSessions) * 100 : 0,
      completionRate: startedSessions > 0 ? (completedSessions / startedSessions) * 100 : 0,
      shareRate: completedSessions > 0 ? (sharedSessions / completedSessions) * 100 : 0,
    };
  }, [events]);

  const dailySummary = useMemo<DailyRow[]>(() => {
    const map = new Map<string, { pv: Set<string>; started: Set<string>; completed: Set<string>; shared: Set<string> }>();

    for (const row of events) {
      const dateKey = toJstDateKey(row.created_at);
      const sessionId = row.session_id;
      if (!sessionId) continue;

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          pv: new Set<string>(),
          started: new Set<string>(),
          completed: new Set<string>(),
          shared: new Set<string>(),
        });
      }

      const bucket = map.get(dateKey)!;
      if (row.event_name === "page_view") bucket.pv.add(sessionId);
      if (row.event_name === "diagnosis_started") bucket.started.add(sessionId);
      if (row.event_name === "diagnosis_completed") bucket.completed.add(sessionId);
      if (row.event_name === "share_clicked") bucket.shared.add(sessionId);
    }

    const rows: DailyRow[] = [...map.entries()].map(([date, bucket]) => {
      const pvSessions = bucket.pv.size;
      const startedSessions = bucket.started.size;
      const completedSessions = bucket.completed.size;
      const sharedSessions = bucket.shared.size;

      return {
        date,
        pvSessions,
        startedSessions,
        completedSessions,
        sharedSessions,
        startRate: pvSessions > 0 ? (startedSessions / pvSessions) * 100 : 0,
        completionRate: startedSessions > 0 ? (completedSessions / startedSessions) * 100 : 0,
        shareRate: completedSessions > 0 ? (sharedSessions / completedSessions) * 100 : 0,
      };
    });

    return sortDailyDesc(rows);
  }, [events]);

  const typeDistribution = useMemo<TypeRow[]>(() => {
    const completedSessionToType = new Map<string, string>();
    const sharedSessionIds = new Set<string>();

    for (const row of events) {
      if (row.event_name === "diagnosis_completed" && row.session_id && row.result_type) {
        completedSessionToType.set(row.session_id, row.result_type);
      }
      if (row.event_name === "share_clicked" && row.session_id) {
        sharedSessionIds.add(row.session_id);
      }
    }

    const resultCountMap = new Map<string, number>();
    for (const row of results) {
      const key = row.result_type || "不明";
      resultCountMap.set(key, (resultCountMap.get(key) ?? 0) + 1);
    }

    const shareCountMap = new Map<string, number>();
    for (const sessionId of sharedSessionIds) {
      const type = completedSessionToType.get(sessionId);
      if (!type) continue;
      shareCountMap.set(type, (shareCountMap.get(type) ?? 0) + 1);
    }

    const total = [...resultCountMap.values()].reduce((sum, count) => sum + count, 0);

    return [...resultCountMap.entries()]
      .map(([resultType, count]) => {
        const shareSessions = shareCountMap.get(resultType) ?? 0;
        return {
          resultType,
          count,
          shareSessions,
          shareRate: count > 0 ? (shareSessions / count) * 100 : 0,
          ratio: total > 0 ? (count / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [events, results]);

  const sourceSummary = useMemo<SourceRow[]>(() => {
    const map = new Map<string, { pv: Set<string>; started: Set<string>; completed: Set<string>; shared: Set<string> }>();

    for (const row of events) {
      const label = normalizeSourceLabel(row);
      const sessionId = row.session_id;
      if (!sessionId) continue;

      if (!map.has(label)) {
        map.set(label, {
          pv: new Set<string>(),
          started: new Set<string>(),
          completed: new Set<string>(),
          shared: new Set<string>(),
        });
      }

      const bucket = map.get(label)!;
      if (row.event_name === "page_view") bucket.pv.add(sessionId);
      if (row.event_name === "diagnosis_started") bucket.started.add(sessionId);
      if (row.event_name === "diagnosis_completed") bucket.completed.add(sessionId);
      if (row.event_name === "share_clicked") bucket.shared.add(sessionId);
    }

    return [...map.entries()]
      .map(([label, bucket]) => {
        const pvSessions = bucket.pv.size;
        const startedSessions = bucket.started.size;
        const completedSessions = bucket.completed.size;
        const sharedSessions = bucket.shared.size;

        return {
          label,
          pvSessions,
          startedSessions,
          completedSessions,
          sharedSessions,
          completionRate: startedSessions > 0 ? (completedSessions / startedSessions) * 100 : 0,
          shareRate: completedSessions > 0 ? (sharedSessions / completedSessions) * 100 : 0,
        };
      })
      .sort((a, b) => b.completedSessions - a.completedSessions || b.pvSessions - a.pvSessions);
  }, [events]);

  const rawCounts = useMemo(() => {
    return {
      eventsRows: events.length,
      eventsSessions: uniqueSessionCount(events),
      resultRows: results.length,
    };
  }, [events, results]);

  return (
    <main className={`${notoSans.className} min-h-screen bg-[#f6f6f6] text-[#111]`}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">NEKOBTI 管理画面</h1>
          <p className="text-sm text-[#666] sm:text-base">
            ファネル指標は <span className="font-bold">events の session_id ベース</span>、タイプ分布は
            <span className="font-bold"> diagnosis_results ベース</span> で集計。
          </p>
        </div>

        {error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-sm font-bold">データ取得エラー</p>
            <p className="mt-1 text-sm">{error}</p>
          </section>
        ) : null}

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="PVセッション" value={overview.pvSessions} sublabel={`events rows ${rawCounts.eventsRows}`} />
          <MetricCard
            label="診断開始"
            value={overview.startedSessions}
            sublabel={`開始率 ${formatPercent(overview.startRate)}`}
          />
          <MetricCard
            label="診断完了"
            value={overview.completedSessions}
            sublabel={`完了率 ${formatPercent(overview.completionRate)}`}
          />
          <MetricCard label="シェア" value={overview.sharedSessions} sublabel={`シェア率 ${formatPercent(overview.shareRate)}`} />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MiniCard label="events セッション数" value={rawCounts.eventsSessions} />
          <MiniCard label="diagnosis_results 件数" value={rawCounts.resultRows} />
          <MiniCard label="ファネル基準" value="session_id" isText />
        </section>

        <section className="mb-6 rounded-3xl border border-[#e5e5e5] bg-white p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-2xl font-black sm:text-4xl">日次サマリー</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#666]">読み込み中...</p>
          ) : dailySummary.length === 0 ? (
            <p className="text-sm text-[#666]">まだ events データがありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm sm:text-base">
                <thead>
                  <tr>
                    <Th>日付</Th>
                    <Th>PV</Th>
                    <Th>開始</Th>
                    <Th>完了</Th>
                    <Th>シェア</Th>
                    <Th>開始率</Th>
                    <Th>完了率</Th>
                    <Th>シェア率</Th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((row) => (
                    <tr key={row.date}>
                      <Td strong>{row.date}</Td>
                      <Td>{row.pvSessions}</Td>
                      <Td>{row.startedSessions}</Td>
                      <Td>{row.completedSessions}</Td>
                      <Td>{row.sharedSessions}</Td>
                      <Td>{formatPercent(row.startRate)}</Td>
                      <Td>{formatPercent(row.completionRate)}</Td>
                      <Td>{formatPercent(row.shareRate)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-6 rounded-3xl border border-[#e5e5e5] bg-white p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-2xl font-black sm:text-4xl">流入元別サマリー</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#666]">読み込み中...</p>
          ) : sourceSummary.length === 0 ? (
            <p className="text-sm text-[#666]">まだ流入元データがありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm sm:text-base">
                <thead>
                  <tr>
                    <Th>流入元</Th>
                    <Th>PV</Th>
                    <Th>開始</Th>
                    <Th>完了</Th>
                    <Th>シェア</Th>
                    <Th>完了率</Th>
                    <Th>シェア率</Th>
                  </tr>
                </thead>
                <tbody>
                  {sourceSummary.map((row) => (
                    <tr key={row.label}>
                      <Td strong>{row.label}</Td>
                      <Td>{row.pvSessions}</Td>
                      <Td>{row.startedSessions}</Td>
                      <Td>{row.completedSessions}</Td>
                      <Td>{row.sharedSessions}</Td>
                      <Td>{formatPercent(row.completionRate)}</Td>
                      <Td>{formatPercent(row.shareRate)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-2xl font-black sm:text-4xl">猫タイプ分布</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#666]">読み込み中...</p>
          ) : typeDistribution.length === 0 ? (
            <p className="text-sm text-[#666]">まだ diagnosis_results データがありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm sm:text-base">
                <thead>
                  <tr>
                    <Th>タイプ</Th>
                    <Th>件数</Th>
                    <Th>割合</Th>
                    <Th>シェア数</Th>
                    <Th>シェア率</Th>
                  </tr>
                </thead>
                <tbody>
                  {typeDistribution.map((row) => (
                    <tr key={row.resultType}>
                      <Td strong>{row.resultType}</Td>
                      <Td>{row.count}</Td>
                      <Td>{row.ratio.toFixed(1)}%</Td>
                      <Td>{row.shareSessions}</Td>
                      <Td>{formatPercent(row.shareRate)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  return (
    <section className="rounded-3xl border border-[#dfdfdf] bg-white p-6 sm:p-8">
      <p className="text-base text-[#666] sm:text-[32px] sm:leading-none">{label}</p>
      <p className="mt-4 text-5xl font-black leading-none sm:text-7xl">{value}</p>
      <p className="mt-4 text-base text-[#666] sm:text-[28px] sm:leading-none">{sublabel}</p>
    </section>
  );
}

function MiniCard({ label, value, isText = false }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <section className="rounded-3xl border border-[#dfdfdf] bg-white p-5 sm:p-6">
      <p className="text-sm text-[#666] sm:text-lg">{label}</p>
      <p className={`mt-3 font-black leading-none ${isText ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>{value}</p>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-[#ececec] bg-[#fafafa] px-4 py-4 font-black text-[#111] sm:px-6 sm:py-5">
      {children}
    </th>
  );
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td className={`border-b border-[#f0f0f0] px-4 py-4 sm:px-6 sm:py-5 ${strong ? "font-bold" : "font-medium"}`}>
      {children}
    </td>
  );
}
