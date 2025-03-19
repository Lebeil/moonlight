
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

// Parser le contenu d'un QR code
export const parseQrContent = (content: string) => {
    try {
        return JSON.parse(content);
    } catch (error) {
        console.error('Error parsing QR content:', error);
        return null;
    }
};

// Formater un numéro de téléphone pour l'affichage
export const formatPhone = (phone: string) => {
    if (!phone) return '';

    // Supprime tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');

    // Format français: XX XX XX XX XX
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    return phone;
}; 