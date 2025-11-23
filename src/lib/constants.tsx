import type { NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  Wallet,
  BookOpen,
  CandlestickChart,
  Star,
  History,
} from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard size={20} />,
  },
  {
    title: 'Trade',
    href: '/trade',
    icon: <CandlestickChart size={20} />,
  },
  {
    title: 'Portfolio',
    href: '/portfolio',
    icon: <Wallet size={20} />,
  },
  {
    title: 'Watchlist',
    href: '/watchlist',
    icon: <Star size={20} />,
  },
  {
    title: 'History',
    href: '/history',
    icon: <History size={20} />,
  },
  {
    title: 'Learning',
    href: '/learning',
    icon: <BookOpen size={20} />,
  },
];

    