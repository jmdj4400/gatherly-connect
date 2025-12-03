import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { trackAnalytics } from "@/lib/logger";

export type SubscriptionPlan = "basic" | "plus";
export type SubscriptionStatus = "active" | "inactive" | "trialing" | "canceled" | "past_due";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  price_group: "A" | "B" | null;
  trial_ends_at: string | null;
  started_at: string | null;
  canceled_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[useSubscription] Error:", error);
        return null;
      }

      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useIsPremium() {
  const { data: subscription, isLoading } = useSubscription();
  
  const isPremium = subscription?.status === "active" || subscription?.status === "trialing";
  const plan = subscription?.plan || null;
  const isTrialing = subscription?.status === "trialing";
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;

  return { isPremium, plan, isTrialing, trialEndsAt, isLoading };
}

export function useCreateCheckout() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      trackAnalytics("premium_clicked", { plan });

      const response = await supabase.functions.invoke("create-checkout", {
        body: { 
          plan,
          successUrl: `${window.location.origin}/premium?success=true`,
          cancelUrl: `${window.location.origin}/premium?canceled=true`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data as { url: string; sessionId: string; priceGroup: string };
    },
    onSuccess: (data) => {
      trackAnalytics("premium_checkout_started", { priceGroup: data.priceGroup });
      // Redirect to Stripe
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("[useCreateCheckout] Error:", error);
    },
  });
}

export function usePriceGroup() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["priceGroup", user?.id],
    queryFn: async (): Promise<"A" | "B"> => {
      if (!user?.id) {
        // Assign random group for non-logged in users
        return Math.random() < 0.5 ? "A" : "B";
      }

      const { data } = await supabase
        .from("profiles")
        .select("price_group")
        .eq("id", user.id)
        .single();

      if (data?.price_group) {
        return data.price_group as "A" | "B";
      }

      // Assign and save group
      const group = Math.random() < 0.5 ? "A" : "B";
      await supabase
        .from("profiles")
        .update({ price_group: group })
        .eq("id", user.id);

      return group;
    },
    enabled: true,
    staleTime: Infinity,
  });
}
