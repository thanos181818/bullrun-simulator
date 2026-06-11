'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function TradingTutorial() {
  const { data: session } = useSession();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (session && !sessionStorage.getItem('welcomeSeen')) {
      setIsActive(true);
      sessionStorage.setItem('welcomeSeen', 'true');
    }
  }, [session]);

  const handleClose = () => setIsActive(false);

  const handleDownloadGuide = () => {
    // PDF download — to be wired up
    console.log('Download guide clicked');
  };

  if (!isActive) return null;

  return (
    <Dialog open={isActive} onOpenChange={setIsActive}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border border-border/50 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">

        {/* ── Header ─────────────────────────────────── */}
        <div className="relative bg-primary px-10 pt-12 pb-10 overflow-hidden">
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(to right,#ffffff18 1px,transparent 1px),linear-gradient(to bottom,#ffffff18 1px,transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          {/* Soft glow blob */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              BullRun Trading Simulator
            </p>
            <h1 className="text-primary-foreground text-4xl font-extrabold tracking-tight leading-tight">
              Welcome aboard.
            </h1>
          </div>
        </div>

        {/* ── Accent bar ─────────────────────────────── */}
        <div className="h-[3px] bg-gradient-to-r from-primary via-accent to-transparent" />

        {/* ── Body ───────────────────────────────────── */}
        <div className="px-10 py-8 bg-background space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We have put together a comprehensive guide that walks you through every
            feature, from placing your first trade to reading market charts and
            earning badges. Download it to keep as a reference while you explore.
          </p>

          {/* ── Buttons ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 h-11 font-semibold text-sm rounded-lg shadow-sm"
              onClick={handleDownloadGuide}
            >
              Download Guide
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 font-semibold text-sm rounded-lg border-border/60"
              onClick={handleClose}
            >
              Start Trading
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 pt-1">
            You can revisit the guide anytime from the Rule Book in the sidebar.
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
