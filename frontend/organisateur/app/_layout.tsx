import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, SplashScreen } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { pb } from '@/utils/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Permet d'obtenir l'utilisateur actuel (sans vérification de rôle)
const getUserRole = () => {
  if (!pb.authStore.isValid) return '';
  const user = pb.authStore.model;
  if (!user) return '';
  // Retourne simplement l'ID utilisateur car nous n'utilisons plus les rôles
  console.log("Utilisateur connecté ID:", user.id);
  return user.id;
};

// Création du client pour React Query
const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on the groups tab doesn't render a blank screen
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Segments return the route segments as an array
  const segments = useSegments();

  // Fonction sécurisée pour la navigation
  const safeNavigate = useCallback((path: string) => {
    setTimeout(() => {
      router.replace({ pathname: path as any });
    }, 300);
  }, []);

  // Exposer les informations de débogage
  useEffect(() => {
    console.log("Navigation check - Auth state:", isLoggedIn, "Current segment:", segments[0], "PB Auth Valid:", pb.authStore.isValid);
  }, [isLoggedIn, segments]);

  // Expose this hook for authentication
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log("Vérification de l'authentification dans le layout");

      // Vérifier si l'utilisateur est connecté
      const isAuth = pb.authStore.isValid;
      console.log("État de l'authentification:", isAuth);

      // Si segment = login, pas besoin de rediriger
      const isLoginPage = segments[0] === 'login';

      // Set the auth state
      setIsLoggedIn(isAuth);

      // Une fois l'état d'authentification déterminé
      if (isLoggedIn === null) {
        return; // Premier rendu, ne pas rediriger
      }

      // Si non connecté et non sur la page de login, rediriger vers login
      if (!isAuth && !isLoginPage) {
        console.log("Utilisateur déconnecté, redirection vers login");
        safeNavigate('/login');
        return;
      }

      // Si connecté et sur la page de login, rediriger vers (tabs)
      if (isAuth && isLoginPage) {
        console.log("Utilisateur connecté sur la page login, redirection vers tabs");
        safeNavigate('/(tabs)');
      }
    };

    checkAuthStatus();
  }, [segments, isLoggedIn, safeNavigate]);

  // Expose hook for loading the app
  useEffect(() => {
    if (error) throw error;
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="attendees" options={{ title: 'Participants' }} />
          <Stack.Screen name="party-details" options={{ title: 'Détails de la soirée' }} />
          <Stack.Screen name="new-party" options={{ title: 'Nouvelle soirée' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
