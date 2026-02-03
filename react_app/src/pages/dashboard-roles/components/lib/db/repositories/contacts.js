import { query, exec } from '../database.js';

/**
 * Contact Repository
 * Handles all database operations for contacts
 */
export const ContactRepository = {
    /**
     * Get all contacts
     */
    getAll() {
        return query('SELECT * FROM contacts ORDER BY name');
    },

    /**
     * Get contact by ID
     */
    getById(id) {
        const results = query('SELECT * FROM contacts WHERE id = ?', [id]);
        return results[0] || null;
    },

    /**
     * Get all contacts for a company
     */
    getByCompany(companyId) {
        return query(
            'SELECT * FROM contacts WHERE company_id = ? ORDER BY is_primary DESC, name',
            [companyId]
        );
    },

    /**
     * Get primary contact for a company
     */
    getPrimaryContact(companyId) {
        const results = query(
            'SELECT * FROM contacts WHERE company_id = ? AND is_primary = 1 LIMIT 1',
            [companyId]
        );
        return results[0] || null;
    },

    /**
     * Create a new contact
     */
    create(contact) {
        const id = contact.id || `ct-${Date.now()}`;

        exec(`
            INSERT INTO contacts (id, company_id, name, email, phone, role, area, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            contact.company_id,
            contact.name,
            contact.email || null,
            contact.phone || null,
            contact.role || 'Usuario Final',
            contact.area || null,
            contact.is_primary ? 1 : 0
        ]);

        return this.getById(id);
    },

    /**
     * Update a contact
     */
    update(id, updates) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'email', 'phone', 'role', 'area', 'is_primary'];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(field === 'is_primary' ? (updates[field] ? 1 : 0) : updates[field]);
            }
        }

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        exec(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`, values);

        return this.getById(id);
    },

    /**
     * Delete a contact
     */
    delete(id) {
        exec('DELETE FROM contacts WHERE id = ?', [id]);
        return true;
    },

    /**
     * Set a contact as primary (and unset others for the same company)
     */
    setPrimary(contactId) {
        const contact = this.getById(contactId);
        if (!contact) return null;

        // Unset all primary contacts for this company
        exec('UPDATE contacts SET is_primary = 0 WHERE company_id = ?', [contact.company_id]);

        // Set this one as primary
        exec('UPDATE contacts SET is_primary = 1 WHERE id = ?', [contactId]);

        return this.getById(contactId);
    }
};
