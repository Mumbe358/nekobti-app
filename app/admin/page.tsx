"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventRow = {
  event_name: string;
  session_id: string | null;
  utm_source: string | null;
  created_at: string;
};

type DiagnosisRow = {
  result_type: string | null;
  session_id: string | null;
  utm_source: string | null;
  gender: string | null;
  coat: string | null;
  created_at: string;
};

type DailyRow = {
  day: string;
  pv: number;
  started: number;
  completed: number;
  shared: number;
};

type TypeRow = {
  result_type: string;
  count: number;
  percentage: number;
};

type SourceRow = {
  utm_source: string;
  count: number;
};

export default function AdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [results, setResults] = useState<DiagnosisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        const [{ data: eventsData, error: eventsError }, { data: resultsData, error: resultsError }] =
          await Promise.all([
            supabase
              .from("events")
              .select("event_name, session_id, utm_source, created_at")
              .order("created_at", { ascending: false })
              .limit(2000),
            supabase
              .from("diagnosis_results")
              .select("result_type, session_id, utm_source, gender, coat, created_at")
              .order("created_at", { ascending: false })
              .limit(2000),
          ]);

        if (eventsError) throw eventsError;
        if (resultsError) throw resultsError;

        setEvents((eventsData ?? []) as EventRow[]);
        setResults((resultsData ?? []) as DiagnosisRow[]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "読み込みに失敗しました";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, []);

  const dailySummary = useMemo<DailyRow[]>(() => {
    const map = new Map<string, DailyRow>();

    const ensureDay = (day: string) => {
      if (!map.has(day)) {
        map.set(day, {
          day,
          pv: 0,
          started: 0,
          completed: 0,
          shared: 0,
        });
      }
      return map.get(day)!;
    };

    for (const row of events) {
      const day = row.created_at.slice(0, 10);
      const target = ensureDay(day);

      if (row.event_name === "page_view") target.pv += 1;
      if (row.event_name === "diagnosis_started") target.started += 1;
      if (row.event_name === "share_clicked") target.shared += 1;
    }

    for (const row of results) {
      const day = row.created_at.slice(0, 10);
      const target = ensureDay(day);
      target.completed += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day));
  }, [events, results]);

  const typeDistribution = useMemo<TypeRow[]>(() => {
    const countMap = new Map<string, number>();

    for (const row of results) {
      const key = row.result_type || "unknown";
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    const total = results.length || 1;

    return Array.from(countMap.entries())
      .map(([result_type, count]) => ({
        result_type,
        count,
        percentage: Math.round((count * 1000) / total) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }, [results]);

  const sourceDistribution = useMemo<SourceRow[]>(() => {
    const countMap = new Map<string, number>();

    for (const row of results) {
      const key = row.utm_source || "unknown";
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    return Array.from(countMap.entries())
      .map(([utm_source, count]) => ({ utm_source, count }))
      .sort((a, b) => b.count - a.count);
  }, [results]);

  const overview = useMemo(() => {
    const pvSessions = new Set(
      events.filter((e) => e.event_name === "page_view" && e.session_id).map((e) => e.session_id as string)
    ).size;

    const startedSessions = new Set(
      events
        .filter((e) => e.event_name === "diagnosis_started" && e.session_id)
        .map((e) => e.session_id as string)
    ).size;

    const completedSessions = new Set(
      results.filter((r) => r.session_id).map((r) => r.session_id as string)
    ).size;

    const sharedSessions = new Set(
      events
        .filter((e) => e.event_name === "share_clicked" && e.session_id)
        .map((e) => e.session_id as string)
    ).size;

    const startRate = pvSessions > 0 ? Math.round((startedSessions * 1000) / pvSessions) / 10 : 0;
    const completionRate =
      startedSessions > 0 ? Math.round((completedSessions * 1000) / startedSessions) / 10 : 0;
    const shareRate =
      completedSessions > 0 ? Math.round((sharedSessions * 1000) / completedSessions) / 10 : 0;

    return {
      pvSessions,
      startedSessions,
      completedSessions,
      sharedSessions,
      startRate,
      completionRate,
      shareRate,
    };
  }, [events, results]);

  if (loading) {
    return <div style={styles.page}>読み込み中...</div>;
  }

  if (error) {
    return <div style={styles.page}>エラー: {error}</div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>NEKOBTI 管理画面</h1>

      <section style={styles.cardGrid}>
        <div style={styles.card}>
          <div style={styles.label}>PVセッション</div>
          <div style={styles.value}>{overview.pvSessions}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>診断開始</div>
          <div style={styles.value}>{overview.startedSessions}</div>
          <div style={styles.sub}>開始率 {overview.startRate}%</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>診断完了</div>
          <div style={styles.value}>{overview.completedSessions}</div>
          <div style={styles.sub}>完了率 {overview.completionRate}%</div>
        </div>
        <div style={styles.card}>
          <div style={styles.label}>シェア</div>
          <div style={styles.value}>{overview.sharedSessions}</div>
          <div style={styles.sub}>シェア率 {overview.shareRate}%</div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>日次サマリー</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>日付</th>
                <th style={styles.th}>PV</th>
                <th style={styles.th}>開始</th>
                <th style={styles.th}>完了</th>
                <th style={styles.th}>シェア</th>
              </tr>
            </thead>
            <tbody>
              {dailySummary.map((row) => (
                <tr key={row.day}>
                  <td style={styles.td}>{row.day}</td>
                  <td style={styles.td}>{row.pv}</td>
                  <td style={styles.td}>{row.started}</td>
                  <td style={styles.td}>{row.completed}</td>
                  <td style={styles.td}>{row.shared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.flexSection}>
        <div style={styles.panel}>
          <h2 style={styles.h2}>猫タイプ分布</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>タイプ</th>
                  <th style={styles.th}>件数</th>
                  <th style={styles.th}>割合</th>
                </tr>
              </thead>
              <tbody>
                {typeDistribution.map((row) => (
                  <tr key={row.result_type}>
                    <td style={styles.td}>{row.result_type}</td>
                    <td style={styles.td}>{row.count}</td>
                    <td style={styles.td}>{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.h2}>流入元別完了数</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>流入元</th>
                  <th style={styles.th}>件数</th>
                </tr>
              </thead>
              <tbody>
                {sourceDistribution.map((row) => (
                  <tr key={row.utm_source}>
                    <td style={styles.td}>{row.utm_source}</td>
                    <td style={styles.td}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>最新の診断結果</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>日時</th>
                <th style={styles.th}>タイプ</th>
                <th style={styles.th}>流入</th>
                <th style={styles.th}>性別</th>
                <th style={styles.th}>毛色</th>
                <th style={styles.th}>session_id</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 50).map((row, idx) => (
                <tr key={`${row.created_at}-${idx}`}>
                  <td style={styles.td}>{new Date(row.created_at).toLocaleString("ja-JP")}</td>
                  <td style={styles.td}>{row.result_type || "-"}</td>
                  <td style={styles.td}>{row.utm_source || "unknown"}</td>
                  <td style={styles.td}>{row.gender || "-"}</td>
                  <td style={styles.td}>{row.coat || "-"}</td>
                  <td style={styles.tdMono}>{row.session_id || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px",
    background: "#f7f7f8",
    minHeight: "100vh",
    color: "#111",
  },
  h1: {
    fontSize: "28px",
    fontWeight: 700,
    marginBottom: "20px",
  },
  h2: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "12px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  label: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "8px",
  },
  value: {
    fontSize: "28px",
    fontWeight: 700,
  },
  sub: {
    fontSize: "13px",
    color: "#666",
    marginTop: "6px",
  },
  section: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
  },
  flexSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fafafa",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f0f0f0",
    whiteSpace: "nowrap",
  },
  tdMono: {
    padding: "10px 12px",
    borderBottom: "1px solid #f0f0f0",
    whiteSpace: "nowrap",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
  },
};