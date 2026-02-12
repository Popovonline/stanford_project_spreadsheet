'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { X, ChevronRight, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

// ─── Onboarding Step Definitions ────────────────────────────────────

interface OnboardingStep {
    id: string;
    type: 'dialog' | 'popover';
    title: string;
    body: string | React.ReactNode;
    targetSelector?: string;
    popoverSide?: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        type: 'dialog',
        title: 'Welcome to SheetForge!',
        body: "Let's take a quick tour of your new spreadsheet.",
    },
    {
        id: 'toolbar',
        type: 'popover',
        title: 'Your Toolbar',
        body: 'Format cells, undo/redo, import data, and toggle dark mode — all from here.',
        targetSelector: '.sf-toolbar',
        popoverSide: 'bottom',
    },
    {
        id: 'cell-editing',
        type: 'popover',
        title: 'Click & Type',
        body: 'Click any cell to select it, then start typing. Press Enter to confirm, or Escape to cancel.',
        targetSelector: '.sf-grid-container',
        popoverSide: 'right',
    },
    {
        id: 'formulas',
        type: 'popover',
        title: 'Powerful Formulas',
        body: (
            <span>
                Type <Kbd>=</Kbd> to start a formula. Try{' '}
                <code className="sf-onboarding-code">=SUM(A1:A3)</code> to add values. Click cells to insert references automatically!
            </span>
        ),
        targetSelector: '.sf-toolbar__formula-bar',
        popoverSide: 'bottom',
    },
    {
        id: 'shortcuts',
        type: 'popover',
        title: 'Navigate Like a Pro',
        body: (
            <div className="sf-onboarding-shortcuts">
                <div className="sf-onboarding-shortcut-row">
                    <Kbd>Tab</Kbd>
                    <span>→ Move right</span>
                </div>
                <div className="sf-onboarding-shortcut-row">
                    <Kbd>Enter</Kbd>
                    <span>→ Move down</span>
                </div>
                <div className="sf-onboarding-shortcut-row">
                    <Kbd>Arrow keys</Kbd>
                    <span>→ Navigate</span>
                </div>
                <div className="sf-onboarding-shortcut-row">
                    <Kbd>⌘Z</Kbd>
                    <span>→ Undo</span>
                </div>
                <div className="sf-onboarding-shortcut-row">
                    <Kbd>⌘C</Kbd> / <Kbd>⌘V</Kbd>
                    <span>→ Copy/Paste</span>
                </div>
            </div>
        ),
        targetSelector: '.sf-grid-container',
        popoverSide: 'right',
    },
    {
        id: 'sheets',
        type: 'popover',
        title: 'Multiple Sheets',
        body: (
            <span>
                Organize your data across sheets. Click <strong>+</strong> to add new ones, right-click to rename.
                Reference other sheets with <code className="sf-onboarding-code">=Sheet2!A1</code>
            </span>
        ),
        targetSelector: '.sf-sheet-tabs',
        popoverSide: 'top',
    },
    {
        id: 'theme',
        type: 'dialog',
        title: 'Choose Your Appearance',
        body: 'Select your preferred theme for SheetForge.',
    },
    {
        id: 'complete',
        type: 'dialog',
        title: "You're All Set!",
        body: 'You now know the essentials of SheetForge.',
    },
];

const TOTAL_STEPS = ONBOARDING_STEPS.length;
const STORAGE_KEY = 'onboarding_completed';

// ─── Spotlight Overlay ──────────────────────────────────────────────

function SpotlightOverlay({ targetRect }: { targetRect: DOMRect | null }) {
    if (!targetRect) {
        // Full dark overlay (for dialog steps)
        return <div className="sf-onboarding-overlay sf-onboarding-overlay--full" />;
    }

    // Spotlight with box-shadow hack
    const padding = 8;
    return (
        <div
            className="sf-onboarding-overlay sf-onboarding-overlay--spotlight"
            style={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
            }}
        />
    );
}

// ─── Step Dots ──────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        'block size-2 rounded-full transition-colors',
                        i === current && 'bg-primary',
                        i < current && 'bg-primary/60',
                        i > current && 'bg-muted-foreground/25'
                    )}
                />
            ))}
        </div>
    );
}

// ─── Popover Tooltip Card ───────────────────────────────────────────

