/**
 * Hero Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { ArrowRight } from '../ui';
import { Banner } from '../../types';
import { Locale } from '../../i18n';
import { hp, rp, scaleFont } from '../../utils/responsive';

const { width } = Dimensions.get('window');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeroProps {
  onNavigate?: (view: 'home' | 'product', target?: string) => void;
  t: (key: string) => string;
  banners?: Banner[];
  locale: Locale;
  isLoading?: boolean;
}

const Hero: React.FC<HeroProps> = ({ onNavigate, t, banners, locale, isLoading }) => {
  const handleClick = () => {
    if (onNavigate) onNavigate('home', 'collection');
  };

  const getBannerContent = (banner: Banner) => {
    const getVal = (obj: any) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      const val = obj[locale];
      return typeof val === 'string' ? val : '';
    };

    return {
      title: getVal(banner.title),
      image: getVal(banner.image_url),
    };
  };

  const validBanners = (banners || []).filter(b => {
    const title = (b.title as any)?.[locale];
    const img = (b.image_url as any)?.[locale];
    return title && title.trim() !== '' && img && img.trim() !== '';
  });

  const activeBannerRaw = validBanners.length > 0 ? validBanners[0] : null;
  const mainBanner = activeBannerRaw ? getBannerContent(activeBannerRaw) : null;

  if (isLoading || !mainBanner) {
    return (
      <View style={[styles.container, styles.loading]}>
        <View style={styles.loadingLine} />
      </View>
    );
  }

  const subtitleText = t('hero.subtitle');
  const ctaText = t('hero.cta');

  return (
    <View style={styles.container}>
      <Image source={{ uri: mainBanner.image }} style={styles.backgroundImage} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.subtitle}>{subtitleText}</Text>
        <Text style={styles.title}>{mainBanner.title}</Text>
        <TouchableOpacity onPress={handleClick} style={styles.ctaButton}>
          <Text style={styles.ctaText}>{ctaText}</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.scrollIndicator}>
        <View style={styles.scrollLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Platform.OS === 'web' ? '100vh' : hp(85), // 85% of screen height, responsive
    minHeight: hp(70), // Minimum 70% of screen height
    position: 'relative',
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loading: {
    backgroundColor: '#FAFAFA',
  },
  loadingLine: {
    width: 128,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: rp(16),
    width: '100%',
  },
  subtitle: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    letterSpacing: scaleFont(10, 0.3) * 0.6,
    marginBottom: rp(24),
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: scaleFont(36, 0.5),
    fontWeight: '300',
    letterSpacing: -2,
    marginBottom: rp(48),
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: scaleFont(36, 0.5) * 0.82,
    paddingHorizontal: rp(8),
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rp(20),
    paddingHorizontal: rp(40),
    paddingVertical: rp(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
  },
  ctaText: {
    fontSize: scaleFont(9, 0.3),
    letterSpacing: scaleFont(9, 0.3) * 0.4,
    color: '#FFFFFF',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: rp(40),
    left: '50%',
    marginLeft: -0.5,
    alignItems: 'center',
    gap: rp(10),
  },
  scrollLine: {
    width: 1,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default Hero;

