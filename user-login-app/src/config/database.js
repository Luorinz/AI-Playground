const Database = require('better-sqlite3');
const path = require('path');

/**
 * Database configuration and management class
 * Uses better-sqlite3 for synchronous SQLite operations
 */
class DatabaseConfig {
  /**
   * Create a new database instance
   * @param {string} dbPath - Path to the SQLite database file
   */
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(__dirname, '../../data/app.db');
    this.db = null;
    this.init();
  }

  /**
   * Initialize database connection
   */
  init() {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  /**
   * Create users table if not exists
   */
  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get user by username
   * @param {string} username - The username to search for
   * @returns {Object|null} User object or null if not found
   */
  getUserByUsername(username) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) || null;
  }

  /**
   * Get user by ID
   * @param {number} id - The user ID
   * @returns {Object|null} User object or null if not found
   */
  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  }

  /**
   * Create a new user
   * @param {string} username - The username
   * @param {string} passwordHash - The hashed password
   * @returns {Object} Created user object with id
   */
  createUser(username, passwordHash) {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, password_hash) VALUES (?, ?)
    `);
    const result = stmt.run(username, passwordHash);
    return {
      id: result.lastInsertRowid,
      username,
      password_hash: passwordHash
    };
  }

  /**
   * Update user password
   * @param {number} userId - The user ID
   * @param {string} newPasswordHash - The new hashed password
   * @returns {boolean} True if updated successfully
   */
  updateUserPassword(userId, newPasswordHash) {
    const stmt = this.db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    const result = stmt.run(newPasswordHash, userId);
    return result.changes > 0;
  }

  /**
   * Delete user by ID
   * @param {number} id - The user ID
   * @returns {boolean} True if deleted successfully
   */
  deleteUser(id) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get all users (for admin/debug purposes)
   * @returns {Array} Array of user objects
   */
  getAllUsers() {
    const stmt = this.db.prepare('SELECT id, username, created_at FROM users');
    return stmt.all();
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = DatabaseConfig;
