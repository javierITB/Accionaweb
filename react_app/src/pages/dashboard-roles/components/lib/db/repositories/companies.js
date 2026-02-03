import { query, exec, beginTransaction, commit, rollback } from '../database.js';

/**
 * Company Repository
 * Handles all database operations for companies
 */
export const CompanyRepository = {
    /**
     * Get all companies
     */
    getAll() {
        return query('SELECT * FROM companies ORDER BY name');
    },

    /**
     * Get company by ID
     */
    getById(id) {
        const results = query('SELECT * FROM companies WHERE id = ?', [id]);
        return results[0] || null;
    },

    /**
     * Create a new company
     */
    create(company) {
        const id = company.id || `comp-${Date.now()}`;

        exec(`
            INSERT INTO companies (id, name, rut, industry, size, website, location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            company.name,
            company.rut || null,
            company.industry || 'Sin definir',
            company.size || 'Sin definir',
            company.website || '',
            company.location || 'Sin definir'
        ]);

        return this.getById(id);
    },

    /**
     * Update a company
     */
    update(id, updates) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'rut', 'industry', 'size', 'website', 'location'];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        exec(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, values);

        return this.getById(id);
    },

    /**
     * Delete a company (and all related data via CASCADE)
     */
    delete(id) {
        exec('DELETE FROM companies WHERE id = ?', [id]);
        return true;
    },

    /**
     * Search companies by name
     */
    search(searchTerm) {
        return query(
            'SELECT * FROM companies WHERE name LIKE ? ORDER BY name',
            [`%${searchTerm}%`]
        );
    },

    /**
     * Get companies by industry
     */
    getByIndustry(industry) {
        return query(
            'SELECT * FROM companies WHERE industry = ? ORDER BY name',
            [industry]
        );
    }
};
