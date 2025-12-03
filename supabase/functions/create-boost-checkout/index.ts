import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price tiers in DKK øre
const BOOST_PRICES = {
  basic: { amount: 19900, name: "Venue Boost Basic", description: "Priority placement in feed" },
  pro: { amount: 49900, name: "Venue Boost Pro", description: "Maximum visibility + analytics" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE")!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orgId, eventId, level, successUrl, cancelUrl } = await req.json();

    if (!orgId || !eventId || !level) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["basic", "pro"].includes(level)) {
      return new Response(JSON.stringify({ error: "Invalid boost level" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user has org admin/owner role
    const { data: role } = await supabase.rpc("get_org_role", {
      _user_id: user.id,
      _org_id: orgId,
    });

    if (!role || !["org_admin", "org_owner"].includes(role)) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, host_org_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event.host_org_id !== orgId) {
      return new Response(JSON.stringify({ error: "Event does not belong to this org" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing active boost
    const { data: existingBoost } = await supabase
      .from("venue_boosts")
      .select("id")
      .eq("event_id", eventId)
      .eq("status", "active")
      .single();

    if (existingBoost) {
      return new Response(JSON.stringify({ error: "Event already has an active boost" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create org's Stripe customer
    const { data: org } = await supabase
      .from("orgs")
      .select("stripe_customer_id, name, contact_email")
      .eq("id", orgId)
      .single();

    let customerId = org?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: org?.contact_email || user.email,
        name: org?.name,
        metadata: {
          supabase_org_id: orgId,
        },
      });
      customerId = customer.id;

      await supabase
        .from("orgs")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);
    }

    const priceConfig = BOOST_PRICES[level as keyof typeof BOOST_PRICES];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: `${priceConfig.name} - ${event.title}`,
              description: priceConfig.description,
            },
            unit_amount: priceConfig.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          supabase_org_id: orgId,
          supabase_event_id: eventId,
          boost_level: level,
          type: "venue_boost",
        },
      },
      success_url: successUrl || `${req.headers.get("origin")}/organizer/events?boost_success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/organizer/events?boost_canceled=true`,
      metadata: {
        supabase_org_id: orgId,
        supabase_event_id: eventId,
        boost_level: level,
        type: "venue_boost",
      },
    });

    // Create pending boost record
    await supabase.from("venue_boosts").insert({
      org_id: orgId,
      event_id: eventId,
      level,
      status: "pending",
      stripe_customer_id: customerId,
      price_amount: priceConfig.amount,
    });

    console.log(`[create-boost-checkout] Created session for org ${orgId}, event ${eventId}, level: ${level}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-boost-checkout] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
