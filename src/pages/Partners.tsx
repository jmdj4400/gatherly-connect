import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Calendar, BarChart3, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

export default function Partners() {
  const { t, language } = useTranslation();

  const benefits = [
    {
      icon: Users,
      title: t('partners.benefit.guests'),
      description: t('partners.benefit.guests.desc'),
    },
    {
      icon: Calendar,
      title: t('partners.benefit.promo'),
      description: t('partners.benefit.promo.desc'),
    },
    {
      icon: TrendingUp,
      title: t('partners.benefit.engagement'),
      description: t('partners.benefit.engagement.desc'),
    },
    {
      icon: BarChart3,
      title: t('partners.benefit.insights'),
      description: t('partners.benefit.insights.desc'),
    },
  ];

  const plans = [
    {
      name: t('partners.plan.starter'),
      price: language === 'da' ? 'Gratis' : 'Free',
      description: t('partners.plan.starter.desc'),
      features: language === 'da' 
        ? ['Op til 5 events/måned', 'Grundlæggende analytics', 'Automatisk matching', 'Email-support']
        : ['Up to 5 events/month', 'Basic analytics', 'Automatic matching', 'Email support'],
    },
    {
      name: t('partners.plan.pro'),
      price: language === 'da' ? '499 kr/md' : '€49/mo',
      description: t('partners.plan.pro.desc'),
      features: language === 'da'
        ? ['Ubegrænsede events', 'Avanceret analytics', 'Prioriteret visning', 'Custom branding', 'CSV-import af events', 'Dedikeret support']
        : ['Unlimited events', 'Advanced analytics', 'Priority placement', 'Custom branding', 'CSV event import', 'Dedicated support'],
      popular: true,
    },
    {
      name: t('partners.plan.enterprise'),
      price: t('partners.cta.contact'),
      description: t('partners.plan.enterprise.desc'),
      features: language === 'da'
        ? ['Alt i Pro', 'API-adgang', 'White-label mulighed', 'Dedikeret account manager', 'Custom integrationer']
        : ['Everything in Pro', 'API access', 'White-label option', 'Dedicated account manager', 'Custom integrations'],
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('partners.title')} | Gatherly</title>
        <meta name="description" content={t('partners.meta')} />
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
            <h1 className="text-4xl font-bold mb-4">{t('partners.title')}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('partners.subtitle')}
            </p>
          </div>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-8 text-center">{t('partners.why.title')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title}>
                  <CardHeader>
                    <benefit.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-8 text-center">{t('partners.pricing')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.name} className={plan.popular ? 'border-primary ring-2 ring-primary' : ''}>
                  <CardHeader>
                    {plan.popular && (
                      <span className="text-xs font-medium text-primary mb-2">{t('partners.plan.popular')}</span>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-3xl font-bold mt-2">{plan.price}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6" 
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <a href="mailto:partners@gatherly.app">
                        {plan.price === t('partners.cta.contact') ? t('partners.cta.contact') : language === 'da' ? 'Kom i gang' : 'Get started'}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="text-center py-12 px-6 rounded-xl bg-muted/50">
            <h2 className="text-2xl font-semibold mb-4">{t('partners.cta.title')}</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {t('partners.cta.text')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="mailto:partners@gatherly.app">{t('partners.cta.contact')}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/venue">{t('partners.cta.dashboard')}</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
