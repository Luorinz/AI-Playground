# User Login Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现基于 Node.js Express 的基础用户登录功能，包括用户注册、登录验证和会话管理。

**Architecture:** 使用 Express.js 作为 Web 框架，bcrypt 加密密码，express-session 管理会话，SQLite 存储用户数据。采用分层架构：路由层 -> 控制器层 -> 数据访问层。

**Tech Stack:** Node.js, Express.js, bcryptjs, express-session, better-sqlite3, connect-sqlite3

---

## 前提条件

确保已安装 Node.js (v18+) 和 npm。

```bash
node --version  # 应输出 v18.x.x 或更高
npm --version   # 应输出 9.x.x 或更高
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `src/config/database.js`
- Create: `src/middleware/auth.js`
- Create: `src/routes/auth.js`
- Create: `src/controllers/authController.js`
- Create: `src/models/User.js`
- Create: `src/app.js`
- Create: `src/server.js`
- Create: `tests/auth.test.js`

### Step 1: 初始化 Node.js 项目

```bash
cd /home/anda/projects/AI-Playground
mkdir -p user-login-app
cd user-login-app
npm init -y
```

Expected: 创建 `package.json` 文件

### Step 2: 安装依赖

```bash
npm install express bcryptjs express-session better-sqlite3 connect-sqlite3 dotenv
npm install -D jest supertest
```

Expected: `node_modules` 目录和更新的 `package.json`

### Step 3: 配置 Jest 测试

修改 `package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "test": "jest --coverage --detectOpenHandles"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

### Step 4: 创建目录结构

```bash
mkdir -p src/config src/middleware src/routes src/controllers src/models tests
```

### Step 5: 提交

```bash
git add package.json
git commit -m "feat: initialize Node.js login project"
```

---

## Task 2: 数据库层

**Files:**
- Create: `src/config/database.js`
- Test: `tests/database.test.js`

### Step 1: 编写数据库测试

Create `tests/database.test.js`:

```javascript
const Database = require('better-sqlite3');
const path = require('path');

describe('Database Setup', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  test('should create users table', () => {
    const stmt = db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    stmt.run();

    // Verify table exists
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    expect(result).toBeDefined();
  });

  test('should insert and retrieve user', () => {
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insert = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    insert.run('testuser', 'hashedpassword123');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser');
    expect(user.username).toBe('testuser');
    expect(user.password).toBe('hashedpassword123');
  });
});
```

### Step 2: 运行测试验证失败

```bash
npm test -- tests/database.test.js
```

Expected: PASS (独立测试，不依赖外部代码)

### Step 3: 创建数据库配置

Create `src/config/database.js`:

```javascript
const Database = require('better-sqlite3');
const path = require('path');

class DatabaseConfig {
  constructor(dbPath = ':memory:') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  getUserByUsername(username) {
    return this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  getUserById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  createUser(username, passwordHash) {
    const stmt = this.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    return stmt.run(username, passwordHash);
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseConfig;
```

### Step 4: 编写数据库集成测试

Create `tests/db-integration.test.js`:

```javascript
const DatabaseConfig = require('../src/config/database');

describe('DatabaseConfig', () => {
  let db;

  beforeEach(() => {
    db = new DatabaseConfig(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  test('should create user', () => {
    const result = db.createUser('testuser', 'hashed123');
    expect(result.lastInsertRowid).toBeDefined();
  });

  test('should get user by username', () => {
    db.createUser('testuser', 'hashed123');
    const user = db.getUserByUsername('testuser');
    expect(user.username).toBe('testuser');
  });

  test('should return undefined for non-existent user', () => {
    const user = db.getUserByUsername('nonexistent');
    expect(user).toBeUndefined();
  });

  test('should enforce unique username', () => {
    db.createUser('testuser', 'hashed123');
    expect(() => db.createUser('testuser', 'hashed456')).toThrow();
  });
});
```

### Step 5: 运行数据库测试

```bash
npm test -- tests/db-integration.test.js
```

Expected: 所有测试 PASS

### Step 6: 提交

```bash
git add src/config/database.js tests/database.test.js tests/db-integration.test.js
git commit -m "feat: add SQLite database layer with user table"
```

