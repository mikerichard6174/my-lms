/**
 * LMS backend bootstrapper
 * ------------------------
 * This module configures a lightweight Express API that powers the proof-of-concept
 * learning management system. It exposes authentication routes, seeds the SQLite
 * datastore with demo roles/users, and publishes helpers for role-aware access
 * control. The inline documentation is intentionally exhaustive so future
 * contributors can trace how authentication, authorization, and persistence work
 * without reverse-engineering the code.
 */

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

// SQLite lives inside backend/data so local development never needs a separate
// database server. The directory is created lazily to avoid install-time issues.
const dataDirectory = path.resolve(__dirname, 'data');
fs.mkdirSync(dataDirectory, { recursive: true });
const dbFile = process.env.DB_PATH || path.join(dataDirectory, 'lms.db');
const db = new Database(dbFile);

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const TOKEN_TTL = process.env.JWT_TTL || '12h';

/**
 * bootstraps the relational schema and demo data.
 *
 * The LMS prototype relies on four roles and a handful of seed users so the
 * front-end portals (student, parent, teacher, admin) can demonstrate role-based
 * navigation immediately after `npm start`. This helper creates the tables if
 * they are missing and idempotently inserts demo rows.
 */
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

// Pre-compiled prepared statements minimise duplicated SQL strings and keep the
// rest of the code focused on business logic.
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

/**
 * Normalises raw database user rows into safe JSON payloads.
 * @param {import('better-sqlite3').RowObject} row
 * @returns {{id:number, username:string, email:string, displayName:string, role:string, permissions:string[], parentId:number|null}|null}
 */
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

/**
 * Generates a signed JWT for the authenticated user.
 * @param {{id:number, role:string, permissions:string[]}} user
 * @returns {string}
 */
function createToken(user) {
  return jwt.sign({
    sub: user.id,
    role: user.role,
    permissions: user.permissions
  }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/**
 * Express middleware that verifies incoming Bearer tokens and populates
 * `req.user` with the hydrated session user. Rejects missing or invalid tokens
 * with a 401 response.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
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

/**
 * Factory middleware that enforces role-based access control. Only users whose
 * role is present in `allowedRoles` can proceed past this middleware.
 * @param {string[]} allowedRoles
 * @returns {import('express').RequestHandler}
 */
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

/**
 * POST /api/auth/login
 * Authenticates a user by username or email and issues a signed JWT for
 * subsequent requests. Rejects mismatched role expectations so each portal can
 * enforce which audience is allowed to sign in from a specific form.
 */
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

/**
 * GET /api/auth/me
 * Returns the hydrated user payload tied to the supplied Bearer token. Used by
 * the front-end to resume sessions on refresh.
 */
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

/**
 * GET /api/roles
 * Public endpoint that lists all roles and their serialized permission scopes.
 * Enables admin tooling to populate dropdowns without requiring authentication.
 */
app.get('/api/roles', (req, res) => {
  const roles = statements.roles.all().map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: JSON.parse(role.permissions)
  }));
  res.json({ roles });
});

/**
 * GET /api/users/:id
 * Example of a protected administrative route that requires both a valid token
 * and the administrator role. Returns a sanitized user document on success.
 */
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
