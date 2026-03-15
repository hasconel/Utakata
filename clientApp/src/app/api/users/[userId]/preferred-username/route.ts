import { NextResponse } from "next/server";
import { getPreferredUsernameByUserId } from "@/lib/appwrite/database";

/**
 * userId から preferredUsername だけ返す API！✨
 * Edge の middleware から fetch で呼ぶ用（middleware は crypto 使えないので database を直 import できない）💖
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const preferredUsername = await getPreferredUsernameByUserId(userId);
  if (!preferredUsername) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ preferredUsername });
}
