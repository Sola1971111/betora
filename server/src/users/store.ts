import { pool } from '../db/pool.js';
import type { PublicUser } from './types.js';

const STARTING_BALANCE = 0;

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password: string;
  balance: string; // numeric comes back as string from pg
  created_at: Date;
}

function toPublic(row: UserRow): PublicUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: row.created_at.toISOString(),
    balance: Number(row.balance),
  };
}

class UserStore {
  async signup(fullName: string, email: string, password: string): Promise<PublicUser> {
    const key = email.trim().toLowerCase();
    if (!fullName.trim()) throw new Error('Full name is required');
    if (!key) throw new Error('Email is required');
    if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');

    const existing = await pool.query<UserRow>('SELECT id FROM users WHERE email = $1', [key]);
    if (existing.rows.length > 0) throw new Error('An account with this email already exists');

    const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query<UserRow>(
      `INSERT INTO users (id, full_name, email, password, balance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, fullName.trim(), key, password, STARTING_BALANCE]
    );
    return toPublic(result.rows[0]);
  }

  async login(email: string, password: string): Promise<PublicUser> {
    const key = email.trim().toLowerCase();
    const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [key]);
    const row = result.rows[0];
    if (!row || row.password !== password) {
      throw new Error('Invalid email or password');
    }
    return toPublic(row);
  }

  async getById(id: string): Promise<PublicUser | null> {
    const result = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? toPublic(result.rows[0]) : null;
  }

  async getAll(): Promise<PublicUser[]> {
    const result = await pool.query<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(toPublic);
  }

  async getBalance(userId: string): Promise<number> {
    const result = await pool.query<UserRow>('SELECT balance FROM users WHERE id = $1', [userId]);
    if (!result.rows[0]) throw new Error('User not found');
    return Number(result.rows[0].balance);
  }

  async adjustBalance(userId: string, delta: number, allowNegative = false): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<UserRow>('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
      if (!current.rows[0]) throw new Error('User not found');

      const next = Math.round((Number(current.rows[0].balance) + delta) * 100) / 100;
      if (!allowNegative && next < 0) {
        throw new Error('Insufficient balance');
      }

      const updated = await client.query<UserRow>('UPDATE users SET balance = $1 WHERE id = $2 RETURNING balance', [
        next,
        userId,
      ]);
      await client.query('COMMIT');
      return Number(updated.rows[0].balance);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const userStore = new UserStore();