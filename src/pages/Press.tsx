import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function Press() {
  const { t, language } = useTranslation();

  const pressReleases = language === 'da' ? [
    {
      date: '15. november 2024',
      title: 'Gatherly lancerer i 7 danske byer',
      excerpt: 'Efter en succesfuld beta-periode udvider Gatherly nu til København, Aarhus, Odense, Aalborg, Esbjerg, Randers og Horsens.',
    },
    {
      date: '1. september 2024',
      title: 'Gatherly rejser seed-funding',
      excerpt: 'Gatherly har rejst pre-seed finansiering for at accelerere udviklingen af platformen og udvide til flere byer.',
    },
    {
      date: '1. juni 2024',
      title: 'Gatherly lancerer beta',
      excerpt: 'Den nye platform, der matcher mennesker til events baseret på interesser og social energi, åbner for beta-brugere.',
    },
  ] : [
    {
      date: 'November 15, 2024',
      title: 'Gatherly launches in 7 Danish cities',
      excerpt: 'After a successful beta period, Gatherly now expands to Copenhagen, Aarhus, Odense, Aalborg, Esbjerg, Randers, and Horsens.',
    },
    {
      date: 'September 1, 2024',
      title: 'Gatherly raises seed funding',
      excerpt: 'Gatherly has raised pre-seed funding to accelerate platform development and expand to more cities.',
    },
    {
      date: 'June 1, 2024',
      title: 'Gatherly launches beta',
      excerpt: 'The new platform that matches people for events based on interests and social energy opens for beta users.',
    },
  ];

  const stats = [
    { label: t('press.stats.groups'), value: '12,000+' },
    { label: t('press.stats.events'), value: '500+' },
    { label: t('press.stats.cities'), value: '7' },
    { label: t('press.stats.size'), value: '4' },
  ];

  return (
    <>
      <Helmet>
        <title>{t('press.title')} | Gatherly</title>
        <meta name="description" content={t('press.meta')} />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('nav.back')}
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-4">{t('press.title')}</h1>
          <p className="text-xl text-muted-foreground mb-12">
            {t('press.subtitle')}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t('press.stats')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl border border-border bg-card text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t('press.releases')}</h2>
            <div className="space-y-4">
              {pressReleases.map((release) => (
                <Card key={release.title}>
                  <CardHeader>
                    <CardDescription>{release.date}</CardDescription>
                    <CardTitle className="text-lg">{release.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{release.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t('press.materials')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    {t('press.brand')}
                  </CardTitle>
                  <CardDescription>{t('press.brand.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:press@gatherly.app?subject=Request brand assets">
                      {t('press.request')}
                    </a>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    {t('press.photos')}
                  </CardTitle>
                  <CardDescription>{t('press.photos.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:press@gatherly.app?subject=Request product images">
                      {t('press.request')}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="text-center py-8 px-6 rounded-xl bg-muted/50">
            <Mail className="h-8 w-8 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-4">{t('press.contact')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('press.contact.text')}
            </p>
            <Button asChild>
              <a href="mailto:press@gatherly.app">press@gatherly.app</a>
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}
