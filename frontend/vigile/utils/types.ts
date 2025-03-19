import { z } from 'zod';

// Interface pour une soirée
export interface Party {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    code: string;
    organizer: string;
}

// Interface pour un participant
export interface Attendee {
    id: string;
    name: string;
    phone: string;
    partyId: string;
    code: string;
    scanned: boolean;
}

// Interface pour le résultat du scan
export interface ScanResult {
    success: boolean;
    attendee?: Attendee;
    party?: Party;
    message?: string;
    alreadyScanned?: boolean;
    error?: string;
}

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