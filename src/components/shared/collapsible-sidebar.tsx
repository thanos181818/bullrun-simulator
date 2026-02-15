'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import useSWR from 'swr';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, ChevronRight } from 'lucide-react';
import { BullRunLogo } from '@/components/icons';
import { NAV_ITEMS } from '@/lib/constants';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';

import { useTranslation } from '@/contexts/translation-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function CollapsibleSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: userData } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher
  );

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 flex">
      {/* Icon-only sidebar */}
      <div className="flex flex-col items-center gap-4 border-r border-border/20 bg-background/95 backdrop-blur-sm py-6 px-3 w-20 transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
          <BullRunLogo className="h-5 w-5 text-primary" />
        </Link>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-3 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 group relative ${
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent/50 text-foreground/70 hover:text-foreground'
              }`}
              title={item.title}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {item.icon}
              </span>
              {/* Tooltip on hover */}
              <span className="absolute left-16 px-2 py-1 bg-foreground text-background rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {item.title}
              </span>
            </Link>
          ))}
        </nav>

        {/* Theme & Language Toggle */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
          <div className="flex h-10 w-10 items-center justify-center hover:bg-accent/50 rounded-lg transition-colors group relative cursor-pointer">
            <LanguageSelector />
            <span className="absolute left-16 px-2 py-1 bg-foreground text-background rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Language
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center hover:bg-accent/50 rounded-lg transition-colors group relative cursor-pointer">
            <ThemeToggle />
            <span className="absolute left-16 px-2 py-1 bg-foreground text-background rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Theme
            </span>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent/50 transition-colors group relative">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userData?.avatar || session?.user?.image || ''} alt={userData?.fullName || session?.user?.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {userData?.fullName?.charAt(0) || session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute left-16 px-2 py-1 bg-foreground text-background rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Account
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="ml-2 w-56 glass-card">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-medium leading-none">{userData?.fullName || session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground/70">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{t('nav.profile')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('common.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group relative mt-auto border-t border-border/20 pt-2 w-full justify-center"
            title={t('common.logout')}
          >
            <LogOut className="h-5 w-5" />
            <span className="absolute left-16 px-2 py-1 bg-foreground text-background rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              {t('common.logout')}
            </span>
          </button>
      </div>

      {/* Expanded sidebar - shows on hover */}
      <div
        className={`hidden lg:flex flex-col w-64 border-r border-border/20 bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-md transition-all duration-300 transform ${
          isExpanded ? 'translate-x-0 opacity-100' : '-translate-x-full absolute top-0 left-20 opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header in expanded view */}
        <div className="flex items-center gap-3 border-b border-border/20 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BullRunLogo className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">BullRun</span>
        </div>

        {/* Navigation in expanded view */}
        <nav className="flex-1 space-y-2 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 group ${
                pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center flex-shrink-0">
                {item.icon}
              </span>
              <span className="text-sm font-medium truncate">{item.title}</span>
              {pathname === item.href && (
                <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer in expanded view */}
        <div className="space-y-2 border-t border-border/20 px-3 py-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent/30 transition-colors">
            <LanguageSelector />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent/30 transition-colors">
            <ThemeToggle />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-accent/30 transition-colors text-left">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={userData?.avatar || session?.user?.image || ''} alt={userData?.fullName || session?.user?.name || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {userData?.fullName?.charAt(0) || session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userData?.fullName?.split(' ')[0] || session?.user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">{session?.user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56 glass-card">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-medium leading-none">{userData?.fullName || session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground/70">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-4 py-2 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{t('common.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
