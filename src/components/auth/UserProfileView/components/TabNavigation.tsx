/// Tab Navigation Component
/// Displays tab buttons for profile sections

import React from 'react';
import { User, Package, MapPin, Ticket } from 'lucide-react';
import { TabId, TabConfig } from '../types';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  t: (key: string) => any;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  t,
}) => {
  const tabs: TabConfig[] = [
    { id: 'profile', label: t('auth.profile'), icon: User },
    { id: 'orders', label: t('auth.orderHistory'), icon: Package },
    { id: 'addresses', label: 'Endereços', icon: MapPin },
    { id: 'affiliate', label: t('auth.affiliate'), icon: Ticket },
  ];

  return (
    <div className="flex bg-neutral-50 p-2 rounded-3xl border border-neutral-100 mx-8 mt-4 gap-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === tab.id
              ? 'bg-black text-white shadow-lg'
              : 'text-neutral-400 hover:text-black'
          }`}
        >
          <tab.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
