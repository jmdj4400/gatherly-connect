import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  event_id: string;
  asset_type: 'story' | 'post' | 'both';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_id, asset_type = 'both' }: GenerateRequest = await req.json();

    if (!event_id) {
      return new Response(
        JSON.stringify({ error: 'Missing event_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-assets] Generating ${asset_type} for event ${event_id}`);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('[generate-assets] Event not found:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format event date/time
    const eventDate = new Date(event.starts_at);
    const dateStr = eventDate.toLocaleDateString('da-DK', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    const timeStr = eventDate.toLocaleTimeString('da-DK', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const results: { story?: string; post?: string } = {};
    const typesToGenerate = asset_type === 'both' ? ['story', 'post'] : [asset_type];

    for (const type of typesToGenerate) {
      const isStory = type === 'story';
      const dimensions = isStory ? '1080x1920 (9:16 portrait)' : '1080x1080 (square)';
      
      const prompt = `Create a vibrant, eye-catching Instagram ${isStory ? 'story' : 'post'} image for an event promotion.

Event Details:
- Title: "${event.title}"
- Date: ${dateStr}
- Time: ${timeStr}
- Location: ${event.venue_name || event.address || event.city || 'TBA'}
${event.category ? `- Category: ${event.category}` : ''}

Design Requirements:
- Dimensions: ${dimensions}
- Modern, clean design with bold typography
- Include the event title prominently
- Show date and time clearly
- Include a "Join Alone → Get Matched" badge/tag in a contrasting color
- Use warm, social colors (coral, orange tones)
- Leave space at bottom for a QR code area (don't draw QR, just leave space)
- Make it feel inviting and social
- No placeholder text, use actual event details

Style: Modern event flyer, vibrant gradients, professional typography`;

      console.log(`[generate-assets] Generating ${type} image...`);

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: 'user', content: prompt }],
          modalities: ['image', 'text'],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`[generate-assets] AI generation failed:`, errorText);
        continue;
      }

      const aiData = await aiResponse.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        console.error(`[generate-assets] No image in response for ${type}`);
        continue;
      }

      console.log(`[generate-assets] Generated ${type} image successfully`);

      // Store in database
      const { error: upsertError } = await supabase
        .from('event_assets')
        .upsert({
          event_id,
          asset_type: type,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'event_id,asset_type',
        });

      if (upsertError) {
        console.error(`[generate-assets] Error saving ${type}:`, upsertError);
      } else {
        results[type as 'story' | 'post'] = imageUrl;
      }
    }

    return new Response(
      JSON.stringify({ success: true, assets: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[generate-assets] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
