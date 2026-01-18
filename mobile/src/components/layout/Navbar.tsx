/**
 * Navbar Component - React Native
 * Exact replica of /auricapri Navbar
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, X, Heart, ShoppingBag, ArrowLeft, User, Ticket } from '../ui';
import { UserMode } from '../../types';
import { Locale } from '../../i18n';
import { rp, scaleFont } from '../../utils/responsive';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenCoupons: () => void;
  onOpenAuth: () => void;
  userMode: UserMode;
  onToggleMode: () => void;
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout' | 'about', target?: string) => void;
  isScrolled: boolean;
  isProductView?: boolean;
  onBack?: () => void;
  isLoggedIn: boolean;
  t: (key: string) => any;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeName: string;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  onOpenCoupons,
  onOpenAuth,
  userMode,
  onToggleMode,
  onNavigate,
  isScrolled,
  isProductView,
  onBack,
  isLoggedIn,
  t,
  currentLocale,
  onChangeLocale,
  storeName,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isSolid = isScrolled || isProductView;
  
  // Both iOS and Android need paddingTop to respect safe area
  // iOS: paddingTop to avoid notch/Dynamic Island
  // Android: paddingTop to avoid status bar, but background extends full screen
  const navbarTopPadding = insets.top;
  
  // Responsive dimensions - use fixed values that work well on all screen sizes
  // These values are already responsive through the rp() function in styles
  const navbarHeightSolid = 56; // Base height for solid navbar
  const navbarHeightTransparent = 70; // Base height for transparent navbar
  
  // Total height includes safe area padding
  // Background extends to top, but height needs to account for content padding
  const totalHeightSolid = navbarHeightSolid + navbarTopPadding;
  const totalHeightTransparent = navbarHeightTransparent + navbarTopPadding;
  
  // Animation values
  const heightAnim = useRef(new Animated.Value(isSolid ? totalHeightSolid : totalHeightTransparent)).current;
  const bgOpacityAnim = useRef(new Animated.Value(isSolid ? 1 : 0)).current;
  const textColorAnim = useRef(new Animated.Value(isSolid ? 0 : 1)).current;
  const menuOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: isSolid ? totalHeightSolid : totalHeightTransparent,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(bgOpacityAnim, {
        toValue: isSolid ? 1 : 0,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(textColorAnim, {
        toValue: isSolid ? 0 : 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isSolid, totalHeightSolid, totalHeightTransparent]);

  useEffect(() => {
    if (isMenuOpen) {
      Animated.timing(menuOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      menuOpacityAnim.setValue(0);
    }
  }, [isMenuOpen]);

  const handleNav = (view: 'home' | 'product' | 'admin' | 'checkout' | 'about', target?: string) => {
    onNavigate(view, target);
    setIsMenuOpen(false);
  };

  const iconColor = isSolid ? '#000000' : '#FFFFFF';
  const textColor = textColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', '#FFFFFF'],
  });

  const backgroundColor = bgOpacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.9)'],
  });

  const borderColor = bgOpacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(245, 245, 245, 0)', 'rgba(245, 245, 245, 1)'],
  });

  return (
    <>
      <Animated.View 
        style={[
          styles.navbar,
          {
            height: heightAnim,
            backgroundColor: backgroundColor,
            borderBottomColor: borderColor,
            borderBottomWidth: isSolid ? 1 : 0,
            // No paddingTop here - background extends to top
          }
        ]}
      >
        <View style={[
          styles.content,
          { paddingTop: navbarTopPadding } // Padding only on content, not on navbar background
        ]}>
          {/* Left Col: Menu/Back */}
          <View style={styles.leftSection}>
            {isProductView ? (
              <TouchableOpacity 
                onPress={onBack} 
                style={styles.backButton}
                activeOpacity={0.5}
              >
                <ArrowLeft size={20} color={isSolid ? '#000000' : '#FFFFFF'} strokeWidth={1.5} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => setIsMenuOpen(true)} 
                style={styles.menuButton}
                activeOpacity={0.5}
              >
                <Menu size={24} color={iconColor} strokeWidth={1.2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Center Col: Brand */}
          <TouchableOpacity 
            onPress={() => handleNav('home')} 
            style={styles.centerSection}
            activeOpacity={0.6}
          >
            <Animated.Text 
              style={[
                styles.brand,
                { color: textColor }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {storeName || 'AURICAPRI'}
            </Animated.Text>
          </TouchableOpacity>

          {/* Right Col: Actions */}
          <View style={styles.rightSection}>
            <TouchableOpacity 
              onPress={onOpenAuth} 
              style={styles.iconButton}
              activeOpacity={0.5}
            >
              <User 
                size={20} 
                color={iconColor} 
                strokeWidth={1.2}
                fill={isLoggedIn ? iconColor : undefined}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onOpenWishlist} 
              style={styles.iconButton}
              activeOpacity={0.5}
            >
              <Heart 
                size={20} 
                color={iconColor} 
                strokeWidth={1.2}
                filled={wishlistCount > 0}
              />
              {wishlistCount > 0 && (
                <View style={[
                  styles.wishlistBadge,
                  { backgroundColor: '#EF4444' }
                ]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onOpenCart} 
              style={styles.iconButton}
              activeOpacity={0.5}
            >
              <ShoppingBag size={20} color={iconColor} strokeWidth={1.2} />
              {cartCount > 0 && (
                <View style={[
                  styles.cartBadge,
                  { 
                    backgroundColor: isSolid ? '#000000' : '#FFFFFF',
                  }
                ]}>
                  <Text style={[
                    styles.cartBadgeText,
                    { color: isSolid ? '#FFFFFF' : '#000000' }
                  ]}>
                    {cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Fullscreen Overlay Menu */}
      <Modal 
        visible={isMenuOpen} 
        animationType="none"
        transparent={false}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: menuOpacityAnim,
            }
          ]}
        >
          <SafeAreaView 
            style={{ flex: 1 }}
            edges={['top', 'bottom']}
          >
          <View style={[styles.menuHeader, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
            <Text style={styles.menuTitle}>{storeName}</Text>
            <TouchableOpacity 
              onPress={() => setIsMenuOpen(false)} 
              style={styles.menuCloseButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuContent}>
            <View style={styles.menuItems}>
              <TouchableOpacity
                onPress={() => handleNav('home', 'hero')}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>{t('nav.newArrivals')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleNav('home', 'collection')}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>{t('nav.collection')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleNav('about')}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemText}>Sobre Nós</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuFooter}>
              {/* Secondary Actions Row */}
              <View style={styles.menuActionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    setIsMenuOpen(false);
                    onOpenCoupons();
                  }}
                  style={styles.menuActionButton}
                  activeOpacity={0.95}
                >
                  <View style={styles.menuActionContent}>
                    <View style={styles.menuActionLeft}>
                      <Ticket size={24} color="#000000" strokeWidth={1} />
                      <Text style={styles.menuActionText}>{t('nav.coupons')}</Text>
                    </View>
                    <ArrowLeft 
                      size={16} 
                      color="#000000"
                      style={{ transform: [{ rotate: '180deg' }] }}
                    />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={onToggleMode}
                  style={styles.menuActionButtonAlt}
                  activeOpacity={0.95}
                >
                  <View style={styles.menuActionContent}>
                    <View style={styles.menuActionLeft}>
                      <View style={styles.menuActionLabelContainer}>
                        <Text style={styles.menuActionLabel}>Ambiente</Text>
                        <Text style={styles.menuActionValue}>{userMode}</Text>
                      </View>
                    </View>
                    <ArrowLeft 
                      size={16} 
                      color="#000000"
                      style={{ transform: [{ rotate: '180deg' }] }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(12), // Reduced padding for smaller screens
    width: '100%',
  },
  leftSection: {
    width: 50, // Fixed width for menu/back button
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rp(4),
    minWidth: 0, // Allow shrinking
    maxWidth: '100%', // Prevent overflow
  },
  rightSection: {
    width: 150, // Fixed width for icons (3 icons ~50px each)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2, // Reduced gap
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: scaleFont(9, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.53, // Proportional letter spacing
  },
  menuButton: {
    padding: rp(4),
    marginLeft: rp(-4),
  },
  brand: {
    fontSize: scaleFont(14, 0.3), // Smaller font for better fit
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(14, 0.3) * 0.4, // Reduced letter spacing
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: '100%', // Prevent overflow
  },
  iconButton: {
    padding: rp(4), // Reduced padding
    position: 'relative',
    minWidth: 36, // Smaller touch target
    maxWidth: 36,
  },
  wishlistBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  cartBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuHeader: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuTitle: {
    fontSize: scaleFont(18, 0.4),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(18, 0.4) * 0.36,
    flex: 1,
  },
  menuCloseButton: {
    padding: rp(8),
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
  },
  menuContent: {
    flex: 1,
    padding: rp(24),
    justifyContent: 'space-between',
  },
  menuItems: {
    gap: 32,
  },
  menuItem: {
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: scaleFont(32, 0.5),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  menuFooter: {
    paddingTop: rp(40),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  menuActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuActionButton: {
    flex: 1,
    minWidth: 120,
    padding: rp(20),
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuActionButtonAlt: {
    flex: 1,
    minWidth: 120,
    padding: rp(20),
    borderWidth: 2,
    borderColor: '#F5F5F5',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuActionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuActionText: {
    fontSize: scaleFont(9, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.53,
  },
  menuActionLabelContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  menuActionLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    color: '#A3A3A3',
  },
  menuActionValue: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default Navbar;
