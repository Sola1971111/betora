import { GiSoccerBall, GiBasketballBall, GiTennisBall, GiVolleyballBall, GiPingPongBat } from 'react-icons/gi';
import { MdSportsMotorsports } from 'react-icons/md';
import type { IconType } from 'react-icons';

export const sportIcons: Record<string, IconType> = {
  football: GiSoccerBall,
  basketball: GiBasketballBall,
  tennis: GiTennisBall,
  volleyball: GiVolleyballBall,
  racing: MdSportsMotorsports,
  'table-tennis': GiPingPongBat,
};

export const sportColors: Record<string, string> = {
  football: '#16A34A',
  basketball: '#F59E0B',
  tennis: '#16A34A',
  volleyball: '#0F172A',
  racing: '#DC2626',
  'table-tennis': '#2563EB',
};