---

## Task 3: 用户模型层

**Files:**
- Create: `src/models/User.js`
- Test: `tests/user-model.test.js`

### Step 1: 编写用户模型测试

Create `tests/user-model.test.js`:

```javascript
const User = require('../src/models/User');
const DatabaseConfig = require('../src/config/database');

describe('User Model', () => {
  let db;
  let userModel;

  beforeEach(() => {
    db = new DatabaseConfig(':memory:');
    userModel = new User(db);
  });

  afterEach(() => {
    db.close();
  });

  test('should find user by username', () => {
    db.createUser('testuser', 'hashed123');
    const user = userModel.findByUsername('testuser');
    expect(user.username).toBe('testuser');
  });

  test('should find user by id', () => {
    const result = db.createUser('testuser', 'hashed123');
    const user = userModel.findById(result.lastInsertRowid);
    expect(user.id).toBe(result.lastInsertRowid);
  });

  test('should create new user', () => {
    const result = userModel.create('newuser', 'newhash');
    expect(result.lastInsertRowid).toBeDefined();
  });

  test('should return undefined for non-existent user', () => {
    const user = userModel.findByUsername('nonexistent');
    expect(user).toBeUndefined();
  });
});
```

### Step 2: 运行测试验证失败

```bash
npm test -- tests/user-model.test.js
```

Expected: FAIL with "Cannot find module '../src/models/User'"

### Step 3: 实现用户模型

Create `src/models/User.js`:

```javascript
class User {
  constructor(db) {
    this.db = db;
  }

  findByUsername(username) {
    return this.db.getUserByUsername(username);
  }

  findById(id) {
    return this.db.getUserById(id);
  }

  create(username, passwordHash) {
    return this.db.createUser(username, passwordHash);
  }
}

module.exports = User;
```

### Step 4: 运行测试验证通过

```bash
npm test -- tests/user-model.test.js
```

Expected: 所有测试 PASS

### Step 5: 提交

```bash
git add src/models/User.js tests/user-model.test.js
git commit -m "feat: add User model layer"
```

---

## Task 4: 认证控制器

**Files:**
- Create: `src/controllers/authController.js`
- Test: `tests/auth-controller.test.js`

### Step 1: 编写控制器测试

Create `tests/auth-controller.test.js`:

```javascript
const authController = require('../src/controllers/authController');
const User = require('../src/models/User');
const DatabaseConfig = require('../src/config/database');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  let db;
  let userModel;
  let mockReq;
  let mockRes;
  let mockJson;
  let mockStatus;

  beforeEach(() => {
    db = new DatabaseConfig(':memory:');
    userModel = new User(db);

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
    mockReq = {
      body: {},
      session: {}
    };
  });

  afterEach(() => {
    db.close();
  });

  describe('register', () => {
    test('should register new user successfully', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };

      await authController.register(mockReq, mockRes, userModel);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User registered' })
      );
    });

    test('should return 400 if username exists', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      await authController.register(mockReq, mockRes, userModel);

      // Try to register again with same username
      await authController.register(mockReq, mockRes, userModel);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Username already exists' })
      );
    });

    test('should return 400 if password too short', async () => {
      mockReq.body = { username: 'testuser', password: '12' };

      await authController.register(mockReq, mockRes, userModel);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Password must be at least 3 characters' })
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Pre-create user for login tests
      mockReq.body = { username: 'testuser', password: 'password123' };
      await authController.register(mockReq, mockRes, userModel);
    });

    test('should login with valid credentials', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      mockReq.session = { userId: null };

      await authController.login(mockReq, mockRes, userModel);

      expect(mockReq.session.userId).toBeDefined();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should return 401 for invalid password', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };

      await authController.login(mockReq, mockRes, userModel);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid credentials' })
      );
    });

    test('should return 404 for non-existent user', async () => {
      mockReq.body = { username: 'nonexistent', password: 'password123' };

      await authController.login(mockReq, mockRes, userModel);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });
});
```

### Step 2: 运行测试验证失败

```bash
npm test -- tests/auth-controller.test.js
```

Expected: FAIL with "Cannot find module '../src/controllers/authController'"

### Step 3: 实现认证控制器

