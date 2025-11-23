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
import { useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface BadgeListProps {
  userBadges: string[];
}

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
};

export function BadgeList({ userBadges }: BadgeListProps) {
  const firestore = useFirestore();

  const badgesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'badges'));
  }, [firestore]);

  const { data: badges, isLoading } = useCollection<Omit<Badge, 'icon'>>(badgesQuery);

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
                const Icon = iconMap[badge.iconName] || PocketKnife;
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex w-28 flex-col items-center gap-2 rounded-lg border p-4 text-center',
                          hasBadge
                            ? 'border-primary/50 bg-primary/10'
                            : 'border-dashed opacity-40'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-8 w-8',
                            hasBadge ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            hasBadge ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {badge.title}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{badge.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {badge.description}
                      </p>
                      {!hasBadge && (
                        <p className="mt-1 text-xs text-destructive">
                          (Not earned yet)
                        </p>
                      )}
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
