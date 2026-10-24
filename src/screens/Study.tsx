import * as Speech from 'expo-speech';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNav } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { fonts, useTheme, type Theme } from '@/lib/theme';
import { WORD_BY_ID, WORDS, type Band, type Word } from '@/lib/words';

const NO_LIGATURES: TextStyle['fontVariant'] = ['no-common-ligatures', 'no-discretionary-ligatures'];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'en-US', rate: 0.9 });
}

export default function Study({ band: bandProp, review = false }: { band?: Band; review?: boolean }) {
  const t = useTheme();
  const { height, width } = useWindowDimensions();
  // 카드 너비의 약 1/3 이상 밀어야 넘어간다 (조금 밀다 놓으면 제자리로)
  const swipeDistance = Math.max(110, Math.min(width, 480) * 0.33);
  const band: Band | 0 = review ? 0 : (bandProp ?? 1);
  const { back } = useNav();
  const { done, options, setDone } = useStore();

  const buildDeck = () => {
    const pool = review
      ? WORDS.filter((w) => done.has(w.id))
      : WORDS.filter((w) => w.band === band && (options.scope === 'all' || !done.has(w.id)));
    const ids = pool.map((w) => w.id);
    return options.order === 'shuffle' ? shuffle(ids) : ids;
  };

  const [deck, setDeck] = useState<number[]>(buildDeck);
  const [pos, setPos] = useState(0);
  const [hist, setHist] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;

  useEffect(() => () => void Speech.stop(), []);

  const current = pos < deck.length ? WORD_BY_ID.get(deck[pos]) : undefined;

  const showCard = (nextPos: number) => {
    flip.setValue(0);
    drag.setValue(0);
    setFlipped(false);
    setPos(nextPos);
  };

  const next = () => {
    setHist((h) => [...h, pos]);
    showCard(pos + 1);
  };

  const know = () => {
    if (!current) return;
    setDone(current.id, true);
    next();
  };

  const again = () => {
    if (!current) return;
    if (review) {
      setDone(current.id, false);
    } else {
      // 지금 위치에서 5~9장 뒤에 다시 끼워 넣는다
      const at = Math.min(deck.length, pos + 1 + 5 + Math.floor(Math.random() * 5));
      setDeck((d) => [...d.slice(0, at), current.id, ...d.slice(at)]);
    }
    next();
  };

  const skip = () => {
    if (current) next();
  };

  const prev = () => {
    if (!hist.length) return;
    showCard(hist[hist.length - 1]);
    setHist((h) => h.slice(0, -1));
  };

  const restart = () => {
    setDeck(buildDeck());
    setHist([]);
    showCard(0);
  };

  const toggleFlip = () => {
    const to = flipped ? 0 : 1;
    setFlipped(!flipped);
    Animated.timing(flip, {
      toValue: to,
      duration: 450,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  };

  // 스와이프 처리기는 한 번만 만들고, 최신 동작은 ref로 넘겨준다
  const actions = useRef({ know, again, swipeDistance });
  actions.current = { know, again, swipeDistance };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => drag.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        // 오른손 엄지로 넘기기 쉽게: 왼쪽 = 외웠어요, 오른쪽 = 다시 볼게요
        if (g.dx < -actions.current.swipeDistance) actions.current.know();
        else if (g.dx > actions.current.swipeDistance) actions.current.again();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const color = review ? t.accent : t.band[band as Band];
  const chipText = review ? t.onAccent : t.onBand;
  const cardHeight = Math.max(330, Math.min(height * 0.58, 440));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.wrap}>
        <View style={styles.top}>
          <Pressable
            onPress={back}
            style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.line }]}
            accessibilityRole="button"
            accessibilityLabel="처음 화면으로"
          >
            <Text style={{ color: t.ink, fontSize: 14 }}>← 목록</Text>
          </Pressable>
          <Text style={[styles.count, { color: t.muted }]}>{current ? `${pos + 1} / ${deck.length}` : ''}</Text>
          <View style={[styles.chip, { backgroundColor: color }]}>
            <Text style={[styles.chipText, { color: chipText }]}>{review ? '복습' : `${band}k`}</Text>
          </View>
        </View>

        {current ? (
          <>
            <Animated.View
              {...pan.panHandlers}
              style={{
                height: cardHeight,
                transform: [
                  { translateX: drag },
                  { rotate: drag.interpolate({ inputRange: [-200, 200], outputRange: ['-8deg', '8deg'] }) },
                ],
              }}
            >
              <Pressable
                onPress={toggleFlip}
                style={{ flex: 1 }}
                // 웹에서는 버튼 안에 버튼(발음 듣기)을 둘 수 없어서 역할을 빼둔다
                accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
                accessibilityLabel={flipped ? '카드 앞면 보기' : '카드 뒤집기'}
              >
                <Face side="front" flip={flip} color={color} t={t} active={!flipped}>
                  {options.front === 'en' ? (
                    <EnglishFront word={current} done={done.has(current.id)} t={t} width={width} />
                  ) : (
                    <KoreanFront word={current} done={done.has(current.id)} t={t} width={width} />
                  )}
                </Face>
                <Face side="back" flip={flip} color={color} t={t} active={flipped}>
                  {options.front === 'en' ? (
                    <EnglishBack word={current} t={t} width={width} />
                  ) : (
                    <KoreanBack word={current} t={t} width={width} />
                  )}
                </Face>
              </Pressable>
              {/* 밀고 있는 방향의 결과를 카드 위에 미리 보여준다 */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swipeTag,
                  styles.swipeTagRight,
                  { backgroundColor: t.band[1], opacity: drag.interpolate({ inputRange: [-swipeDistance, -10], outputRange: [1, 0], extrapolate: 'clamp' }) },
                ]}
              >
                <Text style={[styles.swipeTagText, { color: t.onBand }]}>{review ? '계속 기억해요' : '외웠어요'} ✓</Text>
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swipeTag,
                  styles.swipeTagLeft,
                  { backgroundColor: t.band[2], opacity: drag.interpolate({ inputRange: [10, swipeDistance], outputRange: [0, 1], extrapolate: 'clamp' }) },
                ]}
              >
                <Text style={[styles.swipeTagText, { color: t.onBand }]}>↺ {review ? '잊어버렸어요' : '다시 볼게요'}</Text>
              </Animated.View>
            </Animated.View>
            <Text style={[styles.swipeHint, { color: t.muted }]}>
              ← 밀면 {review ? '계속 기억해요' : '외웠어요'}   ·   밀면 {review ? '잊어버렸어요' : '다시 볼게요'} →
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={again}
                style={[styles.big, { backgroundColor: t.surface, borderColor: t.line, borderWidth: 1 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.bigText, { color: t.ink }]}>{review ? '잊어버렸어요' : '다시 볼게요'}</Text>
              </Pressable>
              <Pressable onPress={know} style={[styles.big, { backgroundColor: t.accent }]} accessibilityRole="button">
                <Text style={[styles.bigText, { color: t.onAccent }]}>{review ? '계속 기억해요' : '외웠어요'}</Text>
              </Pressable>
            </View>
            <View style={styles.nav}>
              <Pressable onPress={prev} hitSlop={8} accessibilityRole="button" disabled={!hist.length}>
                <Text style={[styles.navText, { color: t.muted, opacity: hist.length ? 1 : 0.4 }]}>이전 카드</Text>
              </Pressable>
              <Pressable onPress={skip} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.navText, { color: t.muted }]}>건너뛰기</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Finished
            t={t}
            review={review}
            band={band}
            deckLength={deck.length}
            left={review ? 0 : WORDS.filter((w) => w.band === band && !done.has(w.id)).length}
            onRestart={restart}
            onHome={back}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Face({
  side,
  flip,
  color,
  t,
  active,
  children,
}: {
  side: 'front' | 'back';
  flip: Animated.Value;
  color: string;
  t: Theme;
  active: boolean;
  children: ReactNode;
}) {
  const isFront = side === 'front';
  const rotateY = flip.interpolate({
    inputRange: [0, 1],
    outputRange: isFront ? ['0deg', '180deg'] : ['180deg', '360deg'],
  });
  // 일부 안드로이드에서 뒷면 숨김이 안 먹을 때를 대비해, 절반 지점에서 보이는 면을 바꾼다
  const opacity = flip.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: isFront ? [1, 1, 0, 0] : [0, 0, 1, 1],
  });
  return (
    <Animated.View
      // 안 보이는 면의 버튼이 눌리지 않도록 보이는 면만 터치를 받는다
      pointerEvents={active ? 'box-none' : 'none'}
      style={[
        styles.face,
        {
          backgroundColor: t.surface,
          borderColor: t.line,
          shadowOpacity: t.dark ? 0.5 : 0.18,
          opacity,
          transform: [{ perspective: 1400 }, { rotateY }],
        },
      ]}
    >
      <View style={[styles.strip, { backgroundColor: color }]} />
      {children}
    </Animated.View>
  );
}