Create `src/controllers/authController.js`:

```javascript
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 3;

const authController = {
  async register(req, res, userModel) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        });
      }

      // Check if user exists
      const existingUser = userModel.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = userModel.create(username, passwordHash);

      res.status(201).json({
        success: true,
        message: 'User registered',
        userId: result.lastInsertRowid
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  },

  async login(req, res, userModel) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = userModel.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  },

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Logout failed'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    });
  },

  getSession(req, res) {
    if (req.session.userId) {
      res.status(200).json({
        success: true,
        user: {
          id: req.session.userId,
          username: req.session.username
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
  }
};

module.exports = authController;
```

### Step 4: 运行测试验证通过

```bash
npm test -- tests/auth-controller.test.js
```

Expected: 所有测试 PASS

### Step 5: 提交

```bash
git add src/controllers/authController.js tests/auth-controller.test.js
git commit -m "feat: add authentication controller with register and login"
```

---

## Task 5: 认证中间件

**Files:**
- Create: `src/middleware/auth.js`
- Test: `tests/auth-middleware.test.js`

### Step 1: 编写中间件测试

Create `tests/auth-middleware.test.js`:

```javascript
const requireAuth = require('../src/middleware/auth');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockJson;
  let mockStatus;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
    mockReq = {
      session: {}
    };
  });

  test('should call next for authenticated user', () => {
    mockReq.session = { userId: 1, username: 'testuser' };

    requireAuth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockStatus).not.toHaveBeenCalled();
  });

  test('should return 401 for unauthenticated user', () => {
    mockReq.session = {};

    requireAuth(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Authentication required' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 401 for null userId', () => {
    mockReq.session = { userId: null };

    requireAuth(mockReq, mockRes, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(401);
  });
});
```

### Step 2: 运行测试验证失败

```bash
npm test -- tests/auth-middleware.test.js
```

Expected: FAIL with "Cannot find module '../src/middleware/auth'"

### Step 3: 实现认证中间件

Create `src/middleware/auth.js`:

```javascript
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

module.exports = requireAuth;
```

### Step 4: 运行测试验证通过

```bash
npm test -- tests/auth-middleware.test.js
```

Expected: 所有测试 PASS

### Step 5: 提交

```bash
git add src/middleware/auth.js tests/auth-middleware.test.js
git commit -m "feat: add authentication middleware"
```

---

## Task 6: 路由层

**Files:**
- Create: `src/routes/auth.js`
- Test: `tests/auth-routes.test.js`

### Step 1: 编写路由测试

Create `tests/auth-routes.test.js`:

```javascript
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const DatabaseConfig = require('../src/config/database');
const User = require('../src/models/User');
const authController = require('../src/controllers/authController');

function createApp() {
  const app = express();
  const db = new DatabaseConfig(':memory:');
  const userModel = new User(db);

  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Routes
  app.post('/api/auth/register', (req, res) =>
    authController.register(req, res, userModel)
  );
  app.post('/api/auth/login', (req, res) =>
    authController.login(req, res, userModel)
  );
  app.post('/api/auth/logout', (req, res) =>
    authController.logout(req, res)
  );
  app.get('/api/auth/session', (req, res) =>
    authController.getSession(req, res)
  );

  return { app, db };
}

describe('Auth Routes', () => {
  test('should register new user', async () => {
    const { app, db } = createApp();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' })
      .expect(201);

    expect(response.body.success).toBe(true);
    db.close();
  });

  test('should login with valid credentials', async () => {
    const { app, db } = createApp();

    // Register first
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    // Then login
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    db.close();
  });

  test('should reject invalid credentials', async () => {
    const { app, db } = createApp();

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' })
      .expect(401);

    db.close();
  });

  test('should get session after login', async () => {
    const { app, db } = createApp();
    const agent = request.agent(app);

    await agent
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    await agent
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    const response = await agent
      .get('/api/auth/session')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user.username).toBe('testuser');
    db.close();
  });

  test('should reject session check for unauthenticated', async () => {
    const { app, db } = createApp();

    await request(app)
      .get('/api/auth/session')
      .expect(401);

    db.close();
  });
});
```

### Step 2: 运行测试验证失败

