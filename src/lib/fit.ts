import { Platform } from 'react-native';

// 긴 단어(conversation, administration 등)가 카드 밖으로 잘리지 않게 글자 크기를 줄인다.
// 아이폰·안드로이드 앱은 adjustsFontSizeToFit이 알아서 줄여 주지만 웹에서는 그 기능이 없어서,
// 웹에서는 실제 글꼴로 너비를 재서 크기를 계산한다.
let ctx: CanvasRenderingContext2D | null | undefined;

export function fitFontSize(text: string, size: number, maxWidth: number, fontFamily: string, letterSpacing = 0) {
  if (Platform.OS !== 'web') return size;
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return size;
  ctx.font = `${size}px ${fontFamily}`;
  const width = ctx.measureText(text).width + letterSpacing * text.length;
  // 2%는 글꼴 렌더링 차이를 위한 여유
  return width * 1.02 <= maxWidth ? size : Math.floor((size * maxWidth) / (width * 1.02));
}
