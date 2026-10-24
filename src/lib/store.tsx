import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// 프로토타입과 같은 키·구조를 쓴다: { done, scope, order, front }
const KEY = 'w3000.v1';

export type Options = {
  scope: 'left' | 'all';
  order: 'shuffle' | 'abc';
  front: 'en' | 'ko';
};

const DEFAULT_OPTIONS: Options = { scope: 'left', order: 'shuffle', front: 'en' };

type Store = {
  loaded: boolean;
  done: Set<number>;
  options: Options;
  setDone: (id: number, value: boolean) => void;
  setOption: <K extends keyof Options>(key: K, value: Options[K]) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [done, setDoneState] = useState<Set<number>>(new Set());
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((json) => {
        if (!json) return;
        const saved = JSON.parse(json);
        if (Array.isArray(saved.done)) setDoneState(new Set(saved.done));
        setOptions({
          scope: saved.scope === 'all' ? 'all' : 'left',
          order: saved.order === 'abc' ? 'abc' : 'shuffle',
          front: saved.front === 'ko' ? 'ko' : 'en',
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // 불러오기가 끝난 뒤부터, 바뀔 때마다 통째로 저장한다 (최대 3,000개 숫자라 가볍다)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ done: [...done], ...options })).catch(() => {});
  }, [loaded, done, options]);

  const setDone = useCallback((id: number, value: boolean) => {
    setDoneState((prev) => {
      if (prev.has(id) === value) return prev;
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const setOption = useCallback(<K extends keyof Options>(key: K, value: Options[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(
    () => ({ loaded, done, options, setDone, setOption }),
    [loaded, done, options, setDone, setOption],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