```bash
npm test -- tests/auth-routes.test.js
```

Expected: FAIL (路由文件不存在)

### Step 3: 实现路由文件

Create `src/routes/auth.js`:

```javascript
const express = require('express');
const authController = require('../controllers/authController');
const User = require('../models/User');
const DatabaseConfig = require('../config/database');

const router = express.Router();

// Initialize database and user model
const db = new DatabaseConfig();
const userModel = new User(db);

router.post('/register', (req, res) => {
  authController.register(req, res, userModel);
});

router.post('/login', (req, res) => {
  authController.login(req, res, userModel);
});

router.post('/logout', (req, res) => {
  authController.logout(req, res);
});

router.get('/session', (req, res) => {
  authController.getSession(req, res);
});

module.exports = router;
```

### Step 4: 运行测试验证通过

```bash
npm test -- tests/auth-routes.test.js
```

Expected: 所有测试 PASS

### Step 5: 提交

```bash
git add src/routes/auth.js tests/auth-routes.test.js
git commit -m "feat: add authentication routes"
```

---

## Task 7: 应用入口

**Files:**
- Create: `src/app.js`
- Create: `src/server.js`
- Create: `.env.example`

### Step 1: 创建 Express 应用

Create `src/app.js`:

```javascript
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/auth');
const DatabaseConfig = require('./config/database');

// Initialize database
const db = new DatabaseConfig(path.join(__dirname, '../data/app.db'));

function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session configuration
  app.use(session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: path.join(__dirname, '../data/sessions')
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Routes
  app.use('/api/auth', authRoutes);

  // Protected route example
  app.get('/api/protected', requireAuth, (req, res) => {
    res.json({
      success: true,
      message: 'Access granted',
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

module.exports = { createApp, db };
```

### Step 2: 创建服务器入口

Create `src/server.js`:

```javascript
const { createApp, db } = require('./app');

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.close();
  process.exit(0);
});
```

### Step 3: 创建环境变量示例

Create `.env.example`:

```bash
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-in-production
```

### Step 4: 创建数据目录

```bash
mkdir -p data data/sessions
```

### Step 5: 运行应用验证

```bash
npm start
```

Expected: 输出 "Server running on http://localhost:3000"

### Step 6: 提交

```bash
git add src/app.js src/server.js .env.example
git commit -m "feat: add Express app entry point and server"
```

---

## Task 8: 端到端测试

**Files:**
- Create: `tests/e2e.test.js`

### Step 1: 编写端到端测试

Create `tests/e2e.test.js`:

```javascript
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const DatabaseConfig = require('../src/config/database');
const User = require('../src/models/User');
const authController = require('../src/controllers/authController');
const requireAuth = require('../src/middleware/auth');

function createTestApp() {
  const app = express();
  const db = new DatabaseConfig(':memory:');
  const userModel = new User(db);

  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  app.post('/api/auth/register', (req, res) =>
    authController.register(req, res, userModel)
  );
  app.post('/api/auth/login', (req, res) =>
    authController.login(req, res, userModel)
  );
  app.post('/api/auth/logout', (req, res) =>
    authController.logout(req, res)
  );
  app.get('/api/auth/session', (req, res) =>
    authController.getSession(req, res)
  );
  app.get('/api/protected', requireAuth, (req, res) =>
    res.json({ success: true, data: 'protected content' })
  );

  return { app, db };
}

describe('End-to-End Authentication Flow', () => {
  test('complete user journey: register -> login -> access protected -> logout', async () => {
    const { app, db } = createTestApp();
    const agent = request.agent(app);

    // 1. Register
    const registerRes = await agent
      .post('/api/auth/register')
      .send({ username: 'e2euser', password: 'securepass123' });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    // 2. Login
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'e2euser', password: 'securepass123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user.username).toBe('e2euser');

    // 3. Access protected route
    const protectedRes = await agent
      .get('/api/protected');

    expect(protectedRes.status).toBe(200);
    expect(protectedRes.body.success).toBe(true);

    // 4. Logout
    const logoutRes = await agent
      .post('/api/auth/logout');

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // 5. Try to access protected route after logout
    const afterLogoutRes = await agent
      .get('/api/protected');

    expect(afterLogoutRes.status).toBe(401);

    db.close();
  });

  test('duplicate registration should fail', async () => {
    const { app, db } = createTestApp();

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'duplicateuser', password: 'password123' });

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'duplicateuser', password: 'password456' });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);

    db.close();
  });

  test('weak password should be rejected', async () => {
    const { app, db } = createTestApp();

    const weakRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'weakuser', password: 'ab' });

    expect(weakRes.status).toBe(400);
    expect(weakRes.body.message).toContain('Password must be at least');

    db.close();
  });
});
```

