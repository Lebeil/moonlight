import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '../../components/Themed';
import { useEffect, useState } from 'react';
import { pb } from '@/utils/api';
import type { Party } from '@/utils/types';
import { formatDate } from '@/utils/helpers';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PartiesScreen() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const records = await pb.collection('parties').getList(1, 50, {
        sort: '-created',
        filter: `organizer = "${currentUser.id}"`,
        expand: 'organizer',
      });

      setParties(records.items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.date,
        location: item.location,
        code: item.code,
        organizer: item.organizer,
      })));
    } catch (error) {
      console.error('Error fetching parties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();

    // Subscribe to changes
    let unsubscribeFunc: () => void;

    pb.collection('parties').subscribe('*', () => {
      fetchParties();
    }).then(unsubscribe => {
      unsubscribeFunc = unsubscribe;
    });

    return () => {
      if (unsubscribeFunc) unsubscribeFunc();
    };
  }, []);

  const handleCreateParty = () => {
    router.push('/new-party');
  };

  const handlePartyPress = (party: Party) => {
    router.push({ pathname: '/party-details', params: { id: party.id } });
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
        <TouchableOpacity style={styles.addButton} onPress={handleCreateParty}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Nouvelle</Text>
        </TouchableOpacity>
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
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.partyItem} onPress={() => handlePartyPress(item)}>
              <View style={styles.partyContent}>
                <Text style={styles.partyTitle}>{item.title}</Text>
                <Text style={styles.partyDate}>{formatDate(item.date)}</Text>
                <Text style={styles.partyLocation}>{item.location}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>
          )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
