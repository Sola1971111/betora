export type WalletRequestType = 'deposit' | 'withdrawal';
export type WalletRequestStatus = 'pending' | 'approved' | 'rejected';
export type CryptoMethod = 'bitcoin' | 'usdt' | 'ethereum' | 'solana';

export interface WalletRequest {
  id: string;
  userId: string;
  userLabel: string;
  type: WalletRequestType;
  method: CryptoMethod;
  amount: number;
  address?: string; // withdrawal destination — not applicable to deposits
  status: WalletRequestStatus;
  requestedAt: string;
  resolvedAt?: string;
}
