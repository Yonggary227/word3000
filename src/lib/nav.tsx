import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BackHandler, Platform } from 'react-native';

import type { Band } from './words';

// 화면이 3개뿐이라 화면 이동 도구(Expo Router) 대신 "지금 보는 화면 목록"을 직접 관리한다
export type Route =
  | { name: 'home' }
  | { name: 'study'; band?: Band; mode?: 'band' | 'review' | 'hard' }
  | { name: 'search' };

type Nav = {
  route: Route;
  depth: number;
  push: (route: Route) => void;
  back: () => void;
};

const NavContext = createContext<Nav | null>(null);
const isWeb = Platform.OS === 'web';

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

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

  const back = useCallback(() => {
    if (isWeb) window.history.back();
    else pop();
  }, [pop]);

  const value = useMemo(
    () => ({ route: stack[stack.length - 1], depth: stack.length, push, back }),
    [stack, push, back],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav must be used inside NavProvider');
  return nav;
}
