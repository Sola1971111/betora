import { SiBitcoin, SiTether, SiEthereum, SiSolana } from 'react-icons/si';
import type { IconType } from 'react-icons';
import type { CryptoMethod } from '../types';

export interface CryptoMethodMeta {
  id: CryptoMethod;
  label: string;
  shortLabel: string;
  depositSubtitle: string;
  withdrawSubtitle: string;
  icon: IconType;
  iconColor: string;
  iconBg: string;
  addressPlaceholder: string;
}

export const CRYPTO_METHODS: CryptoMethodMeta[] = [
  {
    id: 'bitcoin',
    label: 'Bitcoin (BTC)',
    shortLabel: 'Bitcoin',
    depositSubtitle: 'Deposit using Bitcoin',
    withdrawSubtitle: 'Withdraw to a Bitcoin wallet',
    icon: SiBitcoin,
    iconColor: '#F7931A',
    iconBg: 'bg-[#F7931A]/10',
    addressPlaceholder: 'bc1...',
  },
  {
    id: 'usdt',
    label: 'Tether (USDT)',
    shortLabel: 'USDT',
    depositSubtitle: 'Deposit using USDT',
    withdrawSubtitle: 'Withdraw to a USDT wallet',
    icon: SiTether,
    iconColor: '#26A17B',
    iconBg: 'bg-[#26A17B]/10',
    addressPlaceholder: 'T... or 0x...',
  },
  {
    id: 'ethereum',
    label: 'Ethereum (ETH)',
    shortLabel: 'Ethereum',
    depositSubtitle: 'Deposit using Ethereum',
    withdrawSubtitle: 'Withdraw to an Ethereum wallet',
    icon: SiEthereum,
    iconColor: '#627EEA',
    iconBg: 'bg-[#627EEA]/10',
    addressPlaceholder: '0x...',
  },
  {
    id: 'solana',
    label: 'Solana (SOL)',
    shortLabel: 'Solana',
    depositSubtitle: 'Deposit using Solana',
    withdrawSubtitle: 'Withdraw to a Solana wallet',
    icon: SiSolana,
    iconColor: '#14F195',
    iconBg: 'bg-[#14F195]/10',
    addressPlaceholder: 'Solana address...',
  },
];

export function cryptoMethodMeta(method: string | undefined): CryptoMethodMeta {
  return CRYPTO_METHODS.find((m) => m.id === method) ?? CRYPTO_METHODS[0];
}
