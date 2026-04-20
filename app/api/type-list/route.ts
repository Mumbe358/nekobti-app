import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/server/supabase-admin";
import { listTypeItems } from "@/app/lib/server/diagnosis-content";

type ShareRow = {
  result_type: string;
  percentage: number | string;
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("diagnosis_type_share")
      .select("result_type, percentage");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const percentages = (data ?? []).reduce<Record<string, number>>((acc, row) => {
      const item = row as ShareRow;
      acc[item.result_type] = Number(item.percentage);
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      items: listTypeItems(percentages),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
