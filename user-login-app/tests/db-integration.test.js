const DatabaseConfig = require('../src/config/database');
const path = require('path');
const fs = require('fs');

describe('Database Integration Tests', () => {
  let db;
  const testDbPath = path.join(__dirname, 'test-app.db');

  // Setup: Create fresh database before each test
  beforeEach(() => {
    // Remove existing test database if present
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Remove WAL and SHM files if they exist
    if (fs.existsSync(testDbPath + '-wal')) {
      fs.unlinkSync(testDbPath + '-wal');
    }
    if (fs.existsSync(testDbPath + '-shm')) {
      fs.unlinkSync(testDbPath + '-shm');
    }
    
    db = new DatabaseConfig(testDbPath);
  });

  // Teardown: Close database and clean up after each test
  afterEach(() => {
    if (db) {
      db.close();
    }
    // Clean up test database files
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testDbPath + '-wal')) {
      fs.unlinkSync(testDbPath + '-wal');
    }
    if (fs.existsSync(testDbPath + '-shm')) {
      fs.unlinkSync(testDbPath + '-shm');
    }
  });

  describe('Database Initialization', () => {
    it('should create database file on initialization', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create users table on initialization', () => {
      const user = db.createUser('testuser', 'hash123');
      expect(user.id).toBeDefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', () => {
      const result = db.createUser('john_doe', 'hashed_password_123');
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.username).toBe('john_doe');
      expect(result.password_hash).toBe('hashed_password_123');
    });

    it('should throw error for duplicate username', () => {
      db.createUser('duplicate_user', 'hash1');
      
      expect(() => {
        db.createUser('duplicate_user', 'hash2');
      }).toThrow();
    });

    it('should auto-increment user IDs', () => {
      const user1 = db.createUser('user1', 'hash1');
      const user2 = db.createUser('user2', 'hash2');
      const user3 = db.createUser('user3', 'hash3');
      
      expect(user2.id).toBe(user1.id + 1);
      expect(user3.id).toBe(user2.id + 1);
    });
  });

  describe('getUserByUsername', () => {
    it('should find user by username', () => {
      db.createUser('findme', 'secret_hash');
      
      const user = db.getUserByUsername('findme');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('findme');
      expect(user.password_hash).toBe('secret_hash');
    });

    it('should return null for non-existent username', () => {
      const user = db.getUserByUsername('nonexistent');
      
      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should find user by ID', () => {
      const createdUser = db.createUser('iduser', 'id_hash');
      
      const user = db.getUserById(createdUser.id);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.username).toBe('iduser');
    });

    it('should return null for non-existent ID', () => {
      const user = db.getUserById(99999);
      
      expect(user).toBeNull();
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password', () => {
      const user = db.createUser('passwordupdater', 'old_hash');
      
      const result = db.updateUserPassword(user.id, 'new_hash');
      
      expect(result).toBe(true);
      
      const updatedUser = db.getUserById(user.id);
      expect(updatedUser.password_hash).toBe('new_hash');
    });

    it('should return false for non-existent user', () => {
      const result = db.updateUserPassword(99999, 'new_hash');
      
      expect(result).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should delete user by ID', () => {
      const user = db.createUser('deleteuser', 'delete_hash');
      
      const result = db.deleteUser(user.id);
      
      expect(result).toBe(true);
      expect(db.getUserById(user.id)).toBeNull();
    });

    it('should return false for non-existent user', () => {
      const result = db.deleteUser(99999);
      
      expect(result).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without password hashes', () => {
      db.createUser('user1', 'hash1');
      db.createUser('user2', 'hash2');
      db.createUser('user3', 'hash3');
      
      const users = db.getAllUsers();
      
      expect(users.length).toBe(3);
      expect(users[0].username).toBe('user1');
      expect(users[1].username).toBe('user2');
      expect(users[2].username).toBe('user3');
      
      // Verify password_hash is not included
      expect(users[0].password_hash).toBeUndefined();
    });

    it('should return empty array when no users exist', () => {
      const users = db.getAllUsers();
      
      expect(users).toEqual([]);
    });
  });

  describe('Database close', () => {
    it('should close database connection', () => {
      db.close();
      expect(db.db).toBeNull();
    });
  });

  describe('Integration Test - User Registration Flow', () => {
    it('should complete full registration flow', () => {
      // Simulate user registration
      const username = 'newuser@example.com';
      const passwordHash = '$2b$10$abcdefghijklmnopqrstuv'; // Simulated bcrypt hash
      
      // Create user
      const createdUser = db.createUser(username, passwordHash);
      expect(createdUser.id).toBeDefined();
      
      // Verify user can be retrieved by username
      const foundByUsername = db.getUserByUsername(username);
      expect(foundByUsername).toBeDefined();
      expect(foundByUsername.id).toBe(createdUser.id);
      
      // Verify user can be retrieved by ID
      const foundById = db.getUserById(createdUser.id);
      expect(foundById).toBeDefined();
      expect(foundById.username).toBe(username);
    });
  });

  describe('Integration Test - User Authentication Flow', () => {
    it('should support authentication lookup', () => {
      // Setup: Register user
      db.createUser('authuser', '$2b$10$validhash');
      
      // Simulate login: Find user by username
      const user = db.getUserByUsername('authuser');
      
      // Verify user exists and has password hash for comparison
      expect(user).toBeDefined();
      expect(user.password_hash).toBeDefined();
      
      // Simulate password verification (in real app, use bcrypt.compare)
      const providedHash = '$2b$10$validhash';
      const isAuthenticated = user.password_hash === providedHash;
      expect(isAuthenticated).toBe(true);
    });
  });
});
