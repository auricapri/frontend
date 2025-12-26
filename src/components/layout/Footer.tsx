
import React from 'react';
import { ShieldCheck, CreditCard, Lock, MapPin, Mail, Phone, FileText } from 'lucide-react';
import { Locale } from '../../i18n';
import { StoreConfig } from '../../types';

interface FooterProps {
  t: (key: string) => string;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  onNavigate: (view: 'home' | 'collection' | 'about', target?: string) => void;
}

const Footer: React.FC<FooterProps> = ({ 
  t, 
  currentLocale, 
  onChangeLocale, 
  storeConfig, 
  onOpenLegal, 
  onNavigate 
}) => {
  
  const handleScrollToContact = () => {
    const el = document.getElementById('footer-contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-neutral-900 text-white py-16 px-6 md:px-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-neutral-800 pb-16">
        
        {/* Brand & Corporate Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-light tracking-[0.2em] uppercase text-white">{storeConfig.brand_name}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">{t('footer.tagline')}</p>
          </div>

          <div id="footer-contact" className="space-y-3 pt-4 border-t border-white/10">
             {storeConfig.tax_id && (
               <div className="flex items-start gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-widest">
                  <FileText className="w-3 h-3 mt-0.5" />
                  <span>CNPJ: {storeConfig.tax_id}</span>
               </div>
             )}
             {storeConfig.address && (
               <div className="flex items-start gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-widest max-w-[200px]">
                  <MapPin className="w-3 h-3 mt-0.5 flex-none" />
                  <span>{storeConfig.address}</span>
               </div>
             )}
             {storeConfig.contact_email && (
               <a href={`mailto:${storeConfig.contact_email}`} className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-widest hover:text-white transition-colors">
                  <Mail className="w-3 h-3" />
                  <span>{storeConfig.contact_email}</span>
               </a>
             )}
             {storeConfig.support_phone && (
               <a href={`tel:${storeConfig.support_phone}`} className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-widest hover:text-white transition-colors">
                  <Phone className="w-3 h-3" />
                  <span>{storeConfig.support_phone}</span>
               </a>
             )}
          </div>
        </div>

        {/* Shop Navigation */}
        <div className="space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-200">{t('footer.shop')}</h4>
          <ul className="space-y-3 text-xs text-neutral-400 font-light">
            <li>
              <button onClick={() => onNavigate('home', 'hero')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                {t('nav.newArrivals')}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('home', 'collection')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                {t('nav.collection')}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('home', 'collection')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                {t('nav.accessories')}
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-200">{t('footer.customerCare')}</h4>
          <ul className="space-y-3 text-xs text-neutral-400 font-light text-left">
            <li>
              <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                Sobre Nós
              </button>
            </li>
            <li>
              <button onClick={handleScrollToContact} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                Contact
              </button>
            </li>
            <li>
              <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                Shipping & Returns
              </button>
            </li>
            <li>
              <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                FAQ
              </button>
            </li>
          </ul>
        </div>

        {/* Security Badges */}
        <div className="space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-200">{t('footer.secure')}</h4>
          <div className="flex items-center space-x-2 text-neutral-400">
             <Lock className="w-3 h-3" />
             <span className="text-[9px] uppercase tracking-wider">{t('footer.ssl')}</span>
          </div>
          <div className="flex gap-4 text-neutral-400 pt-2">
             <CreditCard className="w-8 h-8 stroke-[0.8] opacity-60" />
             <ShieldCheck className="w-8 h-8 stroke-[0.8] opacity-60" />
          </div>
          <p className="text-[9px] text-neutral-600 leading-relaxed max-w-[150px]">
            Payments processed securely by Auricapri Cloud Protocol.
          </p>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-medium">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p>&copy; {new Date().getFullYear()} {storeConfig.brand_name}. {t('footer.rights')}</p>
            <div className="flex space-x-6">
              <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors font-bold uppercase">{t('footer.privacy')}</button>
              <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors font-bold uppercase">{t('footer.terms')}</button>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
