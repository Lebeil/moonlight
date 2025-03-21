import type { Party, Attendee } from './types';

// Formater une date pour l'affichage
export const formatDate = (dateString: string) => {
    try {
        if (!dateString) return "Date non spécifiée";

        const date = new Date(dateString);

        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
            return "Date invalide";
        }

        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.error("Erreur lors du formatage de la date:", error, "dateString:", dateString);
        return "Date invalide";
    }
};

// Formater une date pour l'affichage dans le sélecteur de date
export const formatDisplayDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} - ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (error) {
        return "Date invalide";
    }
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