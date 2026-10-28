import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { shareStateWithWorker } from './push';

// 프로토타입과 같은 키·구조에 헤맨 횟수(misses: { 단어 id: 횟수 })를 더했다
const KEY = 'w3000.v1';

export type Options = {
  scope: 'left' | 'all';
  order: 'shuffle' | 'abc';
  front: 'en' | 'ko';
  // 마지막으로 공부한 구간: 알림 단어와 '이어서 공부하기'가 이 구간을 따른다
  lastBand: 1 | 2 | 3;
};

const DEFAULT_OPTIONS: Options = { scope: 'left', order: 'shuffle', front: 'en', lastBand: 1 };

// 이 횟수 이상 헤맨 단어를 '어려운 단어'로 모아 복습한다
export const HARD_MIN = 5;

type Store = {
  loaded: boolean;
  done: Set<number>;
  // 단어별 헤맨 횟수('다시 볼게요'·'잊어버렸어요'를 누른 수). 외워도 지우지 않는다.
  misses: Record<number, number>;
  options: Options;
  setDone: (id: number, value: boolean) => void;
  addMiss: (id: number) => void;
  setOption: <K extends keyof Options>(key: K, value: Options[K]) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [done, setDoneState] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState<Record<number, number>>({});
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((json) => {
        if (!json) return;
        const saved = JSON.parse(json);
        if (Array.isArray(saved.done)) setDoneState(new Set(saved.done));
        if (saved.misses && typeof saved.misses === 'object') setMisses(saved.misses);
        setOptions({
          scope: saved.scope === 'all' ? 'all' : 'left',
          order: saved.order === 'abc' ? 'abc' : 'shuffle',
          front: saved.front === 'ko' ? 'ko' : 'en',
          lastBand: saved.lastBand === 2 || saved.lastBand === 3 ? saved.lastBand : 1,
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // 불러오기가 끝난 뒤부터, 바뀔 때마다 통째로 저장한다 (최대 3,000개 숫자라 가볍다)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ done: [...done], misses, ...options })).catch(() => {});
  }, [loaded, done, misses, options]);

  useEffect(() => {
    if (loaded) shareStateWithWorker(done, misses, options.lastBand);
  }, [loaded, done, misses, options.lastBand]);

  const setDone = useCallback((id: number, value: boolean) => {
    setDoneState((prev) => {
      if (prev.has(id) === value) return prev;
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const addMiss = useCallback((id: number) => {
    setMisses((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  const setOption = useCallback(<K extends keyof Options>(key: K, value: Options[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(
    () => ({ loaded, done, misses, options, setDone, addMiss, setOption }),
    [loaded, done, misses, options, setDone, addMiss, setOption],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
