import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Day names for logging
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[generate-recurring] Starting recurring event generation...');

    // Get all parent recurring events (events with recurrence_type != 'none' and no parent_event_id)
    const { data: parentEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .neq('recurrence_type', 'none')
      .is('parent_event_id', null);

    if (fetchError) {
      console.error('[generate-recurring] Error fetching parent events:', fetchError);
      throw fetchError;
    }

    if (!parentEvents || parentEvents.length === 0) {
      console.log('[generate-recurring] No recurring events found');
      return new Response(
        JSON.stringify({ success: true, message: 'No recurring events to process', created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-recurring] Found ${parentEvents.length} parent recurring events`);

    let totalCreated = 0;

    for (const parent of parentEvents) {
      console.log(`[generate-recurring] Processing: ${parent.title} (${parent.recurrence_type})`);

      // Get existing child events for this parent
      const { data: existingChildren } = await supabase
        .from('events')
        .select('starts_at')
        .eq('parent_event_id', parent.id)
        .order('starts_at', { ascending: false });

      const existingDates = new Set(
        existingChildren?.map(e => new Date(e.starts_at).toDateString()) || []
      );

      // Calculate the next 6 occurrences
      const now = new Date();
      const occurrences: Date[] = [];
      let checkDate = new Date(now);
      checkDate.setHours(0, 0, 0, 0);

      while (occurrences.length < 6) {
        checkDate.setDate(checkDate.getDate() + 1);

        if (parent.recurrence_type === 'weekly') {
          // Check if this day matches the recurrence day
          if (checkDate.getDay() === parent.recurrence_day) {
            occurrences.push(new Date(checkDate));
          }
        } else if (parent.recurrence_type === 'monthly') {
          // For monthly, use the same day of month as the original event
          const originalDate = new Date(parent.starts_at);
          if (checkDate.getDate() === originalDate.getDate()) {
            occurrences.push(new Date(checkDate));
          }
        }

        // Safety limit to prevent infinite loop
        if (checkDate > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
          break;
        }
      }

      // Create events for new occurrences
      for (const occurrence of occurrences) {
        if (existingDates.has(occurrence.toDateString())) {
          console.log(`[generate-recurring] Skipping existing: ${occurrence.toDateString()}`);
          continue;
        }

        // Set the time from recurrence_time or original event
        const eventTime = parent.recurrence_time 
          ? parent.recurrence_time.split(':')
          : [new Date(parent.starts_at).getHours(), new Date(parent.starts_at).getMinutes()];
        
        occurrence.setHours(parseInt(eventTime[0]), parseInt(eventTime[1]), 0, 0);

        // Calculate end time if original had one
        let endsAt = null;
        if (parent.ends_at) {
          const originalDuration = new Date(parent.ends_at).getTime() - new Date(parent.starts_at).getTime();
          endsAt = new Date(occurrence.getTime() + originalDuration).toISOString();
        }

        const newEvent = {
          title: parent.title,
          description: parent.description,
          starts_at: occurrence.toISOString(),
          ends_at: endsAt,
          venue_name: parent.venue_name,
          address: parent.address,
          city: parent.city,
          lat: parent.lat,
          lng: parent.lng,
          category: parent.category,
          image_url: parent.image_url,
          ticket_price: parent.ticket_price,
          max_group_size: parent.max_group_size,
          allow_come_alone: parent.allow_come_alone,
          host_org_id: parent.host_org_id,
          parent_event_id: parent.id,
          recurrence_type: 'none', // Child events don't recur themselves
          organizer_logo_url: parent.organizer_logo_url,
          source: 'recurring',
        };

        const { error: insertError } = await supabase
          .from('events')
          .insert(newEvent);

        if (insertError) {
          console.error(`[generate-recurring] Error creating event for ${occurrence.toDateString()}:`, insertError);
        } else {
          console.log(`[generate-recurring] Created event for ${occurrence.toDateString()}`);
          totalCreated++;
        }
      }
    }

    console.log(`[generate-recurring] Completed. Created ${totalCreated} new events.`);

    return new Response(
      JSON.stringify({ success: true, created: totalCreated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[generate-recurring] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
