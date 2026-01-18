/**
 * OrderReceipt Component - React Native
 * Adapted from web version
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { ArrowLeft, Download, ShoppingBag, MessageCircle, Check, Loader2 } from '../ui/Icons';
import { Order, OrderItem } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { OrdersApi } from '../../api/orders.api';

interface OrderReceiptProps {
  order: Order;
  onBack: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, onBack, t, locale }) => {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const ordersApi = new OrdersApi();
  
  const handlePrint = async () => {
    setIsDownloadingPDF(true);
    try {
      await ordersApi.downloadReceiptPDF(order.id);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert('Erro ao baixar PDF. Tente novamente.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    const header = `*AURICAPRI - Recibo Digital*\n`;
    const id = `Pedido: #${order.id.slice(0, 8).toUpperCase()}\n`;
    const date = `Data: ${new Date(order.created_at).toLocaleDateString(locale)}\n`;
    const items = order.items.map(i => `- ${i.quantity}x ${getLoc(i.name)}`).join('\n');
    const total = `\n*TOTAL: ${formatCurrency(order.total, locale)}*`;
    const footer = `\n\nObrigado por comprar conosco!`;

    const text = encodeURIComponent(`${header}${id}${date}\nItens:\n${items}\n${total}${footer}`);
    Linking.openURL(`https://wa.me/?text=${text}`);
  };

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const formattedTime = new Date(order.created_at).toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color="#737373" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprovante</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleWhatsAppShare} style={styles.headerActionButton}>
            <MessageCircle size={16} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handlePrint} 
            disabled={isDownloadingPDF}
            style={styles.headerActionButton}
          >
            {isDownloadingPDF ? (
              <Loader2 size={16} color="#000000" />
            ) : (
              <Download size={16} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Receipt Paper */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptContainer}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoContainer}>
              <ShoppingBag size={48} color="#000000" />
            </View>
            <Text style={styles.brandName}>AURICAPRI</Text>
            <Text style={styles.brandSubtitle}>Luxury Global Retail</Text>
            <Text style={styles.brandCnpj}>CNPJ: 00.000.000/0001-99</Text>
          </View>

          {/* Order Info */}
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID DO PEDIDO</Text>
              <Text style={styles.infoValue}>{order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DATA EMISSÃO</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MÉTODO</Text>
              <View style={styles.paymentMethodBadge}>
                <Text style={styles.paymentMethodText}>
                  {order.payment_method === 'pix' ? 'PIX' : 'CARTÃO CRÉDITO'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>STATUS</Text>
              <View style={styles.statusContainer}>
                <Check size={12} color="#10B981" />
                <Text style={styles.statusText}>Confirmado</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Detalhamento</Text>
            {(order.items || []).map((item: OrderItem, idx) => (
              <View key={item.id || item.variant_id || idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{getLoc(item.name)}</Text>
                  <Text style={styles.itemDetails}>
                    {getLoc(item.color_name)} / {item.size} • Qtd: {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.price * item.quantity, locale)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SUBTOTAL</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(order.subtotal || order.total + (order.discount_amount || 0), locale)}
              </Text>
            </View>
            
            {order.discount_amount && order.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.discountLabel]}>DESCONTO APLICADO</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -{formatCurrency(order.discount_amount, locale)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>FRETE / ENVIO</Text>
              <Text style={styles.totalValue}>GRÁTIS</Text>
            </View>
            
            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>TOTAL PAGO</Text>
              <Text style={styles.totalFinalValue}>
                {formatCurrency(order.total, locale)}
              </Text>
            </View>
          </View>

          {/* Tracking Code */}
          {order.tracking_code && (
            <View style={styles.trackingContainer}>
              <Text style={styles.trackingLabel}>Código de Rastreio</Text>
              <Text style={styles.trackingCode}>{order.tracking_code}</Text>
            </View>
          )}

          {/* Barcode Simulation */}
          <View style={styles.barcodeContainer}>
            <View style={styles.barcode}>
              {[...Array(35)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.barcodeLine,
                    { 
                      width: Math.random() > 0.5 ? 2 : 4,
                      height: Math.random() > 0.3 ? '100%' : '60%',
                    }
                  ]} 
                />
              ))}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            Este documento possui valor fiscal para fins de garantia.{'\n'}
            Auricapri Global Inc.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Actions (Mobile) */}
      <View style={styles.floatingActions}>
        <TouchableOpacity 
          onPress={handlePrint}
          disabled={isDownloadingPDF}
          style={[styles.actionButton, styles.pdfButton]}
        >
          {isDownloadingPDF ? (
            <Loader2 size={16} color="#000000" />
          ) : (
            <Download size={16} color="#000000" />
          )}
          <Text style={styles.actionButtonText}>
            {isDownloadingPDF ? 'Gerando...' : 'PDF'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleWhatsAppShare}
          style={[styles.actionButton, styles.whatsappButton]}
        >
          <MessageCircle size={16} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.whatsappButtonText]}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
    padding: 32,
    marginVertical: 24,
  },
  brandHeader: {
    alignItems: 'center',
    paddingBottom: 32,
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  logoContainer: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 6.4,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginBottom: 4,
  },
  brandCnpj: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  orderInfo: {
    backgroundColor: '#FAFAFA',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  paymentMethodBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentMethodText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 32,
    borderStyle: 'dashed',
  },
  itemsSection: {
    marginBottom: 32,
    gap: 24,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#737373',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 20,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 10,
    color: '#737373',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  totalsSection: {
    marginBottom: 32,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  discountLabel: {
    color: '#10B981',
  },
  discountValue: {
    color: '#10B981',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  totalFinalLabel: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000000',
  },
  totalFinalValue: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -2,
    color: '#000000',
  },
  trackingContainer: {
    backgroundColor: '#171717',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  trackingLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  trackingCode: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  barcodeContainer: {
    alignItems: 'center',
    marginBottom: 24,
    opacity: 0.4,
  },
  barcode: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 40,
  },
  barcodeLine: {
    backgroundColor: '#000000',
  },
  footerText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 16,
  },
  floatingActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: 12,
    paddingBottom: Platform.OS === 'web' ? 16 : 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  pdfButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  whatsappButton: {
    flex: 2,
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#000000',
  },
  whatsappButtonText: {
    color: '#FFFFFF',
  },
});

export default OrderReceipt;

