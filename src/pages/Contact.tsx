import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageSquare, Building2, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function Contact() {
  const { t } = useTranslation();

  const contactOptions = [
    {
      icon: HelpCircle,
      title: t('contact.support'),
      description: t('contact.support.desc'),
      email: 'support@gatherly.app',
      response: t('contact.response.24h'),
    },
    {
      icon: Building2,
      title: t('contact.business'),
      description: t('contact.business.desc'),
      email: 'partners@gatherly.app',
      response: t('contact.response.48h'),
    },
    {
      icon: MessageSquare,
      title: t('contact.press'),
      description: t('contact.press.desc'),
      email: 'press@gatherly.app',
      response: t('contact.response.24h'),
    },
    {
      icon: Mail,
      title: t('contact.other'),
      description: t('contact.other.desc'),
      email: 'hello@gatherly.app',
      response: t('contact.response.48h'),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('contact.title')} | Gatherly</title>
        <meta name="description" content={t('contact.meta')} />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('nav.back')}
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-4">{t('contact.title')}</h1>
          <p className="text-xl text-muted-foreground mb-12">
            {t('contact.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {contactOptions.map((option) => (
              <Card key={option.title}>
                <CardHeader>
                  <option.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full mb-2" asChild>
                    <a href={`mailto:${option.email}`}>{option.email}</a>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">{option.response}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="text-center py-8 px-6 rounded-xl bg-muted/50">
            <h2 className="text-xl font-semibold mb-4">{t('contact.hq')}</h2>
            <p className="text-muted-foreground">
              Gatherly ApS<br />
              København, Danmark
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
