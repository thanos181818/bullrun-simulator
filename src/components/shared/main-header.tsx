'use client';
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BullRunLogo } from '@/components/icons';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import { useSession, signOut } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function MainHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: userData } = useSWR(
    session?.user?.email ? `/api/users/${session.user.email}` : null,
    fetcher
  );

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <BullRunLogo className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold tracking-tight">BullRun</span>
      </div>
      <div className="relative ml-auto flex flex-1 items-center justify-end gap-2 md:grow-0">
        <LanguageSelector />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-accent/50"
            >
              <Avatar className='h-7 w-7'>
                <AvatarImage src={userData?.avatar || session?.user?.image || ''} alt={userData?.fullName || session?.user?.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {userData?.fullName?.charAt(0) || session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium">
                {userData?.fullName?.split(' ')[0] || session?.user?.name?.split(' ')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card">
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
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
