import { pool } from '../../src/config/db.js';
import bcrypt from 'bcryptjs';

export async function cleanDatabase() {
  await pool.query('TRUNCATE TABLE applications, verifications, documents, guarantors, profiles, property_photos, property_amenities, properties, users RESTART IDENTITY CASCADE');
}

export async function closeDatabase() {
  await pool.end();
}

export async function createTestUser({ email = 'test@test.com', password = '12345678', role = 'inquilino' } = {}) {
  const passwordHash = await bcrypt.hash(password, 4);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
    [email, passwordHash, role]
  );
  return { ...result.rows[0], plainPassword: password };
}

export async function createTestProfile(userId, overrides = {}) {
  const defaults = {
    first_name: 'Juan',
    last_name: 'Pérez',
    dni: '30123456',
    monthly_income: 500000,
  };
  const data = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO profiles (user_id, first_name, last_name, dni, monthly_income)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, data.first_name, data.last_name, data.dni, data.monthly_income]
  );
  return result.rows[0];
}

export async function createTestGuarantor(profileId, overrides = {}) {
  const defaults = {
    type: 'recibo_tercero',
    full_name: 'María García',
    email: 'garante@test.com',
  };
  const data = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO guarantors (profile_id, type, full_name, email)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [profileId, data.type, data.full_name, data.email]
  );
  return result.rows[0];
}

export async function createTestProperty(ownerId, overrides = {}) {
  const defaults = {
    title: 'Depto 2 ambientes en Centro',
    description: 'Luminoso, a metros del río',
    price: 250000,
    rooms: 2,
    address: 'San Martín 1234',
    status: 'published',
  };
  const data = { ...defaults, ...overrides };
  const result = await pool.query(
    `INSERT INTO properties (owner_id, title, description, price, rooms, address, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [ownerId, data.title, data.description, data.price, data.rooms, data.address, data.status]
  );
  return result.rows[0];
}
