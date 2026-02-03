import initSqlJs from 'sql.js';

// Database instance (singleton)
let db = null;
let SQL = null;

/**
 * Initialize the SQLite database
 * This function loads the SQL.js library and creates/opens the database
 */
export async function initDatabase() {
    if (db) return db; // Already initialized

    // Initialize SQL.js
    SQL = await initSqlJs({
        // Path to sql-wasm.wasm file (adjust based on your build setup)
        locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from IndexedDB
    const savedDb = await loadFromIndexedDB();

    if (savedDb) {
        // Restore from saved data
        db = new SQL.Database(savedDb);
        console.log('✅ Database loaded from IndexedDB');
    } else {
        // Create new database
        db = new SQL.Database();
        console.log('✅ New database created');

        // Initialize schema
        await initializeSchema();
    }

    return db;
}

/**
 * Initialize database schema from SQL file
 */
async function initializeSchema() {
    try {
        // Read schema SQL from public folder
        console.log('📋 Fetching database schema...');
        const response = await fetch('/database_schema.sql');

        if (!response.ok) {
            throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
        }

        const schemaSQL = await response.text();
        console.log('📋 Schema loaded, initializing tables...');

        db.run(schemaSQL);
        console.log('✅ Database schema initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing schema:', error);
        console.error('Schema file should be at: /database_schema.sql');
        throw error;
    }
}

/**
 * Save database to IndexedDB for persistence
 */
export async function saveToIndexedDB() {
    if (!db) return;

    const data = db.export();
    const buffer = data.buffer;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_Database', 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            const dbIDB = request.result;
            const transaction = dbIDB.transaction(['databases'], 'readwrite');
            const store = transaction.objectStore('databases');

            store.put(buffer, 'main');

            transaction.oncomplete = () => {
                console.log('✅ Database saved to IndexedDB');
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        };

        request.onupgradeneeded = (event) => {
            const dbIDB = event.target.result;
            if (!dbIDB.objectStoreNames.contains('databases')) {
                dbIDB.createObjectStore('databases');
            }
        };
    });
}

/**
 * Load database from IndexedDB
 */
async function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CRM_Database', 1);

        request.onerror = () => {
            console.warn('IndexedDB not available, using in-memory database');
            resolve(null);
        };

        request.onsuccess = () => {
            const dbIDB = request.result;

            if (!dbIDB.objectStoreNames.contains('databases')) {
                resolve(null);
                return;
            }

            const transaction = dbIDB.transaction(['databases'], 'readonly');
            const store = transaction.objectStore('databases');
            const getRequest = store.get('main');

            getRequest.onsuccess = () => {
                resolve(getRequest.result ? new Uint8Array(getRequest.result) : null);
            };
            getRequest.onerror = () => resolve(null);
        };

        request.onupgradeneeded = (event) => {
            const dbIDB = event.target.result;
            if (!dbIDB.objectStoreNames.contains('databases')) {
                dbIDB.createObjectStore('databases');
            }
        };
    });
}

/**
 * Execute a SQL query
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Array} Query results
 */
export function query(sql, params = []) {
    if (!db) {
        const error = new Error('Database not initialized. Call initDatabase() first.');
        console.error('❌', error.message);
        throw error;
    }

    try {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);

        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
        }

        stmt.free();
        return results;
    } catch (error) {
        console.error('❌ SQL Query Error:', error.message);
        console.error('   Query:', sql);
        console.error('   Params:', params);
        throw error;
    }
}

/**
 * Execute a SQL command (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL command
 * @param {Array} params - Command parameters
 */
export function exec(sql, params = []) {
    if (!db) {
        const error = new Error('Database not initialized. Call initDatabase() first.');
        console.error('❌', error.message);
        throw error;
    }

    try {
        if (params.length > 0) {
            // Use prepared statement for parameterized queries
            const stmt = db.prepare(sql);
            stmt.bind(params);
            stmt.step();
            stmt.free();
        } else {
            // Use db.run for simple non-parameterized commands
            db.run(sql);
        }

        // Auto-save to IndexedDB after modifications
        saveToIndexedDB().catch(err => console.warn('⚠️  Failed to save to IndexedDB:', err));

        return true;
    } catch (error) {
        console.error('❌ SQL Exec Error:', error.message);
        console.error('   Command:', sql);
        console.error('   Params:', params);
        throw error;
    }
}

/**
 * Begin a transaction
 */
export function beginTransaction() {
    exec('BEGIN TRANSACTION');
}

/**
 * Commit a transaction
 */
export function commit() {
    exec('COMMIT');
}

/**
 * Rollback a transaction
 */
export function rollback() {
    exec('ROLLBACK');
}

/**
 * Get the last inserted row ID
 */
export function getLastInsertId() {
    const result = query('SELECT last_insert_rowid() as id');
    return result[0]?.id;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('✅ Database closed');
    }
}

// Export database instance getter
export function getDatabase() {
    return db;
}
