import type { WalletRequest, WalletRequestType, CryptoMethod } from './types.js';
import { userStore } from '../users/store.js';
import { notificationStore } from '../notifications/store.js';

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
  private requests: WalletRequest[] = [];

  createDeposit(userId: string, userLabel: string, method: CryptoMethod, amount: number): WalletRequest {
    const request: WalletRequest = {
      id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      userLabel,
      type: 'deposit',
      method,
      amount,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    this.requests.push(request);
    return request;
  }

  createWithdrawal(userId: string, userLabel: string, method: CryptoMethod, amount: number, address: string): WalletRequest {
    userStore.adjustBalance(userId, -amount, false); // throws on insufficient balance — held pending review

    const request: WalletRequest = {
      id: `wr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      userLabel,
      type: 'withdrawal',
      method,
      amount,
      address,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    this.requests.push(request);
    return request;
  }

  approve(id: string): WalletRequest {
    const request = this.requests.find((r) => r.id === id);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request has already been resolved');

    request.status = 'approved';
    request.resolvedAt = new Date().toISOString();

    if (request.type === 'deposit') {
      userStore.adjustBalance(request.userId, request.amount, true);
      notificationStore.create(
        request.userId,
        'Deposit Successful',
        `Deposit of ${formatUsd(request.amount)} (${methodLabel[request.method]}) has been added to your balance.`
      );
    } else {
      notificationStore.create(
        request.userId,
        'Withdrawal Processed',
        `Your ${formatUsd(request.amount)} withdrawal (${methodLabel[request.method]}) has been approved and processed.`
      );
    }

    return request;
  }

  reject(id: string): WalletRequest {
    const request = this.requests.find((r) => r.id === id);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request has already been resolved');

    request.status = 'rejected';
    request.resolvedAt = new Date().toISOString();

    if (request.type === 'withdrawal') {
      userStore.adjustBalance(request.userId, request.amount, true);
      notificationStore.create(
        request.userId,
        'Withdrawal Rejected',
        `Your ${formatUsd(request.amount)} withdrawal request was rejected and the funds have been returned to your balance.`
      );
    }
    // Rejected deposits get no notification and no balance change — nothing happened.

    return request;
  }

  getAll(): WalletRequest[] {
    return [...this.requests].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  }

  getPending(): WalletRequest[] {
    return this.getAll().filter((r) => r.status === 'pending');
  }

  getForUser(userId: string): WalletRequest[] {
    return this.getAll().filter((r) => r.userId === userId);
  }

  getByType(type: WalletRequestType): WalletRequest[] {
    return this.getAll().filter((r) => r.type === type);
  }
}

export const walletRequestStore = new WalletRequestStore();
