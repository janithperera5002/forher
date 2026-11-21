import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Coffee, Feather, Flame, Heart, RefreshCw, X } from 'lucide-react';
import { TabletopItemId } from '../types/conservatory';

interface TabletopVerseModalProps {
  item: TabletopItemId | null;
  recipientName: string;
  isDarkMood: boolean;
  onClose: () => void;
}

interface ItemVerseEntry {
  title: string;
  subtitle: string;
  verses: string[];
  icon: 'teacup' | 'lantern' | 'journal' | 'balloon' | 'petals';
}

const ITEM_VERSES: Record<TabletopItemId, ItemVerseEntry> = {
  teacup: {
    title: 'Warm Amber Tea',
    subtitle: 'Tabletop Keepsake',
    icon: 'teacup',
    verses: [
      'Even the quietest afternoon feels gentler when shared over something warm.',
      'Steam curls upward like an unhurried melody—take all the time you need today.',
      'A little warmth for your hands, and a calm corner for your thoughts.',
    ],
  },
  lantern: {
    title: 'Brass Hurricane Lantern',
    subtitle: 'Candlelight Note',
    icon: 'lantern',
    verses: [
      'You carry the kind of warmth that makes even a dim room feel like golden hour.',
      'Some lights do not need to be loud; they just stay steady and soften the dark.',
      'Every small flicker keeps watch over a quiet wish meant just for you.',
    ],
  },
  journal: {
    title: 'Notes & Melodies',
    subtitle: 'Poetry Journal',
    icon: 'journal',
    verses: [
      'Between the margins and little melodies, you are my favorite thought to linger on.',
      'If every good conversation left a pressed bloom on the page, this book would already be full.',
      'Just a quiet line written in ink: the ordinary days shine brighter since you came around.',
    ],
  },
  balloon: {
    title: 'Tethered Silk Balloon',
    subtitle: 'Floating Thought',
    icon: 'balloon',
    verses: [
      'Light as air and tethered softly—some feelings stay close without needing heavy words.',
      'May your days feel effortless, lifted gently like a ribbon in a warm breeze.',
      'A quiet little lift for your heart whenever the evening feels too still.',
    ],
  },
  petals: {
    title: 'Fallen Petals',
    subtitle: 'Botanical Whisper',
    icon: 'petals',
    verses: [
      'Like curls catching afternoon light, even a single petal knows how to grace a room.',
      'Softness is never small—look how a few fallen petals still make the whole table bloom.',
      'Tiny reminders scattered softly: you bring beauty into spaces without even trying.',
    ],
  },
};

function ItemIcon({ type, className }: { type: ItemVerseEntry['icon']; className?: string }) {
  switch (type) {
    case 'teacup':
      return <Coffee className={className} />;
    case 'lantern':
      return <Flame className={className} />;
    case 'journal':
      return <BookOpen className={className} />;
    case 'balloon':
      return <Heart className={className} />;
    case 'petals':
      return <Feather className={className} />;
  }
}

export function TabletopVerseModal({
  item,
  recipientName,
  isDarkMood,
  onClose,
}: TabletopVerseModalProps) {
  const [verseIndex, setVerseIndex] = useState(0);

  useEffect(() => {
    if (item) {
      setVerseIndex((prev) => (prev + 1) % ITEM_VERSES[item].verses.length);
    }
  }, [item]);

  if (!item) return null;

  const entry = ITEM_VERSES[item];
  const verse = entry.verses[verseIndex % entry.verses.length];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0E0C12]/68"
      onClick={onClose}
    >
      <motion.div
        key={item}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl px-7 py-7 ${
          isDarkMood
            ? 'bg-[#17151E] border-[#E7D6B9]/18 text-[#FAF3EA]'
            : 'bg-[#FCF9F3] border-[#3B2F2B]/14 text-[#2E2420]'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close verse"
          className={`absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            isDarkMood
              ? 'text-[#CFC4B4] hover:text-white hover:bg-white/8'
              : 'text-[#6A5A50] hover:text-[#2E2420] hover:bg-[#3B2F2B]/8'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-5 pr-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDarkMood ? 'bg-[#262130] text-[#E6C58D]' : 'bg-[#F2E9DC] text-[#A6783F]'
              }`}
              aria-hidden="true"
            >
              <ItemIcon type={entry.icon} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs ${
                  isDarkMood ? 'text-[#BEB0A0]' : 'text-[#73645B]'
                }`}
              >
                {entry.title} ·{' '}
                {/^for\s+/i.test((recipientName || '').trim())
                  ? recipientName.trim()
                  : `For ${recipientName || 'my priority'}`}
              </div>
              <div
                className={`text-[11px] font-mono-tabular ${
                  isDarkMood ? 'text-[#968A7D]' : 'text-[#9A8B80]'
                }`}
              >
                {entry.subtitle}
              </div>
            </div>
          </div>

          <blockquote
            className={`font-display italic text-2xl sm:text-[28px] leading-snug text-balance ${
              isDarkMood ? 'text-[#FFF7EA]' : 'text-[#281E1A]'
            }`}
          >
            “{verse}”
          </blockquote>

          <div
            className={`pt-4 border-t flex items-center justify-between gap-3 ${
              isDarkMood ? 'border-white/10' : 'border-[#3B2F2B]/10'
            }`}
          >
            <button
              type="button"
              onClick={() => setVerseIndex((prev) => (prev + 1) % entry.verses.length)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDarkMood
                  ? 'bg-white/8 hover:bg-white/14 text-[#EDE2D4]'
                  : 'bg-[#F2EBE0] hover:bg-[#E7DDD0] text-[#3B2F2B]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Another Verse</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDarkMood
                  ? 'bg-[#E8D4B4] hover:bg-[#F2E2C7] text-[#1C1714]'
                  : 'bg-[#2E2420] hover:bg-[#3F322D] text-[#FAF5EE]'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
