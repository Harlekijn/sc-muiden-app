import {
  Barlow_400Regular,
  Barlow_400Regular_Italic,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
  useFonts as useBarlowFonts,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts as useBarlowCondensedFonts,
} from '@expo-google-fonts/barlow-condensed';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { queryClient } from '../lib/queryClient';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [barlowLoaded, barlowError] = useBarlowFonts({
    Barlow_400Regular,
    Barlow_400Regular_Italic,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });

  const [condensedLoaded, condensedError] = useBarlowCondensedFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });

  const fontsLoaded = barlowLoaded && condensedLoaded;
  const fontError = barlowError ?? condensedError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
