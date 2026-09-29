import { StyleSheet, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LogoMark({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2E5D3A" />
          <Stop offset="1" stopColor="#16301F" />
        </LinearGradient>
        <ClipPath id="panel">
          <Rect x="0" y="0" width="512" height="512" rx="112" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#panel)">
        <Rect width="512" height="512" fill="url(#bg)" />
        <G fill="#3F7A45">
          <Ellipse cx="110" cy="120" rx="150" ry="90" transform="rotate(-20 110 120)" />
          <Ellipse cx="420" cy="90" rx="120" ry="70" transform="rotate(15 420 90)" />
        </G>
        <G fill="#1B3A2B">
          <Ellipse cx="90" cy="440" rx="170" ry="115" transform="rotate(25 90 440)" />
          <Ellipse cx="440" cy="400" rx="140" ry="90" transform="rotate(-15 440 400)" />
        </G>
        <G fill="#6B8E23">
          <Ellipse cx="270" cy="24" rx="150" ry="60" />
          <Ellipse cx="46" cy="286" rx="95" ry="72" transform="rotate(30 46 286)" />
        </G>
        <Ellipse
          cx="486"
          cy="250"
          rx="80"
          ry="130"
          fill="#A8C686"
          opacity={0.5}
          transform="rotate(20 486 250)"
        />
        <G>
          <Path
            d="M256 376 C256 322 256 288 256 258"
            stroke="#F2F7EC"
            strokeWidth={24}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M256 278 C206 278 172 244 168 198 C216 198 250 230 256 278 Z" fill="#F2F7EC" />
          <Path d="M256 258 C306 258 340 224 344 178 C296 178 262 210 256 258 Z" fill="#DCEBCB" />
        </G>
      </G>
      <Rect
        x="7"
        y="7"
        width="498"
        height="498"
        rx="107"
        fill="none"
        stroke="#0E1F16"
        strokeWidth={10}
        opacity={0.5}
      />
    </Svg>
  );
}

export function Brand({ size = 48 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.brand}>
      <LogoMark size={size} />
      <ThemedText style={[styles.wordmark, { fontSize: size * 0.56 }]}>
        manga
        <ThemedText style={[styles.wordmark, { fontSize: size * 0.56, color: theme.accent }]}>
          spawn
        </ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
