import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/request';

export async function PUT(request: NextRequest) {
  try {
    const { client, user, error: authError } = await getRequestUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json({ error: 'Preferences are required' }, { status: 400 });
    }

    const { data: profile, error } = await client
      .from('users')
      .update({ preferences })
      .eq('id', user.id)
      .select()
      .single();

    if (error || !profile) {
      console.error('Failed to update preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
