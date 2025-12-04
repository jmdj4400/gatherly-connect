import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageSquare, Building2, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const contactOptions = [
  {
    icon: HelpCircle,
    title: 'Generel support',
    description: 'Spørgsmål om din konto, events eller platformen',
    email: 'support@gatherly.app',
    response: 'Svar inden for 24 timer',
  },
  {
    icon: Building2,
    title: 'For virksomheder',
    description: 'Partnerskaber, venue-samarbejde eller B2B',
    email: 'partners@gatherly.app',
    response: 'Svar inden for 48 timer',
  },
  {
    icon: MessageSquare,
    title: 'Presse',
    description: 'Journalister og mediehenvendelser',
    email: 'press@gatherly.app',
    response: 'Svar inden for 24 timer',
  },
  {
    icon: Mail,
    title: 'Andet',
    description: 'Alt andet du vil spørge om',
    email: 'hello@gatherly.app',
    response: 'Svar inden for 48 timer',
  },
];

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Kontakt | Gatherly</title>
        <meta name="description" content="Kontakt Gatherly for support, partnerskaber, presse eller generelle henvendelser." />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-4">Kontakt os</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Vi vil gerne høre fra dig. Vælg den kategori, der passer bedst til din henvendelse.
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
            <h2 className="text-xl font-semibold mb-4">Hovedkontor</h2>
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
