import { NextRequest, NextResponse } from "next/server";
import { getMaterialWithSegments } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("q") || "";
    const searchMode = (searchParams.get("searchMode") || "all") as "text" | "page" | "all";

    const data = await getMaterialWithSegments(id, { page, search, limit: 10, searchMode });

    if (!data) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in API preview:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
