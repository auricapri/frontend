import { useState, useEffect, useCallback } from 'react';

export type AdminTab =
  | 'health' | 'dream' | 'orders' | 'delivery'
  | 'inventory' | 'suppliers' | 'taxonomy' | 'guides' | 'garment-gallery'
  | 'financial' | 'marketplaces' | 'marketing' | 'coupons' | 'assets'
  | 'about' | 'users' | 'system' | 'faq';

const VALID_TABS: AdminTab[] = [
  'health', 'dream', 'orders', 'delivery',
  'inventory', 'suppliers', 'taxonomy', 'guides', 'garment-gallery',
  'financial', 'marketplaces', 'marketing', 'coupons', 'assets',
  'about', 'users', 'system', 'faq'
];

const DEFAULT_TAB: AdminTab = 'health';

function parseHashTab(): AdminTab {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#/admin/')) {
    return DEFAULT_TAB;
  }
  const tab = hash.replace('#/admin/', '') as AdminTab;
  return VALID_TABS.includes(tab) ? tab : DEFAULT_TAB;
}

export function useAdminRouter() {
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => parseHashTab());

  const navigate = useCallback((tab: AdminTab) => {
    if (!VALID_TABS.includes(tab)) {
      console.warn(`Invalid admin tab: ${tab}`);
      return;
    }
    window.location.hash = `/admin/${tab}`;
    setActiveTabState(tab);
  }, []);

  useEffect(() => {
    // Set initial hash if not present
    if (!window.location.hash.startsWith('#/admin/')) {
      window.location.hash = `/admin/${activeTab}`;
    }

    const handleHashChange = () => {
      const newTab = parseHashTab();
      setActiveTabState(newTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  return { activeTab, navigate, isValidTab: (tab: string): tab is AdminTab => VALID_TABS.includes(tab as AdminTab) };
}
