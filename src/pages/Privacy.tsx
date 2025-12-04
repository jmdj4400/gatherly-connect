import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  const lastUpdated = "4. december 2024";
  const companyName = "Gatherly";
  const contactEmail = "privacy@gatherly.app";

  return (
    <>
      <Helmet>
        <title>Privatlivspolitik | {companyName}</title>
        <meta name="description" content={`${companyName}s privatlivspolitik - Læs om hvordan vi behandler dine personoplysninger i overensstemmelse med GDPR.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Privatlivspolitik</h1>
          <p className="text-muted-foreground mb-8">Sidst opdateret: {lastUpdated}</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduktion</h2>
              <p className="text-muted-foreground leading-relaxed">
                Hos {companyName} tager vi dit privatliv alvorligt. Denne privatlivspolitik forklarer, 
                hvordan vi indsamler, bruger, opbevarer og beskytter dine personoplysninger, når du 
                bruger vores tjenester. Vi overholder EU&apos;s Generelle Databeskyttelsesforordning (GDPR) 
                og den danske databeskyttelseslov.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Dataansvarlig</h2>
              <p className="text-muted-foreground leading-relaxed">
                {companyName} er dataansvarlig for behandlingen af dine personoplysninger. 
                Du kan kontakte os på: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Hvilke oplysninger indsamler vi?</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Vi indsamler følgende kategorier af personoplysninger:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Kontaktoplysninger:</strong> Navn, e-mailadresse</li>
                <li><strong>Profiloplysninger:</strong> Profilbillede, interesser, by, sprogpræferencer</li>
                <li><strong>Brugsdata:</strong> Deltagelse i events, gruppemedlemskab, chatbeskeder</li>
                <li><strong>Tekniske data:</strong> IP-adresse, browsertype, enhedsoplysninger</li>
                <li><strong>Lokationsdata:</strong> Omtrentlig placering baseret på din angivne by</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Hvorfor behandler vi dine oplysninger?</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Vi behandler dine personoplysninger til følgende formål:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>At levere og forbedre vores tjenester</li>
                <li>At matche dig med relevante events og grupper</li>
                <li>At sende dig notifikationer om events og beskeder</li>
                <li>At sikre platformens sikkerhed og forebygge misbrug</li>
                <li>At overholde lovmæssige forpligtelser</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Retsgrundlag</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Vi behandler dine personoplysninger baseret på følgende retsgrundlag:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Samtykke (artikel 6(1)(a)):</strong> Til markedsføring og valgfrie funktioner</li>
                <li><strong>Kontrakt (artikel 6(1)(b)):</strong> For at levere vores tjenester til dig</li>
                <li><strong>Legitime interesser (artikel 6(1)(f)):</strong> Til sikkerhed og forbedring af tjenesten</li>
                <li><strong>Retlig forpligtelse (artikel 6(1)(c)):</strong> For at overholde lovkrav</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Deling af oplysninger</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Vi deler dine oplysninger med:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Andre brugere:</strong> Dit navn og profilbillede vises for andre gruppemedlemmer</li>
                <li><strong>Eventarrangører:</strong> Når du tilmelder dig et event</li>
                <li><strong>Tjenesteudbydere:</strong> Hosting, analytics og betalingsbehandling</li>
                <li><strong>Myndigheder:</strong> Når det kræves ved lov</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Vi sælger aldrig dine personoplysninger til tredjeparter.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Opbevaring af data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi opbevarer dine personoplysninger, så længe du har en aktiv konto hos os. 
                Hvis du sletter din konto, vil vi slette eller anonymisere dine data inden for 30 dage, 
                medmindre vi er forpligtet til at opbevare dem længere af juridiske årsager.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Dine rettigheder</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Under GDPR har du følgende rettigheder:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Ret til indsigt:</strong> Du kan anmode om en kopi af dine data</li>
                <li><strong>Ret til berigtigelse:</strong> Du kan rette unøjagtige oplysninger</li>
                <li><strong>Ret til sletning:</strong> Du kan anmode om at få dine data slettet</li>
                <li><strong>Ret til begrænsning:</strong> Du kan begrænse behandlingen af dine data</li>
                <li><strong>Ret til dataportabilitet:</strong> Du kan få dine data i et maskinlæsbart format</li>
                <li><strong>Ret til indsigelse:</strong> Du kan gøre indsigelse mod behandling baseret på legitime interesser</li>
                <li><strong>Ret til at trække samtykke tilbage:</strong> Du kan til enhver tid trække dit samtykke tilbage</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                For at udøve dine rettigheder, kontakt os på <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Sikkerhed</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi implementerer passende tekniske og organisatoriske sikkerhedsforanstaltninger for at beskytte 
                dine personoplysninger mod uautoriseret adgang, ændring, videregivelse eller sletning. 
                Dette inkluderer kryptering, adgangskontrol og regelmæssige sikkerhedsvurderinger.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi bruger cookies og lignende teknologier til at forbedre din oplevelse, huske dine præferencer 
                og analysere brugen af vores tjeneste. Du kan administrere dine cookie-præferencer i din browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Internationale overførsler</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dine data kan blive overført til og behandlet i lande uden for EU/EØS. 
                I sådanne tilfælde sikrer vi, at der er passende beskyttelsesforanstaltninger på plads, 
                såsom EU-standardkontraktbestemmelser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Børns privatliv</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vores tjeneste er ikke rettet mod børn under 16 år. Vi indsamler ikke bevidst 
                personoplysninger fra børn under denne alder. Hvis du bliver opmærksom på, at et barn 
                har givet os personoplysninger, bedes du kontakte os.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Ændringer til denne politik</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi kan opdatere denne privatlivspolitik fra tid til anden. Vi vil informere dig om 
                væsentlige ændringer via e-mail eller en meddelelse i appen. Din fortsatte brug af 
                tjenesten efter ændringer udgør accept af den opdaterede politik.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Klageadgang</h2>
              <p className="text-muted-foreground leading-relaxed">
                Hvis du mener, at vi ikke behandler dine personoplysninger korrekt, kan du indgive en 
                klage til Datatilsynet: <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.datatilsynet.dk</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Har du spørgsmål til denne privatlivspolitik eller vores behandling af dine personoplysninger, 
                er du velkommen til at kontakte os på: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
