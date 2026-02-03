import { query, exec } from '../database.js';

/**
 * Stage Repository
 * Handles all database operations for pipeline stages
 */
export const StageRepository = {
    /**
     * Get all stages ordered by position
     */
    getAll() {
        return query('SELECT * FROM stages ORDER BY position');
    },

    /**
     * Get stage by ID
     */
    getById(id) {
        const results = query('SELECT * FROM stages WHERE id = ?', [id]);
        return results[0] || null;
    },

    /**
     * Create a new stage
     */
    create(stage) {
        const id = stage.id || `stage-${Date.now()}`;

        exec(`
            INSERT INTO stages (id, name, position)
            VALUES (?, ?, ?)
        `, [
            id,
            stage.name,
            stage.position || 99
        ]);

        return this.getById(id);
    },

    /**
     * Update a stage
     */
    update(id, updates) {
        const fields = [];
        const values = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.position !== undefined) {
            fields.push('position = ?');
            values.push(updates.position);
        }

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        exec(`UPDATE stages SET ${fields.join(', ')} WHERE id = ?`, values);

        return this.getById(id);
    },

    /**
     * Delete a stage
     */
    delete(id) {
        exec('DELETE FROM stages WHERE id = ?', [id]);
        return true;
    }
};
