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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Portfolio</h1>
      <Tabs defaultValue="simulated">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="simulated">Simulated Mode</TabsTrigger>
          <TabsTrigger value="real" disabled>Real Mode (Coming Soon)</TabsTrigger>
        </TabsList>
        <TabsContent value="simulated" className="mt-4">
          <div className="flex flex-col gap-6">
            <PortfolioCharts />
            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
                <CardDescription>
                  Your current assets in the simulated portfolio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HoldingsTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
