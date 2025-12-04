import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Heart, Target, Sparkles } from 'lucide-react';

const values = [
  {
    icon: Users,
    title: 'Fællesskab først',
    description: 'Vi tror på, at ægte forbindelser skabes gennem delte oplevelser i virkeligheden.',
  },
  {
    icon: Heart,
    title: 'Inkluderende',
    description: 'Alle er velkomne. Vi gør det nemt at møde op alene og gå derfra med nye venner.',
  },
  {
    icon: Target,
    title: 'Intentionel',
    description: 'Vores matching sikrer, at du møder mennesker med lignende interesser og energi.',
  },
  {
    icon: Sparkles,
    title: 'Autentisk',
    description: 'Ingen swipes, ingen algoritmer der optimerer for engagement. Bare ægte møder.',
  },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>Om Gatherly | Mød mennesker gennem events</title>
        <meta name="description" content="Lær om Gatherly's mission om at hjælpe mennesker med at møde nye venner gennem lokale events og oplevelser." />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-6">Om Gatherly</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-muted-foreground mb-8">
              Gatherly er bygget på en simpel observation: de bedste venskaber starter, når vi mødes i virkeligheden omkring noget, vi begge elsker.
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Vores mission</h2>
              <p className="text-muted-foreground">
                Vi vil gøre det nemt at møde nye mennesker uden det akavede ved at dukke op alene. 
                Vores platform matcher dig med en lille gruppe ligesindede før eventet, så du altid 
                har nogen at mødes med. Ingen swipes, ingen uendeligt scrolling – bare ægte forbindelser 
                gennem delte oplevelser.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Vores værdier</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {values.map((value) => (
                  <div key={value.title} className="p-6 rounded-xl border border-border bg-card">
                    <value.icon className="h-8 w-8 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Vores historie</h2>
              <p className="text-muted-foreground mb-4">
                Gatherly startede i 2024 med en frustreret erkendelse: det er svært at møde nye 
                mennesker som voksen. Dating-apps har skabt en kultur af swipes, men der mangler 
                et sted, hvor vi bare kan møde ligesindede til fælles oplevelser.
              </p>
              <p className="text-muted-foreground">
                Vi byggede Gatherly for alle dem, der gerne vil til koncerten, løbeklubben eller 
                wine-tastingen, men som holder sig tilbage, fordi de ikke har nogen at tage med. 
                Nu kan du melde dig til alene og blive matchet med andre, der også kommer alene.
              </p>
            </section>

            <section className="text-center py-8 px-6 rounded-xl bg-muted/50">
              <h2 className="text-2xl font-semibold mb-4">Vil du være med?</h2>
              <p className="text-muted-foreground mb-6">
                Vi leder altid efter passionerede mennesker, der vil hjælpe med at bygge fremtidens sociale platform.
              </p>
              <Link to="/careers">
                <Button>Se ledige stillinger</Button>
              </Link>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
