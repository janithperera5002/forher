import { useState } from 'react';
import { Check, Copy, Loader2, PenLine, Sparkles, X } from 'lucide-react';
import {
  DEFAULT_KEEPSAKE_PHOTO,
  FLOWER_PALETTES,
  FlowerPaletteId,
  GiftConfig,
  WOOD_FINISHES,
  WoodFinishId,
} from '../types/conservatory';

interface GiftNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GiftConfig;
  onUpdateConfig: (patch: Partial<GiftConfig>) => void;
  shareUrl: string;
}

export function GiftNoteModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  shareUrl,
}: GiftNoteModalProps) {
  const [tab, setTab] = useState<'read' | 'personalize'>('read');
  const [copied, setCopied] = useState(false);
  const [detailInput, setDetailInput] = useState(
    'her spiral curls, late-night playlists, and blush peonies',
  );
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  if (!isOpen) return null;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback selection not needed; button state still provides feedback
      setCopied(false);
    }
  }

  async function handleDraftNote() {
    if (isDrafting) return;
    setIsDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch('/api/note/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: config.recipientName,
          detail: detailInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDraftError(data?.error || 'Could not draft note.');
        return;
      }
      if (data.draft) {
        onUpdateConfig({ noteBody: data.draft });
      }
    } catch {
      setDraftError('Network error while drafting note.');
    } finally {
      setIsDrafting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#1D1714]/55"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[#FCF9F3] border border-[#3B2F2B]/14 text-[#2E2420] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#3B2F2B]/10">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F3EDE4]">
            <button
              type="button"
              onClick={() => setTab('read')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'read' ? 'bg-white text-[#2E2420] shadow-xs' : 'text-[#73645B]'
              }`}
            >
              Read Dedication
            </button>
            <button
              type="button"
              onClick={() => setTab('personalize')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'personalize' ? 'bg-white text-[#2E2420] shadow-xs' : 'text-[#73645B]'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Personalize & Share</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close gift note"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#3B2F2B]/8 text-[#5B4B44] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tab === 'read' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            <div className="md:col-span-5 bg-[#EFE7DB] min-h-[240px]">
              {!photoFailed ? (
                <img
                  src={DEFAULT_KEEPSAKE_PHOTO}
                  alt="Pressed flowers beside a vintage vinyl record sleeve"
                  referrerPolicy="no-referrer"
                  onError={() => setPhotoFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 text-center text-xs text-[#73645B]">
                  Botanical Keepsake Card
                </div>
              )}
            </div>

            <div className="md:col-span-7 p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs text-[#73645B]">
                  {/^for\s+/i.test((config.recipientName || '').trim())
                    ? config.recipientName.trim()
                    : `For ${config.recipientName || 'my priority'}`}{' '}
                  · {FLOWER_PALETTES[config.flowerPalette].label}
                </div>
                <h2 className="font-display text-3xl font-semibold leading-snug text-[#2E2420]">
                  {config.noteTitle}
                </h2>
                <p className="text-[15px] leading-relaxed text-[#4A3D37] whitespace-pre-line">
                  {config.noteBody}
                </p>
              </div>

              <div className="pt-4 border-t border-[#3B2F2B]/10 flex items-center justify-between gap-4">
                <div>
                  <div className="font-display italic text-xl text-[#2E2420]">
                    — {config.senderName || 'Always'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('personalize')}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#F3EDE4] hover:bg-[#E8DFD2] text-[#3B2F2B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Customize this page
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="recipient-name"
                  className="block text-xs font-semibold text-[#5B4B44] mb-1"
                >
                  Dedication Label
                </label>
                <input
                  id="recipient-name"
                  type="text"
                  value={config.recipientName}
                  onChange={(e) => onUpdateConfig({ recipientName: e.target.value })}
                  placeholder="for my priority"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#3B2F2B]/16 text-sm focus:outline-none focus:border-[#B85D68]"
                />
              </div>

              <div>
                <label
                  htmlFor="sender-name"
                  className="block text-xs font-semibold text-[#5B4B44] mb-1"
                >
                  Your Sign-off
                </label>
                <input
                  id="sender-name"
                  type="text"
                  value={config.senderName}
                  onChange={(e) => onUpdateConfig({ senderName: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#3B2F2B]/16 text-sm focus:outline-none focus:border-[#B85D68]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="note-title"
                className="block text-xs font-semibold text-[#5B4B44] mb-1"
              >
                Headline
              </label>
              <input
                id="note-title"
                type="text"
                value={config.noteTitle}
                onChange={(e) => onUpdateConfig({ noteTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#3B2F2B]/16 text-sm focus:outline-none focus:border-[#B85D68]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="note-body" className="text-xs font-semibold text-[#5B4B44]">
                  Your Note
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={detailInput}
                    onChange={(e) => setDetailInput(e.target.value)}
                    aria-label="Details to include in note draft"
                    placeholder="Details to mention..."
                    className="hidden sm:block w-56 px-2.5 py-1 rounded-md bg-white border border-[#3B2F2B]/14 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleDraftNote}
                    disabled={isDrafting}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F3EDE4] hover:bg-[#E7DED1] text-[#3B2F2B] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isDrafting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#B5894B]" />
                    )}
                    <span>Draft Inspiration</span>
                  </button>
                </div>
              </div>

              <textarea
                id="note-body"
                rows={4}
                value={config.noteBody}
                onChange={(e) => onUpdateConfig({ noteBody: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#3B2F2B]/16 text-sm leading-relaxed focus:outline-none focus:border-[#B85D68] resize-none"
              />
              {draftError && <p className="text-xs text-[#7F2933]">{draftError}</p>}
            </div>

            {/* Wood & Flower Finish Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="text-xs font-semibold text-[#5B4B44] mb-1.5">
                  Turntable & Frame Wood
                </div>
                <div className="flex items-center gap-1.5">
                  {(Object.keys(WOOD_FINISHES) as WoodFinishId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onUpdateConfig({ woodFinish: id })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        config.woodFinish === id
                          ? 'border-[#B85D68] bg-[#B85D68]/8 text-[#2E2420]'
                          : 'border-[#3B2F2B]/12 bg-white text-[#5B4B44]'
                      }`}
                    >
                      {WOOD_FINISHES[id].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#5B4B44] mb-1.5">Bouquet Palette</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(FLOWER_PALETTES) as FlowerPaletteId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onUpdateConfig({ flowerPalette: id })}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        config.flowerPalette === id
                          ? 'border-[#B85D68] bg-[#B85D68]/8 text-[#2E2420]'
                          : 'border-[#3B2F2B]/12 bg-white text-[#5B4B44]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: FLOWER_PALETTES[id].swatch }}
                      />
                      <span>{FLOWER_PALETTES[id].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shareable Gift Link */}
            <div className="pt-4 border-t border-[#3B2F2B]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#73645B]">
                Share this link so her page opens directly with your custom note, flowers, and wood
                finish.
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#2E2420] hover:bg-[#3F322D] text-[#FAF5EE] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Gift Link Copied' : 'Copy Gift Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
