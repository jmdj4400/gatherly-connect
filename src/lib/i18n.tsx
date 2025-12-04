import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'da' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  da: {
    // Navigation & Common
    'nav.back': 'Tilbage',
    'nav.home': 'Hjem',
    'common.loading': 'Indlæser...',
    'common.error': 'Der opstod en fejl',
    'common.retry': 'Prøv igen',
    
    // Landing Page
    'landing.hero.title': 'Mød mennesker gennem events. Ikke apps.',
    'landing.hero.subtitle': 'Tilmeld dig alene, bliv matchet med ligesindede før eventet, og mød op sammen. Ingen swipes, ingen akavede introduktioner.',
    'landing.hero.cta': 'Få tidlig adgang',
    'landing.hero.secondary_cta': 'Se hvordan det virker',
    
    'landing.social_proof.groups': 'mikrogrupper dannet',
    'landing.social_proof.cities': 'Lancerer i 7 byer',
    'landing.social_proof.rating': 'bruger-rating',
    
    'landing.how_it_works.title': 'Sådan virker det',
    'landing.how_it_works.step1.title': 'Find et event',
    'landing.how_it_works.step1.desc': 'Gennemse lokale events der matcher dine interesser – fra wine-tastings til løbeklubber.',
    'landing.how_it_works.step2.title': 'Bliv matchet',
    'landing.how_it_works.step2.desc': 'Vores algoritme matcher dig med 3-4 andre baseret på interesser og social energi.',
    'landing.how_it_works.step3.title': 'Mød op sammen',
    'landing.how_it_works.step3.desc': 'Chat med din gruppe inden, mød op sammen, og nyd eventet med nye venner.',
    
    'landing.features.title': 'Alt du behøver for at connecte',
    'landing.features.subtitle': 'Kraftfulde funktioner designet til at gøre det nemt at møde mennesker',
    'landing.features.smart_matching': 'Smart Matching',
    'landing.features.smart_matching.desc': 'Vores algoritme tager højde for interesser, social energi og præferencer for at skabe kompatible grupper.',
    'landing.features.local_events': 'Lokale events du vil elske',
    'landing.features.local_events.desc': 'Opdag kuraterede events i nærheden – fra afslappede meetups til unikke oplevelser.',
    'landing.features.group_chat': 'Simpel gruppechat',
    'landing.features.group_chat.desc': 'Koordiner med din gruppe før eventet. Del planer, lav jokes, bryd isen.',
    'landing.features.community_tools': 'Værktøjer til fællesskaber',
    'landing.features.community_tools.desc': 'For arrangører: administrer events, track fremmøde og vækst dit fællesskab med kraftfulde værktøjer.',
    
    'landing.why.title': 'Hvorfor Gatherly eksisterer',
    'landing.why.subtitle': 'Vi tror på, at det ikke burde være så svært at få venner som voksen',
    'landing.why.pillar1.title': 'At være social burde ikke være akavet',
    'landing.why.pillar1.desc': 'At gå til events alene kan være intimiderende. Gatherly fjerner den friktion ved at give dig en indbygget gruppe.',
    'landing.why.pillar2.title': 'Små grupper føles naturlige og trygge',
    'landing.why.pillar2.desc': 'Forskning viser, at mennesker forbinder bedst i grupper på 3-5. Ingen overvældende folkemængder, bare meningsfulde samtaler.',
    'landing.why.pillar3.title': 'Bygget til virkeligheden—ikke endeløs swiping',
    'landing.why.pillar3.desc': 'Stop med at scrolle gennem profiler. Begynd at møde op til ægte oplevelser med ægte mennesker, der deler dine interesser.',
    
    'landing.testimonials.title': 'Elsket af rigtige mennesker',
    'landing.testimonials.subtitle': 'Bliv en del af tusindvis, der har opdaget glæden ved at møde mennesker gennem fælles oplevelser',
    
    'landing.cta.title': 'Klar til at møde nye mennesker?',
    'landing.cta.subtitle': 'Tilmeld dig ventelisten og vær blandt de første til at prøve Gatherly.',
    'landing.cta.button': 'Få tidlig adgang',
    
    // Footer
    'footer.tagline': 'Mød mennesker gennem ægte events. Tilmeld dig alene, gå derfra med venner.',
    'footer.product': 'Produkt',
    'footer.product.how': 'Sådan virker det',
    'footer.product.features': 'Funktioner',
    'footer.product.communities': 'For fællesskaber',
    'footer.product.pricing': 'Priser',
    'footer.company': 'Virksomhed',
    'footer.company.about': 'Om os',
    'footer.company.careers': 'Karriere',
    'footer.company.press': 'Presse',
    'footer.company.contact': 'Kontakt',
    'footer.venues': 'For venues',
    'footer.venues.partner': 'Bliv partner',
    'footer.venues.dashboard': 'Venue Dashboard',
    'footer.venues.stories': 'Succeshistorier',
    'footer.legal': 'Juridisk',
    'footer.legal.privacy': 'Privatlivspolitik',
    'footer.legal.terms': 'Brugervilkår',
    'footer.legal.cookies': 'Cookiepolitik',
    'footer.copyright': 'Alle rettigheder forbeholdes.',
    'footer.made_with': 'Lavet med ❤️ for dem der møder op alene',
    
    // About Page
    'about.title': 'Om Gatherly',
    'about.meta': 'Lær om Gatherlys mission om at hjælpe mennesker med at møde nye venner gennem lokale events.',
    'about.intro': 'Gatherly er bygget på en simpel observation: de bedste venskaber starter, når vi mødes i virkeligheden omkring noget, vi begge elsker.',
    'about.mission.title': 'Vores mission',
    'about.mission.text': 'Vi vil gøre det nemt at møde nye mennesker uden det akavede ved at dukke op alene. Vores platform matcher dig med en lille gruppe ligesindede før eventet, så du altid har nogen at mødes med. Ingen swipes, ingen uendeligt scrolling – bare ægte forbindelser gennem delte oplevelser.',
    'about.values.title': 'Vores værdier',
    'about.values.community': 'Fællesskab først',
    'about.values.community.desc': 'Vi tror på, at ægte forbindelser skabes gennem delte oplevelser i virkeligheden.',
    'about.values.inclusive': 'Inkluderende',
    'about.values.inclusive.desc': 'Alle er velkomne. Vi gør det nemt at møde op alene og gå derfra med nye venner.',
    'about.values.intentional': 'Intentionel',
    'about.values.intentional.desc': 'Vores matching sikrer, at du møder mennesker med lignende interesser og energi.',
    'about.values.authentic': 'Autentisk',
    'about.values.authentic.desc': 'Ingen swipes, ingen algoritmer der optimerer for engagement. Bare ægte møder.',
    'about.history.title': 'Vores historie',
    'about.history.p1': 'Gatherly startede i 2024 med en frustreret erkendelse: det er svært at møde nye mennesker som voksen. Dating-apps har skabt en kultur af swipes, men der mangler et sted, hvor vi bare kan møde ligesindede til fælles oplevelser.',
    'about.history.p2': 'Vi byggede Gatherly for alle dem, der gerne vil til koncerten, løbeklubben eller wine-tastingen, men som holder sig tilbage, fordi de ikke har nogen at tage med. Nu kan du melde dig til alene og blive matchet med andre, der også kommer alene.',
    'about.join.title': 'Vil du være med?',
    'about.join.text': 'Vi leder altid efter passionerede mennesker, der vil hjælpe med at bygge fremtidens sociale platform.',
    'about.join.cta': 'Se karrieremuligheder',
    
    // Careers Page
    'careers.title': 'Karriere hos Gatherly',
    'careers.meta': 'Bliv en del af Gatherly-teamet. Vi bygger fremtidens sociale platform.',
    'careers.intro': 'Hjælp os med at gøre det nemt for mennesker at møde nye venner gennem events.',
    'careers.perks.title': 'Fordele ved at arbejde her',
    'careers.perks.flexible': 'Fleksibel arbejdstid',
    'careers.perks.remote': 'Remote-venlig kultur',
    'careers.perks.events': 'Gratis adgang til alle events',
    'careers.perks.learning': 'Årlig learning budget',
    'careers.perks.health': 'Sundhedsforsikring',
    'careers.perks.equity': 'Equity i virksomheden',
    'careers.spontaneous.title': 'Interesseret i at arbejde hos os?',
    'careers.spontaneous.text': 'Vi har ikke åbne stillinger lige nu, men vi er altid interesserede i at møde talentfulde mennesker. Send os en uopfordret ansøgning.',
    'careers.spontaneous.cta': 'Send uopfordret ansøgning',
    
    // Partners Page
    'partners.title': 'Bliv partner med Gatherly',
    'partners.meta': 'Bliv partner med Gatherly og få adgang til engagerede gæster til dine events.',
    'partners.subtitle': 'Få flere gæster til dine events med engagerede mennesker, der faktisk møder op.',
    'partners.why.title': 'Hvorfor partnere vælger Gatherly',
    'partners.benefit.guests': 'Nye gæster',
    'partners.benefit.guests.desc': 'Få adgang til tusindvis af eventlystne mennesker, der leder efter nye oplevelser.',
    'partners.benefit.promo': 'Automatisk promovering',
    'partners.benefit.promo.desc': 'Dine events vises automatisk til relevante brugere baseret på deres interesser.',
    'partners.benefit.engagement': 'Øget engagement',
    'partners.benefit.engagement.desc': 'Vores mikrogrupper sikrer, at gæster faktisk møder op og har en god oplevelse.',
    'partners.benefit.insights': 'Detaljeret indsigt',
    'partners.benefit.insights.desc': 'Se hvem der deltager, track no-shows og få feedback fra deltagerne.',
    'partners.pricing': 'Priser',
    'partners.plan.starter': 'Starter',
    'partners.plan.starter.desc': 'Perfekt til at komme i gang',
    'partners.plan.pro': 'Pro',
    'partners.plan.pro.desc': 'For professionelle arrangører',
    'partners.plan.enterprise': 'Enterprise',
    'partners.plan.enterprise.desc': 'For større organisationer',
    'partners.plan.popular': 'Mest populære',
    'partners.cta.title': 'Klar til at komme i gang?',
    'partners.cta.text': 'Start gratis i dag og se, hvordan Gatherly kan hjælpe dig med at fylde dine events med engagerede gæster.',
    'partners.cta.contact': 'Kontakt os',
    'partners.cta.dashboard': 'Gå til Venue Dashboard',
    
    // Contact Page
    'contact.title': 'Kontakt os',
    'contact.meta': 'Kontakt Gatherly for support, partnerskaber, presse eller generelle henvendelser.',
    'contact.subtitle': 'Vi vil gerne høre fra dig. Vælg den kategori, der passer bedst til din henvendelse.',
    'contact.support': 'Generel support',
    'contact.support.desc': 'Spørgsmål om din konto, events eller platformen',
    'contact.business': 'For virksomheder',
    'contact.business.desc': 'Partnerskaber, venue-samarbejde eller B2B',
    'contact.press': 'Presse',
    'contact.press.desc': 'Journalister og mediehenvendelser',
    'contact.other': 'Andet',
    'contact.other.desc': 'Alt andet du vil spørge om',
    'contact.response.24h': 'Svar inden for 24 timer',
    'contact.response.48h': 'Svar inden for 48 timer',
    'contact.hq': 'Hovedkontor',
    
    // Press Page
    'press.title': 'Presse',
    'press.meta': 'Pressemateriale, nyheder og kontaktinformation for journalister.',
    'press.subtitle': 'Nyheder, pressemateriale og kontaktinformation for journalister.',
    'press.stats': 'Nøgletal',
    'press.stats.groups': 'Mikrogrupper dannet',
    'press.stats.events': 'Events på platformen',
    'press.stats.cities': 'Aktive byer',
    'press.stats.size': 'Gennemsnitlig gruppestørrelse',
    'press.releases': 'Pressemeddelelser',
    'press.materials': 'Pressemateriale',
    'press.brand': 'Brand Assets',
    'press.brand.desc': 'Logoer, farver og typografi',
    'press.photos': 'Produktbilleder',
    'press.photos.desc': 'Screenshots og produktfotos',
    'press.request': 'Anmod om assets',
    'press.contact': 'Pressekontakt',
    'press.contact.text': 'For pressehenvendelser, interviews eller yderligere information:',
    
    // Stories Page
    'stories.title': 'Succeshistorier',
    'stories.meta': 'Se hvordan venues og arrangører bruger Gatherly til at skabe bedre events.',
    'stories.subtitle': 'Se hvordan venues og communities bruger Gatherly til at skabe bedre oplevelser.',
    'stories.stats.members': 'Medlemmer',
    'stories.stats.events': 'Events',
    'stories.stats.attendance': 'Fremmøde',
    'stories.cta.title': 'Vil du være den næste succeshistorie?',
    'stories.cta.text': 'Bliv partner med Gatherly og se, hvordan vi kan hjælpe dig med at skabe bedre events.',
    'stories.cta.button': 'Bliv partner',
  },
  en: {
    // Navigation & Common
    'nav.back': 'Back',
    'nav.home': 'Home',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Try again',
    
    // Landing Page
    'landing.hero.title': 'Meet people through events. Not apps.',
    'landing.hero.subtitle': 'Sign up alone, get matched with like-minded people before the event, and show up together. No swipes, no awkward introductions.',
    'landing.hero.cta': 'Get early access',
    'landing.hero.secondary_cta': 'See how it works',
    
    'landing.social_proof.groups': 'microgroups formed',
    'landing.social_proof.cities': 'Launching in 7 cities',
    'landing.social_proof.rating': 'user rating',
    
    'landing.how_it_works.title': 'How it works',
    'landing.how_it_works.step1.title': 'Find an event',
    'landing.how_it_works.step1.desc': 'Browse local events matching your interests – from wine tastings to running clubs.',
    'landing.how_it_works.step2.title': 'Get matched',
    'landing.how_it_works.step2.desc': 'Our algorithm matches you with 3-4 others based on interests and social energy.',
    'landing.how_it_works.step3.title': 'Show up together',
    'landing.how_it_works.step3.desc': 'Chat with your group beforehand, meet up together, and enjoy the event with new friends.',
    
    'landing.features.title': 'Everything You Need to Connect',
    'landing.features.subtitle': 'Powerful features designed to make meeting people effortless',
    'landing.features.smart_matching': 'Smart Matching',
    'landing.features.smart_matching.desc': 'Our algorithm considers interests, social energy, and preferences to create compatible groups.',
    'landing.features.local_events': "Local Events You'll Love",
    'landing.features.local_events.desc': 'Discover curated events happening near you, from casual meetups to unique experiences.',
    'landing.features.group_chat': 'Simple Group Chat',
    'landing.features.group_chat.desc': 'Coordinate with your group before the event. Share plans, make jokes, break the ice.',
    'landing.features.community_tools': 'Community Tools',
    'landing.features.community_tools.desc': 'For organizers: manage events, track attendance, and grow your community with powerful tools.',
    
    'landing.why.title': 'Why Gatherly Exists',
    'landing.why.subtitle': "We believe making friends as an adult shouldn't be this hard",
    'landing.why.pillar1.title': "Socializing shouldn't be awkward",
    'landing.why.pillar1.desc': 'Walking into events alone can be intimidating. Gatherly eliminates that friction by giving you a built-in group.',
    'landing.why.pillar2.title': 'Small groups feel natural and safe',
    'landing.why.pillar2.desc': 'Research shows people connect best in groups of 3-5. No overwhelming crowds, just meaningful conversations.',
    'landing.why.pillar3.title': 'Built for real life—not endless swiping',
    'landing.why.pillar3.desc': 'Stop scrolling through profiles. Start showing up to real experiences with real people who share your interests.',
    
    'landing.testimonials.title': 'Loved by Real People',
    'landing.testimonials.subtitle': 'Join thousands who have discovered the joy of meeting people through shared experiences',
    
    'landing.cta.title': 'Ready to meet new people?',
    'landing.cta.subtitle': 'Join the waitlist and be among the first to try Gatherly.',
    'landing.cta.button': 'Get early access',
    
    // Footer
    'footer.tagline': 'Meet people through real events. Join alone, leave with friends.',
    'footer.product': 'Product',
    'footer.product.how': 'How It Works',
    'footer.product.features': 'Features',
    'footer.product.communities': 'For Communities',
    'footer.product.pricing': 'Pricing',
    'footer.company': 'Company',
    'footer.company.about': 'About Us',
    'footer.company.careers': 'Careers',
    'footer.company.press': 'Press',
    'footer.company.contact': 'Contact',
    'footer.venues': 'For Venues',
    'footer.venues.partner': 'Partner With Us',
    'footer.venues.dashboard': 'Venue Dashboard',
    'footer.venues.stories': 'Success Stories',
    'footer.legal': 'Legal',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Service',
    'footer.legal.cookies': 'Cookie Policy',
    'footer.copyright': 'All rights reserved.',
    'footer.made_with': 'Made with ❤️ for people who show up alone',
    
    // About Page
    'about.title': 'About Gatherly',
    'about.meta': 'Learn about Gatherly\'s mission to help people meet new friends through local events.',
    'about.intro': 'Gatherly is built on a simple observation: the best friendships start when we meet in person around something we both love.',
    'about.mission.title': 'Our mission',
    'about.mission.text': 'We want to make it easy to meet new people without the awkwardness of showing up alone. Our platform matches you with a small group of like-minded people before the event, so you always have someone to meet with. No swipes, no endless scrolling – just real connections through shared experiences.',
    'about.values.title': 'Our values',
    'about.values.community': 'Community first',
    'about.values.community.desc': 'We believe genuine connections are created through shared real-world experiences.',
    'about.values.inclusive': 'Inclusive',
    'about.values.inclusive.desc': 'Everyone is welcome. We make it easy to show up alone and leave with new friends.',
    'about.values.intentional': 'Intentional',
    'about.values.intentional.desc': 'Our matching ensures you meet people with similar interests and energy.',
    'about.values.authentic': 'Authentic',
    'about.values.authentic.desc': 'No swipes, no algorithms optimizing for engagement. Just real meetings.',
    'about.history.title': 'Our story',
    'about.history.p1': 'Gatherly started in 2024 with a frustrated realization: it\'s hard to meet new people as an adult. Dating apps have created a culture of swipes, but there\'s no place where we can simply meet like-minded people for shared experiences.',
    'about.history.p2': 'We built Gatherly for everyone who wants to go to the concert, running club, or wine tasting, but holds back because they don\'t have anyone to go with. Now you can sign up alone and get matched with others who are also coming alone.',
    'about.join.title': 'Want to join us?',
    'about.join.text': 'We\'re always looking for passionate people who want to help build the future of social platforms.',
    'about.join.cta': 'See career opportunities',
    
    // Careers Page
    'careers.title': 'Careers at Gatherly',
    'careers.meta': 'Join the Gatherly team. We\'re building the future of social platforms.',
    'careers.intro': 'Help us make it easy for people to meet new friends through events.',
    'careers.perks.title': 'Perks of working here',
    'careers.perks.flexible': 'Flexible working hours',
    'careers.perks.remote': 'Remote-friendly culture',
    'careers.perks.events': 'Free access to all events',
    'careers.perks.learning': 'Annual learning budget',
    'careers.perks.health': 'Health insurance',
    'careers.perks.equity': 'Equity in the company',
    'careers.spontaneous.title': 'Interested in working with us?',
    'careers.spontaneous.text': 'We don\'t have open positions right now, but we\'re always interested in meeting talented people. Send us a spontaneous application.',
    'careers.spontaneous.cta': 'Send spontaneous application',
    
    // Partners Page
    'partners.title': 'Partner with Gatherly',
    'partners.meta': 'Partner with Gatherly and get access to engaged guests for your events.',
    'partners.subtitle': 'Get more guests to your events with engaged people who actually show up.',
    'partners.why.title': 'Why partners choose Gatherly',
    'partners.benefit.guests': 'New guests',
    'partners.benefit.guests.desc': 'Get access to thousands of event-loving people looking for new experiences.',
    'partners.benefit.promo': 'Automatic promotion',
    'partners.benefit.promo.desc': 'Your events are automatically shown to relevant users based on their interests.',
    'partners.benefit.engagement': 'Increased engagement',
    'partners.benefit.engagement.desc': 'Our microgroups ensure guests actually show up and have a great experience.',
    'partners.benefit.insights': 'Detailed insights',
    'partners.benefit.insights.desc': 'See who\'s attending, track no-shows, and get feedback from participants.',
    'partners.pricing': 'Pricing',
    'partners.plan.starter': 'Starter',
    'partners.plan.starter.desc': 'Perfect to get started',
    'partners.plan.pro': 'Pro',
    'partners.plan.pro.desc': 'For professional organizers',
    'partners.plan.enterprise': 'Enterprise',
    'partners.plan.enterprise.desc': 'For larger organizations',
    'partners.plan.popular': 'Most popular',
    'partners.cta.title': 'Ready to get started?',
    'partners.cta.text': 'Start free today and see how Gatherly can help you fill your events with engaged guests.',
    'partners.cta.contact': 'Contact us',
    'partners.cta.dashboard': 'Go to Venue Dashboard',
    
    // Contact Page
    'contact.title': 'Contact us',
    'contact.meta': 'Contact Gatherly for support, partnerships, press, or general inquiries.',
    'contact.subtitle': 'We\'d love to hear from you. Choose the category that best fits your inquiry.',
    'contact.support': 'General support',
    'contact.support.desc': 'Questions about your account, events, or the platform',
    'contact.business': 'For businesses',
    'contact.business.desc': 'Partnerships, venue collaboration, or B2B',
    'contact.press': 'Press',
    'contact.press.desc': 'Journalists and media inquiries',
    'contact.other': 'Other',
    'contact.other.desc': 'Anything else you want to ask about',
    'contact.response.24h': 'Response within 24 hours',
    'contact.response.48h': 'Response within 48 hours',
    'contact.hq': 'Headquarters',
    
    // Press Page
    'press.title': 'Press',
    'press.meta': 'Press materials, news, and contact information for journalists.',
    'press.subtitle': 'News, press materials, and contact information for journalists.',
    'press.stats': 'Key figures',
    'press.stats.groups': 'Microgroups formed',
    'press.stats.events': 'Events on platform',
    'press.stats.cities': 'Active cities',
    'press.stats.size': 'Average group size',
    'press.releases': 'Press releases',
    'press.materials': 'Press materials',
    'press.brand': 'Brand Assets',
    'press.brand.desc': 'Logos, colors, and typography',
    'press.photos': 'Product images',
    'press.photos.desc': 'Screenshots and product photos',
    'press.request': 'Request assets',
    'press.contact': 'Press contact',
    'press.contact.text': 'For press inquiries, interviews, or additional information:',
    
    // Stories Page
    'stories.title': 'Success Stories',
    'stories.meta': 'See how venues and organizers use Gatherly to create better events.',
    'stories.subtitle': 'See how venues and communities use Gatherly to create better experiences.',
    'stories.stats.members': 'Members',
    'stories.stats.events': 'Events',
    'stories.stats.attendance': 'Attendance',
    'stories.cta.title': 'Want to be the next success story?',
    'stories.cta.text': 'Partner with Gatherly and see how we can help you create better events.',
    'stories.cta.button': 'Become a partner',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gatherly-language');
    return (saved as Language) || 'da';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gatherly-language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  return useI18n();
}
