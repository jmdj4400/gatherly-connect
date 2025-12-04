import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Mail } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/gatherly', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/gatherly', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/gatherly', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@gatherly.app', label: 'Email' },
];

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    [t('footer.product')]: [
      { label: t('footer.product.how'), href: '#how-it-works' },
      { label: t('footer.product.features'), href: '#features' },
      { label: t('footer.product.communities'), href: '#communities' },
      { label: t('footer.product.pricing'), href: '#pricing' },
    ],
    [t('footer.company')]: [
      { label: t('footer.company.about'), href: '/about' },
      { label: t('footer.company.careers'), href: '/careers' },
      { label: t('footer.company.press'), href: '/press' },
      { label: t('footer.company.contact'), href: '/contact' },
    ],
    [t('footer.venues')]: [
      { label: t('footer.venues.partner'), href: '/partners' },
      { label: t('footer.venues.dashboard'), href: '/venue-panel' },
      { label: t('footer.venues.stories'), href: '/stories' },
    ],
    [t('footer.legal')]: [
      { label: t('footer.legal.privacy'), href: '/privacy' },
      { label: t('footer.legal.terms'), href: '/terms' },
      { label: t('footer.legal.cookies'), href: '/cookies' },
    ],
  };

  return (
    <footer className="border-t border-border/50">
      {/* Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-[1220px] mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-2 md:col-span-1"
          >
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold gradient-brand-text">Gatherly</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
            >
              <h4 className="font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Gatherly. {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {t('footer.made_with')}
            </p>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
