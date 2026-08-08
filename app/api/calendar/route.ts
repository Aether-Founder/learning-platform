import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/request';
import { createCalendarEventInsert, serializeCalendarEvent } from '@/lib/supabase/calendar-events';

export async function GET(request: NextRequest) {
  try {
    const { client, user, error: authError } = await getRequestUser(request);
    if (authError || !user)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    let query = client
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date');

    if (startDate) query = query.gte('event_date', startDate.slice(0, 10));
    if (endDate) query = query.lte('event_date', endDate.slice(0, 10));

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ events: (data || []).map(serializeCalendarEvent) });
  } catch (error) {
    console.error('Get calendar events error:', error);
    return NextResponse.json({ error: 'Failed to get calendar events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client, user, error: authError } = await getRequestUser(request);
    if (authError || !user)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const insert = createCalendarEventInsert(user.id, await request.json());
    const { data, error } = await client.from('calendar_events').insert(insert).select().single();
    if (error || !data) throw error || new Error('Calendar event was not created');

    return NextResponse.json({ event: serializeCalendarEvent(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create calendar event';
    const status = /required|valid date|after the start/i.test(message) ? 400 : 500;
    if (status === 500) console.error('Create calendar event error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
