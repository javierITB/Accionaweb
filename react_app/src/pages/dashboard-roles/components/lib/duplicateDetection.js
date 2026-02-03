/**
 * Utility functions for duplicate detection
 */

/**
 * Calculate similarity between two strings using a simple algorithm
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    // Calculate Levenshtein-based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) track[0][i] = i;
    for (let j = 0; j <= str2.length; j++) track[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }

    return track[str2.length][str1.length];
}

/**
 * Check for duplicate contacts
 * Returns array of potential duplicates with similarity scores
 */
export function findDuplicateContacts(newContact, existingContacts, currentContactId = null) {
    const duplicates = [];
    const NAME_THRESHOLD = 0.85; // 85% similarity for names
    const EMAIL_THRESHOLD = 0.9;  // 90% similarity for emails

    existingContacts.forEach(existing => {
        // Skip if it's the same contact being edited
        if (currentContactId && existing.id === currentContactId) return;

        let reasons = [];
        let maxSimilarity = 0;

        // Check email exact match (most important)
        if (newContact.email && existing.email &&
            newContact.email.toLowerCase().trim() === existing.email.toLowerCase().trim()) {
            reasons.push('Email idéntico');
            maxSimilarity = 1;
        }

        // Check email similarity
        if (newContact.email && existing.email) {
            const emailSim = stringSimilarity(newContact.email, existing.email);
            if (emailSim >= EMAIL_THRESHOLD && emailSim < 1) {
                reasons.push(`Email similar (${Math.round(emailSim * 100)}%)`);
                maxSimilarity = Math.max(maxSimilarity, emailSim);
            }
        }

        // Check name similarity
        if (newContact.name && existing.name) {
            const nameSim = stringSimilarity(newContact.name, existing.name);
            if (nameSim >= NAME_THRESHOLD) {
                reasons.push(`Nombre similar (${Math.round(nameSim * 100)}%)`);
                maxSimilarity = Math.max(maxSimilarity, nameSim);
            }
        }

        // Check phone exact match
        if (newContact.phone && existing.phone) {
            const cleanPhone1 = newContact.phone.replace(/\D/g, '');
            const cleanPhone2 = existing.phone.replace(/\D/g, '');
            if (cleanPhone1 && cleanPhone2 && cleanPhone1 === cleanPhone2) {
                reasons.push('Teléfono idéntico');
                maxSimilarity = Math.max(maxSimilarity, 0.9);
            }
        }

        if (reasons.length > 0) {
            duplicates.push({
                contact: existing,
                reasons,
                similarityScore: maxSimilarity
            });
        }
    });

    // Sort by similarity score (highest first)
    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Check for duplicate companies
 * Returns array of potential duplicates with similarity scores
 */
export function findDuplicateCompanies(newCompany, existingCompanies, currentCompanyId = null) {
    const duplicates = [];
    const NAME_THRESHOLD = 0.85;
    const RUT_THRESHOLD = 0.9;

    existingCompanies.forEach(existing => {
        // Skip if it's the same company being edited
        if (currentCompanyId && existing.id === currentCompanyId) return;

        let reasons = [];
        let maxSimilarity = 0;

        // Check RUT exact match
        if (newCompany.rut && existing.rut &&
            newCompany.rut.toLowerCase().trim() === existing.rut.toLowerCase().trim()) {
            reasons.push('RUT idéntico');
            maxSimilarity = 1;
        }

        // Check name similarity
        if (newCompany.name && existing.name) {
            const nameSim = stringSimilarity(newCompany.name, existing.name);
            if (nameSim >= NAME_THRESHOLD) {
                reasons.push(`Nombre similar (${Math.round(nameSim * 100)}%)`);
                maxSimilarity = Math.max(maxSimilarity, nameSim);
            }
        }

        // Check website exact match
        if (newCompany.website && existing.website) {
            const cleanWebsite1 = newCompany.website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').trim();
            const cleanWebsite2 = existing.website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').trim();
            if (cleanWebsite1 && cleanWebsite2 && cleanWebsite1 === cleanWebsite2) {
                reasons.push('Sitio web idéntico');
                maxSimilarity = Math.max(maxSimilarity, 0.95);
            }
        }

        if (reasons.length > 0) {
            duplicates.push({
                company: existing,
                reasons,
                similarityScore: maxSimilarity
            });
        }
    });

    // Sort by similarity score (highest first)
    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
}
