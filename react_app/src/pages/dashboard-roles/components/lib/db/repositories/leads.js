import { query, exec, beginTransaction, commit, rollback } from '../database.js';

/**
 * Lead Repository
 * Handles all database operations for leads (deals/opportunities)
 */
export const LeadRepository = {
    /**
     * Get all leads with enriched data (company + primary contact)
     */
    getAll() {
        return query(`
            SELECT 
                l.*,
                c.name as business_name,
                ct.name as contact_name,
                ct.email as email,
                ct.phone as phone
            FROM leads l
            LEFT JOIN companies c ON l.company_id = c.id
            LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.is_primary = 1
            ORDER BY l.created_at DESC
        `);
    },

    /**
     * Get lead by ID with enriched data
     */
    getById(id) {
        const results = query(`
            SELECT 
                l.*,
                c.name as business_name,
                ct.name as contact_name,
                ct.email as email,
                ct.phone as phone
            FROM leads l
            LEFT JOIN companies c ON l.company_id = c.id
            LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.is_primary = 1
            WHERE l.id = ?
        `, [id]);

        if (!results[0]) return null;

        // Enrich with tags
        const tags = this.getTags(id);
        return { ...results[0], tags };
    },

    /**
     * Get leads by stage
     */
    getByStage(stageId) {
        return query(`
            SELECT 
                l.*,
                c.name as business_name,
                ct.name as contact_name
            FROM leads l
            LEFT JOIN companies c ON l.company_id = c.id
            LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.is_primary = 1
            WHERE l.stage_id = ?
            ORDER BY l.created_at DESC
        `, [stageId]);
    },

    /**
     * Create a new lead
     */
    create(lead) {
        const id = lead.id || `deal-${Date.now()}`;

        beginTransaction();
        try {
            exec(`
                INSERT INTO leads (
                    id, company_id, title, value, stage_id, probability,
                    source, campaign, budget, estimated_close_date,
                    business_name, contact_name, email, phone
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                lead.company_id,
                lead.title,
                lead.value || 0,
                lead.stage_id,
                lead.probability || 20,
                lead.source || null,
                lead.campaign || null,
                lead.budget || 0,
                lead.estimated_close_date || null,
                lead.business_name || null,
                lead.contact_name || null,
                lead.email || null,
                lead.phone || null
            ]);

            // Add tags if provided
            if (lead.tags && lead.tags.length > 0) {
                for (const tag of lead.tags) {
                    exec('INSERT OR IGNORE INTO lead_tags (lead_id, tag) VALUES (?, ?)', [id, tag]);
                }
            }

            commit();
            return this.getById(id);
        } catch (error) {
            try {
                rollback();
            } catch (rollbackError) {
                console.warn('⚠️  Rollback failed (transaction may not have started):', rollbackError.message);
            }
            console.error('❌ Error creating lead:', error);
            throw error;
        }
    },

    /**
     * Update a lead
     */
    update(id, updates) {
        const fields = [];
        const values = [];

        const allowedFields = [
            'title', 'value', 'stage_id', 'probability', 'source',
            'campaign', 'budget', 'estimated_close_date',
            'business_name', 'contact_name', 'email', 'phone'
        ];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        exec(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);

        return this.getById(id);
    },

    /**
     * Delete a lead
     */
    delete(id) {
        exec('DELETE FROM leads WHERE id = ?', [id]);
        return true;
    },

    /**
     * Get tags for a lead
     */
    getTags(leadId) {
        const results = query('SELECT tag FROM lead_tags WHERE lead_id = ? ORDER BY tag', [leadId]);
        return results.map(r => r.tag);
    },

    /**
     * Add a tag to a lead
     */
    addTag(leadId, tag) {
        exec('INSERT OR IGNORE INTO lead_tags (lead_id, tag) VALUES (?, ?)', [leadId, tag]);
    },

    /**
     * Remove a tag from a lead
     */
    removeTag(leadId, tag) {
        exec('DELETE FROM lead_tags WHERE lead_id = ? AND tag = ?', [leadId, tag]);
    },

    /**
     * Set all tags for a lead (replaces existing)
     */
    setTags(leadId, tags) {
        beginTransaction();
        try {
            // Remove all existing tags
            exec('DELETE FROM lead_tags WHERE lead_id = ?', [leadId]);

            // Add new tags
            for (const tag of tags) {
                this.addTag(leadId, tag);
            }

            commit();
        } catch (error) {
            rollback();
            throw error;
        }
    }
};
