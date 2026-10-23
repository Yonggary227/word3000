import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

type Props<T extends string> = {
  value: T;
  items: { value: T; label: string }[];
  onChange: (value: T) => void;
};

// 둘 중 하나를 고르는 토글 버튼 묶음
export function Seg<T extends string>({ value, items, onChange }: Props<T>) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.surface, borderColor: t.line }]}>
      {items.map((item) => {
        const on = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.btn, on && { backgroundColor: t.accent }]}
          >
            <Text style={[styles.label, { color: on ? t.onAccent : t.muted }, on && styles.on]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 3 },
  btn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9 },
  label: { fontSize: 13 },
  on: { fontWeight: '700' },
});
