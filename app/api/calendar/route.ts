import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser, validationAwareError } from '@/lib/api/supabase';
import { serverError } from '@/lib/api/responses';
import { createCalendarEventInsert, serializeCalendarEvent } from '@/lib/supabase/calendar-events';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser(request);
    if ('response' in auth) return auth.response;
    const { client, user } = auth;

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
    return serverError('Get calendar events error:', error, 'Failed to get calendar events');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser(request);
    if ('response' in auth) return auth.response;

    const insert = createCalendarEventInsert(auth.user.id, await request.json());
    const { data, error } = await auth.client
      .from('calendar_events')
      .insert(insert)
      .select()
      .single();
    if (error || !data) throw error || new Error('Calendar event was not created');

    return NextResponse.json({ event: serializeCalendarEvent(data) });
  } catch (error) {
    return validationAwareError(error, {
      fallbackMessage: 'Failed to create calendar event',
      validationPattern: /required|valid date|after the start/i,
      logMessage: 'Create calendar event error:',
    });
  }
}
