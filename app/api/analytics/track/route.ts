import { NextRequest, NextResponse } from 'next/server';
import {
  ensureAnalyticsDir,
  readAnalyticsFile,
  writeAnalyticsFile,
} from '@/lib/api/analytics-store';
import { badRequest, serverError } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    await ensureAnalyticsDir();

    const event = await request.json();

    // Validate event structure
    if (!event.userId || !event.sessionId || !event.eventType || !event.timestamp) {
      return badRequest('Invalid event structure');
    }

    // Update user data
    const users = await readAnalyticsFile('users.json');
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
    const sessions = await readAnalyticsFile('sessions.json');
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
    const events = await readAnalyticsFile('events.json');
    events.push({
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      data: event.data,
    });

    // Write all files
    await Promise.all([
      writeAnalyticsFile('users.json', users),
      writeAnalyticsFile('sessions.json', sessions),
      writeAnalyticsFile('events.json', events),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Analytics tracking error:', error, 'Internal server error');
  }
}
