import { NextRequest, NextResponse } from "next/server";
import {
  getPublicContent,
  type PublicContentKey,
} from "@/app/lib/server/public-content";

type Params = {
  params: Promise<{
    key: string;
  }>;
};

function isPublicContentKey(value: string): value is PublicContentKey {
  return value === "about" || value === "privacy";
}

export async function GET(_request: NextRequest, context: Params) {
  try {
    const { key } = await context.params;

    if (!isPublicContentKey(key)) {
      return NextResponse.json(
        { ok: false, error: "Content not found" },
        { status: 404 }
      );
    }

    const item = getPublicContent(key);

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    console.error("[api/public-content/[key]] GET error:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to load public content" },
      { status: 500 }
    );
  }
}