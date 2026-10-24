import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Seg } from '@/components/Seg';
import { VoicePicker } from '@/components/VoicePicker';
import { useNav } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { fonts, useTheme } from '@/lib/theme';
import { BANDS, WORDS } from '@/lib/words';

export default function Home() {
  const t = useTheme();
  const { done, options, setOption } = useStore();
  const { push } = useNav();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[styles.title, { color: t.ink }]}>단어 3000</Text>
        <Text style={[styles.sub, { color: t.muted }]}>
          가장 자주 쓰이는 영어 단어 3,000개.{'\n'}카드를 눌러 뜻을 확인하고, 외운 단어는 넘겨두세요.
        </Text>

        <View style={{ gap: 12 }}>
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
                  <Text style={[styles.name, { color: t.ink }]}>
                    {name} {all.length.toLocaleString()}단어
                  </Text>
                  <Text style={[styles.meta, { color: t.muted }]}>
                    {d.toLocaleString()}개 외움 · {p}%
                  </Text>
                  <View style={[styles.bar, { backgroundColor: t.line }]}>
                    <View style={[styles.barFill, { width: `${p}%`, backgroundColor: color }]} />
                  </View>
                </View>
                <Text style={[styles.go, { color: t.muted }]}>시작</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.opts}>
          <View style={styles.opt}>
            <Text style={[styles.optLabel, { color: t.ink }]}>보여줄 단어</Text>
            <Seg
              value={options.scope}
              onChange={(v) => setOption('scope', v)}
              items={[
                { value: 'left', label: '안 외운 것' },
                { value: 'all', label: '전체' },
              ]}
            />
          </View>
          <View style={styles.opt}>
            <Text style={[styles.optLabel, { color: t.ink }]}>순서</Text>
            <Seg
              value={options.order}
              onChange={(v) => setOption('order', v)}
              items={[
                { value: 'shuffle', label: '섞기' },
                { value: 'abc', label: '알파벳순' },
              ]}
            />
          </View>
          <View style={styles.opt}>
            <Text style={[styles.optLabel, { color: t.ink }]}>먼저 보여줄 면</Text>
            <Seg
              value={options.front}
              onChange={(v) => setOption('front', v)}
              items={[
                { value: 'en', label: '영어' },
                { value: 'ko', label: '한글 뜻' },
              ]}
            />
          </View>
          <View style={styles.opt}>
            <Text style={[styles.optLabel, { color: t.ink }]}>발음 목소리</Text>
            <VoicePicker />
          </View>
        </View>

        <View style={styles.linkRow}>
          <Pressable
            onPress={() => push({ name: 'search' })}
            style={[styles.ghost, { borderColor: t.line }]}
            accessibilityRole="button"
          >
            <Text style={[styles.ghostText, { color: t.ink }]}>단어 찾기</Text>
          </Pressable>
          <Pressable
            onPress={() => push({ name: 'study', review: true })}
            style={[styles.ghost, { borderColor: t.line }]}
            accessibilityRole="button"
          >
            <Text style={[styles.ghostText, { color: t.ink }]}>외운 단어 복습</Text>
          </Pressable>
        </View>

        <Text style={[styles.note, { color: t.muted }]}>
          진도는 이 휴대폰에만 저장됩니다. 앱을 지우거나 다른 기기에서는 처음부터 시작해요.{'\n'}
          출처: Paul Nation BNC/COCA 1k~3k 목록.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50, letterSpacing: -0.8, marginTop: 18, marginBottom: 6 },
  sub: { fontSize: 14, lineHeight: 21, marginBottom: 26 },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  k: { fontFamily: fonts.serif, fontSize: 30, width: 64 },
  name: { fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 13, marginTop: 3 },
  bar: { height: 6, borderRadius: 3, marginTop: 9, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  go: { fontSize: 13, fontWeight: '700' },
  opts: { marginTop: 22, gap: 10 },
  opt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optLabel: { fontSize: 14 },
  linkRow: { marginTop: 24, flexDirection: 'row', gap: 10 },
  ghost: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 13, alignItems: 'center' },
  ghostText: { fontSize: 14, fontWeight: '500' },
  note: { fontSize: 12, lineHeight: 19, marginTop: 22 },
});
