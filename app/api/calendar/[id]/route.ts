import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser, validationAwareError } from '@/lib/api/supabase';
import { notFound, serverError } from '@/lib/api/responses';
import { createCalendarEventUpdate, serializeCalendarEvent } from '@/lib/supabase/calendar-events';

async function ownedEvent(request: NextRequest, id: string) {
  const auth = await requireSupabaseUser(request);
  if ('response' in auth) return auth;

  const { data, error } = await auth.client
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (error || !data) return { response: notFound('Event not found') };
  return { client: auth.client, event: data };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await ownedEvent(request, params.id);
    if ('response' in result) return result.response;
    return NextResponse.json({ event: serializeCalendarEvent(result.event) });
  } catch (error) {
    return serverError('Get calendar event error:', error, 'Failed to get calendar event');
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
    return validationAwareError(error, {
      fallbackMessage: 'Failed to update calendar event',
      validationPattern: /cannot be empty|valid date/i,
      logMessage: 'Update calendar event error:',
    });
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
    return serverError('Delete calendar event error:', error, 'Failed to delete calendar event');
  }
}
