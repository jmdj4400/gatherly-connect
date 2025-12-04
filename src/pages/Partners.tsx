import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Calendar, BarChart3, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  {
    icon: Users,
    title: 'Nye gæster',
    description: 'Få adgang til tusindvis af eventlystne mennesker, der leder efter nye oplevelser.',
  },
  {
    icon: Calendar,
    title: 'Automatisk promovering',
    description: 'Dine events vises automatisk til relevante brugere baseret på deres interesser.',
  },
  {
    icon: TrendingUp,
    title: 'Øget engagement',
    description: 'Vores mikrogrupper sikrer, at gæster faktisk møder op og har en god oplevelse.',
  },
  {
    icon: BarChart3,
    title: 'Detaljeret indsigt',
    description: 'Se hvem der deltager, track no-shows og få feedback fra deltagerne.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'Gratis',
    description: 'Perfekt til at komme i gang',
    features: [
      'Op til 5 events/måned',
      'Grundlæggende analytics',
      'Automatisk matching',
      'Email-support',
    ],
  },
  {
    name: 'Pro',
    price: '499 kr/md',
    description: 'For professionelle arrangører',
    features: [
      'Ubegrænsede events',
      'Avanceret analytics',
      'Prioriteret visning',
      'Custom branding',
      'CSV-import af events',
      'Dedikeret support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Kontakt os',
    description: 'For større organisationer',
    features: [
      'Alt i Pro',
      'API-adgang',
      'White-label mulighed',
      'Dedikeret account manager',
      'Custom integrationer',
    ],
  },
];

export default function Partners() {
  return (
    <>
      <Helmet>
        <title>Bliv partner | Gatherly</title>
        <meta name="description" content="Bliv partner med Gatherly og få adgang til engagerede gæster til dine events. Gratis at starte." />
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
            <h1 className="text-4xl font-bold mb-4">Bliv partner med Gatherly</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Få flere gæster til dine events med engagerede mennesker, der faktisk møder op.
            </p>
          </div>

          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-8 text-center">Hvorfor partnere vælger Gatherly</h2>
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
            <h2 className="text-2xl font-semibold mb-8 text-center">Priser</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.name} className={plan.popular ? 'border-primary ring-2 ring-primary' : ''}>
                  <CardHeader>
                    {plan.popular && (
                      <span className="text-xs font-medium text-primary mb-2">Mest populære</span>
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
                      <a href="mailto:partners@gatherly.app?subject=Partnerskab - {{plan.name}}">
                        {plan.price === 'Kontakt os' ? 'Kontakt os' : 'Kom i gang'}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="text-center py-12 px-6 rounded-xl bg-muted/50">
            <h2 className="text-2xl font-semibold mb-4">Klar til at komme i gang?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Start gratis i dag og se, hvordan Gatherly kan hjælpe dig med at fylde dine events med engagerede gæster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="mailto:partners@gatherly.app">Kontakt os</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/venue">Gå til Venue Dashboard</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
