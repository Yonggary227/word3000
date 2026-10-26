// 굵기별로 따로 불러와야 쓰지 않는 16개 굵기가 앱에 들어가지 않는다
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavProvider, useNav } from '@/lib/nav';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import Home from '@/screens/Home';
import Search from '@/screens/Search';
import Study from '@/screens/Study';

SplashScreen.preventAutoHideAsync();

function Screen() {
  const { route, depth } = useNav();
  // depth를 key로 써서, 같은 화면이라도 새로 열면 처음부터 다시 그린다
  if (route.name === 'study') return <Study key={depth} band={route.band} mode={route.mode} />;
  if (route.name === 'search') return <Search key={depth} />;
  return <Home key={depth} />;
}

function Root() {
  const theme = useTheme();
  const { loaded: storeLoaded } = useStore();
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });
  const ready = storeLoaded && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    // 웹: index.html에 미리 그려둔 첫 화면을 진짜 화면으로 바꾼다
    if (Platform.OS === 'web') document.getElementById('boot')?.remove();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style="auto" />
      <Screen />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <NavProvider>
          <Root />
        </NavProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
