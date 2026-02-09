import { Locale } from '../../../i18n';
import { ProductVariant, Category, PricingScenario, Collection, Product, GlobalFinancialSettings, Asset, SizeGuide } from '../../../types';
import { Supplier } from '../../../types/suppliers';

export type AdminEditableData = Product | Category | Collection | Asset | SizeGuide | Supplier;

export interface AdminEditableItem {
  type: string;
  data: AdminEditableData;
  editLocale: Locale;
}

export interface AdminEditorModalProps {
  item: AdminEditableItem;
  categories: Category[];
  collections?: Collection[];
  products?: Product[];
  assets?: Asset[];
  sizeGuides?: SizeGuide[];
  suppliers?: Supplier[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onUpdateData: (newData: AdminEditableData) => void;
  onLocaleChange: (l: Locale) => void;
  onCloneLocale: (from: Locale) => void;
  onDelete?: (id: string) => void;
  globalConfig?: GlobalFinancialSettings;
  t: (key: string) => string;
  locale: Locale;
}

export interface SimulationResult {
  suggestedPrice: number;
  breakdown: {
    production: number;
    assets: number;
    fixed: number;
    logistics: number;
    marketing: number;
    taxes: number;
    margin: number;
  };
}

export interface LocalizedText {
  pt?: string;
  en?: string;
  es?: string;
  fr?: string;
  [key: string]: string | undefined;
}

export type ProductSubTab = 'identity' | 'pricing' | 'hotspots';
export type ActiveTab = 'edit' | 'preview';
export type TargetPriceField = 'retail_price' | 'wholesale_price';
