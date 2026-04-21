import { NextRequest, NextResponse } from "next/server";
import { getPublicContent } from "@/app/lib/server/public-content";

type Params = {
  params: Promise<{
    key: string;
  }>;
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const { key } = await context.params;

    const content = getPublicContent(key);

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      key,
      content,
    });
  } catch (error) {
    console.error("[api/public-content/[key]] GET error:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to load public content" },
      { status: 500 }
    );
  }
}