import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

import {buildConfig, withFbProvider} from '@featbit/react-native-sdk';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

const options = {
  user: {
    name: 'the user name',
    keyId: 'fb-demo-user-key',
    customizedProperties: [],
  },
  sdkKey: 'Obg68EqYZk27JTxphPgy7At1aJ8GaAtEaIA1fb3IpuEA',
  streamingUri: 'wss://app-eval.featbit.co',
  eventsUri: 'https://app-eval.featbit.co',
};

export default withFbProvider(buildConfig({options}, true))(RootLayout);


