// Mock for react-native-reanimated on web
// react-native-reanimated is not needed for web, use regular Animated from react-native-web
import { Animated } from 'react-native';

const mockReanimated = {
  default: {
    View: Animated.View,
    Text: Animated.Text,
    Image: Animated.Image,
    ScrollView: Animated.ScrollView,
    FlatList: Animated.FlatList,
  },
  Easing: {
    linear: (t) => t,
    ease: (t) => t * (2 - t),
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
  },
  Extrapolate: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity',
  },
  // Use react-native Animated API
  Value: Animated.Value,
  timing: Animated.timing,
  spring: Animated.spring,
  decay: Animated.decay,
  sequence: Animated.sequence,
  parallel: Animated.parallel,
  stagger: Animated.stagger,
  loop: Animated.loop,
  event: Animated.event,
  add: Animated.add,
  subtract: Animated.subtract,
  divide: Animated.divide,
  multiply: Animated.multiply,
  modulo: Animated.modulo,
  diffClamp: Animated.diffClamp,
  delay: Animated.delay,
  createAnimatedComponent: Animated.createAnimatedComponent,
  attachNativeEvent: () => {},
  forkEvent: () => {},
  unforkEvent: () => {},
  // Hook mocks
  useSharedValue: (init) => ({ value: init }),
  useAnimatedStyle: (updater) => ({}),
  useAnimatedProps: (updater) => ({}),
  useDerivedValue: (updater) => ({ value: updater() }),
  useAnimatedScrollHandler: (handlers) => ({}),
  useAnimatedGestureHandler: (handlers) => ({}),
  useAnimatedReaction: () => {},
  useAnimatedRef: () => ({ current: null }),
  useFrameCallback: () => {},
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  withTiming: (toValue) => toValue,
  withSpring: (toValue) => toValue,
  withDecay: (toValue) => toValue,
  withRepeat: (animation) => animation,
  withSequence: (...animations) => animations[0],
  cancelAnimation: () => {},
  makeMutable: (value) => ({ value }),
  makeRemote: (value) => value,
};

export default mockReanimated;

