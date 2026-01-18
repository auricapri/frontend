/**
 * WishlistDrawer Component - React Native
 * Adapted from web version
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Platform, Clipboard, Linking } from 'react-native';
import { X, ShoppingBag, Trash2, ArrowRight, Share2, Link2, MessageCircle, ShoppingCart } from '../ui';
import { Drawer } from '../ui/Drawer';
import { Product, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice } from '../../utils/product';
import { WishlistApi } from '../../api/wishlist.api';
import { rp, scaleFont } from '../../utils/responsive';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  userMode: UserMode;
  onRemoveItem: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onBuyAll: () => void;
  t: (key: string) => any;
  locale: Locale;
  currentUserId?: string;
}

const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  userMode, 
  onRemoveItem,
  onSelectProduct,
  onBuyAll,
  t,
  locale,
  currentUserId
}) => {
  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const wishlistApi = new WishlistApi();

  const getProductPrice = (product: Product): number => {
    const mainVariant = product.variants?.[0];
    if (!mainVariant) return 0;
    return calculatePrice(mainVariant, userMode);
  };

  const getProductImage = (product: Product): string => {
    return product.default_image_url || (Array.isArray(product.base_images) && product.base_images.length > 0 ? product.base_images[0] : '');
  };

  // Get or generate share URL
  const getShareUrl = async (): Promise<string | null> => {
    if (!currentUserId) {
      return null;
    }

    // If we already have a share URL, return it
    if (shareUrl) {
      return shareUrl;
    }

    try {
      setIsGeneratingLink(true);
      const shareSlug = await wishlistApi.getShareSlug();
      const url = Platform.OS === 'web' && typeof window !== 'undefined' 
        ? `${window.location.origin}/wishlist/${shareSlug}`
        : `https://frontend-female.vercel.app/wishlist/${shareSlug}`;
      setShareUrl(url);
      return url;
    } catch (error: any) {
      console.error('Error generating share link:', error);
      return null;
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleShareLink = async () => {
    if (!currentUserId) {
      alert('Você precisa estar logado para compartilhar sua wishlist');
      return;
    }

    const url = await getShareUrl();
    if (!url) {
      alert('Erro ao gerar link de compartilhamento. Tente novamente.');
      return;
    }

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        Clipboard.setString(url);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error: any) {
      console.error('Error copying to clipboard:', error);
      alert(`Link de compartilhamento:\n\n${url}\n\nCopie este link manualmente.`);
    }
  };

  const handleSocialShare = async (platform: string) => {
    if (!currentUserId) {
      alert('Você precisa estar logado para compartilhar sua wishlist');
      return;
    }

    const url = await getShareUrl();
    if (!url) {
      alert('Erro ao gerar link de compartilhamento. Tente novamente.');
      return;
    }

    const text = `Dá uma olhada na minha wishlist de luxo da Auricapri!`;
    
    if (platform === 'whatsapp') {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`);
    } else if (platform === 'twitter') {
      Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    }
  };

  const totalValue = items.reduce((sum, product) => sum + getProductPrice(product), 0);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={undefined} side="right" width={undefined}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>My Curation</Text>
          <Text style={styles.headerTitle}>{t('wishlist.title')} ({items.length})</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('wishlist.empty')}</Text>
        </View>
      ) : (
        <>
          {/* Share Actions */}
          <View style={styles.shareSection}>
            <TouchableOpacity onPress={handleShareLink} style={styles.shareButton} disabled={isGeneratingLink}>
              {copiedLink ? (
                <Text style={styles.shareButtonText}>Link Copied!</Text>
              ) : (
                <>
                  <Link2 size={16} color="#000000" />
                  <Text style={styles.shareButtonText}>Share List</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleSocialShare('whatsapp')} 
              style={[styles.shareButton, (isGeneratingLink || !currentUserId) && styles.shareButtonDisabled]}
              disabled={isGeneratingLink || !currentUserId}
            >
              {isGeneratingLink ? (
                <Text style={styles.shareButtonText}>...</Text>
              ) : (
                <MessageCircle size={16} color="#000000" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleSocialShare('twitter')} 
              style={[styles.shareButton, (isGeneratingLink || !currentUserId) && styles.shareButtonDisabled]}
              disabled={isGeneratingLink || !currentUserId}
            >
              {isGeneratingLink ? (
                <Text style={styles.shareButtonText}>...</Text>
              ) : (
                <Share2 size={16} color="#000000" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {items.map((product) => {
              const price = getProductPrice(product);
              const image = getProductImage(product);
              
              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  style={styles.itemContainer}
                >
                  <Image source={{ uri: image }} style={styles.itemImage} />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName} numberOfLines={2}>{getLoc(product.name)}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(price, locale)}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onRemoveItem(product.id);
                        }}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} color="#737373" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                          onClose();
                        }}
                        style={styles.viewButton}
                      >
                        <ShoppingBag size={16} color="#000000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Value</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalValue, locale)}</Text>
            </View>
            <TouchableOpacity onPress={onBuyAll} style={styles.buyAllButton}>
              <View style={styles.buyAllButtonInner}>
                <ShoppingCart size={24} color="#FFFFFF" />
                <Text style={styles.buyAllButtonText}>Adicionar Todos à Bolsa</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Drawer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: rp(20),
    paddingBottom: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    gap: rp(3),
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  headerLabel: {
    fontSize: scaleFont(8, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(8, 0.3) * 0.8,
    color: '#737373',
  },
  headerTitle: {
    fontSize: scaleFont(18, 0.5),
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -1,
    color: '#000000',
    flexShrink: 1,
  },
  closeButton: {
    padding: rp(8),
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    flexShrink: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rp(40),
  },
  emptyText: {
    fontSize: scaleFont(12, 0.3),
    fontWeight: '400',
    color: '#737373',
  },
  shareSection: {
    flexDirection: 'row',
    gap: rp(8),
    padding: rp(16),
    paddingBottom: rp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rp(6),
    padding: rp(8),
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    flex: 1,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    fontSize: scaleFont(9, 0.3),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.22,
    color: '#000000',
  },
  itemsList: {
    flex: 1,
    padding: rp(16),
  },
  itemContainer: {
    flexDirection: 'row',
    gap: rp(12),
    marginBottom: rp(16),
    paddingBottom: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemImage: {
    width: 80, // Smaller for mobile
    height: 100, // Smaller for mobile
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    resizeMode: 'cover',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: rp(2),
    minWidth: 0, // Allow shrinking
  },
  itemName: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#000000',
    marginBottom: rp(6),
    lineHeight: scaleFont(10, 0.3) * 1.6,
  },
  itemPrice: {
    fontSize: scaleFont(12, 0.3),
    fontWeight: '300',
    letterSpacing: -1,
    color: '#000000',
    marginBottom: rp(12),
  },
  itemActions: {
    flexDirection: 'row',
    gap: rp(8),
  },
  removeButton: {
    padding: rp(4),
  },
  viewButton: {
    padding: rp(4),
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  footer: {
    padding: rp(16),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: rp(12),
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(10, 0.3) * 0.2,
    color: '#000000',
  },
  totalValue: {
    fontSize: scaleFont(16, 0.4),
    fontWeight: '300',
    letterSpacing: -1,
    color: '#000000',
  },
  buyAllButton: {
    width: '100%',
  },
  buyAllButtonInner: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: rp(20),
    paddingHorizontal: rp(24),
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rp(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buyAllButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(11, 0.3) * 0.18,
    marginRight: rp(6),
  },
});

export default WishlistDrawer;

