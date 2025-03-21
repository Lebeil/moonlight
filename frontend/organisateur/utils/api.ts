import PocketBase from 'pocketbase';
import { Platform } from 'react-native';

// Création d'une fonction pour obtenir l'URL PocketBase appropriée
const getPocketBaseUrl = () => {
    if (Platform.OS === 'android') {
        // Pour émulateur Android: 10.0.2.2 est l'équivalent de localhost
        return 'http://10.0.2.2:8090';
    } else if (Platform.OS === 'ios') {
        // Pour simulateur iOS
        return 'http://localhost:8090';
    } else if (Platform.OS === 'web') {
        // Pour le web
        return 'http://localhost:8090';
    } else {
        // Pour un appareil physique, utilisez l'adresse IP de votre ordinateur
        // IMPORTANT: 127.0.0.1 ou localhost fonctionnent uniquement sur émulateurs/simulateurs
        // Un appareil physique a besoin de l'adresse IP locale de l'ordinateur
        console.warn('ATTENTION: Appareil physique détecté. Utilisation de l\'adresse IP locale.');

        // Adresse IP réelle de l'ordinateur sur le réseau
        return 'http://192.168.1.49:8090';
    }
};

const pbUrl = getPocketBaseUrl();
console.log('Plateforme détectée:', Platform.OS);
console.log('URL PocketBase utilisée:', pbUrl);

export const pb = new PocketBase(pbUrl);

// Désactiver l'annulation automatique des requêtes
pb.autoCancellation(false);

// Pour déboguer les problèmes de connexion
pb.beforeSend = function (url, options) {
    console.log('PocketBase: Requête envoyée à', url);

    // Ajouter un timeout plus long pour les requêtes
    if (options) {
        if (!options.signal) {
            const controller = new AbortController();
            options.signal = controller.signal;
            setTimeout(() => controller.abort(), 15000); // Timeout de 15 secondes
        }
    }

    return { url, options };
};

// Vérifier l'état de connexion au démarrage
console.log('État initial de l\'authentification PocketBase:', pb.authStore.isValid);
console.log('Token d\'authentification:', pb.authStore.token ? 'Présent' : 'Absent');

