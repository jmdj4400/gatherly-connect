import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Quote, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function Stories() {
  const { t, language } = useTranslation();

  const stories = language === 'da' ? [
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
  ] : [
    {
      venue: 'Running Club CPH',
      type: 'Running Club',
      quote: "We've seen 40% more participants at our weekly runs since starting with Gatherly. The best part is people actually show up because they already have a group to run with.",
      author: 'Marie Jensen',
      role: 'Founder',
      stats: { members: '320+', events: '48', attendance: '92%' },
    },
    {
      venue: 'Wine Bar Nørrebro',
      type: 'Wine Bar',
      quote: 'Our wine tastings were hard to fill. Now we have a waitlist for every event. Gatherly guests are engaged and often become regulars.',
      author: 'Thomas Andersen',
      role: 'Owner',
      stats: { members: '180+', events: '24', attendance: '88%' },
    },
    {
      venue: 'Student House Aarhus',
      type: 'Student Association',
      quote: "New students struggle to meet people. With Gatherly, they can sign up alone and get matched with other new students. It's transformed our intro weeks.",
      author: 'Sofie Madsen',
      role: 'Association Chair',
      stats: { members: '850+', events: '120', attendance: '85%' },
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('stories.title')} | Gatherly</title>
        <meta name="description" content={t('stories.meta')} />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('nav.back')}
            </Button>
          </Link>

          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">{t('stories.title')}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('stories.subtitle')}
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
                          <div className="text-xs text-muted-foreground">{t('stories.stats.members')}</div>
                        </div>
                        <div className="text-center">
                          <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                          <div className="text-2xl font-bold">{story.stats.events}</div>
                          <div className="text-xs text-muted-foreground">{t('stories.stats.events')}</div>
                        </div>
                        <div className="text-center">
                          <TrendingUp className="h-6 w-6 mx-auto text-primary mb-2" />
                          <div className="text-2xl font-bold">{story.stats.attendance}</div>
                          <div className="text-xs text-muted-foreground">{t('stories.stats.attendance')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="text-center py-12 px-6 rounded-xl bg-muted/50">
            <h2 className="text-2xl font-semibold mb-4">{t('stories.cta.title')}</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {t('stories.cta.text')}
            </p>
            <Button size="lg" asChild>
              <Link to="/partners">{t('stories.cta.button')}</Link>
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}
