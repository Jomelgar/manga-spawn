/* eslint-disable react-hooks/immutability */
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const EPSILON = 0.01;

interface ZoomableImageProps {
  uri: string;
  headers?: Record<string, string>;
  width: number;
  height: number;
  onZoomChange?: (zoomed: boolean) => void;
}

export function ZoomableImage({ uri, headers, width, height, onZoomChange }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const [zoomed, setZoomed] = useState(false);

  const notify = useCallback(
    (value: boolean) => {
      setZoomed(value);
      onZoomChange?.(value);
    },
    [onZoomChange],
  );

  const resetPosition = useCallback(() => {
    'worklet';
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [savedTranslateX, savedTranslateY, translateX, translateY]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          const next = savedScale.value * event.scale;
          scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        })
        .onEnd(() => {
          if (scale.value <= MIN_SCALE + EPSILON) {
            scale.value = withTiming(MIN_SCALE);
            savedScale.value = MIN_SCALE;
            resetPosition();
            runOnJS(notify)(false);
          } else {
            savedScale.value = scale.value;
            runOnJS(notify)(true);
          }
        }),
    [notify, resetPosition, savedScale, scale],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(zoomed)
        .onUpdate((event) => {
          translateX.value = savedTranslateX.value + event.translationX;
          translateY.value = savedTranslateY.value + event.translationY;
        })
        .onEnd(() => {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        }),
    [zoomed, savedTranslateX, savedTranslateY, translateX, translateY],
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          const next = scale.value > MIN_SCALE + EPSILON ? MIN_SCALE : DOUBLE_TAP_SCALE;
          scale.value = withTiming(next);
          savedScale.value = next;
          if (next === MIN_SCALE) {
            resetPosition();
            runOnJS(notify)(false);
          } else {
            runOnJS(notify)(true);
          }
        }),
    [notify, resetPosition, savedScale, scale],
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(pinch, pan, doubleTap),
    [pinch, pan, doubleTap],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.viewport, { width, height }]}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.page, { width, height }, animatedStyle]}>
          <Image
            source={{ uri, headers }}
            style={{ width, height }}
            contentFit="contain"
            transition={150}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
