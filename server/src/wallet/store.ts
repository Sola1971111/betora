import { pool } from '../db/pool.js';
import type { WalletRequest, WalletRequestType, CryptoMethod } from './types.js';
import { userStore } from '../users/store.js';
import { notificationStore } from '../notifications/store.js';

interface WalletRequestRow {
  id: string;
  user_id: string;
  user_label: string;
  type: WalletRequestType;
  method: CryptoMethod;
  amount: string;
  address: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
  resolved_at: Date | null;
}

function toWalletRequest(row: WalletRequestRow): WalletRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userLabel: row.user_label,
    type: row.type,
    method: row.method,
    amount: Number(row.amount),
    address: row.address ?? undefined,
    status: row.status,
    requestedAt: row.requested_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString(),
  };
}

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const methodLabel: Record<CryptoMethod, string> = {
  bitcoin: 'Bitcoin',
  usdt: 'USDT',
  ethereum: 'Ethereum',
  solana: 'Solana',
};

class WalletRequestStore {
  async createDeposit(userId: string, userLabel: string, method: CryptoMethod, amount: number): Promise<WalletRequest> {
    const id = `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query<WalletRequestRow>(
      `INSERT INTO wallet_requests (id, user_id, user_label, type, method, amount)
       VALUES ($1, $2, $3, 'deposit', $4, $5) RETURNING *`,
      [id, userId, userLabel, method, amount]
    );
    return toWalletRequest(result.rows[0]);
  }

  async createWithdrawal(
    userId: string,
    userLabel: string,
    method: CryptoMethod,
    amount: number,
    address: string
  ): Promise<WalletRequest> {
    await userStore.adjustBalance(userId, -amount, false);

    const id = `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query<WalletRequestRow>(
      `INSERT INTO wallet_requests (id, user_id, user_label, type, method, amount, address)
       VALUES ($1, $2, $3, 'withdrawal', $4, $5, $6) RETURNING *`,
      [id, userId, userLabel, method, amount, address]
    );
    return toWalletRequest(result.rows[0]);
  }

  async approve(id: string): Promise<WalletRequest> {
    const existing = await pool.query<WalletRequestRow>('SELECT * FROM wallet_requests WHERE id = $1', [id]);
    const request = existing.rows[0];
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request has already been resolved');

    const updated = await pool.query<WalletRequestRow>(
      `UPDATE wallet_requests SET status = 'approved', resolved_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    const resolved = toWalletRequest(updated.rows[0]);

    if (resolved.type === 'deposit') {
      await userStore.adjustBalance(resolved.userId, resolved.amount, true);
      await notificationStore.create(
        resolved.userId,
        'Deposit Successful',
        `Deposit of ${formatUsd(resolved.amount)} (${methodLabel[resolved.method]}) has been added to your balance.`
      );
    } else {
      await notificationStore.create(
        resolved.userId,
        'Withdrawal Processed',
        `Your ${formatUsd(resolved.amount)} withdrawal (${methodLabel[resolved.method]}) has been approved and processed.`
      );
    }

    return resolved;
  }

  async reject(id: string): Promise<WalletRequest> {
    const existing = await pool.query<WalletRequestRow>('SELECT * FROM wallet_requests WHERE id = $1', [id]);
    const request = existing.rows[0];
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request has already been resolved');

    const updated = await pool.query<WalletRequestRow>(
      `UPDATE wallet_requests SET status = 'rejected', resolved_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    const resolved = toWalletRequest(updated.rows[0]);

    if (resolved.type === 'withdrawal') {
      await userStore.adjustBalance(resolved.userId, resolved.amount, true);
      await notificationStore.create(
        resolved.userId,
        'Withdrawal Rejected',
        `Your ${formatUsd(resolved.amount)} withdrawal request was rejected and the funds have been returned to your balance.`
      );
    }

    return resolved;
  }

  async getAll(): Promise<WalletRequest[]> {
    const result = await pool.query<WalletRequestRow>('SELECT * FROM wallet_requests ORDER BY requested_at DESC');
    return result.rows.map(toWalletRequest);
  }

  async getPending(): Promise<WalletRequest[]> {
    const result = await pool.query<WalletRequestRow>(
      "SELECT * FROM wallet_requests WHERE status = 'pending' ORDER BY requested_at DESC"
    );
    return result.rows.map(toWalletRequest);
  }

  async getForUser(userId: string): Promise<WalletRequest[]> {
    const result = await pool.query<WalletRequestRow>(
      'SELECT * FROM wallet_requests WHERE user_id = $1 ORDER BY requested_at DESC',
      [userId]
    );
    return result.rows.map(toWalletRequest);
  }
}

export const walletRequestStore = new WalletRequestStore();