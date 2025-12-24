
import React from 'react';
import { ShieldCheck, CreditCard, Lock } from 'lucide-react';
import { Locale } from '../i18n';

interface FooterProps {
  t: (key: string) => string;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeName: string;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
}

const Footer: React.FC<FooterProps> = ({ t, currentLocale, onChangeLocale, storeName, onOpenLegal }) => {
  return (
    <footer className="w-full bg-neutral-900 text-white py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-neutral-800 pb-16">
        <div className="space-y-6">
          <h3 className="text-2xl font-light tracking-[0.2em] uppercase text-white">{storeName}</h3>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">{t('footer.tagline')}</p>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-200">{t('footer.shop')}</h4>
          <ul className="space-y-3 text-xs text-neutral-400 font-light">
            <li><button className="hover:text-white transition-colors">{t('nav.newArrivals')}</button></li>
            <li><button className="hover:text-white transition-colors">{t('nav.collection')}</button></li>
            <li><button className="hover:text-white transition-colors">{t('nav.accessories')}</button></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-200">{t('footer.customerCare')}</h4>
          <ul className="space-y-3 text-xs text-neutral-400 font-light text-left">
            <li><button className="hover:text-white transition-colors">Contact</button></li>
            <li><button className="hover:text-white transition-colors">Shipping</button></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-200">{t('footer.secure')}</h4>
          <div className="flex items-center space-x-2 text-neutral-400">
             <Lock className="w-4 h-4" />
             <span className="text-[10px] uppercase tracking-wider">{t('footer.ssl')}</span>
          </div>
          <div className="flex space-x-4 text-neutral-400">
             <CreditCard className="w-6 h-6 stroke-1" />
             <ShieldCheck className="w-6 h-6 stroke-1" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-medium">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p>&copy; 2025 {storeName}. {t('footer.rights')}</p>
            <div className="flex space-x-6">
              <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors font-bold uppercase">{t('footer.privacy')}</button>
              <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors font-bold uppercase">{t('footer.terms')}</button>
            </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-6 md:mt-0 opacity-40 hover:opacity-100 transition-opacity">
            {(['en', 'pt', 'es', 'fr'] as Locale[]).map(l => (
                <button 
                    key={l}
                    onClick={() => onChangeLocale(l)}
                    className={`hover:text-white transition-colors ${currentLocale === l ? 'text-white underline' : ''}`}
                >
                    {l}
                </button>
            ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
