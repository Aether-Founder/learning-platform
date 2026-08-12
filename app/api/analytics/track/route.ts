import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'analytics');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read JSON file
async function readJsonFile(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist or is empty
    return filename === 'events.json' ? [] : {};
  }
}

// Write JSON file
async function writeJsonFile(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();

    const event = await request.json();

    // Validate event structure
    if (!event.userId || !event.sessionId || !event.eventType || !event.timestamp) {
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    // Update user data
    const users = await readJsonFile('users.json');
    if (!users[event.userId]) {
      users[event.userId] = {
        id: event.userId,
        name: event.userName || 'Anonymous',
        email: event.userEmail,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        sessionCount: 0,
        totalDuration: 0,
      };
    } else {
      // Update name/email if provided
      if (event.userName) {
        users[event.userId].name = event.userName;
      }
      if (event.userEmail) {
        users[event.userId].email = event.userEmail;
      }
      users[event.userId].lastSeen = event.timestamp;
    }

    // Update session data
    const sessions = await readJsonFile('sessions.json');
    if (!sessions[event.sessionId]) {
      sessions[event.sessionId] = {
        id: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        endTime: null,
        duration: 0,
        events: [],
      };
      users[event.userId].sessionCount++;
    }

    // Update session based on event type
    if (event.eventType === 'session_end' && event.data?.duration) {
      sessions[event.sessionId].endTime = event.timestamp;
      sessions[event.sessionId].duration = event.data.duration;
      users[event.userId].totalDuration += event.data.duration;
    }

    sessions[event.sessionId].events.push({
      eventType: event.eventType,
      timestamp: event.timestamp,
      data: event.data,
    });

    // Add event to events array
    const events = await readJsonFile('events.json');
    events.push({
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      data: event.data,
    });

    // Write all files
    await Promise.all([
      writeJsonFile('users.json', users),
      writeJsonFile('sessions.json', sessions),
      writeJsonFile('events.json', events),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