### Step 2: 运行端到端测试

```bash
npm test -- tests/e2e.test.js
```

Expected: 所有测试 PASS

### Step 3: 运行全部测试并检查覆盖率

```bash
npm test
```

Expected: 所有测试 PASS，覆盖率 > 80%

### Step 4: 提交

```bash
git add tests/e2e.test.js
git commit -m "test: add end-to-end authentication tests"
```

---

## Task 9: 文档和清理

**Files:**
- Create: `README.md`
- Create: `.env`
- Modify: `.gitignore`

### Step 1: 创建项目文档

Create `README.md`:

```markdown
# User Login API

基于 Node.js Express 的基础用户登录系统。

## 功能

- 用户注册
- 用户登录
- 会话管理
- 受保护的路由

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置会话密钥。

### 启动服务器

```bash
npm start
```

服务器将在 http://localhost:3000 启动。

## API 端点

### POST /api/auth/register

注册用户。

**请求体:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应 (201):**
```json
{
  "success": true,
  "message": "User registered",
  "userId": 1
}
```

### POST /api/auth/login

用户登录。

**请求体:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应 (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

### POST /api/auth/logout

用户登出。

**响应 (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET /api/auth/session

获取当前会话。

**响应 (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

### GET /api/protected

受保护的路由示例（需要登录）。

**响应 (401 if not authenticated):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

## 运行测试

```bash
npm test
```

## 项目结构

```
├── src/
│   ├── config/
│   │   └── database.js      # SQLite 数据库配置
│   ├── controllers/
│   │   └── authController.js # 认证控制器
│   ├── middleware/
│   │   └── auth.js          # 认证中间件
│   ├── models/
│   │   └── User.js          # 用户模型
│   ├── routes/
│   │   └── auth.js          # 认证路由
│   ├── app.js               # Express 应用配置
│   └── server.js            # 服务器入口
├── tests/
│   ├── auth-controller.test.js
│   ├── auth-middleware.test.js
│   ├── auth-routes.test.js
│   ├── auth.test.js
│   ├── database.test.js
│   ├── db-integration.test.js
│   ├── e2e.test.js
│   └── user-model.test.js
├── data/                    # 数据库和会话存储
├── package.json
└── README.md
```

## 安全注意事项

- 密码使用 bcrypt 加密
- 会话 Cookie 设置 httpOnly
- 生产环境请更改 SESSION_SECRET
- 密码最少 3 个字符（可根据需求调整）
```

### Step 2: 更新 .gitignore

Add to `.gitignore`:

```bash
# Node.js
node_modules/
dist/

# Environment
.env

# Database
*.db
*.db-journal
data/

# Sessions
sessions/

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
```

### Step 3: 创建默认 .env 文件

Create `.env`:

```bash
PORT=3000
NODE_ENV=development
SESSION_SECRET=dev-secret-key-please-change-in-production
```

### Step 4: 运行最终测试验证

```bash
npm test
```

Expected: 所有测试 PASS

### Step 5: 最终提交

```bash
git add README.md .gitignore .env
git commit -m "docs: add project documentation and update gitignore"
```

---

## 总结

本计划实现了完整的用户登录功能，包括：

1. **数据库层** - SQLite 存储用户数据
2. **模型层** - User 模型封装数据访问
3. **控制器层** - 处理注册、登录、登出逻辑
4. **中间件层** - 认证中间件保护路由
5. **路由层** - RESTful API 端点
6. **测试层** - 单元测试 + 端到端测试，覆盖率 > 80%

所有代码遵循 TDD 流程，频繁提交，每个功能都有对应的测试覆盖。
