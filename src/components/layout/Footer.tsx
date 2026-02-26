
import React from 'react';
import { ShieldCheck, CreditCard, Lock, MapPin, Mail, Phone, FileText, RefreshCw, Truck, Instagram } from 'lucide-react';
import { Locale } from '../../i18n';
import { StoreConfig } from '../../types';

interface FooterProps {
  t: (key: string) => string;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  onNavigate: (view: 'home' | 'collection' | 'about' | 'privacy' | 'terms' | 'shipping' | 'affiliates', target?: string) => void;
  onOpenFAQ?: () => void;
  onOpenAuth?: () => void;
}

/** Strips non-digit chars from phone for tel: links */
function cleanPhoneForTel(phone: string): string {
  return phone.replace(/\D/g, '');
}

const Footer: React.FC<FooterProps> = ({
  t,
  currentLocale: _currentLocale,
  onChangeLocale: _onChangeLocale,
  storeConfig,
  onNavigate,
  onOpenFAQ,
  onOpenAuth
}) => {
  const handleScrollToContact = () => {
    const el = document.getElementById('footer-contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on home page, navigate home first, then scroll
      onNavigate('home');
      setTimeout(() => {
        const contactEl = document.getElementById('footer-contact');
        if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  return (
    <footer className="w-full bg-neutral-900 text-white py-16 px-6 md:px-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-neutral-800 pb-16">

        {/* Brand & Corporate Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-light tracking-[0.2em] uppercase text-white">{storeConfig.brand_name}</h3>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-xs">{t('footer.tagline')}</p>
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
               <a href={`tel:+${cleanPhoneForTel(storeConfig.support_phone)}`} className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-widest hover:text-white transition-colors">
                  <Phone className="w-3 h-3" />
                  <span>{storeConfig.support_phone}</span>
               </a>
             )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://www.instagram.com/auricapri"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
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
                Contato
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shipping')} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                Envios & Devoluções
              </button>
            </li>
            <li>
              <button onClick={onOpenFAQ} className="hover:text-white transition-colors uppercase tracking-wide text-left">
                Perguntas Frequentes
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('affiliates')} className="hover:text-white transition-colors uppercase tracking-wide text-left flex flex-col items-start gap-0.5">
                <span>Programa de Afiliados</span>
                <span className="text-[9px] text-neutral-500 tracking-widest font-bold">A PARTIR DE 10%</span>
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
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Payment method badges */}
            <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-800 text-[9px] font-bold text-neutral-300 uppercase tracking-wider">Pix</span>
            <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-800 text-[9px] font-bold text-neutral-300 uppercase tracking-wider">Visa</span>
            <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-800 text-[9px] font-bold text-neutral-300 uppercase tracking-wider">Master</span>
            <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-800 text-[9px] font-bold text-neutral-300 uppercase tracking-wider">Elo</span>
            <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-800 text-[9px] font-bold text-neutral-300 uppercase tracking-wider">Boleto</span>
          </div>
          <p className="text-[9px] text-neutral-600 leading-relaxed max-w-[180px]">
            Pagamentos processados com segurança via Asaas. Dados protegidos com criptografia SSL.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-col gap-3 pt-4 border-t border-neutral-700">
            <div className="flex items-center gap-2 text-neutral-400">
              <RefreshCw className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Troca fácil</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <Truck className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Envio para todo Brasil</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-medium">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p>&copy; {new Date().getFullYear()} {storeConfig.brand_name}. {t('footer.rights')}</p>
            <div className="flex space-x-6">
              <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors font-bold uppercase">{t('footer.privacy')}</button>
              <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors font-bold uppercase">{t('footer.terms')}</button>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
