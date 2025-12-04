import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Quote, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stories = [
  {
    venue: 'Løbeklubben CPH',
    type: 'Løbeklub',
    quote: 'Vi har fået 40% flere deltagere til vores ugentlige løb siden vi startede med Gatherly. Det bedste er, at folk faktisk møder op, fordi de allerede har en gruppe at løbe med.',
    author: 'Marie Jensen',
    role: 'Stifter',
    stats: { members: '320+', events: '48', attendance: '92%' },
  },
  {
    venue: 'Vinbaren Nørrebro',
    type: 'Vinbar',
    quote: 'Vores wine-tastings var svære at fylde op. Nu har vi venteliste til hver eneste event. Gatherly-gæsterne er engagerede og bliver ofte til stamgæster.',
    author: 'Thomas Andersen',
    role: 'Ejer',
    stats: { members: '180+', events: '24', attendance: '88%' },
  },
  {
    venue: 'Studenterhuset Aarhus',
    type: 'Studenterforening',
    quote: 'Nye studerende har svært ved at møde folk. Med Gatherly kan de tilmelde sig alene og blive matchet med andre nye studerende. Det har transformeret vores intro-uger.',
    author: 'Sofie Madsen',
    role: 'Foreningsformand',
    stats: { members: '850+', events: '120', attendance: '85%' },
  },
];

export default function Stories() {
  return (
    <>
      <Helmet>
        <title>Succeshistorier | Gatherly</title>
        <meta name="description" content="Se hvordan venues og arrangører bruger Gatherly til at skabe bedre events og øge deltagelsen." />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Succeshistorier</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Se hvordan venues og communities bruger Gatherly til at skabe bedre oplevelser.
            </p>
          </div>

          <div className="space-y-12 mb-16">
            {stories.map((story, index) => (
              <Card key={story.venue} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className={`grid md:grid-cols-2 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className="p-8 flex flex-col justify-center">
                      <span className="text-sm font-medium text-primary mb-2">{story.type}</span>
                      <h2 className="text-2xl font-bold mb-4">{story.venue}</h2>
                      <div className="relative mb-6">
                        <Quote className="h-8 w-8 text-primary/20 absolute -top-2 -left-2" />
                        <p className="text-muted-foreground pl-6 italic">{story.quote}</p>
                      </div>
                      <div>
                        <p className="font-semibold">{story.author}</p>
                        <p className="text-sm text-muted-foreground">{story.role}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-8 flex items-center">
                      <div className="grid grid-cols-3 gap-6 w-full">
                        <div className="text-center">
                          <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                          <div className="text-2xl font-bold">{story.stats.members}</div>
                          <div className="text-xs text-muted-foreground">Medlemmer</div>
                        </div>
                        <div className="text-center">
                          <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                          <div className="text-2xl font-bold">{story.stats.events}</div>
                          <div className="text-xs text-muted-foreground">Events</div>
                        </div>
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 mx-auto text-primary mb-2" />
                          <div className="text-2xl font-bold">{story.stats.attendance}</div>
                          <div className="text-xs text-muted-foreground">Fremmøde</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="text-center py-12 px-6 rounded-xl bg-muted/50">
            <h2 className="text-2xl font-semibold mb-4">Vil du være den næste succeshistorie?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Bliv partner med Gatherly og se, hvordan vi kan hjælpe dig med at skabe bedre events.
            </p>
            <Button size="lg" asChild>
              <Link to="/partners">Bliv partner</Link>
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}
