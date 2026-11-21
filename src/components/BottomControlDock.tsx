import {
  ChevronDown,
  ChevronUp,
  Mail,
  Moon,
  Music,
  Pause,
  Play,
  Snowflake,
  Sun,
} from 'lucide-react';
import {
  CameraPresetId,
  FLOWER_PALETTES,
  FlowerPaletteId,
  LIGHTING_MOODS,
  LightingMoodId,
} from '../types/conservatory';

interface BottomControlDockProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  trackTitle: string;
  trackSourceLabel: string;
  cameraPreset: CameraPresetId;
  onSelectCamera: (preset: CameraPresetId) => void;
  flowerPalette: FlowerPaletteId;
  onSelectFlowerPalette: (palette: FlowerPaletteId) => void;
  lightingMood: LightingMoodId;
  onSelectLightingMood: (mood: LightingMoodId) => void;
  snowEnabled: boolean;
  onToggleSnow: () => void;
  onOpenModal: (modal: 'music' | 'note' | 'moon') => void;
}

const CAMERA_OPTIONS: { id: CameraPresetId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'turntable', label: 'Vinyl' },
  { id: 'bouquet', label: 'Flowers' },
  { id: 'portrait', label: 'Frame' },
];

export function BottomControlDock({
  isCollapsed,
  onToggleCollapse,
  isPlaying,
  onTogglePlay,
  trackTitle,
  trackSourceLabel,
  cameraPreset,
  onSelectCamera,
  flowerPalette,
  onSelectFlowerPalette,
  lightingMood,
  onSelectLightingMood,
  snowEnabled,
  onToggleSnow,
  onOpenModal,
}: BottomControlDockProps) {
  const isDark = LIGHTING_MOODS[lightingMood].isDark;

  const surfaceClass = isDark
    ? 'bg-[rgba(28,24,21,0.94)] border-[rgba(255,244,230,0.14)] text-[#F6EFE6]'
    : 'bg-[rgba(252,249,243,0.95)] border-[rgba(59,47,43,0.14)] text-[#2E2420]';

  const mutedTextClass = isDark ? 'text-[#B9ADA0]' : 'text-[#73645B]';
  const segmentBgClass = isDark ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-[rgba(59,47,43,0.06)]';
  const activeSegmentClass = isDark
    ? 'bg-[#3C332D] text-[#FAF5EE] shadow-xs'
    : 'bg-white text-[#2E2420] shadow-xs';

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
      style={{ width: 'min(1060px, 95vw)' }}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Show controls' : 'Hide controls'}
        className={`pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg border text-xs font-medium transition-colors duration-700 ease-in-out whitespace-nowrap shrink-0 cursor-pointer ${surfaceClass}`}
      >
        {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{isCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
      </button>

      <div
        className={`pointer-events-auto w-full rounded-xl border shadow-lg transition-all duration-700 ease-in-out origin-bottom ${surfaceClass} ${
          isCollapsed
            ? 'opacity-0 translate-y-6 pointer-events-none h-0 overflow-hidden py-0 px-0 border-0'
            : 'opacity-100 translate-y-0 px-3.5 py-2.5'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {/* Play / Pause & Current Track */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
              className="w-9 h-9 rounded-lg bg-[#B85D68] hover:bg-[#A34D58] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="min-w-0 max-w-[170px]">
              <div className="text-xs font-semibold truncate">{trackTitle}</div>
              <div className={`text-[11px] truncate font-mono-tabular ${mutedTextClass}`}>
                {trackSourceLabel}
              </div>
            </div>
          </div>

          {/* Camera Views */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded-lg ${segmentBgClass}`}>
            {CAMERA_OPTIONS.map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => onSelectCamera(cam.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  cameraPreset === cam.id
                    ? activeSegmentClass
                    : `${mutedTextClass} hover:opacity-85`
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Flower Palette Swatches */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Flower palette">
            {(Object.keys(FLOWER_PALETTES) as FlowerPaletteId[]).map((id) => {
              const pal = FLOWER_PALETTES[id];
              const active = flowerPalette === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectFlowerPalette(id)}
                  title={pal.label}
                  aria-label={`Select ${pal.label} flowers`}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer shrink-0 ${
                    active ? 'ring-2 ring-[#B85D68] ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: pal.swatch }}
                />
              );
            })}
          </div>

          {/* Two-Theme Lighting & Winter Snow Settings */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded-lg ${segmentBgClass}`} role="group" aria-label="Lighting mood and snow settings">
            <button
              type="button"
              onClick={() => onSelectLightingMood('golden-hour')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lightingMood === 'golden-hour'
                  ? activeSegmentClass
                  : `${mutedTextClass} hover:opacity-85`
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#D08A38]" />
              <span>Golden Hour</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectLightingMood('night')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lightingMood === 'night'
                  ? activeSegmentClass
                  : `${mutedTextClass} hover:opacity-85`
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-[#9BB0E0]" />
              <span>Night</span>
            </button>
            <span
              className={`w-px h-4 mx-0.5 ${isDark ? 'bg-white/12' : 'bg-[#3B2F2B]/12'}`}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={onToggleSnow}
              aria-pressed={snowEnabled}
              title={snowEnabled ? 'Disable gentle snowfall' : 'Enable gentle snowfall'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                snowEnabled
                  ? activeSegmentClass
                  : `${mutedTextClass} hover:opacity-85`
              }`}
            >
              <Snowflake
                className={`w-3.5 h-3.5 transition-colors ${
                  snowEnabled ? 'text-[#7DA8D8]' : 'opacity-70'
                }`}
              />
              <span>Snow</span>
            </button>
          </div>

          {/* Music MP3, Moon Secret & Gift Note Triggers */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenModal('music')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'border-white/12 hover:bg-white/8'
                  : 'border-[#3B2F2B]/14 hover:bg-[#3B2F2B]/5'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-[#B85D68]" />
              <span>Choose MP3</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('moon')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'border-white/12 hover:bg-white/8'
                  : 'border-[#3B2F2B]/14 hover:bg-[#3B2F2B]/5'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-[#B5894B]" />
              <span>Moon</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('note')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2E2420] hover:bg-[#3F322D] text-[#FAF5EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gift Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
