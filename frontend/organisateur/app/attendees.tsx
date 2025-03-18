import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '../components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import { pb } from '@/utils/api';
import type { Attendee } from '@/utils/types';
import { Ionicons } from '@expo/vector-icons';

export default function AttendeesScreen() {
    const { partyId } = useLocalSearchParams();
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [partyTitle, setPartyTitle] = useState('');

    const fetchAttendees = async () => {
        if (!partyId) return;

        try {
            // Récupérer les infos de la soirée
            const partyRecord = await pb.collection('parties').getOne(partyId as string);
            setPartyTitle(partyRecord.title);

            // Récupérer la liste des participants
            const records = await pb.collection('attendees').getList(1, 100, {
                filter: `partyId = "${partyId}"`,
                sort: '-created',
            });

            setAttendees(records.items.map(item => ({
                id: item.id,
                name: item.name,
                phone: item.phone,
                partyId: item.partyId,
                code: item.code,
                scanned: item.scanned,
            })));
        } catch (error) {
            console.error('Error fetching attendees:', error);
            Alert.alert('Erreur', 'Impossible de récupérer la liste des participants');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendees();

        // S'abonner aux changements
        let unsubscribeFunc: () => void;

        pb.collection('attendees').subscribe('*', () => {
            fetchAttendees();
        }).then(unsubscribe => {
            unsubscribeFunc = unsubscribe;
        });

        return () => {
            if (unsubscribeFunc) unsubscribeFunc();
        };
    }, [partyId]);

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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Participants</Text>
                <View style={styles.backButton} />
            </View>

            <Text style={styles.partyTitle}>{partyTitle}</Text>

            {attendees.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucun participant inscrit</Text>
                    <Text style={styles.emptySubText}>Partagez le lien de la soirée pour que les gens s'inscrivent</Text>
                </View>
            ) : (
                <>
                    <View style={styles.countContainer}>
                        <Text style={styles.countText}>{attendees.length} participant(s)</Text>
                        <Text style={styles.scannedText}>
                            {attendees.filter(a => a.scanned).length} scanné(s)
                        </Text>
                    </View>

                    <FlatList
                        data={attendees}
                        keyExtractor={(item) => item.id || item.name}
                        renderItem={({ item }) => (
                            <View style={styles.attendeeItem}>
                                <View style={styles.attendeeInfo}>
                                    <Text style={styles.attendeeName}>{item.name}</Text>
                                    <Text style={styles.attendeePhone}>{item.phone}</Text>
                                </View>
                                <View style={[styles.statusBadge, item.scanned ? styles.scannedBadge : styles.notScannedBadge]}>
                                    <Text style={[styles.statusText, item.scanned ? styles.scannedText : styles.notScannedText]}>
                                        {item.scanned ? 'Scanné' : 'Non scanné'}
                                    </Text>
                                </View>
                            </View>
                        )}
                        style={styles.list}
                    />
                </>
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
        marginBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    partyTitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    countContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    countText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    attendeeItem: {
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
    attendeeInfo: {
        flex: 1,
    },
    attendeeName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    attendeePhone: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    scannedBadge: {
        backgroundColor: '#E6F7ED',
    },
    notScannedBadge: {
        backgroundColor: '#FEF1F0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    scannedText: {
        color: '#34C759',
    },
    notScannedText: {
        color: '#FF3B30',
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