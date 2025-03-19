import PocketBase from 'pocketbase';
import { Platform } from 'react-native';

// Créer une instance de PocketBase
const pbUrl = Platform.OS === 'web' ? 'http://127.0.0.1:8090' : 'http://192.168.1.39:8090'; // Adresse IP correcte
export const pb = new PocketBase(pbUrl);

// Fonction de connexion utilisateur
export const loginUser = async (email: string, password: string) => {
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        return { success: true, user: authData.record };
    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, error: 'Identifiants incorrects' };
    }
};

// Fonction de déconnexion utilisateur
export const logoutUser = () => {
    pb.authStore.clear();
}; 