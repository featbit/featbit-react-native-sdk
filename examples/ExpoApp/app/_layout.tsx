import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

import {buildConfig, UserBuilder, withFbProvider} from '@featbit/react-native-sdk';

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

const user = new UserBuilder("fb-demo-user-key")
  .name("the user name")
  .custom("loggedIn", "true")
  .custom("variationId", "203:b:exclusive")
  .build();

const options = {
  user,
  sdkKey: '3QFLBQibTE6i1duL1WAK2A227SK-9N8k-9VqurJDE_Qw',
  streamingUri: 'wss://app-eval.featbit.co',
  eventsUri: 'https://app-eval.featbit.co',
};

export default withFbProvider(buildConfig({options}, true))(RootLayout);


