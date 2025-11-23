'use client';

import { BullRunLogo } from '@/components/icons';
import {
  TrendingUp,
  CandlestickChart,
  Bitcoin,
  Landmark,
  Wallet,
  BrainCircuit,
} from 'lucide-react';

export function AuthVisualPanel() {
  const icons = [
    { Icon: TrendingUp, className: 'top-[15%] left-[20%] h-8 w-8 animate-float-1' },
    { Icon: CandlestickChart, className: 'top-[30%] left-[80%] h-10 w-10 animate-float-2' },
    { Icon: Bitcoin, className: 'top-[70%] left-[10%] h-9 w-9 animate-float-3' },
    { Icon: Landmark, className: 'top-[85%] left-[60%] h-7 w-7 animate-float-4' },
    { Icon: Wallet, className: 'top-[5%] left-[55%] h-6 w-6 opacity-75 animate-float-2' },
    { Icon: BrainCircuit, className: 'top-[50%] left-[45%] h-12 w-12 opacity-50 animate-float-1' },
  ];

  return (
    <div className="relative hidden h-full items-center justify-center overflow-hidden bg-primary/95 lg:flex">
      {/* Background shapes */}
      <div className="absolute inset-0 z-0">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>
      
      {/* Animated Icons */}
      {icons.map(({ Icon, className }, index) => (
        <Icon key={index} className={`absolute text-primary-foreground/20 ${className}`} />
      ))}
      
      {/* Content */}
      <div className="relative z-10 text-center text-primary-foreground">
        <div className="flex justify-center">
            <BullRunLogo className="h-20 w-20 mb-6" />
        </div>
        <h1 className="text-3xl font-bold">Master the market, risk-free.</h1>
        <p className="mt-2 text-base text-primary-foreground/80">
          Learn, trade, and conquer the financial world in our simulated environment.
        </p>
      </div>
    </div>
  );
}
