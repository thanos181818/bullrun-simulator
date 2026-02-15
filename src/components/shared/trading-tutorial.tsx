'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface TutorialStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export function TradingTutorial() {
  const { data: session } = useSession();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const steps: TutorialStep[] = [
    {
      target: 'body',
      title: 'Welcome to Your Trading Journey! 🚀',
      content: "Let's take a quick tour to help you get started with paper trading. You'll learn the basics in just 60 seconds!",
      placement: 'center',
    },
    {
      target: '[data-tour="market-overview"]',
      title: '📊 Market Overview',
      content: 'See real-time market data, trending stocks, and crypto prices. This is your command center for market insights.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="watchlist"]',
      title: '⭐ Your Watchlist',
      content: 'Track your favorite assets here. Click the star icon on any asset to add it. Quick access to what matters most to you!',
      placement: 'top',
    },
    {
      target: '[data-tour="portfolio-nav"]',
      title: '💼 Your Portfolio',
      content: 'View all your holdings, track performance, and see your profit/loss. This is where you monitor your trading success!',
      placement: 'right',
    },
    {
      target: '[data-tour="balance"]',
      title: '💰 Balance & Rewards',
      content: 'Check your account balance and claim daily bonuses. Come back every day for streak rewards!',
      placement: 'right',
    },
    {
      target: 'body',
      title: "You're All Set! 🎉",
      content: 'Ready to start trading? Press T anytime to quick-trade, or ? to see all keyboard shortcuts. Happy trading! Remember, this is paper money - practice risk-free! 📈',
      placement: 'center',
    },
  ];

  useEffect(() => {
    if (session?.user?.email) {
      const hasCompletedTutorial = localStorage.getItem(`tutorial_completed_${session.user.email}`);
      
      if (!hasCompletedTutorial) {
        const timer = setTimeout(() => {
          setIsActive(true);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [session]);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      const target = document.querySelector(step.target);

      if (!target || step.placement === 'center') {
        setPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
        // For center placement, scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const rect = target.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (step.placement) {
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'top':
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
      }

      setPosition({ top, left });
      
      // Scroll element into view with offset for the tooltip
      const scrollOffset = step.placement === 'top' ? -150 : -100;
      const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition + scrollOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (session?.user?.email) {
      localStorage.setItem(`tutorial_completed_${session.user.email}`, 'true');
    }
    setIsActive(false);
  };

  const handleComplete = () => {
    if (session?.user?.email) {
      localStorage.setItem(`tutorial_completed_${session.user.email}`, 'true');
    }
    setIsActive(false);
  };

  if (!isActive || !session?.user?.email) return null;

  const step = steps[currentStep];
  const isCentered = step.placement === 'center';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-[9998]" />

      {/* Spotlight */}
      {!isCentered && step.target !== 'body' && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            transition: 'all 0.3s ease',
          }}
        >
          {(() => {
            const target = document.querySelector(step.target);
            if (!target) return null;
            const rect = target.getBoundingClientRect();
            return (
              <div
                className="absolute rounded-lg"
                style={{
                  top: rect.top - 4,
                  left: rect.left - 4,
                  width: rect.width + 8,
                  height: rect.height + 8,
                  border: '2px solid hsl(var(--primary))',
                  animation: 'pulse 2s infinite',
                }}
              />
            );
          })()}
        </div>
      )}

      {/* Tutorial Card */}
      <div
        className={`fixed z-[10000] ${
          isCentered
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : ''
        }`}
        style={
          !isCentered
            ? {
                top: position.top,
                left: position.left,
                transform:
                  step.placement === 'bottom' || step.placement === 'top'
                    ? 'translateX(-50%)'
                    : step.placement === 'right' || step.placement === 'left'
                    ? 'translateY(-50%)'
                    : 'none',
              }
            : {}
        }
      >
        <div className="bg-card border border-border rounded-xl p-6 shadow-2xl max-w-md w-[400px] animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {step.title}
            </h3>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">{step.content}</p>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  Back
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1 justify-center mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}
