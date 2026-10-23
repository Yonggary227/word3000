import { useColorScheme } from 'react-native';

import type { Band } from './words';

const light = {
  bg: '#E6EBF1',
  surface: '#FFFFFF',
  ink: '#18263F',
  muted: '#66748A',
  line: '#D3DAE4',
  accent: '#18263F',
  onAccent: '#FFFFFF',
  band: { 1: '#2F8A63', 2: '#C2821A', 3: '#BF4B3A' } as Record<Band, string>,
  // 구간 색 위에 올리는 글자 색
  onBand: '#FFFFFF',
  dark: false,
};

const dark: typeof light = {
  bg: '#10161F',
  surface: '#1A2330',
  ink: '#E7ECF3',
  muted: '#93A0B3',
  line: '#2A3544',
  accent: '#E7ECF3',
  onAccent: '#10161F',
  band: { 1: '#5BC497', 2: '#E2A94A', 3: '#E5786A' },
  // 다크 모드의 구간 색은 밝아서 흰 글자가 잘 안 보이므로 어두운 글자를 쓴다
  onBand: '#10161F',
  dark: true,
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const fonts = {
  serif: 'Fraunces_700Bold',
  serifSemi: 'Fraunces_600SemiBold',
};
