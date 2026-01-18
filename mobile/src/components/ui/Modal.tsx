/**
 * Modal Component - React Native
 * Adapted from web version
 */

import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { X } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const { width } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const sizeWidths: Record<typeof size, number> = {
    sm: Math.min(448, width - 32),
    md: Math.min(512, width - 32),
    lg: Math.min(672, width - 32),
    xl: Math.min(896, width - 32),
  };

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { width: sizeWidths[size] }]}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          )}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    flex: 1,
  },
  closeButton: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
  },
  content: {
    padding: 24,
  },
});

