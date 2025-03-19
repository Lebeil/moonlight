import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { pb } from '@/utils/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Permet d'obtenir le rôle de l'utilisateur actuel
const getUserRole = () => {
  const user = pb.authStore.model;
  if (!user) return '';
  return String(user.role || '').toLowerCase().trim();
};

// Création du client pour React Query
const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Exposer l'environnement actuel à toute l'application
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Si les polices ne sont pas chargées, ne pas afficher le contenu principal
  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNavigation />
    </QueryClientProvider>
  );
}

function RootLayoutNavigation() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Vérifier si l'utilisateur est connecté et est un organisateur
  useEffect(() => {
    // Vérifier l'état de l'authentification
    const checkAuth = async () => {
      try {
        const isAuth = pb.authStore.isValid;
        const userRole = getUserRole();
        const isOrganizer = isAuth && userRole.includes('organisateur');

        console.log('Auth check - isAuth:', isAuth, 'userRole:', userRole, 'isOrganizer:', isOrganizer);

        // Si l'utilisateur est connecté mais n'est pas organisateur, le déconnecter
        if (isAuth && !isOrganizer) {
          console.log('Utilisateur connecté mais pas organisateur, déconnexion forcée');
          pb.authStore.clear();
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(isAuth && isOrganizer);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // S'abonner aux changements d'authentification
    pb.authStore.onChange(() => {
      console.log('Auth store changed, rechecking auth state');
      checkAuth();
    });

    return () => {
      // Nettoyage de l'abonnement
      pb.authStore.onChange(() => { });
    };
  }, []);

  // Écouter les changements de route et rediriger si nécessaire
  useEffect(() => {
    if (isLoading) return;

    console.log('Navigation check - Auth state:', isLoggedIn, 'Current segment:', segments[0], 'PB Auth Valid:', pb.authStore.isValid);

    // Vérifier si l'utilisateur est déconnecté et n'est pas déjà sur login
    if (!pb.authStore.isValid && segments[0] !== 'login') {
      console.log('Utilisateur déconnecté, redirection vers login');
      router.replace('/login');
      return;
    }

    // Comportement normal de navigation
    if (isLoggedIn && segments[0] === 'login') {
      console.log('Redirection vers (tabs)');
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments, isLoading, pb.authStore.isValid]);

  // Masquer l'écran de démarrage une fois chargé
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="attendees" options={{ title: 'Participants' }} />
        <Stack.Screen name="party-details" options={{ title: 'Détails de la soirée' }} />
        <Stack.Screen name="new-party" options={{ title: 'Nouvelle soirée' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
