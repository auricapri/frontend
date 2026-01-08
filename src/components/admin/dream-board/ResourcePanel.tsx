import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, FolderOpen, ChevronDown, ChevronRight, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { Product, Collection, ProductVariant, LocalizedText } from '../../../types';
import { DreamApi } from '../../../api/dream.api';
import { Locale } from '../../../i18n';

interface ResourcePanelProps {
  locale: Locale;
  onAddProduct: (product: Product) => void;
  onAddCollection: (collection: Collection, products: Product[]) => void;
  onAddVariant: (product: Product, variant: ProductVariant) => void;
}

const getLocalizedText = (text: LocalizedText | string | undefined, locale: Locale): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.pt || text.en || '';
};

const ResourcePanel: React.FC<ResourcePanelProps> = ({
  locale,
  onAddProduct,
  onAddCollection,
  onAddVariant,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'collections'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [collectionProducts, setCollectionProducts] = useState<Record<string, Product[]>>({});
  const [loadingCollections, setLoadingCollections] = useState<Set<string>>(new Set());

  const dreamApi = new DreamApi();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dreamApi.getProductsForDiagram(searchQuery || undefined);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dreamApi.getCollectionsForDiagram();
      setCollections(data);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      const debounce = setTimeout(fetchProducts, 300);
      return () => clearTimeout(debounce);
    } else {
      fetchCollections();
    }
  }, [activeTab, searchQuery]);

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleCollectionExpand = async (collectionId: string) => {
    const isExpanded = expandedCollections.has(collectionId);
    
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (isExpanded) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });

    if (!isExpanded && !collectionProducts[collectionId]) {
      setLoadingCollections(prev => new Set(prev).add(collectionId));
      try {
        const products = await dreamApi.getCollectionProducts(collectionId);
        setCollectionProducts(prev => ({ ...prev, [collectionId]: products }));
      } catch (error) {
        console.error('Error fetching collection products:', error);
      } finally {
        setLoadingCollections(prev => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      }
    }
  };

  const handleAddCollectionWithProducts = (collection: Collection) => {
    const products = collectionProducts[collection.id] || [];
    onAddCollection(collection, products);
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const name = getLocalizedText(p.name, locale).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-neutral-100">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">
          Recursos da Base
        </h3>
        
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'collections'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Colecoes
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'products' ? 'Buscar produtos...' : 'Buscar colecoes...'}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : activeTab === 'products' ? (
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4">
                Nenhum produto encontrado
              </p>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-2 bg-neutral-50">
                    <button
                      onClick={() => toggleProductExpand(product.id)}
                      className="p-1 hover:bg-neutral-200 rounded"
                    >
                      {expandedProducts.has(product.id) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </button>
                    
                    {product.base_images?.[0] ? (
                      <img
                        src={product.base_images[0]}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-neutral-200 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">
                        {getLocalizedText(product.name, locale)}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {product.variants?.length || 0} variacoes
                      </p>
                    </div>
                    
                    <button
                      onClick={() => onAddProduct(product)}
                      className="p-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                      title="Adicionar ao diagrama"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {expandedProducts.has(product.id) && product.variants && product.variants.length > 0 && (
                    <div className="border-t border-neutral-200 bg-white">
                      {product.variants.map(variant => (
                        <div
                          key={variant.id}
                          className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 last:border-b-0"
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-neutral-300"
                            style={{ backgroundColor: variant.color_hex || '#ccc' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-neutral-700">
                              {variant.sku}
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              {getLocalizedText(variant.color_name, locale)} {variant.size && `- ${variant.size}`}
                            </p>
                          </div>
                          <p className="text-[10px] font-bold text-neutral-800">
                            R$ {variant.retail_price?.toFixed(2)}
                          </p>
                          <button
                            onClick={() => onAddVariant(product, variant)}
                            className="p-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                            title="Adicionar variacao"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {collections.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4">
                Nenhuma colecao encontrada
              </p>
            ) : (
              collections.map(collection => (
                <div key={collection.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-2 bg-neutral-50">
                    <button
                      onClick={() => toggleCollectionExpand(collection.id)}
                      className="p-1 hover:bg-neutral-200 rounded"
                    >
                      {loadingCollections.has(collection.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                      ) : expandedCollections.has(collection.id) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </button>
                    
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-purple-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">
                        {getLocalizedText(collection.name, locale)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleAddCollectionWithProducts(collection)}
                      className="p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      title="Adicionar colecao com produtos"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {expandedCollections.has(collection.id) && (
                    <div className="border-t border-neutral-200 bg-white">
                      {loadingCollections.has(collection.id) ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                        </div>
                      ) : collectionProducts[collection.id]?.length ? (
                        collectionProducts[collection.id].map(product => (
                          <div
                            key={product.id}
                            className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 last:border-b-0"
                          >
                            {product.base_images?.[0] ? (
                              <img
                                src={product.base_images[0]}
                                alt=""
                                className="w-6 h-6 rounded object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-neutral-200 flex items-center justify-center">
                                <Package className="w-3 h-3 text-neutral-400" />
                              </div>
                            )}
                            <p className="flex-1 text-[10px] font-medium text-neutral-700 truncate">
                              {getLocalizedText(product.name, locale)}
                            </p>
                            <button
                              onClick={() => onAddProduct(product)}
                              className="p-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                              title="Adicionar produto"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-neutral-400 text-center py-3">
                          Nenhum produto nesta colecao
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcePanel;

