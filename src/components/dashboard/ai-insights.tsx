
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';

export function AiInsights() {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  const handleGetInsights = async () => {
    setLoading(true);
    setError(null);
    setInsight('');

    if (!auth.currentUser) {
        setError('You must be logged in to get insights.');
        setLoading(false);
        return;
    }
    
    // Add Authorization header for server-side authentication
    const idToken = await auth.currentUser.getIdToken();
    const headers: HeadersInit = { 'Authorization': `Bearer ${idToken}` };

    // The action now needs to be called via fetch to the new API route
    try {
        const response = await fetch('/api/ai-insights-action', {
            method: 'POST',
            headers: headers
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
            setInsight(result.insights);
        }

    } catch (e: any) {
        setLoading(false);
        setError(e.message || 'An error occurred while fetching insights.');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          AI-Powered Trading Insights
        </CardTitle>
        <Wand2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Get personalized trading suggestions based on market data and your
            portfolio, powered by generative AI.
          </p>
          <Button
            onClick={handleGetInsights}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Insights
          </Button>
          {loading && (
            <div className="rounded-md border border-dashed border-border p-4">
              <p className="text-center text-sm text-muted-foreground">
                Analyzing market data and your portfolio...
              </p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {insight && (
            <div className="rounded-md bg-secondary/50 p-4 text-sm">
              <p className="leading-relaxed">{insight}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
