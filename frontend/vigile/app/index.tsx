import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logoutUser } from '@/utils/api';

export default function HomeScreen() {
    const handleScanPress = () => {
        router.push('/scanner');
    };

    const handleHistoryPress = () => {
        router.push('/history');
    };

    const handleLogout = () => {
        logoutUser();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                /> */}
                <Text style={styles.title}>Vigile</Text>
                <Text style={styles.subtitle}>Scanner les invitations des participants</Text>
            </View>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={handleScanPress}
                >
                    <Ionicons name="scan-outline" size={40} color="white" />
                    <Text style={styles.buttonText}>Scanner un QR code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.historyButton}
                    onPress={handleHistoryPress}
                >
                    <Ionicons name="list" size={40} color="white" />
                    <Text style={styles.buttonText}>Historique des scans</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={styles.logoutText}>Déconnexion</Text>
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
        textAlign: 'center',
    },
    buttonsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    scanButton: {
        width: '100%',
        backgroundColor: '#4630EB',
        borderRadius: 10,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    historyButton: {
        width: '100%',
        backgroundColor: '#34C759',
        borderRadius: 10,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        padding: 10,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
}); 