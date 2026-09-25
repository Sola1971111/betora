import type { PublicUser, StoredUser } from './types.js';

const STARTING_BALANCE = 0;

function toPublic(user: StoredUser): PublicUser {
  return { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt, balance: user.balance };
}

class UserStore {
  private usersByEmail = new Map<string, StoredUser>();
  private usersById = new Map<string, StoredUser>();

  signup(fullName: string, email: string, password: string): PublicUser {
    const key = email.trim().toLowerCase();
    if (!fullName.trim()) throw new Error('Full name is required');
    if (!key) throw new Error('Email is required');
    if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');
    if (this.usersByEmail.has(key)) throw new Error('An account with this email already exists');

    const user: StoredUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fullName: fullName.trim(),
      email: key,
      password,
      createdAt: new Date().toISOString(),
      balance: STARTING_BALANCE,
    };
    this.usersByEmail.set(key, user);
    this.usersById.set(user.id, user);
    return toPublic(user);
  }

  login(email: string, password: string): PublicUser {
    const key = email.trim().toLowerCase();
    const user = this.usersByEmail.get(key);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    return toPublic(user);
  }

  getById(id: string): PublicUser | null {
    const user = this.usersById.get(id);
    return user ? toPublic(user) : null;
  }

  getAll(): PublicUser[] {
    return Array.from(this.usersByEmail.values())
      .map(toPublic)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  getBalance(userId: string): number {
    const user = this.usersById.get(userId);
    if (!user) throw new Error('User not found');
    return user.balance;
  }

  /**
   * Adjusts a user's balance by a signed delta (positive = credit, negative
   * = debit). `allowNegative` controls whether the result may drop below
   * zero — user-initiated debits (bets, withdrawals) should never be
   * allowed to overdraw, but an admin correction may intentionally need to.
   * Returns the new balance.
   */
  adjustBalance(userId: string, delta: number, allowNegative = false): number {
    const user = this.usersById.get(userId);
    if (!user) throw new Error('User not found');
    const next = Math.round((user.balance + delta) * 100) / 100;
    if (!allowNegative && next < 0) {
      throw new Error('Insufficient balance');
    }
    user.balance = next;
    return next;
  }
}

export const userStore = new UserStore();
