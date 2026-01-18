/**
 * UserProfileView Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Platform, Alert, Clipboard, Modal, TextInput } from 'react-native';
import { 
  User, 
  Package, 
  Ticket, 
  ChevronRight, 
  Copy, 
  Check, 
  Loader2, 
  Phone, 
  ShoppingBag,
  ArrowLeft,
  X,
  Truck,
  Download,
  Trophy,
  LogOut
} from '../ui/Icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { UserProfile, Order, OrderItem } from '../../types';
import { Locale } from '../../i18n';
import { supabase } from '../../utils/supabase';
import { OrderReceipt } from '../orders';
import { formatCurrency } from '../../utils/currency';
import { OrdersApi } from '../../api/orders.api';
import { UsersApi } from '../../api/users.api';
import { maskPhone, maskCPF } from '../../utils/masks';

interface UserProfileViewProps {
  user: UserProfile;
  t: (key: string) => any;
  locale: Locale;
  onUpdate: (user: UserProfile) => void;
  onLogout?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, t, locale, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'affiliate'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
  
  const getPhonePrefix = (loc: Locale) => {
    switch (loc) {
      case 'pt': return '+55 ';
      case 'en': return '+1 ';
      case 'es': return '+34 ';
      case 'fr': return '+33 ';
      default: return '';
    }
  };

  const [phone, setPhone] = useState(user.phone || getPhonePrefix(locale));
  const [cpf, setCpf] = useState(user.cpf || '');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    if (!user.phone) {
      const currentVal = phone.trim();
      const prefixes = ['+55', '+1', '+34', '+33'];
      if (currentVal === '' || prefixes.includes(currentVal)) {
        setPhone(getPhonePrefix(locale));
      }
    }
  }, [locale]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const ordersApi = new OrdersApi();
      const ordersData = await ordersApi.getByUserId(user.id);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const usersApi = new UsersApi();
      const updatedProfile = await usersApi.updateProfile({
        full_name: fullName,
        phone,
        cpf
      });
      
      onUpdate(updatedProfile);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyCode = () => {
    const code = user.affiliate_code || `AUR-${user.full_name.split(' ')[0].toUpperCase()}-${user.id.slice(0,4)}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    } else {
      Clipboard.setString(code);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (viewingReceiptOrder) {
    return (
      <View style={styles.receiptContainer}>
        <OrderReceipt 
          order={viewingReceiptOrder} 
          onBack={() => setViewingReceiptOrder(null)} 
          t={t} 
          locale={locale} 
        />
      </View>
    );
  }

  // Loyalty Data
  const xp = user.loyalty?.current_xp || 0;
  const level = user.loyalty?.current_level || 1;
  const cashback = user.loyalty?.cashback_balance || 0;
  const nextLevelXp = level < 4 ? (level === 1 ? 1000 : level === 2 ? 5000 : 15000) : xp * 1.5;
  const xpProgress = Math.min(100, (xp / nextLevelXp) * 100);

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabs}>
        {[
          { id: 'profile' as const, label: t('auth.profile'), icon: User },
          { id: 'orders' as const, label: t('auth.orderHistory'), icon: Package },
          { id: 'affiliate' as const, label: t('auth.affiliate'), icon: Ticket },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive
            ]}
          >
            <tab.icon size={14} color={activeTab === tab.id ? '#FFFFFF' : '#737373'} />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && (
          <View style={styles.profileTab}>
            {/* Loyalty Card */}
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyTrophy}>
                <Trophy size={128} color="rgba(255, 255, 255, 0.1)" />
              </View>
              
              <View style={styles.loyaltyContent}>
                <View style={styles.loyaltyHeader}>
                  <View>
                    <Text style={styles.loyaltyLabel}>Status Fidelidade</Text>
                    <Text style={styles.loyaltyLevel}>Nível {level}</Text>
                  </View>
                  <View style={styles.cashbackBadge}>
                    <Text style={styles.cashbackText}>
                      {formatCurrency(cashback, locale)} Cashback
                    </Text>
                  </View>
                </View>

                <View style={styles.xpSection}>
                  <View style={styles.xpLabels}>
                    <Text style={styles.xpLabel}>{xp} XP</Text>
                    <Text style={styles.xpLabel}>{nextLevelXp} XP</Text>
                  </View>
                  <View style={styles.xpBar}>
                    <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
                  </View>
                  <Text style={styles.xpHint}>
                    Continue comprando para subir de nível e ganhar cupons exclusivos.
                  </Text>
                </View>
              </View>
            </View>

            {/* Profile Form */}
            <View style={styles.form}>
              <Input
                label={t('admin.customer') || 'Nome'}
                value={fullName}
                onChangeText={setFullName}
              />
              
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.phoneLabel}>{t('auth.phone') || 'Telefone'}</Text>
                <View style={styles.phoneInputContainer}>
                  <Phone size={16} color="#A3A3A3" style={styles.phoneIcon} />
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="+55 11 99999-9999"
                    value={phone}
                    onChangeText={(text) => setPhone(maskPhone(text))}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.cpfInputWrapper}>
                <Text style={styles.cpfLabel}>CPF (opcional para nota fiscal)</Text>
                <TextInput
                  style={styles.cpfInput}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#A3A3A3"
                  value={cpf}
                  onChangeText={(text) => setCpf(maskCPF(text))}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>

              <Button
                onPress={handleUpdateProfile}
                disabled={isUpdating}
                variant="primary"
                size="md"
                isLoading={isUpdating}
              >
                {t('auth.save') || 'Salvar'}
              </Button>
            </View>

            {/* Logout Button */}
            {onLogout && (
              <TouchableOpacity 
                onPress={async () => {
                  await supabase.auth.signOut();
                  onLogout();
                }}
                style={styles.logoutButton}
              >
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.logoutText}>{t('auth.logout') || 'Sair'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.ordersTab}>
            {loadingOrders ? (
              <View style={styles.loadingContainer}>
                <Loader2 size={32} color="#A3A3A3" />
                <Text style={styles.loadingText}>Carregando Histórico...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyOrders}>
                <ShoppingBag size={48} color="#E5E5E5" />
                <Text style={styles.emptyOrdersText}>{t('auth.noOrders') || 'Nenhum pedido encontrado'}</Text>
              </View>
            ) : (
              orders.map(order => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => setSelectedOrder(order)}
                  style={styles.orderCard}
                >
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>ID: {order.id.slice(0, 8)}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString(locale)}
                    </Text>
                    <View style={styles.orderStatusRow}>
                      <View style={[
                        styles.orderStatusDot,
                        order.status === 'delivered' && styles.orderStatusDotDelivered
                      ]} />
                      <Text style={styles.orderStatus}>{order.status}</Text>
                    </View>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>
                      {formatCurrency(order.total || 0, locale)}
                    </Text>
                    <ChevronRight size={20} color="#A3A3A3" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'affiliate' && (
          <View style={styles.affiliateTab}>
            <View style={styles.affiliateCard}>
              <View style={styles.affiliateTrophy}>
                <Ticket size={128} color="rgba(255, 255, 255, 0.1)" />
              </View>
              
              <View style={styles.affiliateContent}>
                <Text style={styles.affiliateTitle}>Auricapri Muse</Text>
                <Text style={styles.affiliateSubtitle}>
                  Compartilhe elegância e ganhe 10% de comissão em cada venda convertida.
                </Text>

                <View style={styles.affiliateCodeSection}>
                  <Text style={styles.affiliateCodeLabel}>Seu Código Único</Text>
                  <View style={styles.affiliateCodeContainer}>
                    <Text style={styles.affiliateCode}>
                      {user.affiliate_code || `AUR-${user.full_name.split(' ')[0].toUpperCase()}-${user.id.slice(0,4)}`}
                    </Text>
                    <TouchableOpacity 
                      onPress={handleCopyCode}
                      style={styles.copyCodeButton}
                    >
                      {copiedCode ? (
                        <Check size={20} color="#000000" />
                      ) : (
                        <Copy size={20} color="#000000" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.affiliateStats}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Ganhos</Text>
                <Text style={styles.statValue}>{formatCurrency(0, locale)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Vendas</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal visible={!!selectedOrder} animationType="slide">
          <View style={styles.orderDetailContainer}>
            <View style={styles.orderDetailHeader}>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.backButtonDetail}>
                <ArrowLeft size={16} color="#737373" />
              </TouchableOpacity>
              <Text style={styles.orderDetailTitle}>
                Pedido {selectedOrder.id.slice(0, 8)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeButtonDetail}>
                <X size={16} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.orderDetailContent} showsVerticalScrollIndicator={false}>
              {/* Tracking Section */}
              <View style={styles.trackingCard}>
                <View style={styles.trackingHeader}>
                  <View style={styles.trackingIcon}>
                    <Truck size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.trackingLabel}>{t('auth.tracking') || 'Rastreamento'}</Text>
                    <Text style={styles.trackingCode}>
                      {selectedOrder.tracking_code || 'Aguardando Despacho'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.trackingBar}>
                  <View style={[
                    styles.trackingBarFill,
                    { 
                      width: selectedOrder.status === 'delivered' ? '100%' 
                        : selectedOrder.status === 'shipped' ? '60%' 
                        : '15%' 
                    }
                  ]} />
                </View>
                
                <View style={styles.trackingLabels}>
                  <Text style={styles.trackingLabelItem}>Processando</Text>
                  <Text style={[
                    styles.trackingLabelItem,
                    (selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && styles.trackingLabelItemActive
                  ]}>
                    Enviado
                  </Text>
                  <Text style={[
                    styles.trackingLabelItem,
                    selectedOrder.status === 'delivered' && styles.trackingLabelItemActive
                  ]}>
                    Entregue
                  </Text>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.orderItemsSection}>
                <Text style={styles.orderItemsTitle}>Itens do Pedido</Text>
                {(selectedOrder.items || []).map((item: OrderItem) => (
                  <View key={item.id} style={styles.orderItemCard}>
                    <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName}>{getLoc(item.name)}</Text>
                      <Text style={styles.orderItemDetails}>
                        {getLoc(item.color_name)} | {item.size}
                      </Text>
                      <Text style={styles.orderItemQuantity}>Qtd: {item.quantity}</Text>
                    </View>
                    <Text style={styles.orderItemPrice}>
                      {formatCurrency(item.price * item.quantity, locale)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Total and Download */}
              <View style={styles.orderDetailFooter}>
                <View style={styles.orderDetailTotalRow}>
                  <Text style={styles.orderDetailTotalLabel}>Total Pago</Text>
                  <Text style={styles.orderDetailTotalValue}>
                    {formatCurrency(selectedOrder.total || 0, locale)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => setViewingReceiptOrder(selectedOrder)}
                  style={styles.downloadReceiptButton}
                >
                  <Download size={16} color="#000000" />
                  <Text style={styles.downloadReceiptText}>Baixar Comprovante Fiscal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    padding: 4,
    marginHorizontal: 32,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileTab: {
    padding: 32,
    gap: 32,
  },
  loyaltyCard: {
    backgroundColor: '#171717',
    padding: 32,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
    position: 'relative',
  },
  loyaltyTrophy: {
    position: 'absolute',
    top: 32,
    right: 32,
    opacity: 0.1,
  },
  loyaltyContent: {
    position: 'relative',
    zIndex: 10,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  loyaltyLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  loyaltyLevel: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  cashbackBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  xpSection: {
    gap: 8,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FACC15',
  },
  xpHint: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingTop: 8,
  },
  form: {
    gap: 24,
  },
  phoneInputWrapper: {
    gap: 8,
  },
  phoneLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    paddingHorizontal: 16,
  },
  phoneInputContainer: {
    position: 'relative',
  },
  phoneIcon: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
  },
  phoneInput: {
    width: '100%',
    padding: 20,
    paddingLeft: 56,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  cpfInputWrapper: {
    gap: 8,
  },
  cpfLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    paddingHorizontal: 16,
  },
  cpfInput: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    color: '#000000',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 32,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: '#EF4444',
  },
  ordersTab: {
    padding: 32,
    gap: 24,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#A3A3A3',
  },
  emptyOrders: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  emptyOrdersText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  orderInfo: {
    gap: 8,
  },
  orderId: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FB923C',
  },
  orderStatusDotDelivered: {
    backgroundColor: '#10B981',
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#404040',
  },
  orderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: -1,
  },
  affiliateTab: {
    padding: 32,
    gap: 40,
  },
  affiliateCard: {
    backgroundColor: '#171717',
    padding: 40,
    borderRadius: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  affiliateTrophy: {
    position: 'absolute',
    top: 32,
    right: 32,
    opacity: 0.1,
  },
  affiliateContent: {
    position: 'relative',
    zIndex: 10,
    gap: 32,
    alignItems: 'center',
  },
  affiliateTitle: {
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  affiliateSubtitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
  affiliateCodeSection: {
    width: '100%',
    gap: 12,
  },
  affiliateCodeLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 6.4,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  affiliateCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
    borderRadius: 32,
  },
  affiliateCode: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    color: '#FFFFFF',
  },
  copyCodeButton: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliateStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statCard: {
    flex: 1,
    padding: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -1,
  },
  orderDetailContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  orderDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    height: 96,
  },
  backButtonDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
  },
  backButtonTextDetail: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  orderDetailTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  closeButtonDetail: {
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
  orderDetailContent: {
    flex: 1,
    padding: 32,
    gap: 48,
  },
  trackingCard: {
    backgroundColor: '#FAFAFA',
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    gap: 32,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  trackingIcon: {
    padding: 16,
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    marginBottom: 4,
  },
  trackingCode: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  trackingBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
  },
  trackingBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#000000',
  },
  trackingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackingLabelItem: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  trackingLabelItemActive: {
    color: '#000000',
  },
  orderItemsSection: {
    gap: 24,
  },
  orderItemsTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#A3A3A3',
    paddingHorizontal: 8,
  },
  orderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    backgroundColor: '#FAFAFA',
  },
  orderItemImage: {
    width: 64,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  orderItemInfo: {
    flex: 1,
    gap: 4,
  },
  orderItemName: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  orderItemDetails: {
    fontSize: 9,
    color: '#737373',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 2,
  },
  orderItemQuantity: {
    fontSize: 10,
    fontWeight: '900',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -1,
  },
  orderDetailFooter: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: 24,
  },
  orderDetailTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailTotalLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  orderDetailTotalValue: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: -2,
  },
  downloadReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 32,
    backgroundColor: '#FAFAFA',
  },
  downloadReceiptText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default UserProfileView;