// Gestionnaire d'erreurs PocketBase
export const handlePocketBaseError = (error: any) => {
    console.error('Erreur PocketBase détaillée:', JSON.stringify(error));

    // Vérifier les détails d'erreur pour une validation de données
    if (error?.data?.data) {
        // Détails de validation
        const validationErrors = Object.entries(error.data.data)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');

        return `Erreur de validation: ${validationErrors}`;
    }

    if (error?.status === 401) {
        return "Session expirée, veuillez vous reconnecter";
    }

    if (error?.status === 404) {
        return "Ressource non trouvée (collection absente ou mal nommée)";
    }

    if (error?.status === 403) {
        return "Accès non autorisé (vérifiez les règles d'accès de la collection)";
    }

    if (error?.data?.message) {
        return error.data.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Erreur de connexion au serveur";
};

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

// Fonction de connexion utilisateur avec meilleure gestion d'erreurs
export const loginUser = async (email: string, password: string) => {
    try {
        console.log(`Tentative de connexion avec ${email} vers ${pbUrl}`);

        // Vérifier d'abord si le serveur est accessible
        try {
            await pb.health.check();
        } catch (healthError) {
            console.error("Serveur PocketBase inaccessible:", healthError);
            return {
                success: false,
                error: `Serveur inaccessible. Vérifiez votre connexion ou l'URL du serveur.`
            };
        }

        // Tentative d'authentification
        const authData = await pb.collection('users').authWithPassword(email, password);

        // Vérification de l'authentification
        console.log('Connexion réussie. AuthStore valide:', pb.authStore.isValid);
        console.log('Infos utilisateur:', JSON.stringify(authData.record));

        return { success: true, user: authData.record };
    } catch (error) {
        console.error('Error during login:', error);

        // Message d'erreur plus spécifique
        let errorMessage = "Identifiants incorrects";

        if (error instanceof Error) {
            console.error('Message d\'erreur:', error.message);

            if (error.message.includes("Failed to fetch") || error.message.includes("Network Error")) {
                errorMessage = "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
            }
        }

        return { success: false, error: errorMessage };
    }
};

// Fonction de déconnexion utilisateur
export const logoutUser = async () => {
    console.log("Déconnexion en cours...");
    try {
        // Nettoyer le stockage d'authentification
        pb.authStore.clear();
        console.log("Déconnexion effectuée, état de l'auth:", pb.authStore.isValid);
        return { success: true, isLoggedOut: !pb.authStore.isValid };
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        return { success: false, error };
    }
};

// Fonction pour obtenir l'utilisateur connecté actuel
export const getCurrentUser = () => {
    if (pb.authStore.isValid) {
        const user = pb.authStore.record;
        console.log("Utilisateur authentifié récupéré:", user);
        return user;
    }
    console.log("Aucun utilisateur authentifié");
    return null;
};

// Fonction pour obtenir le token d'authentification
export const getAuthToken = () => {
    const token = pb.authStore.token;
    console.log("Token d'authentification:", token || "Non disponible");
    return token;
};

// Fonction pour diagnostiquer les problèmes avec une collection
export const diagnoseCollectionIssue = async (collectionName: string) => {
    try {
        // Vérifier si la collection existe
        const collections = await pb.collections.getFullList();
        const collectionExists = collections.some(c => c.name === collectionName);

        if (!collectionExists) {
            return {
                success: false,
                error: `Collection "${collectionName}" n'existe pas`,
                collections: collections.map(c => c.name)
            };
        }

        // Vérifier si l'utilisateur a accès à la collection
        const collection = await pb.collections.getOne(collectionName);

        // Afficher les infos d'authentification
        const authInfo = {
            isValid: pb.authStore.isValid,
            token: pb.authStore.token,
            model: pb.authStore.model,
        };

        console.log(`Auth info pour ${collectionName}:`, authInfo);

        // Vérifier si on peut lister les éléments (même vide)
        try {
            await pb.collection(collectionName).getList(1, 1);
            return {
                success: true,
                schema: collection.schema,
                authInfo
            };
        } catch (listError: any) {
            return {
                success: false,
                error: `Erreur de liste: ${listError.message}`,
                schema: collection.schema,
                authInfo
            };
        }
    } catch (error: any) {
        console.error(`Erreur diagnostic ${collectionName}:`, error);
        return {
            success: false,
            error: error.message,
            authInfo: {
                isValid: pb.authStore.isValid,
                token: pb.authStore.token ? 'Présent' : 'Absent',
            }
        };
    }
};

// Fonction pour afficher les informations d'authentification complètes (debug)
export const logAuthDetails = () => {
    // ... existing code ...
};

// Fonction pour tenter de créer manuellement une collection parties simple
export const createPartiesCollection = async () => {
    try {
        console.log("Tentative de création manuelle de la collection 'parties'");

        // Vérifier d'abord la santé du serveur
        try {
            const health = await pb.health.check();
            console.log("Serveur PocketBase accessible:", health);
        } catch (err) {
            console.error("Impossible d'accéder au serveur PocketBase:", err);
            return { success: false, error: "Serveur PocketBase inaccessible" };
        }

        // Tenter une création directe avec fetch (car l'API admin n'est pas facilement accessible)
        try {
            console.log("Tentative de création via API directe");

            // Définition de la collection
            const collectionData = {
                name: "parties",
                type: "base",
                schema: [
                    {
                        name: "name",
                        type: "text",
                        required: true
                    },
                    {
                        name: "title",
                        type: "text",
                        required: false
                    },
                    {
                        name: "description",
                        type: "text",
                        required: false
                    }
                ],
                listRule: "@request.auth.id != ''",
                viewRule: "@request.auth.id != ''",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            };

            // Essayer de créer via fetch direct (nécessite accès admin)
            const response = await fetch(`${pb.baseUrl}/api/collections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(collectionData)
            });

            const result = await response.text();
            console.log("Résultat de la création:", response.status, result);

            if (response.ok) {
                return { success: true, message: "Collection créée via API directe" };
            } else {
                return {
                    success: false,
                    error: `Erreur ${response.status}: ${result}`,
                    note: "Pour créer cette collection, utilisez le tableau de bord admin de PocketBase (généralement sur http://localhost:8090/_/)"
                };
            }
        } catch (err) {
            console.error("Erreur lors de la création via API:", err);
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
                note: "Pour créer cette collection, utilisez le tableau de bord admin de PocketBase (généralement sur http://localhost:8090/_/)"
            };
        }
    } catch (error) {
        console.error("Erreur globale:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}; 