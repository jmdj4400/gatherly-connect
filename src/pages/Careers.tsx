import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const openings = [
  {
    title: 'Full-Stack Developer',
    department: 'Engineering',
    location: 'København / Remote',
    type: 'Fuldtid',
    description: 'Hjælp med at bygge og skalere vores platform med React, TypeScript og Supabase.',
  },
  {
    title: 'Community Manager',
    department: 'Growth',
    location: 'København',
    type: 'Fuldtid',
    description: 'Byg og nurtur vores community af eventarrangører og deltagere.',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'København / Remote',
    type: 'Fuldtid',
    description: 'Design intuitive oplevelser, der gør det nemt at møde nye mennesker.',
  },
];

const perks = [
  'Fleksibel arbejdstid',
  'Remote-venlig kultur',
  'Gratis adgang til alle events',
  'Årlig learning budget',
  'Sundhedsforsikring',
  'Equity i virksomheden',
];

export default function Careers() {
  return (
    <>
      <Helmet>
        <title>Karriere hos Gatherly | Bliv en del af teamet</title>
        <meta name="description" content="Se ledige stillinger hos Gatherly. Vi leder efter passionerede mennesker, der vil bygge fremtidens sociale platform." />
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-4">Karriere hos Gatherly</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Hjælp os med at gøre det nemt for mennesker at møde nye venner gennem events.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Ledige stillinger</h2>
            <div className="space-y-4">
              {openings.map((job) => (
                <Card key={job.title}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.department}</CardDescription>
                      </div>
                      <Badge variant="secondary">{job.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </span>
                    </div>
                    <Button className="mt-4" asChild>
                      <a href="mailto:jobs@gatherly.app?subject=Ansøgning: {{job.title}}">
                        Ansøg nu
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Fordele ved at arbejde her</h2>
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
            <h2 className="text-xl font-semibold mb-4">Finder du ikke den rette stilling?</h2>
            <p className="text-muted-foreground mb-6">
              Send os en uopfordret ansøgning – vi er altid interesserede i at møde talentfulde mennesker.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:jobs@gatherly.app">Send uopfordret ansøgning</a>
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}
