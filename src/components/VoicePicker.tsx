import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEnglishVoices, speak, type Voice } from '@/lib/speech';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const SAMPLE = 'Pronunciation. I read a book yesterday.';

// 홈 화면의 "발음 목소리" 줄: 누르면 이 기기에 있는 영어 목소리 목록이 열린다
export function VoicePicker() {
  const t = useTheme();
  const { options, setOption } = useStore();
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<Voice[] | null>(null);

  useEffect(() => {
    if (open && !voices) getEnglishVoices().then(setVoices);
  }, [open, voices]);

  const choose = (v: Voice | null) => {
    setOption('voice', v?.id ?? null);
    setOption('voiceName', v?.name ?? null);
    speak(SAMPLE, v?.id ?? null);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={[styles.pill, { backgroundColor: t.surface, borderColor: t.line }]}
      >
        <Text style={{ color: t.ink, fontSize: 13 }} numberOfLines={1}>
          {options.voiceName ?? '기본'} ›
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: t.ink }]}>발음 목소리</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button">
              <Text style={{ color: t.ink, fontSize: 16, fontWeight: '700' }}>완료</Text>
            </Pressable>
          </View>
          {voices === null ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={t.muted} />
          ) : (
            <FlatList
              data={[null, ...voices]}
              keyExtractor={(v) => v?.id ?? 'default'}
              style={[styles.list, { backgroundColor: t.surface, borderColor: t.line }]}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.line }} />}
              renderItem={({ item }) => {
                const on = (item?.id ?? null) === options.voice;
                return (
                  <Pressable onPress={() => choose(item)} style={styles.row} accessibilityRole="button">
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: t.ink }]}>{item ? item.name : '기본'}</Text>
                      <Text style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>
                        {item ? item.language : '휴대폰이 정한 영어 목소리'}
                      </Text>
                    </View>
                    {on && <Text style={{ color: t.band[1], fontSize: 18, fontWeight: '700' }}>✓</Text>}
                  </Pressable>
                );
              }}
              ListFooterComponent={
                voices.length === 0 ? (
                  <Text style={{ color: t.muted, padding: 16, lineHeight: 20 }}>
                    이 기기에서 고를 수 있는 영어 목소리를 찾지 못했어요.
                  </Text>
                ) : undefined
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, maxWidth: 200 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  title: { fontSize: 20, fontWeight: '700' },
  list: { flex: 1, marginHorizontal: 18, marginBottom: 18, borderWidth: 1, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  name: { fontSize: 16, fontWeight: '600' },
});
