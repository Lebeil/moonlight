import PocketBase from 'pocketbase';

// Créer une instance de PocketBase
const pbUrl = 'http://127.0.0.1:8090'; // Utiliser localhost pour le développement
export const pb = new PocketBase(pbUrl);

// Générer un code unique pour les soirées
export const generateUniqueCode = () => {
    // Génère un code de 6 caractères alphanumériques
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Fonction de connexion utilisateur
export const loginUser = async (email: string, password: string) => {
    try {
        console.log(`Tentative de connexion avec ${email}`);
        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log('Connexion réussie:', authData.record);
        return { success: true, user: authData.record };
    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, error: 'Identifiants incorrects' };
    }
};

// Fonction de déconnexion utilisateur
export const logoutUser = async () => {
    console.log("Déconnexion en cours...");
    try {
        // Nettoyer le stockage d'authentification
        pb.authStore.clear();

        // Vérifier que la déconnexion a bien eu lieu
        console.log("Déconnexion effectuée, état de l'auth:", pb.authStore.isValid);

        // Retourner le résultat pour permettre d'attendre la fin de l'opération
        return { success: true, isLoggedOut: !pb.authStore.isValid };
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        return { success: false, error };
    }
};

// Fonction pour obtenir l'utilisateur connecté actuel
export const getCurrentUser = () => {
    if (pb.authStore.isValid) {
        return pb.authStore.model;
    }
    return null;
}; 