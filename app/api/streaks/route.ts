import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getStreakData, updateStreak, checkStreakStatus } from "@/lib/streaks";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const streakData = await getStreakData(payload.userId);
    const status = await checkStreakStatus(payload.userId);

    return NextResponse.json({ streakData, status });
  } catch (error) {
    console.error("Error fetching streak data:", error);
    return NextResponse.json({ error: "Failed to fetch streak data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { studyDate } = body;

    const updatedStreak = await updateStreak(payload.userId, studyDate ? new Date(studyDate) : new Date());

    return NextResponse.json({ streakData: updatedStreak });
  } catch (error) {
    console.error("Error updating streak:", error);
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
  }
}
