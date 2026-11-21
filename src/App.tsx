import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConservatoryAudioEngine } from './audio/musicBoxSynth';
import { BottomControlDock } from './components/BottomControlDock';
import { GiftNoteModal } from './components/GiftNoteModal';
import { MoonSecretModal } from './components/MoonSecretModal';
import { MusicStudioModal } from './components/MusicStudioModal';
import { TabletopVerseModal } from './components/TabletopVerseModal';
import { ConservatoryCanvas } from './three/ConservatoryCanvas';
import {
  CameraPresetId,
  CustomMp3Track,
  DEFAULT_GIFT_CONFIG,
  FLOWER_PALETTES,
  FlowerPaletteId,
  GiftConfig,
  LIGHTING_MOODS,
  LightingMoodId,
  TabletopItemId,
} from './types/conservatory';

interface SharedGiftPayload extends Partial<Omit<GiftConfig, 'lightingMood'>> {
  lightingMood?: string;
  mp3Url?: string;
  mp3Title?: string;
}

function normalizeLightingMood(mood?: string): LightingMoodId {
  if (mood === 'night' || mood === 'candlelit') return 'night';
  return 'golden-hour';
}

function decodeGiftFromHash(): SharedGiftPayload | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#gift=')) return null;
    const encoded = decodeURIComponent(hash.slice('#gift='.length));
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json) as SharedGiftPayload;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function encodeGiftUrl(config: GiftConfig, track: CustomMp3Track | null): string {
  const payload: SharedGiftPayload = {
    recipientName: config.recipientName,
    senderName: config.senderName,
    noteTitle: config.noteTitle,
    noteBody: config.noteBody,
    flowerPalette: config.flowerPalette,
    woodFinish: config.woodFinish,
    lightingMood: config.lightingMood,
    snowEnabled: config.snowEnabled,
    ...(track?.sourceType === 'url'
      ? { mp3Url: track.audioUrl, mp3Title: track.title }
      : {}),
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#gift=${encodeURIComponent(encoded)}`;
}

export default function App() {
  const initialHash = useMemo(() => decodeGiftFromHash(), []);
  const [config, setConfig] = useState<GiftConfig>(() =>
    initialHash
      ? {
          ...DEFAULT_GIFT_CONFIG,
          ...initialHash,
          lightingMood: normalizeLightingMood(initialHash.lightingMood),
          snowEnabled: Boolean(initialHash.snowEnabled),
        }
      : DEFAULT_GIFT_CONFIG,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activeModal, setActiveModal] = useState<'music' | 'note' | 'moon' | null>(null);
  const [activeVerseItem, setActiveVerseItem] = useState<TabletopItemId | null>(null);
  const [customTrack, setCustomTrack] = useState<CustomMp3Track | null>(() =>
    initialHash?.mp3Url
      ? {
          title: initialHash.mp3Title || 'Dedicated Song',
          audioUrl: initialHash.mp3Url,
          sourceType: 'url',
        }
      : null,
  );

  const audioEngineRef = useRef<ConservatoryAudioEngine | null>(null);
  const mp3AudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAutoplayRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const customTrackRef = useRef<CustomMp3Track | null>(customTrack);
  customTrackRef.current = customTrack;

  if (!audioEngineRef.current) {
    audioEngineRef.current = new ConservatoryAudioEngine();
  }

  useEffect(() => {
    const engine = audioEngineRef.current;
    engine?.setOnCustomEnded(() => setIsPlaying(false));
    return () => {
      engine?.setOnCustomEnded(null);
      engine?.dispose();
    };
  }, []);

  const ensureAutoplayResumed = useCallback(() => {
    if (!pendingAutoplayRef.current || customTrackRef.current) return;
    pendingAutoplayRef.current = false;
    const engine = audioEngineRef.current;
    if (!engine) return;
    void engine
      .playCustomMp3('/song.mp3', true)
      .then((started) => {
        if (started) {
          setIsPlaying(true);
        }
      })
      .catch(() => {});
  }, []);

  // Attempt /song.mp3 autoplay on initial load; if browser restricts autoplay,
  // resume seamlessly on first user click or surprise interaction without uncaught rejections.
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine || customTrackRef.current) {
      pendingAutoplayRef.current = false;
      return;
    }

    let cancelled = false;
    void engine
      .playCustomMp3('/song.mp3', true)
      .then((started) => {
        if (cancelled) return;
        if (started) {
          pendingAutoplayRef.current = false;
          setIsPlaying(true);
        }
      })
      .catch(() => {});

    const onFirstUserGesture = () => {
      ensureAutoplayResumed();
    };

    window.addEventListener('click', onFirstUserGesture);
    window.addEventListener('keydown', onFirstUserGesture);

    return () => {
      cancelled = true;
      window.removeEventListener('click', onFirstUserGesture);
      window.removeEventListener('keydown', onFirstUserGesture);
    };
  }, [ensureAutoplayResumed]);

  // Keyboard shortcut 'H' to collapse/expand bottom dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setActiveModal(null);
        setActiveVerseItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Sync audio playback state cleanly between /song.mp3 and user-selected custom MP3 <audio>
  useEffect(() => {
    const engine = audioEngineRef.current;
    const el = mp3AudioRef.current;
    if (!engine) return;

    let cancelled = false;
    if (customTrack && el) {
      pendingAutoplayRef.current = false;
      engine.stopCustomMp3();
      if (isPlaying) {
        if (customTrack.sourceType === 'file') {
          engine.connectMediaElement(el);
        }
        void el.play().catch(() => {
          if (!cancelled) setIsPlaying(false);
        });
      } else {
        el.pause();
      }
    } else {
      if (el) el.pause();
      if (isPlaying) {
        pendingAutoplayRef.current = false;
        if (!engine.isCustomPlaying()) {
          void engine
            .playCustomMp3('/song.mp3', true)
            .then((started) => {
              if (!cancelled && !started) {
                setIsPlaying(false);
              }
            })
            .catch(() => {
              if (!cancelled) setIsPlaying(false);
            });
        }
      } else {
        engine.stopCustomMp3();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [isPlaying, customTrack]);

  const handleTogglePlay = useCallback(() => {
    pendingAutoplayRef.current = false;
    const next = !isPlayingRef.current;
    setIsPlaying(next);

    const engine = audioEngineRef.current;
    if (!engine || customTrackRef.current) return;

    if (next) {
      void engine
        .playCustomMp3('/song.mp3', true)
        .then((started) => {
          if (!started) setIsPlaying(false);
        })
        .catch(() => setIsPlaying(false));
    } else {
      engine.stopCustomMp3();
    }
  }, []);

  const handleCycleFlowerPalette = useCallback(() => {
    ensureAutoplayResumed();
    const keys = Object.keys(FLOWER_PALETTES) as FlowerPaletteId[];
    setConfig((prev) => {
      const next = keys[(keys.indexOf(prev.flowerPalette) + 1) % keys.length];
      return { ...prev, flowerPalette: next };
    });
  }, [ensureAutoplayResumed]);

  const handleUpdateConfig = useCallback((patch: Partial<GiftConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const getAudioEnergy = useCallback(() => {
    return audioEngineRef.current?.getAudioEnergy() ?? 0;
  }, []);

  const handleSelectCustomTrack = useCallback((nextTrack: CustomMp3Track | null) => {
    pendingAutoplayRef.current = false;
    setCustomTrack((prev) => {
      if (prev?.sourceType === 'file' && prev.audioUrl !== nextTrack?.audioUrl) {
        URL.revokeObjectURL(prev.audioUrl);
      }
      return nextTrack;
    });
  }, []);

  const shareUrl = useMemo(() => encodeGiftUrl(config, customTrack), [config, customTrack]);
  const isDarkMood = LIGHTING_MOODS[config.lightingMood].isDark;
  const activeTrackTitle = customTrack ? customTrack.title : config.songDedication;
  const activeSourceLabel = customTrack
    ? customTrack.sourceType === 'file'
      ? 'Custom MP3'
      : 'MP3 Stream'
    : 'MP3 · /song.mp3';

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Hidden <audio> element for custom MP3 playback */}
      <audio
        ref={mp3AudioRef}
        src={customTrack?.audioUrl}
        loop
        onEnded={() => setIsPlaying(false)}
      />

      {/* Full-bleed 3D Conservatory Viewport */}
      <div className="absolute inset-0">
        <ConservatoryCanvas
          isPlaying={isPlaying}
          cameraPreset={cameraPreset}
          flowerPalette={config.flowerPalette}
          woodFinish={config.woodFinish}
          lightingMood={config.lightingMood}
          snowEnabled={config.snowEnabled}
          recipientName={config.recipientName}
          trackTitle={activeTrackTitle}
          coverImageUrl={config.coverImageUrl}
          getAudioEnergy={getAudioEnergy}
          onTogglePlay={handleTogglePlay}
          onCycleFlowerPalette={handleCycleFlowerPalette}
          onOpenNote={() => {
            ensureAutoplayResumed();
            setActiveVerseItem(null);
            setActiveModal('note');
          }}
          onOpenMoon={() => {
            ensureAutoplayResumed();
            setActiveVerseItem(null);
            setActiveModal('moon');
          }}
          onSelectTabletopItem={(item) => {
            ensureAutoplayResumed();
            setActiveModal(null);
            setActiveVerseItem(item);
          }}
        />
      </div>

      {/* Editorial Unboxed Name Dedication (Top-Left, Zero Card Clutter) */}
      <header className="fixed top-6 left-7 z-20 pointer-events-none select-none max-w-[min(460px,80vw)]">
        <div
          className={`transition-colors duration-1000 ease-in-out ${
            isDarkMood ? 'text-[#FAF3EA]' : 'text-[#281E1A]'
          }`}
        >
          <div
            className={`text-xs tracking-wide font-medium transition-colors duration-1000 ease-in-out ${
              isDarkMood ? 'text-[#D3C5B4]' : 'text-[#6A5A50]'
            }`}
          >
            Sound &amp; Petals
          </div>
          <h1 className="font-display italic font-semibold text-4xl sm:text-[44px] leading-[1.06] tracking-tight mt-0.5 text-balance">
            {config.recipientName || 'for my priority'}
          </h1>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="w-10 h-px bg-[#B5894B]/70" aria-hidden="true" />
            <span
              className={`text-[11px] transition-colors duration-1000 ease-in-out ${
                isDarkMood ? 'text-[#C4B6A6]' : 'text-[#73645B]'
              }`}
            >
              Touch any item on the table, bubbles, or moon
            </span>
          </div>
        </div>
      </header>

      {/* Single Collapsible Bottom Control Dock */}
      <BottomControlDock
        isCollapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        trackTitle={activeTrackTitle}
        trackSourceLabel={activeSourceLabel}
        cameraPreset={cameraPreset}
        onSelectCamera={setCameraPreset}
        flowerPalette={config.flowerPalette}
        onSelectFlowerPalette={(palette) => handleUpdateConfig({ flowerPalette: palette })}
        lightingMood={config.lightingMood}
        onSelectLightingMood={(mood) => handleUpdateConfig({ lightingMood: mood })}
        snowEnabled={config.snowEnabled}
        onToggleSnow={() => handleUpdateConfig({ snowEnabled: !config.snowEnabled })}
        onOpenModal={(modal) => {
          ensureAutoplayResumed();
          setActiveVerseItem(null);
          setActiveModal(modal);
        }}
      />

      {/* Modals: Custom MP3, Gift Note, Moon Secret & Tabletop Verse Popup */}
      <MusicStudioModal
        isOpen={activeModal === 'music'}
        onClose={() => setActiveModal(null)}
        activeTrack={customTrack}
        onSelectTrack={(track) => {
          handleSelectCustomTrack(track);
          setIsPlaying(true);
        }}
        onPlayBuiltIn={() => {
          handleSelectCustomTrack(null);
          setIsPlaying(true);
        }}
        isPlayingBuiltIn={isPlaying}
      />

      <GiftNoteModal
        isOpen={activeModal === 'note'}
        onClose={() => setActiveModal(null)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        shareUrl={shareUrl}
      />

      <MoonSecretModal
        isOpen={activeModal === 'moon'}
        onClose={() => setActiveModal(null)}
        recipientName={config.recipientName}
      />

      <TabletopVerseModal
        item={activeVerseItem}
        recipientName={config.recipientName}
        isDarkMood={isDarkMood}
        onClose={() => setActiveVerseItem(null)}
      />
    </main>
  );
}
