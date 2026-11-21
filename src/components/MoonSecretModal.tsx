import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, RotateCcw, Sparkles, X } from 'lucide-react';

interface MoonSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

type Stage = 'game' | 'countdown' | 'reveal';

const NO_ESCALATIONS = [
  {
    question: 'Do you really want to see this secret?',
    yesLabel: 'Yes',
    noLabel: 'No',
    subtext: 'The moon has been holding onto something quietly.',
  },
  {
    question: 'Are you absolutely sure?',
    yesLabel: 'Actually, Yes',
    noLabel: 'No',
    subtext: 'Think twice before turning away from the night sky.',
  },
  {
    question: 'Are you absolutely sure you do not want a tiny peek?',
    yesLabel: 'Okay, show me',
    noLabel: 'Still No',
    subtext: 'Even the stars are leaning in to listen.',
  },
  {
    question: 'Last chance—are you truly sure?',
    yesLabel: 'Yes, reveal it',
    noLabel: 'No, never',
    subtext: 'Patience is a quiet kind of magic.',
  },
];

const STARS = [
  { x: '14%', y: '18%', size: 4, delay: 0 },
  { x: '84%', y: '16%', size: 3, delay: 0.35 },
  { x: '22%', y: '74%', size: 3, delay: 0.7 },
  { x: '78%', y: '72%', size: 5, delay: 0.2 },
  { x: '50%', y: '12%', size: 3, delay: 0.55 },
  { x: '10%', y: '48%', size: 4, delay: 0.9 },
  { x: '90%', y: '46%', size: 3, delay: 0.45 },
  { x: '34%', y: '86%', size: 4, delay: 0.15 },
  { x: '68%', y: '84%', size: 3, delay: 0.65 },
];

