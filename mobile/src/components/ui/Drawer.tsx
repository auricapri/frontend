/**
 * Drawer Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from './Icons';
import { getDrawerWidth, rp, scaleFont } from '../../utils/responsive';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  width,
}) => {
  const insets = useSafeAreaInsets();
  // Use responsive width if not provided - smaller max width for better mobile experience
  const drawerWidth = width || getDrawerWidth(95, 280, 400);
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              [side]: 0,
              paddingTop: Platform.OS === 'ios' ? insets.top : 0,
              paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
            },
          ]}
        >
          <SafeAreaView style={styles.safeContent} edges={['top', 'bottom']}>
            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={20} color="#000000" />
                </TouchableOpacity>
              </View>
            )}
            {children}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  safeContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rp(16),
    paddingVertical: rp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  title: {
    fontSize: scaleFont(18, 0.4),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(18, 0.4) * 0.11,
    flex: 1,
  },
  closeButton: {
    padding: rp(4),
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
});

