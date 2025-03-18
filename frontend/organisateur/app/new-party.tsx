import { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Text, View } from '../components/Themed';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Party } from '@/utils/types';
import { PartySchema } from '@/utils/types';
import { pb, generateUniqueCode } from '@/utils/api';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NewPartyScreen() {
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<Party>({
        resolver: zodResolver(PartySchema),
        defaultValues: {
            title: '',
            description: '',
            date: new Date().toISOString(),
            location: '',
        }
    });

    const selectedDate = watch('date');

    const onSubmit = async (data: Party) => {
        setLoading(true);
        try {
            const user = pb.authStore.model;
            if (!user) {
                router.replace('/login');
                return;
            }

            // Générer un code unique pour la soirée
            const partyCode = generateUniqueCode();

            const newParty = await pb.collection('parties').create({
                title: data.title,
                description: data.description,
                date: data.date,
                location: data.location,
                code: partyCode,
                organizer: user.id,
            });

            Alert.alert(
                'Succès',
                'La soirée a été créée avec succès !',
                [{ text: 'OK', onPress: () => router.replace(`/party-details?id=${newParty.id}`) }]
            );
        } catch (error) {
            console.error('Error creating party:', error);
            Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de la création de la soirée.'
            );
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setValue('date', selectedDate.toISOString());
        }
    };

    const formatDisplayDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Nouvelle Soirée</Text>

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
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text>{formatDisplayDate(selectedDate)}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date(selectedDate)}
                                mode="datetime"
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
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
}); 