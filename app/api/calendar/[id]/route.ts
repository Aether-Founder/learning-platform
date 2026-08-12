import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/request';
import { createCalendarEventUpdate, serializeCalendarEvent } from '@/lib/supabase/calendar-events';

async function ownedEvent(request: NextRequest, id: string) {
  const auth = await getRequestUser(request);
  if (auth.error || !auth.user)
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };

  const { data, error } = await auth.client
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (error || !data)
    return { response: NextResponse.json({ error: 'Event not found' }, { status: 404 }) };
  return { client: auth.client, event: data };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedEvent(request, params.id);
    if ('response' in result) return result.response;
    return NextResponse.json({ event: serializeCalendarEvent(result.event) });
  } catch (error) {
    console.error('Get calendar event error:', error);
    return NextResponse.json({ error: 'Failed to get calendar event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedEvent(request, params.id);
    if ('response' in result) return result.response;

    const update = createCalendarEventUpdate(await request.json(), result.event.metadata);
    const { data, error } = await result.client
      .from('calendar_events')
      .update(update)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) throw error || new Error('Calendar event was not updated');
    return NextResponse.json({ event: serializeCalendarEvent(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update calendar event';
    const status = /cannot be empty|valid date/i.test(message) ? 400 : 500;
    if (status === 500) console.error('Update calendar event error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedEvent(request, params.id);
    if ('response' in result) return result.response;

    const { error } = await result.client.from('calendar_events').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 });
  }
}
