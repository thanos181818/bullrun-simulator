'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, CrosshairMode, AreaSeries } from 'lightweight-charts';
import { useTheme } from 'next-themes';

interface LightweightChartProps {
  data: { time: number; value: number }[];
  isPositive: boolean;
  className?: string;
}

export function LightweightChart({ data, isPositive, className }: LightweightChartProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
  const { theme } = useTheme();

  React.useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const chartColor = isPositive ? '#22c55e' : '#ef4444'; // Tailwind green-500 / red-500

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
        horzLines: { color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: isDark ? '#1e293b' : '#64748b',
          style: LineStyle.Dashed,
        },
        horzLine: {
          labelBackgroundColor: isDark ? '#1e293b' : '#64748b',
          style: LineStyle.Dashed,
        },
      },
      handleScroll: false,
      handleScale: false,
      watermark: {
        visible: false,
      },
      attributionLogo: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: chartColor,
      topColor: `${chartColor}44`, // 44 is hex for ~25% opacity
      bottomColor: `${chartColor}00`,
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    // Lightweight charts expects time in seconds or string (YYYY-MM-DD)
    const formattedData = data.map(item => ({
      time: Math.floor(item.time / 1000) as any,
      value: item.value,
    })).sort((a, b) => a.time - b.time);

    series.setData(formattedData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, isPositive, theme]);

  return <div ref={chartContainerRef} className={`${className} lightweight-chart-container`} style={{ width: '100%', height: '100%' }} />;
}
