import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNav } from '@/lib/nav';
import { HARD_MIN, useStore } from '@/lib/store';
import { useTheme, type Theme } from '@/lib/theme';
import { WORDS, type Word } from '@/lib/words';

type Filter = 'all' | '1' | '2' | '3' | 'done' | 'hard';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '1', label: '1k' },
  { value: '2', label: '2k' },
  { value: '3', label: '3k' },
  { value: 'done', label: '외운 것' },
  { value: 'hard', label: '많이 헤맨 것' },
];

export default function Search() {
  const t = useTheme();
  const { done, misses, setDone } = useStore();
  const { back } = useNav();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const insets = useSafeAreaInsets();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const r = WORDS.filter(
      (w) =>
        (filter === 'all' ||
          (filter === 'done'
            ? done.has(w.id)
            : filter === 'hard'
              ? (misses[w.id] ?? 0) >= HARD_MIN
              : w.band === Number(filter))) &&
        (!q || w.word.toLowerCase().includes(q) || w.meaning.includes(q)),
    );
    // 영어 앞글자가 일치하는 단어를 먼저 보여준다 (sort는 같은 그룹 안의 기존 순서를 유지한다)
    if (q) r.sort((a, b) => Number(b.word.toLowerCase().startsWith(q)) - Number(a.word.toLowerCase().startsWith(q)));
    // '많이 헤맨 것'은 많이 헤맨 순서로
    else if (filter === 'hard') r.sort((a, b) => (misses[b.id] ?? 0) - (misses[a.id] ?? 0));
    return r;
  }, [query, filter, done, misses]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <View style={styles.wrap}>
        <View style={styles.top}>
          <Pressable
            onPress={back}
            style={[styles.iconBtn, { backgroundColor: t.surface, borderColor: t.line }]}
            accessibilityRole="button"
            accessibilityLabel="처음 화면으로"
          >
            <Text style={{ color: t.ink, fontSize: 14 }}>← 처음</Text>
          </Pressable>
          <Text style={[styles.count, { color: t.muted }]}>{results.length.toLocaleString()}개</Text>
          <View style={{ minWidth: 44 }} />
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="영어 단어나 한글 뜻으로 찾기"
          placeholderTextColor={t.muted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={[styles.search, { backgroundColor: t.surface, borderColor: t.line, color: t.ink }]}
        />

        {/* 필터는 한 줄로 두고, 넘치면 옆으로 밀어서 본다 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const on = f.value === filter;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  styles.filter,
                  { backgroundColor: on ? t.accent : t.surface, borderColor: on ? t.accent : t.line },
                ]}
              >
                <Text style={{ fontSize: 13, color: on ? t.onAccent : t.muted, fontWeight: on ? '700' : '400' }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FlatList
          data={results}
          keyExtractor={(w) => String(w.id)}
          extraData={[done, misses]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={20}
          windowSize={10}
          style={[styles.list, { backgroundColor: t.surface, borderColor: t.line }]}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.line }} />}
          renderItem={({ item }) => (
            <Row word={item} done={done.has(item.id)} missCount={misses[item.id] ?? 0} onToggle={setDone} t={t} />
          )}
          ListEmptyComponent={
            <Text style={{ color: t.muted, textAlign: 'center', padding: 24 }}>찾는 단어가 없어요</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const Row = memo(function Row({
  word,
  done,
  missCount,
  onToggle,
  t,
}: {
  word: Word;
  done: boolean;
  missCount: number;
  onToggle: (id: number, value: boolean) => void;
  t: Theme;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.lw, { color: t.ink }]}>
          {word.word}
          <Text style={[styles.lwBand, { color: t.muted }]}>  {word.band}k</Text>
          {missCount > 0 && (
            <Text style={[styles.lwBand, { color: missCount >= HARD_MIN ? t.band[3] : t.muted }]}>  · 헤맨 {missCount}번</Text>
          )}
        </Text>
        <Text style={[styles.lm, { color: t.muted }]}>{word.meaning}</Text>
      </View>
      <Pressable
        onPress={() => onToggle(word.id, !done)}
        hitSlop={6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`${word.word} 외움 표시`}
        style={[
          styles.tick,
          done ? { backgroundColor: t.band[1], borderColor: t.band[1] } : { borderColor: t.line },
        ]}
      >
        <Text style={{ fontSize: 16, color: done ? t.onBand : 'transparent' }}>✓</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18, paddingTop: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  iconBtn: { borderWidth: 1, borderRadius: 12, minWidth: 44, height: 44, paddingHorizontal: 12, justifyContent: 'center' },
  count: { fontSize: 14, fontVariant: ['tabular-nums'] },
  search: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, fontSize: 16 },
  filterScroll: { flexGrow: 0, marginVertical: 12 },
  filters: { flexDirection: 'row', gap: 6 },
  filter: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  list: { flex: 1, borderWidth: 1, borderRadius: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  lw: { fontWeight: '700', fontSize: 16 },
  lwBand: { fontWeight: '500', fontSize: 11 },
  lm: { fontSize: 13, marginTop: 2 },
  tick: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
