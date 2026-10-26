import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PushToggle } from '@/components/PushToggle';
import { Seg } from '@/components/Seg';
import { useNav } from '@/lib/nav';
import { pushSupported } from '@/lib/push';
import { HARD_MIN, useStore } from '@/lib/store';
import { fonts, useTheme, type Theme } from '@/lib/theme';
import { BANDS, WORDS } from '@/lib/words';

// public/index.html의 미리 그린 첫 화면(#boot)이 이 화면과 같은 모양이다. 바꿀 때 함께 바꾼다.
export default function Home() {
  const t = useTheme();
  const { done, misses, options, setOption } = useStore();
  const { push } = useNav();
  const hardCount = Object.values(misses).filter((n) => n >= HARD_MIN).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[styles.title, { color: t.ink }]}>단어 3000</Text>
        <Text style={[styles.sub, { color: t.muted }]}>가장 자주 쓰이는 영어 단어 3,000개</Text>

        <View style={{ gap: 10 }}>
          {BANDS.map(({ band, name }) => {
            const all = WORDS.filter((w) => w.band === band);
            const d = all.filter((w) => done.has(w.id)).length;
            const p = Math.round((d / all.length) * 100);
            const color = t.band[band];
            return (
              <Pressable
                key={band}
                onPress={() => push({ name: 'study', band })}
                accessibilityRole="button"
                accessibilityLabel={`${band}k ${name} 시작, ${d}개 외움`}
                style={({ pressed }) => [
                  styles.band,
                  { backgroundColor: t.surface, borderColor: t.line, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.k, { color }]}>{band}k</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.bandTop}>
                    <Text style={[styles.name, { color: t.ink }]}>{name}</Text>
                    <Text style={[styles.progress, { color: t.muted }]}>
                      {d.toLocaleString()} / {all.length.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.bar, { backgroundColor: t.line }]}>
                    <View style={[styles.barFill, { width: `${p}%`, backgroundColor: color }]} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: t.muted }]}>학습 설정</Text>
        <Group t={t}>
          <Row t={t} label="보여줄 단어">
            <Seg
              value={options.scope}
              onChange={(v) => setOption('scope', v)}
              items={[
                { value: 'left', label: '안 외운 것' },
                { value: 'all', label: '전체' },
              ]}
            />
          </Row>
          <Row t={t} label="순서">
            <Seg
              value={options.order}
              onChange={(v) => setOption('order', v)}
              items={[
                { value: 'shuffle', label: '섞기' },
                { value: 'abc', label: '알파벳순' },
              ]}
            />
          </Row>
          <Row t={t} label="먼저 보여줄 면">
            <Seg
              value={options.front}
              onChange={(v) => setOption('front', v)}
              items={[
                { value: 'en', label: '영어' },
                { value: 'ko', label: '한글 뜻' },
              ]}
            />
          </Row>
          {pushSupported() && (
            <Row t={t} label="단어 알림" hint="9시~22시 매 정각">
              <PushToggle />
            </Row>
          )}
        </Group>

        <Text style={[styles.section, { color: t.muted }]}>복습</Text>
        <Group t={t}>
          <Row t={t} label="외운 단어 복습" count={done.size} onPress={() => push({ name: 'study', mode: 'review' })} />
          <Row
            t={t}
            label="어려운 단어 복습"
            hint={`${HARD_MIN}번 이상 헤맨 단어`}
            count={hardCount}
            onPress={() => push({ name: 'study', mode: 'hard' })}
          />
          <Row t={t} label="단어 찾기" onPress={() => push({ name: 'search' })} />
        </Group>

        <Text style={[styles.note, { color: t.muted }]}>
          진도는 이 휴대폰에만 저장돼요 · 출처: Paul Nation BNC/COCA 1k~3k
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// 여러 줄을 한 상자에 담고, 줄 사이에 가는 선을 넣는다
function Group({ t, children }: { t: Theme; children: ReactNode }) {
  // toArray는 조건부로 빠진 줄(false)을 걸러 준다
  return (
    <View style={[styles.group, { backgroundColor: t.surface, borderColor: t.line }]}>
      {Children.toArray(children).map((child, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={[styles.sep, { backgroundColor: t.line }]} />}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

function Row({
  t,
  label,
  hint,
  count,
  onPress,
  children,
}: {
  t: Theme;
  label: string;
  hint?: string;
  count?: number;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const body = (
    <>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: t.ink }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: t.muted }]}>{hint}</Text>}
      </View>
      {children}
      {count !== undefined && <Text style={[styles.rowCount, { color: t.muted }]}>{count.toLocaleString()}개</Text>}
      {onPress && <Text style={[styles.chevron, { color: t.muted }]}>›</Text>}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: t.bg }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, letterSpacing: -0.8, marginTop: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 24 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 18, padding: 16 },
  k: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, width: 48 },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '700', fontSize: 16, lineHeight: 22 },
  progress: { fontSize: 13, lineHeight: 18, fontVariant: ['tabular-nums'] },
  bar: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  section: { fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 28, marginBottom: 8, marginLeft: 4 },
  group: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  sep: { height: 1, marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 10, paddingHorizontal: 16 },
  rowLabel: { fontSize: 15, lineHeight: 21 },
  rowHint: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  rowCount: { fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  chevron: { fontSize: 20, lineHeight: 22, marginLeft: -4 },
  note: { fontSize: 12, lineHeight: 18, marginTop: 24, textAlign: 'center' },
});
