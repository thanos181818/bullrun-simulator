'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { PortfolioCharts } from '@/components/portfolio/portfolio-charts';

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-8 animate-scale-in">
      <div className="stagger-fade-in stagger-1">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
          Portfolio
        </h1>
        <p className="text-muted-foreground/80 text-lg">
          Manage your investments and track performance in real-time
        </p>
      </div>
      <Tabs defaultValue="simulated" className="stagger-fade-in stagger-2">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] h-12 glass-card p-1.5">
          <TabsTrigger 
            value="simulated" 
            className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-semibold rounded-lg transition-all duration-200"
          >
            Simulated Mode
          </TabsTrigger>
          <TabsTrigger value="real" disabled className="opacity-40 cursor-not-allowed">
            Real Mode (Soon)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="simulated" className="mt-8">
          <div className="flex flex-col gap-8">
            <div className="stagger-fade-in stagger-3">
              <PortfolioCharts />
            </div>
            <Card className="stagger-fade-in stagger-4 hover-lift overflow-hidden group">
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border-b border-border/50">
                <CardTitle className="text-2xl font-bold">Your Holdings</CardTitle>
                <CardDescription className="text-base text-muted-foreground/70">
                  Current assets in your simulated portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 relative">
                <HoldingsTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
