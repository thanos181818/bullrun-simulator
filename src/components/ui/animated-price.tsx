'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssetPriceStore, selectPrice, selectPriceDirection } from '@/stores/asset-price-store';
import { cn, formatCurrency } from '@/lib/utils';

interface AnimatedPriceProps {
  symbol: string;
  className?: string;
  showDirection?: boolean;
}

export function AnimatedPrice({ symbol, className, showDirection = false }: AnimatedPriceProps) {
  const price = useAssetPriceStore(selectPrice(symbol));
  const direction = useAssetPriceStore(selectPriceDirection(symbol));

  const [displayPrice, setDisplayPrice] = React.useState(price);
  const [flash, setFlash] = React.useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    if (price !== displayPrice) {
      if (price && displayPrice) {
        setFlash(price > displayPrice ? 'up' : 'down');
        const timer = setTimeout(() => setFlash(null), 800);
        setDisplayPrice(price);
        return () => clearTimeout(timer);
      }
      setDisplayPrice(price);
    }
  }, [price, displayPrice]);

  if (price === null) return <span className={cn("animate-pulse bg-muted rounded w-16 h-5", className)} />;

  return (
    <div className={cn("inline-flex items-center gap-1 font-mono", className)}>
      <div className="relative overflow-hidden h-[1.2em]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={price}
            initial={{ y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction === 'up' ? -20 : direction === 'down' ? 20 : 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "block transition-colors duration-500",
              flash === 'up' ? "text-green-500" : flash === 'down' ? "text-red-500" : ""
            )}
          >
            {formatCurrency(price)}
          </motion.span>
        </AnimatePresence>
      </div>
      {showDirection && direction !== 'flat' && (
        <span className={cn(
          "text-[10px] font-bold",
          direction === 'up' ? "text-green-500" : "text-red-500"
        )}>
          {direction === 'up' ? '▲' : '▼'}
        </span>
      )}
    </div>
  );
}
