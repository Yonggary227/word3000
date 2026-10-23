// 굵기별로 따로 불러와야 쓰지 않는 16개 굵기가 앱에 들어가지 않는다
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function Root() {
  const theme = useTheme();
  const { loaded: storeLoaded } = useStore();
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });
  const ready = storeLoaded && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        {/* 카드 화면에서는 오른쪽 스와이프가 '외웠어요'라서, 아이폰의 밀어서 뒤로 가기를 끈다 */}
        <Stack.Screen name="study" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
