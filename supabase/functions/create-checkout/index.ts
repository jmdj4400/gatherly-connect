import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs - create these in Stripe Dashboard
const PRICE_CONFIG = {
  A: { basic: 2900, plus: 4900 }, // 29kr, 49kr
  B: { basic: 3900, plus: 5900 }, // 39kr, 59kr (test variant)
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

    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan || !["basic", "plus"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's price group (A/B test)
    const { data: profile } = await supabase
      .from("profiles")
      .select("price_group, email")
      .eq("id", user.id)
      .single();

    // Assign price group if not set
    let priceGroup = profile?.price_group;
    if (!priceGroup) {
      priceGroup = Math.random() < 0.5 ? "A" : "B";
      await supabase
        .from("profiles")
        .update({ price_group: priceGroup })
        .eq("id", user.id);
    }

    const priceAmount = PRICE_CONFIG[priceGroup as "A" | "B"][plan as "basic" | "plus"];

    // Check for existing Stripe customer
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        metadata: {
          supabase_user_id: user.id,
          price_group: priceGroup,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: plan === "basic" ? "Gatherly Basic" : "Gatherly Plus",
              description: plan === "basic" 
                ? "Priority matching & see who joined" 
                : "All Basic features + early event access",
            },
            unit_amount: priceAmount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
          plan,
          price_group: priceGroup,
        },
      },
      success_url: successUrl || `${req.headers.get("origin")}/premium?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/premium?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        price_group: priceGroup,
      },
    });

    console.log(`[create-checkout] Created session for user ${user.id}, plan: ${plan}, group: ${priceGroup}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        priceGroup,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-checkout] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
