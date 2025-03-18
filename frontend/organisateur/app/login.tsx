import { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, View } from '../components/Themed';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LoginForm } from '@/utils/types';
import { LoginSchema } from '@/utils/types';
import { loginUser } from '@/utils/api';
import { router } from 'expo-router';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const response = await loginUser(data.email, data.password);

            // Vérifier si l'utilisateur est un organisateur
            if (response.user.role !== 'organisateur') {
                Alert.alert(
                    'Accès refusé',
                    'Seuls les organisateurs peuvent accéder à cette application.'
                );
                return;
            }

            router.replace('/');
        } catch (error) {
            Alert.alert(
                'Erreur d\'authentification',
                'Email ou mot de passe incorrect'
            );
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
}); 