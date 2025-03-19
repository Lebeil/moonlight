import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { pb } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';

type ScanHistoryItem = {
    id: string;
    attendee: {
        id: string;
        name: string;
        code: string;
    };
    party: {
        id: string;
        title: string;
    };
    scannedAt: string;
};

export default function HistoryScreen() {
    const [scans, setScans] = useState<ScanHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScans = async () => {
            setLoading(true);
            try {
                const currentUser = pb.authStore.model;
                if (!currentUser) {
                    router.replace('/login');
                    return;
                }

                // Récupérer les scans effectués par l'utilisateur actuel
                const records = await pb.collection('scans').getList(1, 50, {
                    sort: '-scannedAt',
                    filter: `scannedBy = "${currentUser.id}"`,
                    expand: 'attendeeId',
                });

                // Traitement des résultats pour inclure les détails des participants et des soirées
                const scanPromises = records.items.map(async (item) => {
                    const attendee = item.expand?.attendeeId;
                    if (!attendee) return null;

                    try {
                        const partyRecord = await pb.collection('parties').getOne(attendee.partyId);

                        return {
                            id: item.id,
                            attendee: {
                                id: attendee.id,
                                name: attendee.name,
                                code: attendee.code,
                            },
                            party: {
                                id: partyRecord.id,
                                title: partyRecord.title,
                            },
                            scannedAt: item.scannedAt,
                        };
                    } catch (error) {
                        console.error('Error fetching party details:', error);
                        return null;
                    }
                });

                const resolvedScans = await Promise.all(scanPromises);
                setScans(resolvedScans.filter(scan => scan !== null) as ScanHistoryItem[]);
            } catch (error) {
                console.error('Error fetching scan history:', error);
                Alert.alert('Erreur', 'Impossible de récupérer l\'historique des scans');
            } finally {
                setLoading(false);
            }
        };

        fetchScans();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
                <Text style={styles.title}>Historique des scans</Text>
                {scans.length > 0 && (
                    <Text style={styles.subtitle}>{scans.length} scans effectués</Text>
                )}
            </View>

            {scans.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="scan-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Aucun scan effectué</Text>
                    <Text style={styles.emptySubText}>Vos scans apparaîtront ici une fois réalisés</Text>

                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => router.push('/scanner')}
                    >
                        <Ionicons name="scan" size={20} color="white" />
                        <Text style={styles.buttonText}>Scanner un QR code</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={scans}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.scanItem}>
                            <View style={styles.scanInfo}>
                                <Text style={styles.scanParty}>{item.party.title}</Text>
                                <Text style={styles.scanName}>{item.attendee.name}</Text>
                                <Text style={styles.scanDate}>{formatDate(item.scannedAt)}</Text>
                            </View>
                            <View style={styles.scanStatus}>
                                <View style={styles.statusBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                                    <Text style={styles.statusText}>Validé</Text>
                                </View>
                            </View>
                        </View>
                    )}
                    style={styles.list}
                />
            )}

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    list: {
        flex: 1,
    },
    scanItem: {
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
    scanInfo: {
        flex: 1,
    },
    scanParty: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scanName: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    scanDate: {
        fontSize: 12,
        color: '#666',
    },
    scanStatus: {
        marginLeft: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F7ED',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        color: '#34C759',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    scanButton: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    backButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 