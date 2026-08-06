import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getClassById, getAssignmentById, updateAssignment, deleteAssignment } from "@/lib/classes";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
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

    const assignment = await getAssignmentById(params.assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.classId !== params.id) {
      return NextResponse.json({ error: "Assignment does not belong to this class" }, { status: 400 });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
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

    const assignment = await getAssignmentById(params.assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.classId !== params.id) {
      return NextResponse.json({ error: "Assignment does not belong to this class" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, dueDate } = body;

    const updatedAssignment = await updateAssignment(
      params.assignmentId,
      title,
      description,
      dueDate ? new Date(dueDate) : undefined
    );

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
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

    const assignment = await getAssignmentById(params.assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.classId !== params.id) {
      return NextResponse.json({ error: "Assignment does not belong to this class" }, { status: 400 });
    }

    await deleteAssignment(params.assignmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
