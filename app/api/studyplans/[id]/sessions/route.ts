import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getStudyPlanById, createStudySession, getStudySessionsByPlan } from "@/lib/studyplans";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const studyPlan = await getStudyPlanById(params.id);
    if (!studyPlan) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    if (studyPlan.userId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessions = await getStudySessionsByPlan(params.id);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    return NextResponse.json({ error: "Failed to fetch study sessions" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const studyPlan = await getStudyPlanById(params.id);
    if (!studyPlan) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    if (studyPlan.userId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { subjectId, scheduledDate, duration, topics } = body;

    if (!subjectId || !scheduledDate || !duration) {
      return NextResponse.json({ error: "Subject ID, scheduled date, and duration are required" }, { status: 400 });
    }

    const session = await createStudySession(
      params.id,
      subjectId,
      new Date(scheduledDate),
      duration,
      topics
    );

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Error creating study session:", error);
    return NextResponse.json({ error: "Failed to create study session" }, { status: 500 });
  }
}
