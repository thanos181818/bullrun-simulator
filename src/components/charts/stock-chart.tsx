
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PriceData } from '@/lib/types';

type Duration = '6H' | '1D' | '1W' | '1M' | '1Y' | '5Y' | 'ALL';

interface StockChartProps {
  data: PriceData[];
  isPositive: boolean;
  duration: Duration;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-background/90 p-2 shadow-lg">
        <p className="label font-bold">
          {new Date(label).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
          })}
        </p>
        <p className="intro text-foreground">
          Price: {payload[0].value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })}
        </p>
      </div>
    );
  }

  return null;
};

export function StockChart({ data, isPositive, duration }: StockChartProps) {
  const lineChartColor = isPositive ? '#238636' : '#DA3633'; // green or red

  const formatXAxis = (tickItem: number) => {
    switch (duration) {
      case '6H':
      case '1D':
        return new Date(tickItem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1W':
      case '1M':
        return new Date(tickItem).toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1Y':
      case '5Y':
      case 'ALL':
        return new Date(tickItem).toLocaleDateString([], { year: 'numeric', month: 'short' });
      default:
        return new Date(tickItem).toLocaleDateString();
    }
  };

  const formatYAxis = (tickItem: number) => `$${tickItem.toFixed(2)}`;
  
  if (!data || data.length === 0) {
    return <div>Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="time"
          tickFormatter={formatXAxis}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatYAxis}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          orientation="left"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke={lineChartColor}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
