import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Share, Alert, ScrollView } from 'react-native';
import { Text, View } from '../components/Themed';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { pb } from '@/utils/api';
import type { Party } from '@/utils/types';
import { formatDate, generatePartyUrl, generatePartyQrContent } from '@/utils/helpers';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

// Fonction de navigation sécurisée
const safeNavigate = (path: string) => {
  setTimeout(() => {
    if (path === '/') {
      router.replace('/(tabs)' as any);
    } else if (path.startsWith('/attendees')) {
      router.push(path as any);
    } else {
      router.back();
    }
  }, 300);
};

export default function PartyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(0);

  const fetchParty = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      console.log("Récupération des détails de la soirée:", id);
      const record = await pb.collection('parties').getOne(id as string, {
        expand: 'organizer',
      });

      console.log("Données brutes de la soirée:", JSON.stringify(record));

      // Logs détaillés pour comprendre les problèmes de champs manquants
      console.log("Champs vérifiés individuellement:");
      console.log("- description:", record.description);
      console.log("- location:", record.location);
      console.log("- code:", record.code);

      // Récupérer tous les champs disponibles
      const allFields = Object.keys(record);
      console.log("Tous les champs disponibles:", allFields);

      // Mapper les données en vérifiant chaque champ
      setParty({
        id: record.id,
        title: record.title || record.name || "Sans titre",
        description: record.description || record.description_text || "",
        date: record.date || new Date().toISOString(),
        location: record.location || record.link || "", // Essayer d'utiliser 'link' comme alternative
        code: record.code || "",
        organizer: record.organizer,
      });

      // Récupérer le nombre de participants
      const attendeesResult = await pb.collection('attendees').getList(1, 1, {
        filter: `partyId = "${id}"`,
        countOnly: true,
      });

      setAttendeeCount(attendeesResult.totalItems);
    } catch (error) {
      console.error('Error fetching party:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les détails de la soirée');
      router.replace('/(tabs)' as any);
    } finally {
      setLoading(false);
    }
  };

  // Utiliser useFocusEffect au lieu de useEffect
  useFocusEffect(
    useCallback(() => {
      fetchParty();

      // S'abonner aux changements
      let unsubscribeFunc: (() => void) | undefined;

      if (id) {
        pb.collection('attendees').subscribe('*', () => {
          pb.collection('attendees').getList(1, 1, {
            filter: `partyId = "${id}"`,
            countOnly: true,
          }).then(result => {
            setAttendeeCount(result.totalItems);
          });
        }).then(unsubscribe => {
          unsubscribeFunc = unsubscribe;
        });
      }

      return () => {
        if (unsubscribeFunc) unsubscribeFunc();
      };
    }, [id])
  );

  const handleShareLink = async () => {
    if (!party) return;

    const url = generatePartyUrl(party.code || '');

    try {
      await Share.share({
        message: `Rejoins la soirée "${party.title}" avec ce lien: ${url}`,
      });
    } catch (error) {
      console.error('Error sharing link:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!party) return;

    const url = generatePartyUrl(party.code || '');

    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Succès', 'Lien copié dans le presse-papier');
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleDeleteParty = async () => {
    if (!party) return;

    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette soirée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                await pb.collection('parties').delete(party.id as string);
                Alert.alert('Succès', 'La soirée a été supprimée');
                router.replace('/(tabs)' as any);
              } catch (error) {
                console.error('Error deleting party:', error);
                Alert.alert('Erreur', 'Impossible de supprimer la soirée');
              }
            })();
          }
        },
      ]
    );
  };

  const handleViewAttendees = () => {
    if (!party) return;
    safeNavigate(`/attendees?partyId=${party.id}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.container}>
        <Text>Soirée non trouvée</Text>
      </View>
    );
  }

  const qrContent = generatePartyQrContent(party);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la soirée</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Ionicons name="home" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{party.title}</Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={qrContent}
            size={200}
            color="black"
            backgroundColor="white"
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>{formatDate(party.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.infoText}>{party.location || "Lieu non spécifié"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.infoText}>{attendeeCount} participant(s)</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.description}>{party.description || "Aucune description"}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Code de la soirée</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{party.code || "Code non disponible"}</Text>
              {party.code && (
                <TouchableOpacity onPress={handleCopyLink}>
                  <Ionicons name="copy-outline" size={20} color="#4630EB" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleShareLink}>
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.buttonText}>Partager le lien</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleViewAttendees}>
            <Ionicons name="people" size={20} color="white" />
            <Text style={styles.buttonText}>Voir les participants</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteParty}>
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.deleteButtonText}>Supprimer la soirée</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoContainer: {
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4630EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
}); 