import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BackHandler, Platform } from 'react-native';

import type { Band } from './words';

const isWeb = Platform.OS === 'web';

// 화면이 3개뿐이라 화면 이동 도구(Expo Router) 대신 "지금 보는 화면 목록"을 직접 관리한다
export type Route =
  | { name: 'home' }
  | { name: 'study'; band?: Band; mode?: 'band' | 'review' | 'hard' | 'single'; wordId?: number }
  | { name: 'search' };

// 웹: 단어 알림을 눌러 열면 주소가 /word3000/?word=123 이다. 그 단어 카드부터 보여주고 주소는 깨끗하게 되돌린다.
function initialStack(): Route[] {
  const home: Route = { name: 'home' };
  if (!isWeb || typeof location === 'undefined') return [home];
  const id = Number(new URLSearchParams(location.search).get('word'));
  if (!Number.isInteger(id) || id < 1 || id > 3000) return [home];
  window.history.replaceState(null, '', location.pathname);
  window.history.pushState(null, '');
  return [home, { name: 'study', mode: 'single', wordId: id }];
}

type Nav = {
  route: Route;
  depth: number;
  // 화면을 새로 그려야 할 때마다 바뀌는 값 (같은 깊이에서 화면을 바꿔 끼운 경우 포함)
  screenKey: string;
  push: (route: Route) => void;
  // 지금 화면을 다른 화면으로 바꿔 끼운다 (뒤로 가면 그 이전 화면으로)
  replace: (route: Route) => void;
  back: () => void;
};

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>(initialStack);
  const [replaced, setReplaced] = useState(0);

  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  // 웹: 브라우저(안드로이드)의 뒤로 가기와 맞물리도록 화면을 옮길 때마다 기록을 남긴다
  useEffect(() => {
    if (!isWeb) return;
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [pop]);

  // 안드로이드 앱: 기기의 뒤로 가기 버튼
  useEffect(() => {
    if (isWeb) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      pop();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, pop]);

  const push = useCallback((route: Route) => {
    if (isWeb) window.history.pushState(null, '');
    setStack((s) => [...s, route]);
  }, []);

  const replace = useCallback((route: Route) => {
    setStack((s) => [...s.slice(0, -1), route]);
    setReplaced((n) => n + 1);
  }, []);

  const back = useCallback(() => {
    if (isWeb) window.history.back();
    else pop();
  }, [pop]);

  const value = useMemo(
    () => ({
      route: stack[stack.length - 1],
      depth: stack.length,
      screenKey: `${stack.length}-${replaced}`,
      push,
      replace,
      back,
    }),
    [stack, replaced, push, replace, back],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav must be used inside NavProvider');
  return nav;
}
