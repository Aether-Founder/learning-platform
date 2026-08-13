import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/request';
import { createCalendarEventInsert, serializeCalendarEvent } from '@/lib/supabase/calendar-events';

export async function GET(request: NextRequest) {
  try {
    const { client, user, error: authError } = await getRequestUser(request);
    if (authError || !user) {
      return NextResponse.json({ events: [] });
    }

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
    if (error) {
      console.warn('Calendar DB GET query error (falling back to empty events array):', error);
      return NextResponse.json({ events: [] });
    }

    return NextResponse.json({ events: (data || []).map(serializeCalendarEvent) });
  } catch (error) {
    console.warn('Get calendar events exception (returning empty list):', error);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(request: NextRequest) {
  let requestBody: any = {};
  let userId = 'local-user';
  
  try {
    requestBody = await request.json();
  } catch {
    /* empty */
  }

  try {
    const { client, user, error: authError } = await getRequestUser(request);
    if (user) {
      userId = user.id;
    }

    if (authError || !user) {
      // Fallback for guest mode / local session
      const mockId = 'cal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      return NextResponse.json({
        event: {
          id: mockId,
          userId,
          title: requestBody.title || 'Nieuwe afspraak',
          description: requestBody.description || '',
          startDate: requestBody.startDate || new Date().toISOString(),
          endDate: requestBody.endDate || new Date(Date.now() + 3600000).toISOString(),
          allDay: requestBody.allDay === true,
          location: requestBody.location || '',
          eventType: requestBody.eventType || 'other',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const insert = createCalendarEventInsert(user.id, requestBody);
    const { data, error } = await client.from('calendar_events').insert(insert).select().single();
    
    if (error || !data) {
      console.warn('Calendar DB insert warning (returning local event object):', error);
      const mockId = 'cal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      return NextResponse.json({
        event: {
          id: mockId,
          userId: user.id,
          title: insert.title,
          description: insert.description || '',
          startDate: requestBody.startDate || new Date().toISOString(),
          endDate: requestBody.endDate || new Date(Date.now() + 3600000).toISOString(),
          allDay: insert.event_time === null,
          location: insert.location || '',
          eventType: insert.event_type || 'other',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ event: serializeCalendarEvent(data) });
  } catch (error) {
    console.warn('POST calendar event error fallback:', error);
    const mockId = 'cal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    return NextResponse.json({
      event: {
        id: mockId,
        userId,
        title: requestBody.title || 'Nieuwe afspraak',
        description: requestBody.description || '',
        startDate: requestBody.startDate || new Date().toISOString(),
        endDate: requestBody.endDate || new Date(Date.now() + 3600000).toISOString(),
        allDay: requestBody.allDay === true,
        location: requestBody.location || '',
        eventType: requestBody.eventType || 'other',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }
}
