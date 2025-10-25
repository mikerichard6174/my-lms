const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath, override: true });

const app = express();
app.use(cors());
app.use(express.json());

const dataDirectory = path.resolve(__dirname, 'data');
fs.mkdirSync(dataDirectory, { recursive: true });
const dbFile = process.env.DB_PATH || path.join(dataDirectory, 'lms.db');
const db = new Database(dbFile);

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const TOKEN_TTL = process.env.JWT_TTL || '12h';

function bootstrapSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      parent_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    );
  `);

  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
  if (roleCount === 0) {
    const insertRole = db.prepare('INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)');
    insertRole.run('student', 'Access to assigned courses, progress tracking, and daily schedule.', JSON.stringify([
      'view:student-dashboard',
      'view:lessons',
      'track:progress'
    ]));
    insertRole.run('parent', 'Oversight of linked students, goal setting, and scheduling controls.', JSON.stringify([
      'view:parent-dashboard',
      'manage:schedule',
      'manage:goals',
      'review:grades'
    ]));
    insertRole.run('teacher', 'Classroom level controls over assignments, pacing, and assessments.', JSON.stringify([
      'view:teacher-dashboard',
      'assign:lessons',
      'track:class-progress',
      'comment:feedback'
    ]));
    insertRole.run('administrator', 'Organization-wide management of curriculum, roles, and compliance.', JSON.stringify([
      'view:admin-dashboard',
      'manage:users',
      'configure:curriculum',
      'audit:reports'
    ]));
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const getRoleId = db.prepare('SELECT id FROM roles WHERE name = ?');
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, display_name, password_hash, role_id, parent_id)
      VALUES (@username, @email, @display_name, @password_hash, @role_id, @parent_id)
    `);

    const adminRole = getRoleId.get('administrator').id;
    const teacherRole = getRoleId.get('teacher').id;
    const parentRole = getRoleId.get('parent').id;
    const studentRole = getRoleId.get('student').id;

    const adminUser = {
      username: 'admin1',
      email: 'admin@example.com',
      display_name: 'District Admin',
      password_hash: bcrypt.hashSync('AdminPass123!', 12),
      role_id: adminRole,
      parent_id: null
    };

    const teacherUser = {
      username: 'teacher1',
      email: 'teacher@example.com',
      display_name: 'Ms. Carter',
      password_hash: bcrypt.hashSync('TeacherPass123!', 12),
      role_id: teacherRole,
      parent_id: null
    };

    const parentUser = {
      username: 'parent1',
      email: 'parent@example.com',
      display_name: 'Jordan Avery',
      password_hash: bcrypt.hashSync('ParentPass123!', 12),
      role_id: parentRole,
      parent_id: null
    };

    const student = {
      username: 'student1',
      email: 'student@example.com',
      display_name: 'Mia Avery',
      password_hash: bcrypt.hashSync('StudentPass123!', 12),
      role_id: studentRole,
      parent_id: null
    };

    const parentResult = insertUser.run(parentUser);
    student.parent_id = parentResult.lastInsertRowid;

    insertUser.run(adminUser);
    insertUser.run(teacherUser);
    insertUser.run(student);
  }
}

bootstrapSchema();

const statements = {
  roles: db.prepare('SELECT id, name, description, permissions FROM roles'),
  userByIdentifier: db.prepare(`
    SELECT users.*, roles.name as role_name, roles.permissions as role_permissions
    FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE username = ? OR email = ?
  `),
  userById: db.prepare(`
    SELECT users.*, roles.name as role_name, roles.permissions as role_permissions
    FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = ?
  `)
};

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    role: row.role_name,
    permissions: JSON.parse(row.role_permissions),
    parentId: row.parent_id
  };
}

function createToken(user) {
  return jwt.sign({
    sub: user.id,
    role: user.role,
    permissions: user.permissions
  }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userRow = statements.userById.get(payload.sub);
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    req.user = sanitizeUser(userRow);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.post('/api/auth/login', (req, res) => {
  const { identifier, password, expectedRole } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required.' });
  }
  const userRow = statements.userByIdentifier.get(identifier, identifier);
  if (!userRow) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const passwordValid = bcrypt.compareSync(password, userRow.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const user = sanitizeUser(userRow);
  if (expectedRole && user.role !== expectedRole) {
    return res.status(403).json({ error: `Account is registered as ${user.role}. Switch to the appropriate login panel.` });
  }
  const token = createToken(user);
  res.json({
    token,
    user
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/roles', (req, res) => {
  const roles = statements.roles.all().map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: JSON.parse(role.permissions)
  }));
  res.json({ roles });
});

app.get('/api/users/:id', authenticate, authorize(['administrator']), (req, res) => {
  const userRow = statements.userById.get(Number(req.params.id));
  if (!userRow) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: sanitizeUser(userRow) });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`LMS backend listening on port ${port}`);
});
