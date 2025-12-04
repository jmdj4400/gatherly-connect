import { Link } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsPremium } from "@/hooks/useSubscription";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useTranslation } from "@/lib/i18n";

export function UpgradeCTA() {
  const { isPremium, plan, isTrialing, trialEndsAt } = useIsPremium();
  const { t } = useTranslation();

  // Don't show if premium features are disabled
  if (!isFeatureEnabled("PREMIUM_FEATURES")) {
    return null;
  }

  // Show current status if premium
  if (isPremium) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  {plan === "plus" ? "Plus" : "Basic"} {t('premium.member')}
                  {isTrialing && (
                    <Badge variant="secondary" className="text-xs">{t('premium.trial_badge')}</Badge>
                  )}
                </p>
                {isTrialing && trialEndsAt && (
                  <p className="text-xs text-muted-foreground">
                    {t('premium.trial_ends_date')} {trialEndsAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Link to="/premium">
              <Button variant="ghost" size="sm">{t('premium.manage')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upgrade CTA for free users
  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{t('premium.upgrade')}</p>
              <p className="text-xs text-muted-foreground">
                {t('premium.upgrade_desc')}
              </p>
            </div>
          </div>
          <Link to="/premium">
            <Button size="sm">
              {t('premium.try_free')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
