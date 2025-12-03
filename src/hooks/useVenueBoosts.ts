import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface VenueBoost {
  id: string;
  org_id: string;
  event_id: string;
  level: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  price_amount: number;
  created_at: string;
}

export function useVenueBoosts(orgId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["venue-boosts", orgId],
    queryFn: async (): Promise<VenueBoost[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("venue_boosts")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!user,
  });
}

export function useEventBoost(eventId?: string) {
  return useQuery({
    queryKey: ["event-boost", eventId],
    queryFn: async (): Promise<VenueBoost | null> => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("venue_boosts")
        .select("*")
        .eq("event_id", eventId)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useCreateBoostCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orgId, 
      eventId, 
      level 
    }: { 
      orgId: string; 
      eventId: string; 
      level: "basic" | "pro"; 
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("create-boost-checkout", {
        body: {
          orgId,
          eventId,
          level,
          successUrl: `${window.location.origin}/organizer/events?boost_success=true`,
          cancelUrl: `${window.location.origin}/organizer/events?boost_canceled=true`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("[useCreateBoostCheckout] Error:", error);
      toast.error("Failed to create checkout session");
    },
  });
}

export function useActiveBoosts() {
  return useQuery({
    queryKey: ["active-boosts"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("venue_boosts")
        .select("event_id")
        .eq("status", "active");

      if (error) throw error;
      return (data || []).map((b) => b.event_id);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