export function MoonSecretModal({
  isOpen,
  onClose,
  recipientName,
}: MoonSecretModalProps) {
  const [stage, setStage] = useState<Stage>('game');
  const [noClicks, setNoClicks] = useState(0);
  const [yesConfirmStep, setYesConfirmStep] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Reset state cleanly whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('game');
      setNoClicks(0);
      setYesConfirmStep(false);
      setCountdown(3);
    }
  }, [isOpen]);

  // Short patience countdown timer
  useEffect(() => {
    if (!isOpen || stage !== 'countdown') return;
    if (countdown <= 0) {
      const doneTimer = window.setTimeout(() => {
        setStage('reveal');
      }, 450);
      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isOpen, stage, countdown]);

  if (!isOpen) return null;

  function startCountdown() {
    setCountdown(3);
    setStage('countdown');
  }

  function handleYesClick() {
    // If she immediately clicks Yes on the very first screen, tease once with "Are you absolutely sure?"
    if (noClicks === 0 && !yesConfirmStep) {
      setYesConfirmStep(true);
      return;
    }
    startCountdown();
  }

  function handleNoClick() {
    if (yesConfirmStep) {
      setYesConfirmStep(false);
      setNoClicks(1);
      return;
    }
    const next = noClicks + 1;
    if (next >= NO_ESCALATIONS.length) {
      startCountdown();
    } else {
      setNoClicks(next);
    }
  }

  const currentPrompt = yesConfirmStep
    ? {
        question: 'Are you absolutely sure you are ready to see it?',
        yesLabel: "Yes, I'm ready",
        noLabel: 'Wait, no',
        subtext: 'Once the moon rises, there is no unreading it.',
      }
    : NO_ESCALATIONS[Math.min(noClicks, NO_ESCALATIONS.length - 1)];

  // Subtly shrink/offset the "No" button on repeated attempts for playful feedback
  const noButtonOffset =
    noClicks === 1 ? 10 : noClicks === 2 ? -14 : noClicks === 3 ? 16 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E0C12]/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#17141C] border border-[#E7D6B9]/18 text-[#FAF3EA] shadow-2xl px-7 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle twinkling starfield */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {STARS.map((star, idx) => (
            <motion.span
              key={idx}
              className="absolute rounded-full bg-[#F5E4C3]"
              style={{
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
              }}
              animate={{
                opacity: stage === 'reveal' ? [0.25, 0.95, 0.35] : [0.15, 0.5, 0.15],
                scale: stage === 'reveal' ? [0.9, 1.35, 0.9] : [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                delay: star.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close moon secret"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg flex items-center justify-center text-[#CFC4B4] hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Luminous Lunar Orb */}
          <div className="relative mb-6 flex items-center justify-center">
            <motion.div
              className="w-24 h-24 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 32%, #FFF9EE 0%, #EFE1C6 52%, #C9B596 100%)',
                boxShadow:
                  stage === 'reveal'
                    ? '0 0 48px rgba(245, 224, 184, 0.52), inset -10px -10px 22px rgba(112, 92, 68, 0.25)'
                    : '0 0 24px rgba(245, 224, 184, 0.24), inset -10px -10px 22px rgba(112, 92, 68, 0.25)',
              }}
              animate={
                stage === 'reveal'
                  ? { scale: [0.92, 1.06, 1], y: [8, -4, 0] }
                  : stage === 'countdown'
                    ? { scale: [1, 1.04, 1] }
                    : { y: [0, -3, 0] }
              }
              transition={{
                duration: stage === 'reveal' ? 1.4 : 3.2,
                repeat: stage === 'reveal' ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
            {stage === 'game' && (
              <div
                className="absolute -right-2 -top-1 w-7 h-7 rounded-full bg-[#241F2B] border border-[#E7D6B9]/25 flex items-center justify-center text-[#E7D6B9]"
                aria-hidden="true"
              >
                <Moon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {stage === 'game' && (
              <motion.div
                key={`game-${noClicks}-${yesConfirmStep ? 'y' : 'n'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 w-full"
              >
                <div className="space-y-2">
                  <div className="text-xs text-[#C6B6A1]">
                    {/^for\s+/i.test((recipientName || '').trim())
                      ? recipientName.trim()
                      : `For ${recipientName || 'my priority'}`}
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-balance">
                    {currentPrompt.question}
                  </h2>
                  <p className="text-xs text-[#B3A596] max-w-sm mx-auto">
                    {currentPrompt.subtext}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleYesClick}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[#E8D4B4] hover:bg-[#F2E2C7] text-[#1C1714] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {currentPrompt.yesLabel}
                  </button>

                  <motion.button
                    type="button"
                    onClick={handleNoClick}
                    animate={{ x: noButtonOffset }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#E7D6B9]/22 text-[#E5DACB] hover:bg-white/8 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {currentPrompt.noLabel}
                  </motion.button>
                </div>

                {noClicks > 0 && (
                  <div className="text-[11px] font-mono-tabular text-[#9A8C7D]">
                    Patience check {noClicks} of {NO_ESCALATIONS.length - 1}
                  </div>
                )}
              </motion.div>
            )}

            {stage === 'countdown' && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 py-2"
              >
                <div className="text-xs text-[#C6B6A1]">
                  Testing your patience for just a moment
                </div>
                <motion.div
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="font-display text-6xl font-semibold text-[#F4E3C3] font-mono-tabular"
                >
                  {countdown > 0 ? countdown : '✦'}
                </motion.div>
                <p className="text-sm text-[#CFC4B4]">
                  {countdown > 1
                    ? 'Hold still and watch the sky...'
                    : countdown === 1
                      ? 'Almost there...'
                      : 'Look closely.'}
                </p>
              </motion.div>
            )}

            {stage === 'reveal' && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5 w-full pt-1"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="w-16 h-px bg-[#E7D6B9]/45 mx-auto"
                />

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="font-display italic text-4xl sm:text-[42px] font-semibold leading-snug text-[#FFF7EA] text-balance"
                >
                  “The moon is beautiful, isn&apos;t it?”
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.55 }}
                  className="text-xs text-[#C6B6A1] flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E7D6B9]" />
                  <span>
                    Quietly meant{' '}
                    {/^for\s+/i.test((recipientName || '').trim())
                      ? recipientName.trim()
                      : `for ${recipientName || 'my priority'}`}
                  </span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.85 }}
                  className="pt-3 flex items-center justify-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStage('game');
                      setNoClicks(0);
                      setYesConfirmStep(false);
                      setCountdown(3);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-[#E7D6B9]/20 text-[#DFD4C4] hover:bg-white/8 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ask Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-[#E8D4B4] hover:bg-[#F2E2C7] text-[#1C1714] transition-colors cursor-pointer"
                  >
                    Return to Conservatory
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
