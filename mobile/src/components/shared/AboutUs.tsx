/**
 * AboutUs Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import { ArrowLeft } from '../ui';
import { StoreConfig } from '../../types';
import { Locale } from '../../i18n';
import { TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

interface AboutUsProps {
  config: StoreConfig;
  locale: Locale;
  onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ config, locale, onBack }) => {
  const text = config.about_us ? (config.about_us[locale] || config.about_us['en'] || '') : '';
  const image = config.about_us_image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header / Nav Area */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Left Column: Visual */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <View style={styles.imageOverlay} />
        </View>

        {/* Right Column: Content */}
        <View style={styles.textContainer}>
          <View style={styles.textContent}>
            <Text style={styles.label}>Nossa História</Text>
            <Text style={styles.title}>{config.brand_name}</Text>
            <View style={styles.divider} />
            
            <Text style={styles.text}>
              {text || 'A história da marca ainda está sendo escrita. Em breve compartilharemos nossa jornada e valores com você.'}
            </Text>

            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Fundação</Text>
                <Text style={styles.footerValue}>2024</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Sede</Text>
                <Text style={styles.footerValue}>São Paulo, BR</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Contato</Text>
                <Text style={styles.footerValue}>{config.contact_email || 'hello@auricapri.com'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  backText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? '60vh' : height * 0.6,
    backgroundColor: '#F5F5F5',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  textContainer: {
    width: '100%',
    padding: 24,
    paddingTop: 48,
    paddingBottom: 64,
  },
  textContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 9.6,
    color: '#737373',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: -2,
    lineHeight: 41,
    marginBottom: 48,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#000000',
    marginBottom: 48,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: '#404040',
    fontWeight: '400',
    marginBottom: 80,
  },
  footer: {
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 48,
  },
  footerItem: {
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    marginBottom: 8,
    color: '#737373',
  },
  footerValue: {
    fontSize: 20,
    fontWeight: '300',
    color: '#000000',
  },
});

export default AboutUs;

