import { useRef, useState } from 'react';
import { Disc3, Link2, Music, Play, Upload, Volume2, X } from 'lucide-react';
import { CustomMp3Track } from '../types/conservatory';

interface MusicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrack: CustomMp3Track | null;
  onSelectTrack: (track: CustomMp3Track | null) => void;
  onPlayBuiltIn: () => void;
  isPlayingBuiltIn: boolean;
}

function cleanFileTitle(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Custom Track';
}

export function MusicStudioModal({
  isOpen,
  onClose,
  activeTrack,
  onSelectTrack,
  onPlayBuiltIn,
  isPlayingBuiltIn,
}: MusicStudioModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('audio/') && !/\.mp3$/i.test(file.name)) {
      setError('Please choose an MP3 or standard audio file (.mp3, .wav, .m4a, .ogg).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const title = customTitle.trim() || cleanFileTitle(file.name);
    onSelectTrack({
      title,
      audioUrl: objectUrl,
      sourceType: 'file',
    });
  }

  function handleApplyUrl(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Enter a direct link to an MP3 audio file.');
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Please enter a valid http:// or https:// MP3 URL.');
        return;
      }
    } catch {
      setError('Please enter a valid MP3 URL.');
      return;
    }

    const fallbackName = trimmed.split('/').pop()?.split('?')[0] || 'Custom MP3';
    onSelectTrack({
      title: customTitle.trim() || cleanFileTitle(fallbackName),
      audioUrl: trimmed,
      sourceType: 'url',
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#1D1714]/55"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[#FCF9F3] border border-[#3B2F2B]/14 text-[#2E2420] shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#3B2F2B]/10 pb-4">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight">
              Turntable Music
            </h2>
            <p className="text-xs text-[#73645B] mt-1">
              Load your own MP3 file for my priority or play your default conservatory song
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close music dialog"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#3B2F2B]/8 text-[#5B4B44] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Default /song.mp3 Option */}
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F3EDE4] border border-[#3B2F2B]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EAE0D2] flex items-center justify-center text-[#B5894B]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Default Track (/song.mp3)</div>
              <div className="text-xs text-[#73645B]">
                Plays your custom MP3 from the conservatory turntable
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectTrack(null);
              onPlayBuiltIn();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#2E2420] text-[#FAF5EE] hover:bg-[#3F322D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isPlayingBuiltIn && !activeTrack ? 'Playing' : 'Play Default'}</span>
          </button>
        </div>

        {/* Optional Label Name for the Vinyl */}
        <div>
          <label htmlFor="vinyl-track-name" className="block text-xs font-semibold text-[#5B4B44] mb-1">
            Vinyl Center Label Title (optional)
          </label>
          <input
            id="vinyl-track-name"
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Uses your MP3 filename if left blank"
            className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#3B2F2B]/16 text-sm focus:outline-none focus:border-[#B85D68]"
          />
        </div>

        {/* Upload / Drop Custom MP3 File */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelected(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? 'border-[#B85D68] bg-[#B85D68]/8'
              : 'border-[#3B2F2B]/18 bg-white hover:border-[#3B2F2B]/32'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,audio/mpeg,audio/*"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
          <div className="w-11 h-11 rounded-full bg-[#F3EDE4] text-[#B85D68] flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-[#2E2420]">
            Choose a custom MP3 file
          </div>
          <p className="text-xs text-[#73645B] mt-1 mb-4">
            Drag and drop an `.mp3` here, or browse from your device
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#B85D68] hover:bg-[#A34D58] text-white transition-colors cursor-pointer"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Select MP3 File</span>
          </button>
        </div>

        {/* Or Paste Direct MP3 URL */}
        <form onSubmit={handleApplyUrl} className="space-y-2">
          <label htmlFor="mp3-url-input" className="block text-xs font-semibold text-[#5B4B44]">
            Or Load from an MP3 Link
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-[#73645B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="mp3-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/song.mp3"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white border border-[#3B2F2B]/16 text-sm focus:outline-none focus:border-[#B85D68]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[#2E2420] hover:bg-[#3F322D] text-[#FAF5EE] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Load URL
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#B85D68]/35 text-xs text-[#7F2933]">
            {error}
          </div>
        )}

        {/* Currently Loaded Custom MP3 */}
        {activeTrack && (
          <div className="p-3.5 rounded-xl border border-[#B85D68]/40 bg-[#B85D68]/6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Disc3 className="w-4 h-4 text-[#B85D68] shrink-0" />
                <span className="text-sm font-semibold truncate">{activeTrack.title}</span>
              </div>
              <span className="text-[11px] font-mono-tabular text-[#73645B]">
                {activeTrack.sourceType === 'file' ? 'Local MP3' : 'MP3 URL'}
              </span>
            </div>
            <audio controls src={activeTrack.audioUrl} className="w-full h-9" />
          </div>
        )}
      </div>
    </div>
  );
}