function SayButton({ label, text, t }: { label: string; text: string; t: Theme }) {
  return (
    <Pressable
      onPress={() => speak(text)}
      style={[styles.say, { borderColor: t.line }]}
      accessibilityRole="button"
      hitSlop={6}
    >
      <Text style={{ color: t.ink, fontSize: 14 }}>🔊 {label}</Text>
    </Pressable>
  );
}

function DoneMark({ t }: { t: Theme }) {
  return <Text style={[styles.doneMark, { color: t.band[1] }]}>외운 단어</Text>;
}

type CardProps = { word: Word; t: Theme; width: number };
const wordSize = (width: number) => Math.min(64, Math.max(40, width * 0.13));
const meanSize = (width: number) => Math.min(32, Math.max(24, width * 0.07));

function EnglishFront({ word, done, t, width }: CardProps & { done: boolean }) {
  return (
    <>
      {done && <DoneMark t={t} />}
      <Text
        style={[styles.word, { color: t.ink, fontSize: wordSize(width), lineHeight: wordSize(width) * 1.35 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {word.word}
      </Text>
      <SayButton label="발음 듣기" text={word.word} t={t} />
      <Text style={[styles.hint, { color: t.muted }]}>눌러서 뒤집기</Text>
    </>
  );
}

function KoreanFront({ word, done, t, width }: CardProps & { done: boolean }) {
  return (
    <>
      {done && <DoneMark t={t} />}
      <Text style={[styles.mean, { color: t.ink, fontSize: meanSize(width), lineHeight: meanSize(width) * 1.35 }]}>
        {word.meaning}
      </Text>
      <Text style={[styles.hint, { color: t.muted }]}>눌러서 영어 보기</Text>
    </>
  );
}

function EnglishBack({ word, t, width }: CardProps) {
  return (
    <>
      <Text style={[styles.wSmall, { color: t.muted }]}>{word.word}</Text>
      <Text style={[styles.mean, { color: t.ink, fontSize: meanSize(width), lineHeight: meanSize(width) * 1.35 }]}>
        {word.meaning}
      </Text>
      <Text style={[styles.ex, { color: t.ink }]}>{word.example}</Text>
      <Text style={[styles.exKo, { color: t.muted }]}>{word.exampleKo}</Text>
      <SayButton label="예문 듣기" text={word.example} t={t} />
    </>
  );
}

function KoreanBack({ word, t, width }: CardProps) {
  const size = Math.min(54, Math.max(36, width * 0.11));
  return (
    <>
      <Text
        style={[styles.word, { color: t.ink, fontSize: size, lineHeight: size * 1.35 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {word.word}
      </Text>
      <Text style={[styles.mean, { color: t.muted, fontSize: 20, lineHeight: 27, marginTop: 8, marginBottom: 18 }]}>
        {word.meaning}
      </Text>
      <Text style={[styles.ex, { color: t.ink }]}>{word.example}</Text>
      <Text style={[styles.exKo, { color: t.muted }]}>{word.exampleKo}</Text>
      <SayButton label="발음 듣기" text={word.word} t={t} />
    </>
  );
}

function Finished({
  t,
  review,
  band,
  deckLength,
  left,
  onRestart,
  onHome,
}: {
  t: Theme;
  review: boolean;
  band: Band | 0;
  deckLength: number;
  left: number;
  onRestart: () => void;
  onHome: () => void;
}) {
  let title: string;
  let body: string;
  if (deckLength === 0) {
    title = review ? '아직 외운 단어가 없어요' : `${band}k 완료`;
    body = review
      ? "카드에서 '외웠어요'를 누른 단어가 여기 모입니다."
      : "이 구간 1,000단어를 모두 외웠어요.\n'보여줄 단어'를 전체로 바꾸면 다시 볼 수 있어요.";
  } else {
    title = '한 바퀴 끝';
    body = review ? '외운 단어를 모두 훑어봤어요.' : `남은 단어 ${left.toLocaleString()}개`;
  }
  const canContinue = deckLength > 0 && left > 0 && !review;
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: t.ink }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: t.muted }]}>{body}</Text>
      <Pressable
        onPress={canContinue ? onRestart : onHome}
        style={[styles.big, { backgroundColor: t.accent, alignSelf: 'stretch', flex: 0 }]}
        accessibilityRole="button"
      >
        <Text style={[styles.bigText, { color: t.onAccent }]}>{canContinue ? '남은 단어 다시 보기' : '처음 화면으로'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18, paddingTop: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  iconBtn: { borderWidth: 1, borderRadius: 12, minWidth: 44, height: 44, paddingHorizontal: 12, justifyContent: 'center' },
  count: { fontSize: 14, fontVariant: ['tabular-nums'] },
  chip: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 3,
  },
  strip: { position: 'absolute', left: 0, top: 22, bottom: 22, width: 5, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  doneMark: { position: 'absolute', top: 18, right: 18, fontSize: 12, fontWeight: '700' },
  // 영어 글자는 합자(fi, ff 등이 한 글자로 붙는 것)를 꺼서 철자가 그대로 보이게 한다
  word: { fontFamily: fonts.serif, letterSpacing: -1, textAlign: 'center', fontVariant: NO_LIGATURES },
  wSmall: { fontFamily: fonts.serifSemi, fontSize: 22, textAlign: 'center', fontVariant: NO_LIGATURES },
  mean: { fontWeight: '700', textAlign: 'center', marginTop: 10, marginBottom: 22 },
  ex: { fontFamily: fonts.serifSemi, fontSize: 19, lineHeight: 28, textAlign: 'center', maxWidth: 320, fontVariant: NO_LIGATURES },
  exKo: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6, maxWidth: 320 },
  say: { marginTop: 18, borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  hint: { position: 'absolute', bottom: 20, fontSize: 12 },
  swipeTag: { position: 'absolute', top: 22, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  swipeTagLeft: { left: 22, transform: [{ rotate: '-8deg' }] },
  swipeTagRight: { right: 22, transform: [{ rotate: '8deg' }] },
  swipeTagText: { fontSize: 14, fontWeight: '700' },
  swipeHint: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  big: { flex: 1, borderRadius: 16, paddingVertical: 17, paddingHorizontal: 10, alignItems: 'center' },
  bigText: { fontSize: 16, fontWeight: '700' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 8 },
  navText: { fontSize: 13, paddingVertical: 8 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 10 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 30, marginBottom: 10, textAlign: 'center' },
  emptyBody: { fontSize: 15, lineHeight: 24, marginBottom: 22, textAlign: 'center' },
});
