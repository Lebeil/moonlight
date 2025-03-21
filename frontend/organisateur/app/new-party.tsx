import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView, Modal, View as RNView } from 'react-native';
import { Text, View } from '../components/Themed';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Party } from '@/utils/types';
import { PartySchema } from '@/utils/types';
import { pb, handlePocketBaseError, generateUniqueCode } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import { Picker, PickerProps } from '@react-native-picker/picker';
import { formatDisplayDate } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';

// Wrapper autour du Picker pour éviter les avertissements de pointerEvents
const PickerWrapper = ({ children, ...props }: PickerProps<number>) => {
    return (
        <RNView style={{
            pointerEvents: 'auto',
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            overflow: 'hidden',
            height: 200,
            width: 80,
            borderWidth: 1,
            borderColor: '#dddddd'
        }}>
            <Picker {...props}>
                {children}
            </Picker>
        </RNView>
    );
};

export default function NewPartyScreen() {
    const [loading, setLoading] = useState(false);
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [serverError, setServerError] = useState(false);

    // États pour le picker de date/heure
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedHour, setSelectedHour] = useState(new Date().getHours());
    const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

    // Vérifier l'authentification quand la page est active
    useFocusEffect(
        useCallback(() => {
            const checkAuth = () => {
                const isAuth = pb.authStore.isValid;
                const userId = pb.authStore.record?.id;

                console.log("============= VÉRIFICATION AUTH =============");
                console.log("État d'authentification:", isAuth);
                console.log("Token présent:", pb.authStore.token ? 'Oui' : 'Non');
                console.log("ID Utilisateur:", userId || 'Non disponible');
                console.log("URL PocketBase:", pb.baseUrl);
                console.log("==========================================");

                if (!isAuth) {
                    console.log("Authentification nécessaire");
                    setNeedsAuth(true);
                } else {
                    setNeedsAuth(false);
                }
            };

            // Vérifier la disponibilité du serveur
            const checkServer = async () => {
                try {
                    const health = await pb.health.check();
                    console.log("Serveur PocketBase accessible:", health);
                    setServerError(false);
                } catch (err) {
                    console.error("Impossible d'accéder au serveur PocketBase:", err);
                    setServerError(true);
                }
            };

            checkAuth();
            checkServer();

            return () => {
                // Nettoyage si nécessaire
            };
        }, [])
    );

    // Gérer les redirections de manière sécurisée
    useEffect(() => {
        if (needsAuth) {
            // Utiliser setTimeout pour s'assurer que la navigation se fait après le montage complet
            const timer = setTimeout(() => {
                Alert.alert(
                    'Session expirée',
                    'Veuillez vous reconnecter pour créer une soirée',
                    [{
                        text: 'OK',
                        onPress: () => {
                            console.log("Redirection vers login - non authentifié");
                            router.replace('/login');
                        }
                    }]
                );
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [needsAuth]);

    // Gérer les erreurs serveur
    useEffect(() => {
        if (serverError) {
            const timer = setTimeout(() => {
                Alert.alert(
                    'Erreur de connexion',
                    'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
                );
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [serverError]);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<Party>({
        resolver: zodResolver(PartySchema),
        defaultValues: {
            title: '',
            description: '',
            date: new Date().toISOString(),
            location: '',
            organizer: pb.authStore.record?.id || '',
        }
    });

    const selectedDate = watch('date');

    // Mettre à jour les états du picker lors de l'initialisation
    useEffect(() => {
        const date = new Date(selectedDate);
        setSelectedDay(date.getDate());
        setSelectedMonth(date.getMonth() + 1);
        setSelectedYear(date.getFullYear());
        setSelectedHour(date.getHours());
        setSelectedMinute(date.getMinutes());
    }, []);


    // Helper pour faire des navigations sécurisées
    const safeNavigate = (path: string) => {
        setTimeout(() => {
            // Utiliser la syntaxe correcte pour expo-router qui évite les undefined dans l'URL
            if (path === '/login') {
                router.replace('/login' as any);
            } else if (path.startsWith('/party-details')) {
                const id = path.split('id=')[1];
                if (id) {
                    router.replace({
                        pathname: '/party-details',
                        params: { id }
                    });
                } else {
                    console.error('ID de soirée manquant pour la navigation');
                    router.replace('/(tabs)' as any);
                }
            } else {
                router.replace(path as any);
            }
        }, 100);
    };

    const onSubmit = async (data: Party) => {
        // Vérifier l'authentification
        if (!pb.authStore.isValid) {
            Alert.alert(
                'Session expirée',
                'Veuillez vous reconnecter pour créer une soirée',
                [{ text: 'OK', onPress: () => safeNavigate('/login') }]
            );
            return;
        }

        setLoading(true);

        try {
            console.log("Début création soirée avec données:", data);

            // Récupérer l'ID utilisateur depuis le store d'authentification
            const userId = pb.authStore.record?.id;

            if (!userId) {
                throw new Error("ID utilisateur non disponible");
            }

            // Créer un objet avec les champs requis par le schéma de PocketBase
            const partyData = {
                name: data.title,
                title: data.title,
                description: data.description || "",
                description_text: data.description || "",
                date: data.date,
                location: data.location || "",
                link: data.location || "",
                organizer: userId,
                code: generateUniqueCode(),
            };

            // Logs de débogage pour vérifier les données
            console.log("Description envoyée:", data.description || "");
            console.log("Location envoyée:", data.location || "");
            console.log("Code généré:", partyData.code);

            // Ajouter un log pour déboguer la date
            console.log("Date de la soirée envoyée à PocketBase:", data.date);
            console.log("Date parsée:", new Date(data.date).toLocaleString());

            console.log("Données à envoyer:", partyData);

            const newParty = await pb.collection('parties').create(partyData);
            console.log("Soirée créée avec succès:", newParty.id);

            // Notification et redirection
            Alert.alert(
                'Succès',
                'La soirée a été créée avec succès!',
                [{
                    text: 'OK',
                    onPress: () => {
                        router.replace({
                            pathname: '/party-details',
                            params: { id: newParty.id }
                        });
                    }
                }]
            );
        } catch (error) {
            console.error("Erreur création soirée:", error);

            // Utiliser le gestionnaire d'erreurs PocketBase
            const errorMessage = handlePocketBaseError(error);

            Alert.alert(
                'Erreur lors de la création',
                `Impossible de créer la soirée: ${errorMessage}. Vérifiez que tous les champs sont correctement remplis.`,
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Générer les options pour les pickers
    const generateDays = () => {
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    };

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.replace('/(tabs)' as any)}
                        >
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Nouvelle Soirée</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Titre</Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={styles.input}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    placeholder="Nom de la soirée"
                                />
                            )}
                            name="title"
                        />
                        {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Description</Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    placeholder="Description de la soirée"
                                    multiline
                                    numberOfLines={4}
                                />
                            )}
                            name="description"
                        />
                        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Date et Heure</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowDateTimePicker(true)}
                        >
                            <Text>{formatDisplayDate(selectedDate)}</Text>
                        </TouchableOpacity>

                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={showDateTimePicker}
                            onRequestClose={() => setShowDateTimePicker(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Définir l'heure</Text>

                                    <View style={styles.pickerContainer}>
                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>Jour</Text>
                                            <PickerWrapper
                                                style={styles.picker}
                                                selectedValue={selectedDay}
                                                onValueChange={(itemValue) => setSelectedDay(itemValue)}
                                                itemStyle={styles.pickerItem}
                                            >
                                                {generateDays().map(day => (
                                                    <Picker.Item
                                                        key={`day-${day}`}
                                                        label={String(day).padStart(2, '0')}
                                                        value={day}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </PickerWrapper>
                                        </View>

                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>Mois</Text>
                                            <PickerWrapper
                                                style={styles.picker}
                                                selectedValue={selectedMonth}
                                                onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                                                itemStyle={styles.pickerItem}
                                            >
                                                {months.map(month => (
                                                    <Picker.Item
                                                        key={`month-${month}`}
                                                        label={String(month).padStart(2, '0')}
                                                        value={month}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </PickerWrapper>
                                        </View>

                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>Année</Text>
                                            <PickerWrapper
                                                style={styles.picker}
                                                selectedValue={selectedYear}
                                                onValueChange={(itemValue) => setSelectedYear(itemValue)}
                                                itemStyle={styles.pickerItem}
                                            >
                                                {years.map(year => (
                                                    <Picker.Item
                                                        key={`year-${year}`}
                                                        label={String(year)}
                                                        value={year}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </PickerWrapper>
                                        </View>
                                    </View>

                                    <Text style={styles.timeSeparator}>:</Text>

                                    <View style={styles.pickerContainer}>
                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>Heure</Text>
                                            <PickerWrapper
                                                style={styles.picker}
                                                selectedValue={selectedHour}
                                                onValueChange={(itemValue) => setSelectedHour(itemValue)}
                                                itemStyle={styles.pickerItem}
                                            >
                                                {hours.map(hour => (
                                                    <Picker.Item
                                                        key={`hour-${hour}`}
                                                        label={String(hour).padStart(2, '0')}
                                                        value={hour}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </PickerWrapper>
                                        </View>

                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>Minute</Text>
                                            <PickerWrapper
                                                style={styles.picker}
                                                selectedValue={selectedMinute}
                                                onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                                                itemStyle={styles.pickerItem}
                                            >
                                                {minutes.map(minute => (
                                                    <Picker.Item
                                                        key={`minute-${minute}`}
                                                        label={String(minute).padStart(2, '0')}
                                                        value={minute}
                                                        color="#000000"
                                                    />
                                                ))}
                                            </PickerWrapper>
                                        </View>
                                    </View>

                                    <View style={styles.buttonModalContainer}>
                                        <TouchableOpacity
                                            style={styles.modalButton}
                                            onPress={() => {
                                                const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay, selectedHour, selectedMinute);
                                                setValue('date', newDate.toISOString());
                                                setShowDateTimePicker(false);
                                            }}
                                        >
                                            <Text style={styles.modalButtonText}>Définir</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalCancelButton}
                                            onPress={() => setShowDateTimePicker(false)}
                                        >
                                            <Text style={styles.modalCancelButtonText}>Annuler</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Lieu</Text>
                        <Controller
                            control={control}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={styles.input}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    placeholder="Adresse de la soirée"
                                />
                            )}
                            name="location"
                        />
                        {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Création...' : 'Créer la soirée'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    formContainer: {
        padding: 20,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateInput: {
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    buttonDisabled: {
        backgroundColor: '#a29bdb',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Styles pour la modal et les pickers
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '95%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333333',
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    pickerColumn: {
        alignItems: 'center',
        marginHorizontal: 5,
        backgroundColor: '#FFFFFF',
    },
    picker: {
        width: 80,
        height: 200,
        color: '#000000',
        backgroundColor: '#FFFFFF',
        fontWeight: 'bold',
    },
    pickerItem: {
        color: '#000000',
        backgroundColor: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333333',
    },
    timeSeparator: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    buttonModalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 30,
    },
    modalButton: {
        backgroundColor: '#4630EB',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    modalCancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 