function TooltipCard({
    step,
    stepIndex,
    targetRect,
    onNext,
    onSkip,
}: {
    step: OnboardingStep;
    stepIndex: number;
    targetRect: DOMRect;
    onNext: () => void;
    onSkip: () => void;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (!cardRef.current) return;
        const card = cardRef.current.getBoundingClientRect();
        const padding = 16;
        let top = 0;
        let left = 0;

        switch (step.popoverSide) {
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + targetRect.width / 2 - card.width / 2;
                break;
            case 'top':
                top = targetRect.top - card.height - padding;
                left = targetRect.left + targetRect.width / 2 - card.width / 2;
                break;
            case 'right':
                top = targetRect.top + targetRect.height / 2 - card.height / 2;
                left = targetRect.right + padding;
                break;
            case 'left':
                top = targetRect.top + targetRect.height / 2 - card.height / 2;
                left = targetRect.left - card.width - padding;
                break;
        }

        // Viewport clamping
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (left < 12) left = 12;
        if (left + card.width > vw - 12) left = vw - card.width - 12;
        if (top < 12) top = 12;
        if (top + card.height > vh - 12) top = vh - card.height - 12;

        setPos({ top, left });
    }, [targetRect, step.popoverSide]);

    return (
        <Card
            ref={cardRef}
            className="sf-onboarding-card !py-4 !gap-3"
            style={{ top: pos.top, left: pos.left }}
            role="dialog"
            aria-label={step.title}
        >
            <CardHeader className="!p-0 !px-5 !gap-1 flex flex-col">
                <CardTitle className="text-[15px]">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="!px-5 text-[13px] leading-relaxed text-muted-foreground">{step.body}</CardContent>
            <CardFooter className="!px-5 flex flex-col gap-3">
                <div className="sf-onboarding-card__progress">
                    <StepDots current={stepIndex} total={TOTAL_STEPS} />
                    <Badge variant="secondary" className="sf-onboarding-card__counter">
                        {stepIndex + 1} of {TOTAL_STEPS}
                    </Badge>
                </div>
                <div className="sf-onboarding-card__actions">
                    <Button variant="link" size="sm" onClick={onSkip}>
                        Skip tour
                    </Button>
                    <Button size="sm" onClick={onNext}>
                        Next <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

// ─── Welcome / Completion Dialog ────────────────────────────────────

function WelcomeDialog({
    stepIndex,
    onStart,
    onSkip,
}: {
    stepIndex: number;
    onStart: () => void;
    onSkip: () => void;
}) {
    return (
        <Card className="sf-onboarding-dialog !gap-4 !py-8 !px-8" role="dialog" aria-labelledby="onboarding-title">
            <CardHeader className="!p-0 flex flex-col items-center text-center gap-3">
                <div className="sf-toolbar__monogram sf-toolbar__monogram--large">SF</div>
                <CardTitle className="text-[22px] font-bold font-[var(--font-outfit,'Outfit',system-ui,sans-serif)]">
                    Welcome to SheetForge!
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-snug">
                    Let&apos;s take a quick tour of your new spreadsheet
                </CardDescription>
            </CardHeader>
            <CardContent className="!p-0 flex flex-col gap-2">
                <Button onClick={onStart} className="w-full py-5 text-sm font-semibold">
                    Start Tour
                </Button>
                <Button variant="link" onClick={onSkip} className="w-full text-muted-foreground text-[13px]">
                    Skip
                </Button>
            </CardContent>
            <CardFooter className="!p-0 flex flex-col items-center gap-1">
                <StepDots current={stepIndex} total={TOTAL_STEPS} />
                <Badge variant="secondary">1 of {TOTAL_STEPS}</Badge>
            </CardFooter>
        </Card>
    );
}

function CompletionDialog({
    stepIndex,
    onFinish,
}: {
    stepIndex: number;
    onFinish: () => void;
}) {
    return (
        <Card className="sf-onboarding-dialog !gap-4 !py-8 !px-8" role="dialog" aria-labelledby="onboarding-complete-title">
            <CardHeader className="!p-0 flex flex-col items-center text-center gap-2">
                <div className="text-5xl mb-1">🎉</div>
                <CardTitle className="text-[22px] font-bold font-[var(--font-outfit,'Outfit',system-ui,sans-serif)]">
                    You&apos;re All Set!
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-snug">
                    You now know the essentials of SheetForge
                </CardDescription>
            </CardHeader>
            <CardContent className="!p-0 flex flex-col items-center gap-4">
                <div className="flex gap-2 justify-center flex-wrap">
                    <Badge variant="secondary">Grid ✅</Badge>
                    <Badge variant="secondary">Formulas ✅</Badge>
                    <Badge variant="secondary">Navigation ✅</Badge>
                    <Badge variant="secondary">Sheets ✅</Badge>
                    <Badge variant="secondary">Theme ✅</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                    Restart tour from toolbar <Sparkles className="size-3.5 inline" /> icon anytime
                </p>
                <Button onClick={onFinish} className="w-full py-5 text-sm font-semibold">
                    Start Building
                </Button>
            </CardContent>
            <CardFooter className="!p-0 flex flex-col items-center gap-1">
                <StepDots current={stepIndex} total={TOTAL_STEPS} />
                <Badge variant="secondary">{TOTAL_STEPS} of {TOTAL_STEPS}</Badge>
            </CardFooter>
        </Card>
    );
}

// ─── Theme Selection Dialog (FR-309) ────────────────────────────────

function ThemeDialog({
    stepIndex,
    onNext,
    onSkip,
}: {
    stepIndex: number;
    onNext: () => void;
    onSkip: () => void;
}) {
    const { theme, setTheme } = useTheme();
    const currentTheme = theme === 'dark' ? 'dark' : 'light';

    return (
        <Card className="sf-onboarding-dialog !gap-4 !py-8 !px-8" role="dialog" aria-labelledby="onboarding-theme-title">
            <CardHeader className="!p-0 flex flex-col items-center text-center gap-2">
                <CardTitle className="text-[22px] font-bold font-[var(--font-outfit,'Outfit',system-ui,sans-serif)]">
                    Choose Your Appearance
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-snug">
                    Select your preferred theme for SheetForge
                </CardDescription>
            </CardHeader>

            <CardContent className="!p-0 flex flex-col items-center gap-4">
                <div className="sf-theme-picker">
                    <button
                        className={cn(
                            'sf-theme-picker__card',
                            currentTheme === 'light' && 'sf-theme-picker__card--active'
                        )}
                        onClick={() => setTheme('light')}
                        aria-pressed={currentTheme === 'light'}
                        type="button"
                    >
                        <div className="sf-theme-picker__preview sf-theme-picker__preview--light">
                            <div className="sf-theme-picker__preview-toolbar">
                                <div className="sf-theme-picker__preview-dot" />
                                <div className="sf-theme-picker__preview-dot" />
                                <div className="sf-theme-picker__preview-dot" />
                            </div>
                            <div className="sf-theme-picker__preview-grid">
                                <div className="sf-theme-picker__preview-row">
                                    <span /><span /><span />
                                </div>
                                <div className="sf-theme-picker__preview-row">
                                    <span /><span /><span />
                                </div>
                                <div className="sf-theme-picker__preview-row">
                                    <span /><span /><span />
                                </div>
                            </div>
                        </div>
                        <div className="sf-theme-picker__label">
                            <Sun className="size-4" />
                            <span>Light</span>
                        </div>
                    </button>

                    <button
                        className={cn(
                            'sf-theme-picker__card',
                            currentTheme === 'dark' && 'sf-theme-picker__card--active'
                        )}
                        onClick={() => setTheme('dark')}
                        aria-pressed={currentTheme === 'dark'}
                        type="button"
                    >
                        <div className="sf-theme-picker__preview sf-theme-picker__preview--dark">
                            <div className="sf-theme-picker__preview-toolbar">
                                <div className="sf-theme-picker__preview-dot" />
                                <div className="sf-theme-picker__preview-dot" />
                                <div className="sf-theme-picker__preview-dot" />
                            </div>
                            <div className="sf-theme-picker__preview-grid">
                                <div className="sf-theme-picker__preview-row">
                                    <span /><span /><span />
                                </div>
                                <div className="sf-theme-picker__preview-row">
                                    <span /><span /><span />
                                </div>
                                <div className="sf-theme-picker__preview-row">
                                    <span /><span /><span />
                                </div>
                            </div>
                        </div>
                        <div className="sf-theme-picker__label">
                            <Moon className="size-4" />
                            <span>Dark</span>
                        </div>
                    </button>
                </div>

                <p className="text-xs text-muted-foreground">
                    You can switch anytime from the toolbar
                </p>

                <div className="flex items-center justify-between w-full">
                    <Button variant="link" size="sm" onClick={onSkip}>
                        Skip tour
                    </Button>
                    <Button size="sm" onClick={onNext}>
                        Next <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </CardContent>

            <CardFooter className="!p-0 flex flex-col items-center gap-1">
                <StepDots current={stepIndex} total={TOTAL_STEPS} />
                <Badge variant="secondary">{stepIndex + 1} of {TOTAL_STEPS}</Badge>
            </CardFooter>
        </Card>
    );
}

// ─── Main Onboarding Tour ───────────────────────────────────────────

export default function OnboardingTour() {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isSmallViewport, setIsSmallViewport] = useState(false);

    // Check localStorage on mount
    useEffect(() => {
        try {
            const flag = localStorage.getItem(STORAGE_KEY);
            if (flag !== 'true') {
                setIsActive(true);
            }
        } catch {
            // Corrupted localStorage — treat as false (CC-309)
            setIsActive(true);
        }
        // Detect small viewport for modal fallback
        const checkViewport = () => setIsSmallViewport(window.innerWidth < 768);
        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    // Listen for re-launch event from toolbar
    useEffect(() => {
        const handler = () => {
            setCurrentStep(0);
            setIsActive(true);
        };
        window.addEventListener('onboarding-relaunch', handler);
        return () => window.removeEventListener('onboarding-relaunch', handler);
    }, []);

    // Get target element rect whenever step changes
    useEffect(() => {
        if (!isActive) return;
        const step = ONBOARDING_STEPS[currentStep];
        if (!step?.targetSelector) {
            setTargetRect(null);
            return;
        }
        const el = document.querySelector(step.targetSelector);
        if (!el) {
            // CC-305: Target element missing — skip step
            setTargetRect(null);
            return;
        }
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        // Recalculate on resize (CC-302)
        const onResize = () => {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [isActive, currentStep]);

    // Block keyboard shortcuts during tour (CC-308)
    useEffect(() => {
        if (!isActive) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // CC-304: Escape dismisses tour
                completeTour();
                return;
            }
            // Block most keyboard shortcuts from reaching the grid
            if (e.ctrlKey || e.metaKey) {
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isActive]);

    const completeTour = useCallback(() => {
        setIsActive(false);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch {
            // Storage full — tour completes anyway
        }
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < TOTAL_STEPS - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTour();
        }
    }, [currentStep, completeTour]);

    const handleSkip = useCallback(() => {
        completeTour();
    }, [completeTour]);

    if (!isActive) return null;

    const step = ONBOARDING_STEPS[currentStep];
    // On small viewports, treat popover steps as dialog steps (modal fallback)
    const effectiveType = isSmallViewport ? 'dialog' : step.type;
    const usePopover = effectiveType === 'popover' && targetRect;

    return (
        <div className="sf-onboarding" data-testid="onboarding-tour">
            {/* Overlay */}
            <SpotlightOverlay targetRect={usePopover ? targetRect : null} />

            {/* Click blocker on overlay (CC-303) */}
            {usePopover && (
                <div
                    className="sf-onboarding-overlay--click-blocker"
                    onClick={(e) => e.stopPropagation()}
                />
            )}

            {/* Step Content */}
            {step.id === 'welcome' && (
                <WelcomeDialog
                    stepIndex={currentStep}
                    onStart={handleNext}
                    onSkip={handleSkip}
                />
            )}

            {step.id === 'theme' && (
                <ThemeDialog
                    stepIndex={currentStep}
                    onNext={handleNext}
                    onSkip={handleSkip}
                />
            )}

            {step.id === 'complete' && (
                <CompletionDialog
                    stepIndex={currentStep}
                    onFinish={completeTour}
                />
            )}

            {usePopover && (
                <TooltipCard
                    step={step}
                    stepIndex={currentStep}
                    targetRect={targetRect!}
                    onNext={handleNext}
                    onSkip={handleSkip}
                />
            )}

            {/* Modal fallback for non-welcome/complete popover steps on small viewports */}
            {effectiveType === 'dialog' && step.id !== 'welcome' && step.id !== 'complete' && step.id !== 'theme' && (
                <Card className="sf-onboarding-dialog !gap-4 !py-8 !px-8" role="dialog" aria-label={step.title}>
                    <CardHeader className="!p-0 flex flex-col items-center text-center gap-2">
                        <CardTitle className="text-[22px] font-bold">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="!p-0 text-sm text-muted-foreground text-center">{step.body}</CardContent>
                    <CardContent className="!p-0 flex flex-col gap-2">
                        <Button onClick={handleNext} className="w-full py-5 text-sm font-semibold">
                            Next <ChevronRight className="size-3.5" />
                        </Button>
                        <Button variant="link" onClick={handleSkip} className="w-full text-muted-foreground text-[13px]">
                            Skip
                        </Button>
                    </CardContent>
                    <CardFooter className="!p-0 flex flex-col items-center gap-1">
                        <StepDots current={currentStep} total={TOTAL_STEPS} />
                        <Badge variant="secondary">{currentStep + 1} of {TOTAL_STEPS}</Badge>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
