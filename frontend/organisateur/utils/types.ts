import { z } from 'zod';

// Interface pour une soirée
export interface Party {
    id?: string;
    title: string;
    description: string;
    date: string;
    location: string;
    code?: string;
    organizer: string;
}

// Interface pour un participant
export interface Attendee {
    id?: string;
    name: string;
    phone: string;
    partyId: string;
    code?: string;
    scanned: boolean;
}

// Schéma de validation pour une soirée
export const PartySchema = z.object({
    title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
    description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
    date: z.string().nonempty('La date est requise'),
    location: z.string().min(3, 'Le lieu doit contenir au moins 3 caractères'),
    organizer: z.string(),
});

// Interface pour le formulaire de connexion
export interface LoginForm {
    email: string;
    password: string;
}

// Schéma de validation pour la connexion
export const LoginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
}); 