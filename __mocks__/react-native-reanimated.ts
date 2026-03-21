export const useSharedValue = (val: unknown) => ({ value: val });
export const useAnimatedStyle = (fn: () => unknown) => fn();
export const withTiming = (val: unknown) => val;
export const withSpring = (val: unknown) => val;
export const withDelay = (_delay: number, val: unknown) => val;
export const runOnJS = (fn: (...args: unknown[]) => unknown) => fn;
export const interpolate = (val: unknown) => val;
export const Extrapolation = { CLAMP: 'clamp' };
export const FadeIn = {};
export const FadeOut = {};
export const SlideInDown = {};
export const SlideOutDown = {};
export const Easing = { bezier: () => (t: number) => t, linear: (t: number) => t };
const Animated = {
  View: 'Animated.View',
  Text: 'Animated.Text',
  Image: 'Animated.Image',
  ScrollView: 'Animated.ScrollView',
  createAnimatedComponent: (C: unknown) => C,
};
export default Animated;
