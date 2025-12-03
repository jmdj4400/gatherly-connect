import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, Crown, Sparkles, Users, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useIsPremium, useCreateCheckout, usePriceGroup } from "@/hooks/useSubscription";
import { trackAnalytics } from "@/lib/logger";
import { toast } from "sonner";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { BottomNav } from "@/components/layout/BottomNav";

const PRICE_CONFIG = {
  A: { basic: 29, plus: 49 },
  B: { basic: 39, plus: 59 },
};

const BENEFITS = {
  basic: [
    { icon: Zap, text: "Priority matching (10-20% boost)" },
    { icon: Eye, text: "See who joined events" },
    { icon: Users, text: "Larger group preferences" },
  ],
  plus: [
    { icon: Zap, text: "Priority matching (10-20% boost)" },
    { icon: Eye, text: "See who joined events" },
    { icon: Users, text: "Larger group preferences" },
    { icon: Sparkles, text: "Early access to new events" },
    { icon: Crown, text: "Premium badge on profile" },
  ],
};

export default function Premium() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, plan, isTrialing, trialEndsAt } = useIsPremium();
  const { data: priceGroup } = usePriceGroup();
  const createCheckout = useCreateCheckout();

  const prices = PRICE_CONFIG[priceGroup || "A"];

  useEffect(() => {
    trackAnalytics("premium_offered", { priceGroup, isLoggedIn: !!user });
  }, [priceGroup, user]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      trackAnalytics("premium_converted", { priceGroup });
      trackAnalytics("trial_started", { priceGroup });
      toast.success("Welcome to Premium! Your 7-day trial has started.");
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled. You can upgrade anytime.");
    }
  }, [searchParams, priceGroup]);

  const handleUpgrade = (selectedPlan: "basic" | "plus") => {
    if (!user) {
      toast.error("Please sign in to upgrade");
      return;
    }
    createCheckout.mutate(selectedPlan);
  };

  // Feature flag check
  if (!isFeatureEnabled("PREMIUM_FEATURES")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Premium features are not yet available. Check back soon!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gatherly Premium - Unlock Better Matching</title>
        <meta name="description" content="Get priority matching, see who's attending, and unlock exclusive features with Gatherly Premium." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              7-day free trial
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Upgrade to <span className="text-primary">Premium</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Get matched faster, see who's attending, and make the most of every event.
            </p>
          </div>

          {/* Current Status */}
          {isPremium && (
            <Card className="mb-8 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">
                      You're on {plan === "plus" ? "Plus" : "Basic"}
                      {isTrialing && " (Trial)"}
                    </p>
                    {isTrialing && trialEndsAt && (
                      <p className="text-sm text-muted-foreground">
                        Trial ends {trialEndsAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Plan */}
            <Card className={`relative ${plan === "basic" ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Basic
                  {plan === "basic" && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>Essential premium features</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold">{prices.basic}</span>
                  <span className="text-muted-foreground"> kr/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {BENEFITS.basic.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan === "basic" ? "secondary" : "default"}
                  onClick={() => handleUpgrade("basic")}
                  disabled={plan === "basic" || createCheckout.isPending}
                >
                  {plan === "basic" ? "Current Plan" : "Start Free Trial"}
                </Button>
              </CardFooter>
            </Card>

            {/* Plus Plan */}
            <Card className={`relative ${plan === "plus" ? "border-primary" : "border-primary/50"}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Plus
                  {plan === "plus" && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>Everything in Basic + more</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold">{prices.plus}</span>
                  <span className="text-muted-foreground"> kr/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {BENEFITS.plus.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan === "plus" ? "secondary" : "default"}
                  onClick={() => handleUpgrade("plus")}
                  disabled={plan === "plus" || createCheckout.isPending}
                >
                  {plan === "plus" ? "Current Plan" : "Start Free Trial"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Cancel anytime during your trial. No questions asked.
            </p>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
