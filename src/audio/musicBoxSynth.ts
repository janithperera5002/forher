// Audio playback & real-time AnalyserNode energy metering for 3D motion reactivity.
// Routes custom MP3 playback (defaulting to /song.mp3) through Web Audio so
// getAudioEnergy() drives reactive petals, bouquet sway, balloon float, and turntable motion.

export class ConservatoryAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private mediaSources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private customAudio: HTMLAudioElement | null = null;
  private customAudioSrc: string | null = null;
  private onEndedCallback: (() => void) | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public connectMediaElement(el: HTMLAudioElement): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;
    if (!this.mediaSources.has(el)) {
      const src = ctx.createMediaElementSource(el);
      src.connect(this.masterGain);
      this.mediaSources.set(el, src);
    }
  }

  public setOnCustomEnded(cb: (() => void) | null): void {
    this.onEndedCallback = cb;
  }

  public isCustomPlaying(): boolean {
    return Boolean(this.customAudio && !this.customAudio.paused);
  }

  public async playCustomMp3(src = '/song.mp3', loop = true): Promise<boolean> {
    try {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      if (!this.customAudio) {
        this.customAudio = new Audio();
        this.customAudio.preload = 'auto';
        this.customAudio.addEventListener('ended', () => {
          if (!this.customAudio?.loop) {
            this.onEndedCallback?.();
          }
        });
      }

      this.customAudio.loop = loop;
      if (this.customAudioSrc !== src) {
        this.customAudio.src = src;
        this.customAudioSrc = src;
      }

      this.connectMediaElement(this.customAudio);
      await this.customAudio.play();

      // If Web Audio remains suspended without a user gesture, pause cleanly so
      // playback can resume cleanly on the user's first interaction.
      if (ctx.state !== 'running') {
        this.customAudio.pause();
        return false;
      }

      return !this.customAudio.paused;
    } catch {
      return false;
    }
  }

  public stopCustomMp3(): void {
    if (this.customAudio && !this.customAudio.paused) {
      this.customAudio.pause();
    }
  }

  public getAudioEnergy(): number {
    if (!this.analyser || !this.freqData) return 0;
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    const bins = Math.min(24, this.freqData.length);
    for (let i = 0; i < bins; i++) {
      sum += this.freqData[i];
    }
    return Math.min(1, sum / (bins * 165));
  }

  public dispose(): void {
    this.stopCustomMp3();
    if (this.customAudio) {
      this.customAudio.src = '';
      this.customAudio = null;
      this.customAudioSrc = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
