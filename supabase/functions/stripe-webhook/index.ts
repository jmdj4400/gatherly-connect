import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE")!;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("[stripe-webhook] Signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
    }

    console.log(`[stripe-webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        const priceGroup = session.metadata?.price_group;

        if (userId && plan) {
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            plan,
            status: "trialing",
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            price_group: priceGroup,
            started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: "user_id" });

          console.log(`[stripe-webhook] Created subscription for user ${userId}, plan: ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const status = subscription.status === "active" ? "active" 
            : subscription.status === "trialing" ? "trialing"
            : subscription.status === "past_due" ? "past_due"
            : subscription.status === "canceled" ? "canceled"
            : "inactive";

          await supabase
            .from("subscriptions")
            .update({ 
              status,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          console.log(`[stripe-webhook] Updated subscription ${subscription.id} to status: ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({ 
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`[stripe-webhook] Canceled subscription ${subscription.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // Check if this is a venue boost subscription
          const subscriptionId = invoice.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          if (subscription.metadata?.type === "venue_boost") {
            // Activate venue boost
            const orgId = subscription.metadata.supabase_org_id;
            const eventId = subscription.metadata.supabase_event_id;
            const level = subscription.metadata.boost_level;

            const startsAt = new Date();
            const endsAt = new Date();
            endsAt.setMonth(endsAt.getMonth() + 1);

            await supabase
              .from("venue_boosts")
              .update({
                status: "active",
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
                stripe_subscription_id: subscriptionId,
                updated_at: new Date().toISOString(),
              })
              .eq("org_id", orgId)
              .eq("event_id", eventId)
              .eq("status", "pending");

            console.log(`[stripe-webhook] Activated venue boost for event ${eventId}, level: ${level}`);
          } else {
            // Regular subscription payment
            await supabase
              .from("subscriptions")
              .update({ 
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", subscriptionId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabase
            .from("subscriptions")
            .update({ 
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[stripe-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
