import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import { ScanResult, Party } from '../../shared/types';
import { pb } from '../../shared/api';
import { formatDate } from '../../shared/utils';
import { Ionicons } from '@expo/vector-icons';

export default function ScanResultScreen() {
    const { result } = useLocalSearchParams();
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [party, setParty] = useState<Party | null>(null);

    useEffect(() => {
        if (!result) {
            router.back();
            return;
        }

        try {
            const parsedResult: ScanResult = JSON.parse(result as string);
            setScanResult(parsedResult);

            // Si nous avons des informations sur l'invité, récupérons les détails de la soirée
            if (parsedResult.attendee) {
                fetchPartyDetails(parsedResult.attendee.partyId);
            }
        } catch (error) {
            console.error('Error parsing scan result:', error);
            router.back();
        }
    }, [result]);

    const fetchPartyDetails = async (partyId: string) => {
        try {
            const record = await pb.collection('parties').getOne(partyId);

            setParty({
                id: record.id,
                title: record.title,
                description: record.description,
                date: record.date,
                location: record.location,
                code: record.code,
                organizer: record.organizer,
            });
        } catch (error) {
            console.error('Error fetching party details:', error);
        }
    };

    const handleScanAgain = () => {
        router.replace('/scanner');
    };

    const handleBackToHome = () => {
        router.replace('/index');
    };

    if (!scanResult) {
        return (
            <View style={styles.container}>
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[
                styles.resultHeader,
                scanResult.valid ? styles.validHeader : styles.invalidHeader
            ]}>
                {scanResult.valid ? (
                    <Ionicons name="checkmark-circle" size={80} color="white" />
                ) : (
                    <Ionicons name="close-circle" size={80} color="white" />
                )}

                <Text style={styles.resultText}>
                    {scanResult.valid ? 'Scan Réussi' : 'Scan Refusé'}
                </Text>
                <Text style={styles.resultMessage}>{scanResult.message}</Text>
            </View>

            {scanResult.attendee && (
                <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Nom</Text>
                        <Text style={styles.detailText}>{scanResult.attendee.name}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Téléphone</Text>
                        <Text style={styles.detailText}>{scanResult.attendee.phone}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Code</Text>
                        <Text style={styles.detailText}>{scanResult.attendee.code}</Text>
                    </View>

                    {party && (
                        <>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Soirée</Text>
                                <Text style={styles.detailText}>{party.title}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailText}>{formatDate(party.date)}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Lieu</Text>
                                <Text style={styles.detailText}>{party.location}</Text>
                            </View>
                        </>
                    )}
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={handleScanAgain}
                >
                    <Ionicons name="scan" size={20} color="white" />
                    <Text style={styles.buttonText}>Scanner un autre code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={handleBackToHome}
                >
                    <Ionicons name="home" size={20} color="white" />
                    <Text style={styles.buttonText}>Retour à l'accueil</Text>
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
    resultHeader: {
        alignItems: 'center',
        padding: 30,
        borderRadius: 16,
        marginBottom: 30,
    },
    validHeader: {
        backgroundColor: '#34C759',
    },
    invalidHeader: {
        backgroundColor: '#FF3B30',
    },
    resultText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 20,
        marginBottom: 10,
    },
    resultMessage: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
    },
    detailsContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 30,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
    },
    detailText: {
        fontSize: 16,
        fontWeight: '500',
    },
    buttonContainer: {
        gap: 15,
    },
    scanAgainButton: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeButton: {
        backgroundColor: '#666',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
}); 