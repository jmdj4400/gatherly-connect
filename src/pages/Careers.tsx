import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function Careers() {
  const { t } = useTranslation();

  const perks = [
    t('careers.perks.flexible'),
    t('careers.perks.remote'),
    t('careers.perks.events'),
    t('careers.perks.learning'),
    t('careers.perks.health'),
    t('careers.perks.equity'),
  ];

  return (
    <>
      <Helmet>
        <title>{t('careers.title')} | Gatherly</title>
        <meta name="description" content={t('careers.meta')} />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('nav.back')}
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-4">{t('careers.title')}</h1>
          <p className="text-xl text-muted-foreground mb-12">
            {t('careers.intro')}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t('careers.perks.title')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{perk}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="text-center py-8 px-6 rounded-xl bg-muted/50">
            <h2 className="text-xl font-semibold mb-4">{t('careers.spontaneous.title')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('careers.spontaneous.text')}
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:jobs@gatherly.app">{t('careers.spontaneous.cta')}</a>
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}
