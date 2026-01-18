/**
 * Splash Screen Component - React Native
 * Replicates the web splash screen design
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';

interface SplashScreenProps {
  visible: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ visible }) => {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const [shouldUnmount, setShouldUnmount] = useState(false);

  useEffect(() => {
    // useNativeDriver não funciona no web
    const useNativeDriver = Platform.OS !== 'web';
    
    // Shimmer animation
    Animated.loop(
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
      ])
    ).start();

    if (!visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver,
      }).start(() => {
        // After animation completes, unmount
        setShouldUnmount(true);
      });
    } else {
      setShouldUnmount(false);
    }
  }, [visible, fadeAnim, shimmerAnim]);

  
  // On web, return null immediately when not visible (animations may not work correctly)
  if (Platform.OS === 'web' && !visible) {
    return null;
  }
  
  // If not visible and should unmount, don't render at all
  if (!visible && shouldUnmount) {
    return null;
  }

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.logo,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            AURICAPRI
          </Animated.Text>
        </Animated.View>
        <View style={styles.lineContainer}>
          <View style={styles.lineBackground} />
          <Animated.View
            style={[
              styles.lineShimmer,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999, // Android
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 9.6, // 0.6em * 16
    color: '#000000',
  },
  lineContainer: {
    marginTop: 32,
    height: 1,
    width: 128,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  lineBackground: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#F5F5F5',
  },
  lineShimmer: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000000',
    width: '50%',
  },
});

export default SplashScreen;
