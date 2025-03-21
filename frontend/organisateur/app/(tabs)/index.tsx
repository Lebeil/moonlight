import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useEffect, useState, useCallback } from 'react';
import { pb, getCurrentUser } from '@/utils/api';
import type { Party } from '@/utils/types';
import { formatDate } from '@/utils/helpers';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Fonction de navigation sécurisée
const safeNavigate = (path: string) => {
  setTimeout(() => {
    if (path === '/login') {
      router.replace('/login' as any);
    } else if (path.startsWith('/party-details')) {
      const id = path.split('id=')[1];
      if (id) {
        router.replace({
          pathname: '/party-details',
          params: { id }
        });
      } else {
        console.error('ID de soirée manquant pour la navigation');
        router.replace('/(tabs)' as any);
      }
    } else {
      router.replace(path as any);
    }
  }, 300);
};

export default function PartiesScreen() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchParties = async () => {
    setLoading(true);
    try {
      // Vérifier l'authentification
      if (!pb.authStore.isValid) {
        console.log("Authentification nécessaire pour voir les soirées");
        setNeedsAuth(true);
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log("Utilisateur non trouvé dans le store");
        setNeedsAuth(true);
        return;
      }

      console.log("Récupération des soirées pour l'utilisateur:", currentUser.id);

      // Récupérer toutes les soirées sans filtrer par organisateur pour déboguer
      const records = await pb.collection('parties').getList(1, 50, {
        // Trier par date de l'événement en ordre croissant
        sort: 'date',
        // Temporairement supprimé le filtre pour voir toutes les soirées
        // filter: `organizer = "${currentUser.id}"`,
        expand: 'organizer',
      });

      console.log(`${records.items.length} soirées trouvées`, JSON.stringify(records.items));

      // Ajouter des logs pour voir les dates brutes
      records.items.forEach(item => {
        console.log(`Soirée: ${item.title || item.name}, Date brute: ${item.date}, Créée le: ${item.created}`);
      });

      setParties(records.items.map(item => ({
        id: item.id,
        title: item.title || item.name || "Sans titre",
        description: item.description || "",
        date: item.date || new Date().toISOString(),
        location: item.location || "",
        code: item.code || "",
        organizer: item.organizer,
      })));
    } catch (error) {
      console.error('Error fetching parties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utiliser useFocusEffect pour s'assurer que le code s'exécute après le montage complet
  useFocusEffect(
    useCallback(() => {
      const checkAndFetch = async () => {
        console.log("Vérification de l'authentification avant de charger les soirées");
        // On vérifie d'abord l'authentification sans naviguer
        if (!pb.authStore.isValid) {
          setNeedsAuth(true);
          return;
        }

        // Si authentifié, on récupère les soirées
        await fetchParties();
      };

      checkAndFetch();

      // Subscribe to changes seulement si authentifié
      let unsubscribeFunc: (() => void) | undefined;

      if (pb.authStore.isValid) {
        pb.collection('parties').subscribe('*', () => {
          fetchParties();
        }).then(unsubscribe => {
          unsubscribeFunc = unsubscribe;
        });
      }

      return () => {
        if (unsubscribeFunc) unsubscribeFunc();
      };
    }, [])
  );

  // Gérer la redirection si besoin d'authentification
  useEffect(() => {
    if (needsAuth) {
      const timer = setTimeout(() => {
        console.log("Redirection vers login depuis index");
        router.replace('/login' as any);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [needsAuth]);

  const handleCreateParty = () => {
    router.push('/new-party');
  };

  const handlePartyPress = (party: Party) => {
    router.push({
      pathname: '/party-details',
      params: { id: party.id }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Soirées</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchParties}>
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateParty}>
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Nouvelle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {parties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune soirée créée</Text>
          <Text style={styles.emptySubText}>Créez votre première soirée avec le bouton ci-dessus</Text>
        </View>
      ) : (
        <FlatList
          data={parties}
          keyExtractor={(item) => item.id || item.title}
          renderItem={({ item }) => {
            // Ajouter ce log pour vérifier la date avant formatage
            console.log(`Rendu de ${item.title}: date=${item.date}, formatée=${formatDate(item.date)}`);

            return (
              <TouchableOpacity style={styles.partyItem} onPress={() => handlePartyPress(item)}>
                <View style={styles.partyContent}>
                  <Text style={styles.partyTitle}>{item.title}</Text>
                  <Text style={styles.partyDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.partyLocation}>{item.location}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#888" />
              </TouchableOpacity>
            );
          }}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4630EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  partyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  partyContent: {
    flex: 1,
  },
  partyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partyDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  partyLocation: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
