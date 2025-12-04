import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Cookies = () => {
  const lastUpdated = "4. december 2024";
  const companyName = "Gatherly";
  const contactEmail = "privacy@gatherly.app";

  return (
    <>
      <Helmet>
        <title>Cookiepolitik | {companyName}</title>
        <meta name="description" content={`${companyName}s cookiepolitik - Læs om hvordan vi bruger cookies og lignende teknologier.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Cookiepolitik</h1>
          <p className="text-muted-foreground mb-8">Sidst opdateret: {lastUpdated}</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Hvad er cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies er små tekstfiler, der gemmes på din enhed (computer, tablet eller mobil), 
                når du besøger en hjemmeside. Cookies bruges til at huske dine præferencer, 
                forbedre din oplevelse og analysere, hvordan hjemmesiden bruges.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Hvordan bruger vi cookies?</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                {companyName} bruger cookies til følgende formål:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>At huske din login-status og indstillinger</li>
                <li>At analysere trafik og brugeradfærd for at forbedre tjenesten</li>
                <li>At levere personaliseret indhold og anbefalinger</li>
                <li>At vise relevante annoncer (hvis du har givet samtykke)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Typer af cookies vi bruger</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Nødvendige cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Disse cookies er essentielle for, at hjemmesiden fungerer korrekt. De muliggør 
                    grundlæggende funktioner som navigation og adgang til sikre områder. Hjemmesiden 
                    kan ikke fungere ordentligt uden disse cookies.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Varighed:</strong> Session til 1 år
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Funktionelle cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Disse cookies husker dine valg og præferencer for at give dig en bedre og mere 
                    personlig oplevelse. De kan f.eks. huske dit sprog, region eller andre indstillinger.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Varighed:</strong> 1 måned til 1 år
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Analytiske cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Disse cookies hjælper os med at forstå, hvordan besøgende interagerer med 
                    hjemmesiden, ved at indsamle og rapportere information anonymt. Dette hjælper 
                    os med at forbedre hjemmesidens funktionalitet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Varighed:</strong> Session til 2 år
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Markedsføringscookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Disse cookies bruges til at spore besøgende på tværs af hjemmesider. Formålet er 
                    at vise annoncer, der er relevante og engagerende for den enkelte bruger.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Varighed:</strong> 1 måned til 2 år
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Tredjepartscookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Vi bruger følgende tredjepartstjenester, som kan sætte cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Supabase:</strong> Autentifikation og sessionshåndtering</li>
                <li><strong>Stripe:</strong> Betalingsbehandling (kun ved køb)</li>
                <li><strong>Google Analytics:</strong> Webanalyse (hvis aktiveret)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Sådan administrerer du cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Du kan til enhver tid ændre dine cookie-præferencer ved at:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Klikke på &quot;Cookie-indstillinger&quot; i bunden af siden</li>
                <li>Ændre indstillingerne i din browser</li>
                <li>Slette eksisterende cookies via din browser</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Bemærk, at hvis du blokerer alle cookies, kan nogle funktioner på hjemmesiden 
                muligvis ikke fungere korrekt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Browser-indstillinger</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                De fleste browsere giver dig mulighed for at kontrollere cookies via indstillingerne. 
                Her er links til instruktioner for de mest populære browsere:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a href="https://support.mozilla.org/da/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a href="https://support.apple.com/da-dk/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Safari
                  </a>
                </li>
                <li>
                  <a href="https://support.microsoft.com/da-dk/microsoft-edge/slet-cookies-i-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Ændringer til denne politik</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi kan opdatere denne cookiepolitik fra tid til anden for at afspejle ændringer i 
                vores praksis eller af andre operationelle, juridiske eller regulatoriske årsager.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Har du spørgsmål til vores brug af cookies, er du velkommen til at kontakte os på:{" "}
                <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cookies;
