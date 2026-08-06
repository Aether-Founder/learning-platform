import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getClassById, addClassMember, getClassMembers, removeClassMember } from "@/lib/classes";

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

    const classData = await getClassById(params.id);
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacherId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await getClassMembers(params.id);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching class members:", error);
    return NextResponse.json({ error: "Failed to fetch class members" }, { status: 500 });
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

    const classData = await getClassById(params.id);
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Class code is required" }, { status: 400 });
    }

    if (classData.code !== code) {
      return NextResponse.json({ error: "Invalid class code" }, { status: 400 });
    }

    const member = await addClassMember(params.id, payload.userId, "student");

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Error adding class member:", error);
    return NextResponse.json({ error: "Failed to add class member" }, { status: 500 });
  }
}

export async function DELETE(
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

    const classData = await getClassById(params.id);
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (classData.teacherId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await removeClassMember(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing class member:", error);
    return NextResponse.json({ error: "Failed to remove class member" }, { status: 500 });
  }
}
