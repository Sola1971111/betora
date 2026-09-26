import { pool } from '../db/pool.js';
import type { VirtualBet, VirtualBetSelection } from './types.js';

interface VirtualBetRow {
  id: string;
  matchday_id: string;
  matchday_round: number;
  user_id: string;
  user_label: string;
  type: 'single' | 'multiple';
  selections: VirtualBetSelection[];
  combined_odds: string;
  stake: string;
  potential_win: string;
  placed_at: Date;
  status: 'pending' | 'won' | 'lost';
  settled_at: Date | null;
}

function toBet(row: VirtualBetRow): VirtualBet {
  return {
    id: row.id,
    matchdayId: row.matchday_id,
    matchdayRound: row.matchday_round,
    userId: row.user_id,
    userLabel: row.user_label,
    type: row.type,
    selections: row.selections,
    combinedOdds: Number(row.combined_odds),
    stake: Number(row.stake),
    potentialWin: Number(row.potential_win),
    placedAt: row.placed_at.toISOString(),
    status: row.status,
    settledAt: row.settled_at?.toISOString(),
  };
}

class VirtualBetStore {
  async create(bet: VirtualBet): Promise<VirtualBet> {
    const result = await pool.query<VirtualBetRow>(
      `INSERT INTO virtual_bets
        (id, matchday_id, matchday_round, user_id, user_label, type, selections, combined_odds, stake, potential_win, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING *`,
      [
        bet.id,
        bet.matchdayId,
        bet.matchdayRound,
        bet.userId,
        bet.userLabel,
        bet.type,
        JSON.stringify(bet.selections),
        bet.combinedOdds,
        bet.stake,
        bet.potentialWin,
      ]
    );
    return toBet(result.rows[0]);
  }

  async getPendingForMatchday(matchdayId: string): Promise<VirtualBet[]> {
    const result = await pool.query<VirtualBetRow>(
      `SELECT * FROM virtual_bets WHERE matchday_id = $1 AND status = 'pending'`,
      [matchdayId]
    );
    return result.rows.map(toBet);
  }

  async settle(id: string, status: 'won' | 'lost'): Promise<void> {
    await pool.query(`UPDATE virtual_bets SET status = $1, settled_at = now() WHERE id = $2`, [status, id]);
  }

  async getForUser(userId: string): Promise<VirtualBet[]> {
    const result = await pool.query<VirtualBetRow>(
      'SELECT * FROM virtual_bets WHERE user_id = $1 ORDER BY placed_at DESC',
      [userId]
    );
    return result.rows.map(toBet);
  }

  async getAll(): Promise<VirtualBet[]> {
    const result = await pool.query<VirtualBetRow>('SELECT * FROM virtual_bets ORDER BY placed_at DESC');
    return result.rows.map(toBet);
  }

  async getUserSummaries(): Promise
    { userId: string; userLabel: string; betCount: number; totalStaked: number; totalWon: number }[]
  > {
    const result = await pool.query<{
      user_id: string;
      user_label: string;
      bet_count: string;
      total_staked: string;
      total_won: string;
    }>(
      `SELECT
         user_id,
         MAX(user_label) AS user_label,
         COUNT(*) AS bet_count,
         COALESCE(SUM(stake), 0) AS total_staked,
         COALESCE(SUM(potential_win) FILTER (WHERE status = 'won'), 0) AS total_won
       FROM virtual_bets
       GROUP BY user_id`
    );
    return result.rows.map((r) => ({
      userId: r.user_id,
      userLabel: r.user_label,
      betCount: Number(r.bet_count),
      totalStaked: Number(r.total_staked),
      totalWon: Number(r.total_won),
    }));
  }
}

export const virtualBetStore = new VirtualBetStore();