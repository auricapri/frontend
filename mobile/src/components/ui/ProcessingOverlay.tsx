/**
 * ProcessingOverlay Component - React Native
 * Smooth animated loading overlay for order processing
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, Platform } from 'react-native';
import { Loader2 } from './Icons';

interface ProcessingOverlayProps {
  visible: boolean;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
      rotateAnim.setValue(0);
      shimmerAnim.setValue(0);

      // Fade in and scale up with smooth spring
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver,
        }),
      ]).start();

      // Continuous rotation for loader (smooth infinite loop)
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver,
        }),
        { iterations: -1 }
      );
      rotateAnimation.start();

      // Shimmer animation for text (subtle pulse)
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver,
          }),
        ]),
        { iterations: -1 }
      );
      shimmerAnimation.start();

      return () => {
        rotateAnimation.stop();
        shimmerAnimation.stop();
      };
    } else {
      // Fade out smoothly
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, rotateAnim, shimmerAnim]);

  if (!visible) {
    return null;
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loaderContainer,
            {
              transform: [{ rotate }],
            },
          ]}
        >
          <Loader2 size={48} color="#000000" />
        </Animated.View>
        
        <Animated.View style={{ opacity: shimmerOpacity }}>
          <Text style={styles.title}>Processando Pedido</Text>
        </Animated.View>
        
        <Text style={styles.subtitle}>Não feche esta janela...</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 2000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
    fontStyle: 'italic',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
});

