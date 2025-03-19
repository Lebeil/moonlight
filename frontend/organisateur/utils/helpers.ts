import type { Party, Attendee } from './types';

// Formater une date pour l'affichage
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Générer le contenu QR pour une soirée
export const generatePartyQrContent = (party: Party) => {
    return JSON.stringify({
        type: 'party',
        id: party.id,
        code: party.code,
    });
};

// Générer l'URL de la soirée pour partage
export const generatePartyUrl = (code: string) => {
    // En environnement de développement, utiliser l'URL locale
    return `exp://192.168.1.39:8081/--/party?code=${code}`;
    // En production, utiliser l'URL publique
    // return `https://moonlight-party.com/party?code=${code}`;
};

// Filtrer les participants par nom ou téléphone
export const filterAttendees = (attendees: Attendee[], searchText: string) => {
    if (!searchText) return attendees;

    const normalizedSearch = searchText.toLowerCase().trim();
    return attendees.filter(
        attendee =>
            attendee.name.toLowerCase().includes(normalizedSearch) ||
            attendee.phone.includes(normalizedSearch) ||
            attendee.code?.toLowerCase().includes(normalizedSearch)
    );
};

// Calculer les statistiques d'une soirée
export const getPartyStats = (attendees: Attendee[]) => {
    const total = attendees.length;
    const scanned = attendees.filter(a => a.scanned).length;
    const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;

    return {
        total,
        scanned,
        notScanned: total - scanned,
        percentage,
    };
}; 