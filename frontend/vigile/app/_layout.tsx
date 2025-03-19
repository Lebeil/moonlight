import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { pb } from '@/utils/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Création du client QueryClient
const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();

  // Check if a user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Vérifier l'authentification
    const checkAuth = async () => {
      // Si un utilisateur est authentifié, vérifiez son rôle
      if (pb.authStore.isValid) {
        const user = pb.authStore.model;
        // Vérifiez que l'utilisateur est un vigile
        if (user && user.role === 'vigile') {
          setIsAuthenticated(true);
        } else {
          pb.authStore.clear();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Masquer l'écran de démarrage
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || isAuthenticated === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} redirect={!isAuthenticated} />
          <Stack.Screen name="login" options={{ headerShown: false }} redirect={isAuthenticated} />
          <Stack.Screen name="scanner" options={{ title: 'Scanner les invitations' }} />
          <Stack.Screen name="history" options={{ title: 'Historique des scans' }} />
          <Stack.Screen name="scan-result" options={{ title: 'Résultat du scan', presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
