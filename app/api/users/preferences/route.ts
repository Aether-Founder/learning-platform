import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser } from '@/lib/api/supabase';
import { badRequest, serverError } from '@/lib/api/responses';

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser(request);
    if ('response' in auth) return auth.response;
    const { client, user } = auth;

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return badRequest('Preferences are required');
    }

    const { data: profile, error } = await client
      .from('users')
      .update({ preferences })
      .eq('id', user.id)
      .select()
      .single();

    if (error || !profile) {
      return serverError('Failed to update preferences:', error, 'Failed to update preferences');
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    return serverError('Update preferences error:', error, 'Failed to update preferences');
  }
}
