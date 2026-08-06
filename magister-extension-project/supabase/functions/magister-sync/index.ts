/**
 * Supabase Edge Function: magister-sync
 * 
 * Receives POST requests from Chrome Extension with Magister data.
 * Validates sync_token and upserts data into magister_events or magister_grades tables.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers for Chrome Extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sync-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestPayload {
  syncToken?: string;
  apiType: 'CALENDAR' | 'GRADES';
  data: any;
  url?: string;
  timestamp?: string;
}

interface MagisterEvent {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  title: string;
  raw_payload: any;
}

interface MagisterGrade {
  id: string;
  user_id: string;
  subject: string;
  grade_value: string;
  raw_payload: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: RequestPayload = await req.json();
    
    // Extract sync_token from payload or headers
    const syncToken = payload.syncToken || 
                      req.headers.get('sync-token') || 
                      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!syncToken) {
      console.error('[Magister Sync] No sync token provided');
      return new Response(
        JSON.stringify({ error: 'Sync token is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[Magister Sync] Validating sync token...');

    // Validate sync_token and get user_id
    const { data: mapping, error: mappingError } = await supabase
      .from('user_magister_mappings')
      .select('user_id, magister_email')
      .eq('sync_token', syncToken)
      .single();

    if (mappingError || !mapping) {
      console.error('[Magister Sync] Invalid sync token:', mappingError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired sync token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = mapping.user_id;
    console.log(`[Magister Sync] Token validated for user: ${userId}`);

    // Process based on API type
    let result;
    if (payload.apiType === 'CALENDAR') {
      result = await processCalendarData(supabase, userId, payload.data);
    } else if (payload.apiType === 'GRADES') {
      result = await processGradesData(supabase, userId, payload.data);
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown API type: ${payload.apiType}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[Magister Sync] ${payload.apiType} sync completed:`, result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${payload.apiType} data synced successfully`,
        ...result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Magister Sync] Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Process and upsert calendar/agenda data
 */
async function processCalendarData(supabase: any, userId: string, data: any) {
  // Handle both Items and items (case variations from Magister API)
  const items = data.Items || data.items || [];
  
  if (items.length === 0) {
    console.log('[Magister Sync] No calendar items to process');
    return { inserted: 0, updated: 0 };
  }

  // Format events for database
  const events: MagisterEvent[] = items.map((event: any) => ({
    id: String(event.Id || event.id || generateId(event)),
    user_id: userId,
    start_time: event.Start || event.start || event.Begin,
    end_time: event.Einde || event.end || event.End,
    title: event.Omschrijving || event.title || event.Titel || 'Untitled Event',
    raw_payload: event
  }));

  // Validate required fields
  const validEvents = events.filter(event => 
    event.start_time && event.end_time && event.title
  );

  if (validEvents.length === 0) {
    console.warn('[Magister Sync] No valid calendar events found');
    return { inserted: 0, updated: 0, skipped: items.length };
  }

  console.log(`[Magister Sync] Upserting ${validEvents.length} calendar events`);

  // Upsert events (insert or update on conflict)
  const { data: result, error } = await supabase
    .from('magister_events')
    .upsert(validEvents, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error('[Magister Sync] Error upserting calendar events:', error);
    throw new Error(`Failed to upsert calendar events: ${error.message}`);
  }

  return { 
    inserted: result?.length || 0,
    skipped: items.length - validEvents.length 
  };
}

/**
 * Process and upsert grades/cijfers data
 */
async function processGradesData(supabase: any, userId: string, data: any) {
  // Handle both Items and items (case variations from Magister API)
  const items = data.Items || data.items || [];
  
  if (items.length === 0) {
    console.log('[Magister Sync] No grade items to process');
    return { inserted: 0, updated: 0 };
  }

  // Format grades for database
  const grades: MagisterGrade[] = items.map((grade: any) => ({
    id: String(grade.CijferId || grade.Id || grade.id || generateId(grade)),
    user_id: userId,
    subject: grade.Vak || grade.subject || grade.Subject || 'Unknown Subject',
    grade_value: String(grade.Cijfer || grade.grade || grade.Grade || ''),
    raw_payload: grade
  }));

  // Validate required fields
  const validGrades = grades.filter(grade => 
    grade.subject && grade.grade_value
  );

  if (validGrades.length === 0) {
    console.warn('[Magister Sync] No valid grades found');
    return { inserted: 0, updated: 0, skipped: items.length };
  }

  console.log(`[Magister Sync] Upserting ${validGrades.length} grades`);

  // Upsert grades (insert or update on conflict)
  const { data: result, error } = await supabase
    .from('magister_grades')
    .upsert(validGrades, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error('[Magister Sync] Error upserting grades:', error);
    throw new Error(`Failed to upsert grades: ${error.message}`);
  }

  return { 
    inserted: result?.length || 0,
    skipped: items.length - validGrades.length 
  };
}

/**
 * Generate a fallback ID if none exists in the API response
 */
function generateId(obj: any): string {
  const timestamp = Date.now();
  const hash = Math.random().toString(36).substring(2, 11);
  return `magister_${timestamp}_${hash}`;
}
