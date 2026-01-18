/**
 * Footer Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { FileText, MapPin, Mail, Phone, Lock } from '../ui/Icons';
import { Locale } from '../../i18n';
import { StoreConfig } from '../../types';
import { getVersion } from '../../utils/version';

interface FooterProps {
  t: (key: string) => string;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
  onNavigate: (view: 'home' | 'collection' | 'about', target?: string) => void;
}

const Footer: React.FC<FooterProps> = ({
  t,
  currentLocale,
  onChangeLocale,
  storeConfig,
  onOpenLegal,
  onNavigate,
}) => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  return (
    <View style={styles.footer}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.brand}>{storeConfig.brand_name || ''}</Text>
          <Text style={styles.tagline}>{t('footer.tagline') || ''}</Text>

          {storeConfig.tax_id && storeConfig.tax_id.trim() !== '' ? (
            <View style={styles.infoRow}>
              <FileText size={16} color="#737373" style={styles.infoIcon} />
              <Text style={[styles.infoText, { marginLeft: 12 }]}>CNPJ: {storeConfig.tax_id}</Text>
            </View>
          ) : null}
          {storeConfig.address && storeConfig.address.trim() !== '' ? (
            <View style={styles.infoRow}>
              <MapPin size={16} color="#737373" style={styles.infoIcon} />
              <Text style={[styles.infoText, { marginLeft: 12 }]}>{storeConfig.address}</Text>
            </View>
          ) : null}
          {storeConfig.contact_email && storeConfig.contact_email.trim() !== '' ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${storeConfig.contact_email}`)}
              style={styles.infoRow}
            >
              <Mail size={16} color="#737373" style={styles.infoIcon} />
              <Text style={[styles.infoText, { marginLeft: 12 }]}>{storeConfig.contact_email}</Text>
            </TouchableOpacity>
          ) : null}
          {storeConfig.support_phone && storeConfig.support_phone.trim() !== '' ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${storeConfig.support_phone}`)}
              style={styles.infoRow}
            >
              <Phone size={16} color="#737373" style={styles.infoIcon} />
              <Text style={[styles.infoText, { marginLeft: 12 }]}>{storeConfig.support_phone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('footer.shop')}</Text>
          <TouchableOpacity onPress={() => onNavigate('home', 'hero')} style={styles.link}>
            <Text style={styles.linkText}>{t('nav.newArrivals')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate('home', 'collection')} style={styles.link}>
            <Text style={styles.linkText}>{t('nav.collection')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('footer.customerCare')}</Text>
          <TouchableOpacity onPress={() => onOpenLegal('privacy')} style={styles.link}>
            <Text style={styles.linkText}>{t('footer.privacy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onOpenLegal('terms')} style={styles.link}>
            <Text style={styles.linkText}>{t('footer.terms')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Lock size={16} color="#FFFFFF" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{t('footer.secure')}</Text>
            </View>
            <View style={styles.badge}>
              <Lock size={16} color="#FFFFFF" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{t('footer.ssl')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.copyright}>
        <Text style={styles.copyrightText}>{t('footer.rights')}</Text>
        {version && (
          <Text style={styles.versionText}>v.{version}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#171717',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  section: {
    marginBottom: 48,
  },
  brand: {
    fontSize: 24,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 12,
    color: '#A3A3A3',
    lineHeight: 20,
    maxWidth: 300,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    fontSize: 10,
    color: '#737373',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    color: '#E5E5E5',
    marginBottom: 12,
  },
  link: {
    marginTop: 12,
  },
  linkText: {
    fontSize: 12,
    color: '#A3A3A3',
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#262626',
    borderRadius: 8,
    marginRight: 16,
    marginBottom: 16,
  },
  badgeIcon: {
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#FFFFFF',
  },
  copyright: {
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 32,
    marginTop: 32,
  },
  copyrightText: {
    fontSize: 10,
    color: '#737373',
    textAlign: 'center',
  },
  versionText: {
    fontSize: 9,
    color: '#525252',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Footer;

