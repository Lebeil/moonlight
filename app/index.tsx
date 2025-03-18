import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { pb } from '../../../shared/api';
import { parseQrContent } from '../../../shared/utils';

export default function HomeScreen() {
    const [partyCode, setPartyCode] = useState('');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);

    // Demander la permission d'utiliser la caméra
    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    // Gestionnaire pour la saisie manuelle du code
    const handleSubmit = async () => {
        if (!partyCode.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un code de soirée');
            return;
        }

        setLoading(true);
        try {
            // Vérifier si le code de soirée existe
            const records = await pb.collection('parties').getList(1, 1, {
                filter: `code = "${partyCode.trim().toUpperCase()}"`,
            });

            if (records.items.length === 0) {
                Alert.alert('Erreur', 'Code de soirée invalide');
                return;
            }

            const party = records.items[0];
            router.push(`/party?id=${party.id}`);
        } catch (error) {
            console.error('Error checking party code:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la vérification du code');
        } finally {
            setLoading(false);
        }
    };

    // Gestionnaire pour le scan du QR code
    const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
        setScanning(false);

        try {
            const parsedData = parseQrContent(data);

            if (!parsedData || parsedData.type !== 'party' || !parsedData.id) {
                Alert.alert('Erreur', 'QR code invalide ou non reconnu');
                return;
            }

            // Vérifier si le QR code correspond à une soirée existante
            try {
                const party = await pb.collection('parties').getOne(parsedData.id);
                if (party) {
                    router.push(`/party?id=${party.id}`);
                } else {
                    Alert.alert('Erreur', 'Soirée non trouvée');
                }
            } catch (error) {
                console.error('Error fetching party:', error);
                Alert.alert('Erreur', 'Soirée non trouvée');
            }
        } catch (error) {
            console.error('Error parsing QR code:', error);
            Alert.alert('Erreur', 'QR code invalide');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.title}>Moonlight</Text>
                <Text style={styles.subtitle}>Rejoignez la soirée en un instant</Text>
            </View>

            {scanning ? (
                <View style={styles.scannerContainer}>
                    {hasPermission === null ? (
                        <Text>Demande d'autorisation de la caméra...</Text>
                    ) : hasPermission === false ? (
                        <Text>Pas d'accès à la caméra</Text>
                    ) : (
                        <>
                            <BarCodeScanner
                                onBarCodeScanned={handleBarCodeScanned}
                                style={styles.scanner}
                            />
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setScanning(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : (
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Entrez le code de la soirée</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={partyCode}
                            onChangeText={setPartyCode}
                            placeholder="Code de la soirée"
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => setScanning(true)}
                        >
                            <Ionicons name="qr-code" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Rejoindre la soirée</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
        marginVertical: 40,
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    formContainer: {
        marginTop: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginRight: 10,
    },
    scanButton: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#a29bdb',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scannerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanner: {
        width: '100%',
        height: 300,
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 