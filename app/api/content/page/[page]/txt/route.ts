import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function GET(
  _request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const pageName = params.page.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!pageName) {
      return NextResponse.json({ error: "Invalid page name" }, { status: 400 });
    }

    const filePath = path.join(CONTENT_DIR, `${pageName}.json`);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Content file not found" }, { status: 404 });
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);

    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error serving plain text content:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}
