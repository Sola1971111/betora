export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'winnings' | 'bonus';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface StoredTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  method?: string;
  description: string;
  amount: number; // negative for outgoing
  status: TransactionStatus;
  date: string;
  walletRequestId?: string;
}
