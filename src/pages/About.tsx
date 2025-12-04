import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Heart, Target, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function About() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Users,
      title: t('about.values.community'),
      description: t('about.values.community.desc'),
    },
    {
      icon: Heart,
      title: t('about.values.inclusive'),
      description: t('about.values.inclusive.desc'),
    },
    {
      icon: Target,
      title: t('about.values.intentional'),
      description: t('about.values.intentional.desc'),
    },
    {
      icon: Sparkles,
      title: t('about.values.authentic'),
      description: t('about.values.authentic.desc'),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('about.title')} | Gatherly</title>
        <meta name="description" content={t('about.meta')} />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('nav.back')}
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-6">{t('about.title')}</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-muted-foreground mb-8">
              {t('about.intro')}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{t('about.mission.title')}</h2>
              <p className="text-muted-foreground">
                {t('about.mission.text')}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">{t('about.values.title')}</h2>
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
              <h2 className="text-2xl font-semibold mb-4">{t('about.history.title')}</h2>
              <p className="text-muted-foreground mb-4">
                {t('about.history.p1')}
              </p>
              <p className="text-muted-foreground">
                {t('about.history.p2')}
              </p>
            </section>

            <section className="text-center py-8 px-6 rounded-xl bg-muted/50">
              <h2 className="text-2xl font-semibold mb-4">{t('about.join.title')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('about.join.text')}
              </p>
              <Link to="/careers">
                <Button>{t('about.join.cta')}</Button>
              </Link>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
