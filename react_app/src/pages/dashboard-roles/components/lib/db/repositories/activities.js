import { query, exec } from '../database.js';

/**
 * Activity Repository
 * Handles all database operations for activities (timeline events)
 */
export const ActivityRepository = {
    /**
     * Get all activities
     */
    getAll() {
        return query('SELECT * FROM activities ORDER BY timestamp DESC');
    },

    /**
     * Get activities for a specific lead
     */
    getByLead(leadId) {
        return query(
            'SELECT * FROM activities WHERE lead_id = ? ORDER BY timestamp DESC',
            [leadId]
        );
    },

    /**
     * Get recent activities (limit)
     */
    getRecent(limit = 10) {
        return query(`SELECT * FROM activities ORDER BY timestamp DESC LIMIT ${limit}`);
    },

    /**
     * Create a new activity
     */
    create(activity) {
        const id = activity.id || `act-${Date.now()}-${Math.random()}`;

        exec(`
            INSERT INTO activities (id, lead_id, type, content, user, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            activity.lead_id || null,
            activity.type,
            activity.content,
            activity.user || 'Demo User',
            activity.timestamp || new Date().toISOString(),
            activity.metadata ? JSON.stringify(activity.metadata) : null
        ]);

        const results = query('SELECT * FROM activities WHERE id = ?', [id]);
        return results[0];
    },

    /**
     * Delete an activity
     */
    delete(id) {
        exec('DELETE FROM activities WHERE id = ?', [id]);
        return true;
    }
};

/**
 * Task Repository
 * Handles all database operations for tasks
 */
export const TaskRepository = {
    /**
     * Get all tasks
     */
    getAll() {
        return query('SELECT * FROM tasks ORDER BY due_date, created_at DESC');
    },

    /**
     * Get tasks for a specific lead
     */
    getByLead(leadId) {
        return query(
            'SELECT * FROM tasks WHERE lead_id = ? ORDER BY completed, due_date',
            [leadId]
        );
    },

    /**
     * Get incomplete tasks
     */
    getIncomplete() {
        return query('SELECT * FROM tasks WHERE completed = 0 ORDER BY due_date');
    },

    /**
     * Create a new task
     */
    create(task) {
        exec(`
            INSERT INTO tasks (lead_id, title, type, due_date, completed)
            VALUES (?, ?, ?, ?, ?)
        `, [
            task.lead_id || null,
            task.title || task.text, // Support both 'title' and legacy 'text'
            task.type || 'call',
            task.due_date || new Date().toISOString(),
            task.completed ? 1 : 0
        ]);

        // Get the last inserted task (using last_insert_rowid)
        const results = query('SELECT * FROM tasks WHERE id = last_insert_rowid()');
        return results[0];
    },

    /**
     * Update a task
     */
    update(id, updates) {
        const fields = [];
        const values = [];

        const allowedFields = ['title', 'type', 'due_date', 'completed'];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(field === 'completed' ? (updates[field] ? 1 : 0) : updates[field]);
            }
        }

        if (fields.length === 0) {
            const results = query('SELECT * FROM tasks WHERE id = ?', [id]);
            return results[0];
        }

        values.push(id);
        exec(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);

        const results = query('SELECT * FROM tasks WHERE id = ?', [id]);
        return results[0];
    },

    /**
     * Toggle task completion
     */
    toggle(id) {
        exec('UPDATE tasks SET completed = NOT completed WHERE id = ?', [id]);
        const results = query('SELECT * FROM tasks WHERE id = ?', [id]);
        return results[0];
    },

    /**
     * Delete a task
     */
    delete(id) {
        exec('DELETE FROM tasks WHERE id = ?', [id]);
        return true;
    }
};

/**
 * Comment Repository
 * Handles all database operations for comments/notes
 */
export const CommentRepository = {
    /**
     * Get comments for a lead
     */
    getByLead(leadId) {
        return query(
            'SELECT * FROM comments WHERE lead_id = ? ORDER BY created_at DESC',
            [leadId]
        );
    },

    /**
     * Create a new comment
     */
    create(comment) {
        const id = comment.id || `comment-${Date.now()}`;

        exec(`
            INSERT INTO comments (id, lead_id, content, user_name)
            VALUES (?, ?, ?, ?)
        `, [
            id,
            comment.lead_id,
            comment.content,
            comment.user_name || 'Demo User'
        ]);

        const results = query('SELECT * FROM comments WHERE id = ?', [id]);
        return results[0];
    },

    /**
     * Delete a comment
     */
    delete(id) {
        exec('DELETE FROM comments WHERE id = ?', [id]);
        return true;
    }
};
