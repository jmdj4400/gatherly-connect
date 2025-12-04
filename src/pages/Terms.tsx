import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  const lastUpdated = "4. december 2024";
  const companyName = "Gatherly";
  const contactEmail = "support@gatherly.app";

  return (
    <>
      <Helmet>
        <title>Brugervilkår | {companyName}</title>
        <meta name="description" content={`${companyName}s brugervilkår - Læs vores vilkår og betingelser for brug af platformen.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Brugervilkår</h1>
          <p className="text-muted-foreground mb-8">Sidst opdateret: {lastUpdated}</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Accept af vilkår</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ved at oprette en konto eller bruge {companyName} accepterer du disse brugervilkår. 
                Hvis du ikke accepterer vilkårene, må du ikke bruge tjenesten. Vi anbefaler, at du 
                læser vilkårene grundigt, før du begynder at bruge platformen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Om tjenesten</h2>
              <p className="text-muted-foreground leading-relaxed">
                {companyName} er en platform, der forbinder mennesker gennem events og aktiviteter. 
                Vi gør det muligt for brugere at deltage i events alene og blive matchet med andre 
                deltagere i små grupper for at skabe nye sociale forbindelser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Oprettelse af konto</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">For at bruge {companyName} skal du:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Være mindst 16 år gammel</li>
                <li>Oprette en konto med korrekte oplysninger</li>
                <li>Holde dine loginoplysninger fortrolige</li>
                <li>Straks informere os om uautoriseret brug af din konto</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Du er ansvarlig for al aktivitet, der sker via din konto.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Brugeradfærd</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Ved brug af {companyName} accepterer du at:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Behandle andre brugere med respekt og værdighed</li>
                <li>Ikke dele stødende, truende eller ulovligt indhold</li>
                <li>Ikke chikanere, mobbe eller diskriminere andre brugere</li>
                <li>Ikke udgive dig for at være en anden person</li>
                <li>Ikke bruge platformen til kommercielle formål uden tilladelse</li>
                <li>Ikke forsøge at omgå platformens sikkerhedsforanstaltninger</li>
                <li>Overholde alle gældende love og regler</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Event-deltagelse</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Når du tilmelder dig et event:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Forpligter du dig til at møde op som aftalt</li>
                <li>Accepterer du at blive matchet med andre deltagere</li>
                <li>Deles dit navn og profilbillede med din gruppe</li>
                <li>Skal du afmelde dig i god tid, hvis du ikke kan deltage</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Gentagne udeblivelser uden afbud kan resultere i begrænsninger på din konto.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Gruppechat</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vores gruppechat-funktion er beregnet til koordinering mellem gruppemedlemmer. 
                Chatbeskeder kan blive modereret automatisk for at sikre et sikkert miljø. 
                Vi forbeholder os retten til at fjerne indhold, der overtræder vores retningslinjer, 
                og til at suspendere brugere, der gentagne gange overtræder reglerne.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Brugerindhold</h2>
              <p className="text-muted-foreground leading-relaxed">
                Du bevarer ejerskabet over det indhold, du uploader til {companyName}. Ved at uploade 
                indhold giver du os en ikke-eksklusiv, verdensomspændende, royaltyfri licens til at 
                bruge, vise og distribuere indholdet i forbindelse med tjenesten. Du garanterer, at 
                du har ret til at dele det indhold, du uploader.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Premium-abonnement</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                {companyName} tilbyder valgfrie premium-funktioner mod betaling:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Abonnementer fornyes automatisk, medmindre de opsiges</li>
                <li>Du kan opsige dit abonnement når som helst via din profil</li>
                <li>Refusion gives kun i overensstemmelse med gældende forbrugerlovgivning</li>
                <li>Prisændringer varsles mindst 30 dage i forvejen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Ansvarsfraskrivelse</h2>
              <p className="text-muted-foreground leading-relaxed">
                {companyName} leveres &quot;som den er&quot; uden garantier af nogen art. Vi garanterer ikke, 
                at tjenesten vil være fejlfri eller uafbrudt. Vi er ikke ansvarlige for interaktioner 
                mellem brugere uden for platformen eller for eventarrangørers handlinger. Deltagelse 
                i events sker på eget ansvar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Ansvarsbegrænsning</h2>
              <p className="text-muted-foreground leading-relaxed">
                I det omfang loven tillader det, er {companyName} ikke ansvarlig for indirekte skader, 
                følgeskader eller tab af data. Vores samlede ansvar er begrænset til det beløb, du har 
                betalt til os i de seneste 12 måneder, eller 500 DKK, alt efter hvad der er højest.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Suspendering og ophør</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Vi kan suspendere eller lukke din konto, hvis du:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Overtræder disse brugervilkår</li>
                <li>Udviser adfærd, der skader andre brugere eller platformen</li>
                <li>Bruger platformen til ulovlige formål</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Du kan til enhver tid slette din konto via dine profilindstillinger.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Immaterielle rettigheder</h2>
              <p className="text-muted-foreground leading-relaxed">
                {companyName}, herunder logo, design, kode og indhold, er beskyttet af ophavsret og 
                andre immaterielle rettigheder. Du må ikke kopiere, modificere eller distribuere 
                noget af vores materiale uden skriftlig tilladelse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Ændringer af vilkår</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vi kan opdatere disse vilkår fra tid til anden. Væsentlige ændringer vil blive 
                kommunikeret via e-mail eller en meddelelse i appen mindst 30 dage før de træder i kraft. 
                Din fortsatte brug af tjenesten efter ændringer udgør accept af de opdaterede vilkår.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Lovvalg og værneting</h2>
              <p className="text-muted-foreground leading-relaxed">
                Disse vilkår er underlagt dansk ret. Eventuelle tvister skal afgøres ved de danske 
                domstole. Som forbruger har du dog altid ret til at anlægge sag ved domstolene i 
                dit hjemland.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Har du spørgsmål til disse brugervilkår, er du velkommen til at kontakte os på:{" "}
                <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
