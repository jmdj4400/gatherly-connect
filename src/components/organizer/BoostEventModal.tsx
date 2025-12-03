import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, TrendingUp, BarChart3, Eye, Check, Loader2 } from "lucide-react";
import { useCreateBoostCheckout, useEventBoost } from "@/hooks/useVenueBoosts";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

interface BoostEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
  };
  orgId: string;
}

const BOOST_TIERS = [
  {
    level: "basic" as const,
    name: "Basic Boost",
    price: 199,
    description: "Get more visibility for your event",
    features: [
      "Priority placement in event feed",
      "Boosted badge on event card",
      "10% boost weight in matching algorithm",
    ],
    recommended: false,
  },
  {
    level: "pro" as const,
    name: "Pro Boost",
    price: 499,
    description: "Maximum visibility and insights",
    features: [
      "Top priority placement in event feed",
      "Premium boosted badge",
      "25% boost weight in matching algorithm",
      "Detailed analytics dashboard",
      "Highlighted in email digests",
    ],
    recommended: true,
  },
];

export function BoostEventModal({ open, onOpenChange, event, orgId }: BoostEventModalProps) {
  const [selectedTier, setSelectedTier] = useState<"basic" | "pro">("pro");
  const createCheckout = useCreateBoostCheckout();
  const { data: existingBoost, isLoading: checkingBoost } = useEventBoost(event.id);

  if (!isFeatureEnabled("VENUE_BOOST")) {
    return null;
  }

  const handleBoost = () => {
    createCheckout.mutate({
      orgId,
      eventId: event.id,
      level: selectedTier,
    });
  };

  const isLoading = createCheckout.isPending || checkingBoost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Boost Event
          </DialogTitle>
          <DialogDescription>
            Increase visibility for "{event.title}"
          </DialogDescription>
        </DialogHeader>

        {existingBoost ? (
          <div className="py-6 text-center">
            <Badge variant="default" className="mb-4">
              <TrendingUp className="h-3 w-3 mr-1" />
              Already Boosted
            </Badge>
            <p className="text-muted-foreground">
              This event already has an active {existingBoost.level} boost.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {BOOST_TIERS.map((tier) => (
                <Card
                  key={tier.level}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTier === tier.level
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-muted-foreground/30"
                  )}
                  onClick={() => setSelectedTier(tier.level)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{tier.name}</span>
                          {tier.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tier.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">{tier.price}</span>
                        <span className="text-muted-foreground text-sm">kr/mo</span>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Estimated +40% more views
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Cancel anytime
                </span>
              </div>

              <Button
                onClick={handleBoost}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Boost for {BOOST_TIERS.find((t) => t.level === selectedTier)?.price}kr/mo
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
