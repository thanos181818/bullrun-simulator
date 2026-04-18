
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wand2, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  PieChart, 
  Zap, 
  Target, 
  ArrowDownRight,
  TrendingDown,
  Activity,
  Lightbulb,
  ShieldAlert,
  LucideIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface InsightPoint {
  type: 'opportunity' | 'risk' | 'diversification' | 'performance';
  text: string;
  icon: string;
}

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  Zap,
  Target,
  ArrowDownRight,
  Activity,
  Lightbulb,
  ShieldAlert
};

const typeStyles = {
  opportunity: 'bg-green-500/10 text-green-500 border-green-500/20',
  risk: 'bg-red-500/10 text-red-500 border-red-500/20',
  diversification: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  performance: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export function AiInsights() {
  const [insights, setInsights] = useState<InsightPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleGetInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights([]);

    if (!session?.user) {
        setError('You must be logged in to get insights.');
        setLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/ai-insights-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok');
        }

        const result = await response.json();
        
        setLoading(false);

        if ('error' in result) {
            setError(result.error);
        } else {
            setInsights(result.insights);
        }

    } catch (e) {
        setLoading(false);
        setError(e instanceof Error ? e.message : 'An error occurred while fetching insights.');
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-accent/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary animate-pulse" />
          Quant AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time portfolio analysis and high-momentum opportunities identified by our quantitative model.
          </p>
          
          <Button
            onClick={handleGetInsights}
            disabled={loading}
            className="w-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Analyze Portfolio
          </Button>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 animate-pulse">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-muted-foreground">Synthesizing market data...</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          {insights.length > 0 && (
            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {insights.map((insight, idx) => {
                const Icon = iconMap[insight.icon] || Activity;
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md",
                      typeStyles[insight.type]
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {insight.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
