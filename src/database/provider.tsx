'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import useSWR from 'swr';

export interface DBUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  cashBalance: number;
  portfolioValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  badgeIds: string[];
  watchlist: string[];
  themePreference: string;
}

interface DatabaseContextState {
  user: DBUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const DatabaseContext = createContext<DatabaseContextState | undefined>(undefined);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * DatabaseProvider manages user authentication state via NextAuth
 * and provides user data from MongoDB
 */
export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  
  // Fetch user data from MongoDB when authenticated
  const { data: userData, error } = useSWR<DBUser>(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30s deduping - prevent duplicate requests
      focusThrottleInterval: 60000, // 60s throttle - prevent constant revalidation
    }
  );

  const contextValue: DatabaseContextState = {
    user: userData || null,
    isUserLoading: isLoading || (!userData && !error && !!session),
    userError: error || null,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Root provider that wraps both SessionProvider and DatabaseProvider
 */
export const AppDatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SessionProvider>
      <DatabaseProvider>{children}</DatabaseProvider>
    </SessionProvider>
  );
};

/**
 * Hook to access user data and loading state
 */
export const useUser = () => {
  const context = useContext(DatabaseContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a DatabaseProvider');
  }
  
  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/**
 * Hook to access NextAuth session
 */
export const useAuth = () => {
  const { data: session, status } = useSession();
  return {
    session,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };
};

// SWR-based hooks for real-time data fetching
export const useDoc = <T,>(endpoint: string | null) => {
  const { data, error, mutate } = useSWR<T>(endpoint, fetcher);
  
  return {
    data,
    isLoading: !error && !data && !!endpoint,
    error,
    mutate,
  };
};

export const useCollection = <T,>(endpoint: string | null) => {
  const { data, error, mutate } = useSWR<T[]>(endpoint, fetcher);
  
  return {
    data: data || [],
    isLoading: !error && !data && !!endpoint,
    error,
    mutate,
  };
};

// Utility hook for memoizing values (replaces useMemoFirebase)
export const useMemoValue = <T,>(factory: () => T, deps: React.DependencyList): T => {
  return React.useMemo(factory, deps);
};
