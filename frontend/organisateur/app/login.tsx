import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '../components/Themed';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginForm } from '@/utils/types';
import { LoginSchema } from '@/utils/types';
import { loginUser, pb } from '@/utils/api';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { logout } = useLocalSearchParams();

    // Gestion de la déconnexion uniquement si paramètre explicite
    useEffect(() => {
        // Si on arrive sur cette page avec un paramètre logout, c'est qu'on vient d'être déconnecté
        if (logout) {
            console.log("Réinitialisation du store d'authentification suite à une déconnexion");
            pb.authStore.clear();
        }
    }, [logout]);

    // Vérifier si déjà connecté
    useEffect(() => {
        if (pb.authStore.isValid) {
            const userRole = String(pb.authStore.model?.role || '').toLowerCase().trim();
            if (userRole.includes('organisateur')) {
                console.log('Utilisateur déjà connecté, redirection vers (tabs)');
                router.replace('/(tabs)');
            }
        }
    }, []);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setErrorMessage(''); // Réinitialiser le message d'erreur

        try {
            const response = await loginUser(data.email, data.password);

            // Vérifier si la connexion a réussi et si l'utilisateur existe
            if (!response.success || !response.user) {
                setErrorMessage('Email ou mot de passe incorrect');
                setLoading(false);
                return;
            }

            // Déboguer l'objet utilisateur
            console.log('User object:', JSON.stringify(response.user));
            console.log('Role property type:', typeof response.user.role);
            console.log('Role property value:', response.user.role);

            // Vérifier si l'utilisateur est un organisateur
            const userRole = String(response.user.role || '').toLowerCase().trim();
            console.log('Rôle détecté:', response.user.role, 'Après conversion:', userRole);

            if (!userRole.includes('organisateur')) {
                console.log('Rôle incorrect:', response.user.role);

                // Message d'erreur sur le rôle
                setErrorMessage(`Accès refusé: Cette application est réservée aux organisateurs. Votre rôle actuel est "${response.user.role || 'Non défini'}"`);

                // Déconnexion de l'utilisateur non autorisé
                pb.authStore.clear();
                setLoading(false);
                return;
            }

            // L'authentification a réussi
            console.log('Authentification réussie! Redirection vers la page des soirées');

            // Forcer la redirection vers la page des soirées
            try {
                router.replace('/(tabs)');
            } catch (navError) {
                console.error('Erreur lors de la redirection:', navError);
                // En cas d'échec, essayer une autre approche
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 500);
            }
        } catch (error) {
            setErrorMessage('Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>Connexion Organisateur</Text>
                <Text style={styles.subtitle}>Connectez-vous pour gérer vos soirées</Text>

                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Cette application est réservée aux organisateurs d'événements
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <Controller
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                placeholder="votre@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        )}
                        name="email"
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <Controller
                        control={control}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                placeholder="Mot de passe"
                                secureTextEntry
                            />
                        )}
                        name="password"
                    />
                    {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </Text>
                </TouchableOpacity>

                {errorMessage ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color="#d9534f" />
                        <Text style={styles.errorNotification}>{errorMessage}</Text>
                    </View>
                ) : null}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formContainer: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        backgroundColor: '#a29bdb',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderLeftWidth: 3,
        borderLeftColor: '#4630EB',
    },
    infoText: {
        color: '#555',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fdf7f7',
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#d9534f',
    },
    errorNotification: {
        color: '#d9534f',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
}); 