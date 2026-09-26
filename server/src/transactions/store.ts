import { pool } from '../db/pool.js';
import type { StoredTransaction, TransactionStatus, TransactionType } from './types.js';

interface TransactionRow {
  id: string;
  user_id: string;
  type: TransactionType;
  method: string | null;
  description: string;
  amount: string;
  status: TransactionStatus;
  date: Date;
  wallet_request_id: string | null;
}

function toStored(row: TransactionRow): StoredTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    method: row.method ?? undefined,
    description: row.description,
    amount: Number(row.amount),
    status: row.status,
    date: row.date.toISOString(),
    walletRequestId: row.wallet_request_id ?? undefined,
  };
}

class TransactionStore {
  async create(params: {
    userId: string;
    type: TransactionType;
    description: string;
    amount: number;
    status?: TransactionStatus;
    method?: string;
    walletRequestId?: string;
  }): Promise<StoredTransaction> {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await pool.query<TransactionRow>(
      `INSERT INTO transactions (id, user_id, type, method, description, amount, status, wallet_request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        params.userId,
        params.type,
        params.method ?? null,
        params.description,
        params.amount,
        params.status ?? 'completed',
        params.walletRequestId ?? null,
      ]
    );
    return toStored(result.rows[0]);
  }

  async updateStatusByWalletRequestId(walletRequestId: string, status: TransactionStatus): Promise<void> {
    await pool.query('UPDATE transactions SET status = $1 WHERE wallet_request_id = $2', [status, walletRequestId]);
  }

  async getForUser(userId: string): Promise<StoredTransaction[]> {
    const result = await pool.query<TransactionRow>(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    return result.rows.map(toStored);
  }
}

export const transactionStore = new TransactionStore();
