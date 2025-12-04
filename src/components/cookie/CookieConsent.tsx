import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X, Settings, Cookie } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  functional: false,
};

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFERENCES_KEY = "cookie-preferences";

export function getCookieConsent(): boolean {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "true";
}

export function getCookiePreferences(): CookiePreferences {
  const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultPreferences;
    }
  }
  return defaultPreferences;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setShowBanner(false);
    setShowSettings(false);
    
    // Dispatch event for other parts of the app to react
    window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: prefs }));
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5 duration-300">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Vi bruger cookies</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Vi bruger cookies for at forbedre din oplevelse, analysere trafik og vise relevante annoncer. 
                    Du kan tilpasse dine præferencer eller acceptere alle cookies.{" "}
                    <Link to="/cookies" className="text-primary hover:underline">
                      Læs mere
                    </Link>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mt-1 -mr-1"
                  onClick={handleRejectNonEssential}
                  aria-label="Afvis ikke-nødvendige cookies"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Tilpas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectNonEssential}
                >
                  Kun nødvendige
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                >
                  Acceptér alle
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie-indstillinger</DialogTitle>
            <DialogDescription>
              Vælg hvilke typer cookies du vil tillade. Nødvendige cookies er altid aktiveret.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Nødvendige cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Disse cookies er nødvendige for at siden fungerer korrekt og kan ikke slås fra.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Funktionelle cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Disse cookies husker dine præferencer og forbedrer din oplevelse.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, functional: checked }))
                }
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Analytiske cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Disse cookies hjælper os med at forstå, hvordan besøgende bruger siden.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Markedsføringscookies</Label>
                <p className="text-sm text-muted-foreground">
                  Disse cookies bruges til at vise dig relevante annoncer på andre sider.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Annuller
            </Button>
            <Button onClick={handleSavePreferences}>
              Gem indstillinger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
