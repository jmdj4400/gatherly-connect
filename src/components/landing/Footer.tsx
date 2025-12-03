import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'For Communities', href: '#communities' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  'For Venues': [
    { label: 'Partner With Us', href: '/partners' },
    { label: 'Venue Dashboard', href: '/venue-panel' },
    { label: 'Success Stories', href: '/stories' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/gatherly', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/gatherly', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/gatherly', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@gatherly.app', label: 'Email' },
];

export function Footer() {
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
              Meet people through real events. Join alone, leave with friends.
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
            © {new Date().getFullYear()} Gatherly. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ for people who show up alone
          </p>
        </div>
      </div>
    </footer>
  );
}
