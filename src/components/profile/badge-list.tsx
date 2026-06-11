'use client';

import {
  Award,
  BookCheck,
  LucideProps,
  PocketKnife,
  TrendingUp,
  Library,
  Repeat,
  Gem,
  Bitcoin,
  Landmark,
  BrainCircuit,
  Rocket,
  Trophy,
  Flame,
  PieChart,
  Zap,
  Crown,
  Building2,
  Target,
  Wallet,
  BadgeDollarSign,
  Star,
  ZapOff,
  ShieldCheck,
  TrendingDown,
  Activity,
  BookOpen,
  GraduationCap,
  Lightbulb,
} from 'lucide-react';
import type { Badge } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import useSWR from 'swr';

interface BadgeListProps {
  userBadges: string[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const iconMap: { [key: string]: React.FC<LucideProps> } = {
  PocketKnife,
  TrendingUp,
  BookCheck,
  Award,
  Library,
  Repeat,
  Gem,
  Bitcoin,
  Landmark,
  BrainCircuit,
  Rocket,
  Trophy,
  Flame,
  PieChart,
  Zap,
  Crown,
  Building2,
  Target,
  Wallet,
  BadgeDollarSign,
  Star,
  ZapOff,
  ShieldCheck,
  TrendingDown,
  Activity,
  BookOpen,
  GraduationCap,
  Lightbulb,
};

export function BadgeList({ userBadges }: BadgeListProps) {
  const { data: badges, isLoading } = useSWR<Badge[]>('/api/badges', fetcher);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Badges</CardTitle>
                <CardDescription>Achievements you've unlocked on your trading journey.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-28 rounded-lg" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Badges</CardTitle>
        <CardDescription>
          Achievements you've unlocked on your trading journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badges && badges.length > 0 ? (
          <TooltipProvider>
            <div className="flex flex-wrap gap-4">
              {badges.map((badge) => {
                const hasBadge = userBadges.includes(badge.id);
                const Icon = iconMap[badge.icon] || PocketKnife;
                
                const rarityColors: Record<string, string> = {
                  common: 'text-blue-500',
                  rare: 'text-emerald-500',
                  epic: 'text-purple-500',
                  legendary: 'text-amber-500',
                };

                const rarityBg: Record<string, string> = {
                  common: 'bg-blue-500/10 border-blue-500/30',
                  rare: 'bg-emerald-500/10 border-emerald-500/30',
                  epic: 'bg-purple-500/10 border-purple-500/30',
                  legendary: 'bg-amber-500/10 border-amber-500/30',
                };

                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex w-28 flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-300',
                          hasBadge
                            ? cn(rarityBg[badge.rarity] || 'border-primary/50 bg-primary/10', 'scale-105 shadow-sm')
                            : 'border-dashed opacity-40 grayscale'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-8 w-8',
                            hasBadge 
                              ? (rarityColors[badge.rarity] || 'text-primary') 
                              : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs font-bold uppercase tracking-tight',
                            hasBadge 
                              ? (rarityColors[badge.rarity] || 'text-primary') 
                              : 'text-muted-foreground'
                          )}
                        >
                          {badge.title}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="max-w-xs p-3 bg-popover border border-border shadow-xl z-[100]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-base text-foreground">{badge.title}</p>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border font-bold uppercase",
                            rarityBg[badge.rarity] || "bg-primary/10",
                            rarityColors[badge.rarity] || "text-primary"
                          )}>
                            {badge.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {badge.description}
                        </p>
                        {!hasBadge && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                              <ZapOff className="h-3 w-3" /> Not earned yet
                            </p>
                          </div>
                        )}
                        {hasBadge && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Achievement Unlocked
                            </p>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        ) : (
          <p className="text-muted-foreground">
            No badges available yet. Keep trading and learning!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
