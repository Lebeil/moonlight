import { StyleSheet, TouchableOpacity, Image, View as DefaultView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { pb, getCurrentUser } from '@/utils/api';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    const loadCurrentUser = () => {
      const user = getCurrentUser();
      if (user) {
        setUserData({
          id: user.id,
          name: user.name || 'Utilisateur',
          email: user.email,
          avatar: user.avatar ? pb.getFileUrl(user, user.avatar) : undefined,
        });
      }
    };

    loadCurrentUser();
  }, []);

  const handleLogout = () => {
    try {
      // Déconnexion de l'utilisateur
      pb.authStore.clear();

      // Navigation vers la page de connexion avec paramètre de déconnexion
      router.replace({
        pathname: '/login',
        params: { logout: 'true' }
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <DefaultView style={styles.avatarContainer}>
          {userData.avatar ? (
            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
          ) : (
            <DefaultView style={[styles.avatar, styles.placeholderAvatar]}>
              <Ionicons name="person" size={50} color="#666" />
            </DefaultView>
          )}
        </DefaultView>
        <Text style={styles.name}>{userData.name}</Text>
        <Text style={styles.email}>{userData.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte organisateur</Text>
        <Text style={styles.sectionDescription}>
          En tant qu'organisateur, vous pouvez créer et gérer des soirées,
          suivre les participants et générer des QR codes pour les invitations.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
