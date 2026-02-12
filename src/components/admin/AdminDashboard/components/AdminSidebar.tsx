/// Admin Sidebar Component
/// Navigation sidebar with collapsible categories

import React from 'react';
import {
  Box, Users, Settings, LogOut, BarChart3, Tag, Layers,
  Image as ImageIcon, Ticket, Archive, BookOpen, Ruler, Lightbulb,
  Store, Truck, ShoppingBag, ChevronDown, DollarSign, Shirt, HelpCircle
} from 'lucide-react';
import { AdminTab } from '../../../../hooks/useAdminRouter';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  onLogout: () => void;
  expandedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
}

const sidebarConfig = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { id: 'health', icon: BarChart3, label: 'Health' },
      { id: 'dream', icon: Lightbulb, label: 'Dream Board' },
      { id: 'orders', icon: Box, label: 'Pedidos' },
      { id: 'delivery', icon: Truck, label: 'Delivery' },
    ],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    items: [
      { id: 'inventory', icon: Tag, label: 'Catálogo' },
      { id: 'suppliers', icon: Store, label: 'Fornecedores' },
      { id: 'taxonomy', icon: Layers, label: 'Taxonomia' },
      { id: 'guides', icon: Ruler, label: 'Guias' },
      { id: 'garment-gallery', icon: Shirt, label: 'Galeria Virtual' },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    items: [
      { id: 'financial', icon: DollarSign, label: 'Financeiro' },
      { id: 'marketplaces', icon: ShoppingBag, label: 'Marketplaces' },
      { id: 'marketing', icon: ImageIcon, label: 'Marketing' },
      { id: 'coupons', icon: Ticket, label: 'Cupons' },
      { id: 'assets', icon: Archive, label: 'Insumos' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      { id: 'about', icon: BookOpen, label: 'Sobre Nós' },
      { id: 'faq', icon: HelpCircle, label: 'FAQ' },
      { id: 'users', icon: Users, label: 'Usuários' },
      { id: 'system', icon: Settings, label: 'Sistema' },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onNavigate,
  onLogout,
  expandedCategories,
  onToggleCategory,
}) => {
  return (
    <aside className="w-20 md:w-64 bg-black text-white flex flex-col py-8 z-50 transition-all duration-300">
      <div className="flex flex-col items-center md:items-start md:px-8 space-y-6 flex-shrink-0">
        <div className="text-2xl font-black uppercase tracking-tighter hidden md:block">
          AURICAPRI<span className="text-neutral-500">.OS</span>
        </div>
        <div className="md:hidden font-black text-xl">OS</div>

        <nav className="flex flex-col gap-1 w-full overflow-y-auto flex-1 min-h-0 pr-1">
          {sidebarConfig.map((category) => (
            <div key={category.id} className="space-y-1 mt-2 first:mt-0">
              <button
                onClick={() => onToggleCategory(category.id)}
                className="hidden md:flex items-center justify-between w-full text-[8px] font-black uppercase tracking-widest text-neutral-500 px-3 py-1.5 hover:text-neutral-300 transition-colors"
              >
                <span>{category.label}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    !expandedCategories.has(category.id) ? '-rotate-90' : ''
                  }`}
                />
              </button>
              {expandedCategories.has(category.id) && (
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id as AdminTab)}
                      className={`flex items-center gap-4 p-2.5 rounded-xl transition-all w-full ${
                        activeTab === item.id
                          ? 'bg-white text-black font-bold'
                          : 'text-neutral-500 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden md:block text-[10px] uppercase tracking-widest truncate">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="px-4 md:px-8 mt-auto flex-shrink-0">
        <button
          onClick={onLogout}
          className="flex items-center gap-4 text-red-500 hover:text-red-400 transition-colors p-2.5 w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="hidden md:block text-[10px] uppercase tracking-widest font-bold">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
};
