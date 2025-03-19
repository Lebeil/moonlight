import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { pb } from '@/utils/api';
import { parseQrContent } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import type { ScanResult } from '@/utils/types';

export default function ScannerScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);

        try {
            const parsedData = parseQrContent(data);

            if (!parsedData || parsedData.type !== 'attendee' || !parsedData.id || !parsedData.partyId) {
                Alert.alert('Erreur', 'QR code invalide ou non reconnu');
                setLoading(false);
                return;
            }

            // Vérifier si le QR code correspond à une invitation existante
            try {
                // Récupérer l'invitation
                const attendee = await pb.collection('attendees').getOne(parsedData.id);

                // Vérifier si l'invitation est déjà scannée
                if (attendee.scanned) {
                    const result: ScanResult = {
                        valid: false,
                        message: 'Cette invitation a déjà été scannée',
                        attendee: {
                            id: attendee.id,
                            name: attendee.name,
                            phone: attendee.phone,
                            partyId: attendee.partyId,
                            code: attendee.code,
                            scanned: attendee.scanned,
                        }
                    };

                    router.push({
                        pathname: '/scan-result',
                        params: { result: JSON.stringify(result) }
                    });
                    return;
                }

                // Récupérer la soirée
                const party = await pb.collection('parties').getOne(attendee.partyId);

                // Vérifier que l'utilisateur est authentifié
                const currentUser = pb.authStore.model;
                if (!currentUser) {
                    router.replace('/login');
                    return;
                }

                // Créer un enregistrement du scan
                await pb.collection('scans').create({
                    attendeeId: attendee.id,
                    scannedBy: currentUser.id,
                    scannedAt: new Date().toISOString(),
                });

                // Marquer l'invitation comme scannée
                await pb.collection('attendees').update(attendee.id, {
                    scanned: true
                });

                // Créer un résultat positif
                const result: ScanResult = {
                    valid: true,
                    message: 'Invitation valide',
                    attendee: {
                        id: attendee.id,
                        name: attendee.name,
                        phone: attendee.phone,
                        partyId: attendee.partyId,
                        code: attendee.code,
                        scanned: true,
                    }
                };

                router.push({
                    pathname: '/scan-result',
                    params: { result: JSON.stringify(result) }
                });
            } catch (error) {
                console.error('Error processing scan:', error);
                const result: ScanResult = {
                    valid: false,
                    message: 'Invitation non trouvée ou erreur de traitement',
                };

                router.push({
                    pathname: '/scan-result',
                    params: { result: JSON.stringify(result) }
                });
            }
        } catch (error) {
            console.error('Error parsing QR code:', error);
            Alert.alert('Erreur', 'QR code invalide');
            setLoading(false);
            setScanned(false);
        }
    };

    const handleReset = () => {
        setScanned(false);
        setLoading(false);
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text>Demande d'autorisation de la caméra...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text>Pas d'accès à la caméra</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Scanner une invitation</Text>
                <Text style={styles.subtitle}>Placez le QR code dans le cadre</Text>
            </View>

            <View style={styles.scannerContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4630EB" />
                        <Text style={styles.loadingText}>Vérification de l'invitation...</Text>
                    </View>
                ) : (
                    <BarCodeScanner
                        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                        style={styles.scanner}
                    />
                )}

                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                </View>
            </View>

            {scanned && !loading && (
                <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={handleReset}
                >
                    <Ionicons name="scan" size={20} color="white" />
                    <Text style={styles.buttonText}>Scanner à nouveau</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
            >
                <Text style={styles.cancelButtonText}>Retour</Text>
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
        alignItems: 'center',
        marginBottom: 30,
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
    scannerContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16,
        marginBottom: 20,
    },
    scanner: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#4630EB',
        backgroundColor: 'transparent',
        borderRadius: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    rescanButton: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 