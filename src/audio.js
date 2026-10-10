// Pure Web Audio API Sound Synthesizer for 8-bit / 16-bit Retro Celeste Polish
// Zero external files, 100% reliable, zero latency!

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.masterFilter = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentBiome = 0;
    this.nextStepTime = 0;
    this.musicStep = 0;
    this.schedulerTimer = null;
    this.dreamDroneOsc = null;
    this.dreamDroneGain = null;
    this.noiseBuffer = null;
  }

  getNoiseBuffer() {
    if (this.noiseBuffer) return this.noiseBuffer;
    if (!this.ctx) return null;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
      return buffer;
    } catch (_) {
      return null;
    }
  }

  playHiHat(t, vol = 0.05) {
    if (!this.ctx || this.muted || !this.musicEnabled) return;
    const buf = this.getNoiseBuffer();
    if (!buf) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.setValueAtTime(8000, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(this.musicGain);
      src.start(t);
      src.stop(t + 0.04);
    } catch (_) {}
  }

  playSnare(t, vol = 0.16) {
    if (!this.ctx || this.muted || !this.musicEnabled) return;
    const buf = this.getNoiseBuffer();
    if (!buf) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(1500, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(this.musicGain);
      src.start(t);
      src.stop(t + 0.12);

      const tone = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(190, t);
      tone.frequency.exponentialRampToValueAtTime(65, t + 0.06);
      tGain.gain.setValueAtTime(vol * 0.65, t);
      tGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      tone.connect(tGain);
      tGain.connect(this.musicGain);
      tone.start(t);
      tone.stop(t + 0.075);
    } catch (_) {}
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Low-Pass Filter for muffled death/pause audio ducking
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 14000;
      this.masterFilter.Q.value = 1.0;
      this.masterFilter.connect(this.ctx.destination);
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.masterFilter);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.90;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.55;
      this.musicGain.connect(this.masterGain);

      this.startMusicSequencer();
    } catch (e) {
      console.warn('Web Audio not supported or blocked', e);
    }
  }

  setBiome(biome) {
    this.currentBiome = biome;
  }

  // Low-Pass Filter Ducking on Death & Pause
  setLowPass(muffled) {
    if (!this.ctx || !this.masterFilter) return;
    const t = this.ctx.currentTime;
    const targetFreq = muffled ? 360 : 14000;
    this.masterFilter.frequency.cancelScheduledValues(t);
    this.masterFilter.frequency.setValueAtTime(this.masterFilter.frequency.value, t);
    this.masterFilter.frequency.exponentialRampToValueAtTime(Math.max(100, targetFreq), t + 0.14);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (!this.schedulerTimer) this.startMusicSequencer();
      });
    }
  }

  toggleMute() {
    this.ensureContext();
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0.0 : 1.0;
    }
    return this.muted;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicEnabled ? 0.55 : 0.0;
    }
    return this.musicEnabled;
  }

  // --- Sound Effects ---

  // Jump: rising square/triangle wave with snappy decay
  playJump() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Dash: Iconic Celeste whoosh + punch!
  playDash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Noise burst
    const bufferSize = this.ctx.sampleRate * 0.16;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);
    filter.Q.value = 3.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.15);

    // 2. Low-frequency punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    oscGain.gain.setValueAtTime(0.45, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Wall Jump: snappy high tap
  playWallJump() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Land on ground: soft low-pass thud
  playLand() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Strawberry Collect: arpeggiated bright chime
  playBerryCollect() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playStrawberryCollect() {
    this.playBerryCollect();
  }

  // Dash Refill Crystal: shimmering two-tone chime
  playCrystalRefill() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, t); // E5
    osc1.frequency.exponentialRampToValueAtTime(987.77, t + 0.18); // B5
    osc2.frequency.setValueAtTime(880, t); // A5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, t + 0.18); // E6

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.2);
    osc2.stop(t + 0.2);
  }

  playRefill() {
    this.playCrystalRefill();
  }

  // Dream Block Dash: ethereal shimmering phase sweep
  playDreamDash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.25);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // Crystal Heart Collect: glorious cosmic chime
  playHeartCollect() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, i) => {
      const t = this.ctx.currentTime + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Bouncy Spring: comic upward boing!
  playSpring() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Player Death: crunch & dissolving burst
  playDeath() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Downward crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // UI Button Click: crisp mechanical tick
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.setValueAtTime(400, t + 0.02);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Victory Fanfare
  playVictory() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];

    let offset = 0;
    notes.forEach(n => {
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + n.d);
      offset += n.d * 0.8;
    });
  }

  // Warp sound (for chapter transition & level select)
  playWarp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.16);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Wavedash: downward swoosh into explosive rising pop
  playWaveDash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.15);
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Wall Bounce: snappy high resonant bell tap with upward sweep
  playWallBounce() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(1360, t + 0.14);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Dream Block Drone: continuous celestial space hum while phasing
  startDreamDrone() {
    if (this.dreamDroneOsc || this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    this.dreamDroneOsc = this.ctx.createOscillator();
    this.dreamDroneGain = this.ctx.createGain();
    this.dreamDroneOsc.type = 'sine';
    this.dreamDroneOsc.frequency.setValueAtTime(240, t);
    this.dreamDroneGain.gain.setValueAtTime(0.001, t);
    this.dreamDroneGain.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
    this.dreamDroneOsc.connect(this.dreamDroneGain);
    this.dreamDroneGain.connect(this.sfxGain);
    this.dreamDroneOsc.start(t);
  }

  stopDreamDrone() {
    if (!this.dreamDroneOsc || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.dreamDroneGain) {
      this.dreamDroneGain.gain.cancelScheduledValues(t);
      this.dreamDroneGain.gain.setValueAtTime(this.dreamDroneGain.gain.value, t);
      this.dreamDroneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    }
    this.dreamDroneOsc.stop(t + 0.06);
    this.dreamDroneOsc = null;
    this.dreamDroneGain = null;
  }

  // Dream Block Exit: high sparkling bell chime
  playDreamExit() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.16);
    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Golden Feather: magical soaring arpeggio
  playFeatherCollect() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  playFeatherEnd() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Cassette Tape: triumphant 8-bit A-major fanfare
  playCassetteCollect() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.20, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  // Rhythm Beat Block: woodblock clock tick on beat switch
  playBeatTick(isHigh = false) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHigh ? 920 : 540, t);
    osc.frequency.exponentialRampToValueAtTime(isHigh ? 420 : 220, t + 0.025);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Shadow Doppelganger Warning Pulse
  playDoppelgangerWarning() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.1);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // -------------------------------------------------------------
  // MULTI-BIOME MULTI-LAYERED CHIPTUNE MUSIC SEQUENCER (Lena Raine / Celeste Inspired)
  // -------------------------------------------------------------
  startMusicSequencer() {
    if (this.schedulerTimer) return;

    // Frequencies
    const N = {
      A1: 55.00, Bb1: 58.27, B1: 61.74, C2: 65.41, Db2: 69.30, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Gb2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
      C3: 130.81, Db3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Gb3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
      C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
      C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Gb5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
      C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00, B6: 1975.53, C7: 2093.00
    };

    // 128-step multi-phrase soundtracks for all 8 biomes
    const TRACKS = [
  {
    "name": "0: Cyber Skyline",
    "osc": "triangle",
    "decay": 0.16,
    "lead": [
      329.63,
      null,
      440,
      523.25,
      659.25,
      null,
      523.25,
      null,
      349.23,
      null,
      440,
      523.25,
      698.46,
      null,
      523.25,
      null,
      392,
      null,
      523.25,
      659.25,
      783.99,
      null,
      659.25,
      null,
      392,
      null,
      493.88,
      587.33,
      783.99,
      null,
      587.33,
      null,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      null,
      349.23,
      null,
      440,
      523.25,
      698.46,
      null,
      523.25,
      null,
      329.63,
      null,
      392,
      493.88,
      659.25,
      null,
      493.88,
      null,
      440,
      null,
      523.25,
      659.25,
      880,
      null,
      659.25,
      null,
      440,
      523.25,
      659.25,
      880,
      783.99,
      659.25,
      523.25,
      440,
      349.23,
      440,
      523.25,
      698.46,
      659.25,
      523.25,
      440,
      349.23,
      392,
      493.88,
      587.33,
      783.99,
      698.46,
      587.33,
      493.88,
      392,
      329.63,
      392,
      493.88,
      659.25,
      587.33,
      493.88,
      392,
      329.63,
      349.23,
      null,
      440,
      523.25,
      659.25,
      null,
      587.33,
      null,
      293.66,
      null,
      349.23,
      440,
      523.25,
      null,
      493.88,
      null,
      329.63,
      null,
      392,
      493.88,
      587.33,
      null,
      523.25,
      null,
      220,
      null,
      261.63,
      329.63,
      440,
      null,
      null,
      null
    ],
    "bass": [
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      110,
      null,
      110,
      null,
      82.41,
      null,
      110,
      null,
      87.31,
      null,
      87.31,
      null,
      65.41,
      null,
      87.31,
      null,
      98,
      null,
      98,
      null,
      73.42,
      null,
      98,
      null,
      82.41,
      null,
      82.41,
      null,
      123.47,
      null,
      82.41,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        220,
        261.63,
        329.63
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        220,
        261.63,
        329.63
      ]
    ]
  },
  {
    "name": "1: Cosmic Nebulae",
    "osc": "sine",
    "decay": 0.22,
    "chime": true,
    "lead": [
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      null,
      233.08,
      null,
      293.66,
      349.23,
      466.16,
      null,
      349.23,
      null,
      349.23,
      null,
      440,
      523.25,
      698.46,
      null,
      523.25,
      null,
      261.63,
      null,
      329.63,
      392,
      523.25,
      null,
      392,
      null,
      392,
      null,
      466.16,
      587.33,
      783.99,
      null,
      587.33,
      null,
      466.16,
      null,
      587.33,
      698.46,
      932.33,
      null,
      698.46,
      null,
      440,
      null,
      523.25,
      659.25,
      880,
      null,
      659.25,
      null,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      null,
      587.33,
      null,
      698.46,
      880,
      1174.66,
      null,
      1046.5,
      null,
      932.33,
      null,
      880,
      698.46,
      783.99,
      null,
      698.46,
      null,
      523.25,
      null,
      659.25,
      783.99,
      1046.5,
      null,
      932.33,
      null,
      880,
      null,
      698.46,
      587.33,
      659.25,
      null,
      587.33,
      null,
      392,
      null,
      466.16,
      587.33,
      698.46,
      null,
      659.25,
      null,
      440,
      null,
      523.25,
      659.25,
      783.99,
      null,
      698.46,
      null,
      466.16,
      null,
      587.33,
      698.46,
      659.25,
      null,
      523.25,
      null,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      null,
      null
    ],
    "bass": [
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      116.54,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      130.81,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      146.83,
      null,
      null,
      null,
      116.54,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      73.42,
      null,
      73.42,
      null,
      110,
      null,
      null,
      null,
      116.54,
      null,
      116.54,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      65.41,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      73.42,
      null,
      110,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      116.54,
      null,
      null,
      null,
      130.81,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        146.83,
        174.61,
        220
      ],
      [
        116.54,
        146.83,
        174.61
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        233.08,
        293.66
      ],
      [
        233.08,
        293.66,
        349.23
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        233.08,
        293.66,
        349.23
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        196,
        233.08,
        293.66
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        233.08,
        293.66,
        349.23
      ],
      [
        146.83,
        174.61,
        220
      ]
    ]
  },
  {
    "name": "2: Alpine Ridge",
    "osc": "triangle",
    "decay": 0.15,
    "lead": [
      493.88,
      null,
      659.25,
      783.99,
      987.77,
      null,
      783.99,
      null,
      523.25,
      null,
      659.25,
      783.99,
      1046.5,
      null,
      783.99,
      null,
      392,
      null,
      493.88,
      587.33,
      783.99,
      null,
      587.33,
      null,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      null,
      659.25,
      null,
      783.99,
      987.77,
      1174.66,
      null,
      987.77,
      null,
      440,
      null,
      523.25,
      659.25,
      880,
      null,
      659.25,
      null,
      493.88,
      null,
      587.33,
      698.46,
      987.77,
      null,
      698.46,
      null,
      329.63,
      null,
      392,
      493.88,
      659.25,
      null,
      493.88,
      null,
      659.25,
      783.99,
      987.77,
      1318.51,
      1174.66,
      987.77,
      783.99,
      659.25,
      523.25,
      659.25,
      783.99,
      1046.5,
      987.77,
      783.99,
      659.25,
      523.25,
      392,
      493.88,
      587.33,
      783.99,
      698.46,
      587.33,
      493.88,
      392,
      587.33,
      698.46,
      880,
      1174.66,
      1046.5,
      880,
      698.46,
      587.33,
      523.25,
      null,
      659.25,
      783.99,
      987.77,
      null,
      880,
      null,
      440,
      null,
      523.25,
      659.25,
      783.99,
      null,
      698.46,
      null,
      493.88,
      null,
      587.33,
      698.46,
      880,
      null,
      783.99,
      null,
      329.63,
      null,
      392,
      493.88,
      659.25,
      null,
      null,
      null
    ],
    "bass": [
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      146.83,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      82.41,
      null,
      82.41,
      null,
      123.47,
      null,
      82.41,
      null,
      65.41,
      null,
      65.41,
      null,
      98,
      null,
      65.41,
      null,
      98,
      null,
      98,
      null,
      73.42,
      null,
      98,
      null,
      73.42,
      null,
      73.42,
      null,
      110,
      null,
      73.42,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        164.81,
        196,
        246.94
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        246.94,
        293.66,
        349.23
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        246.94,
        293.66,
        349.23
      ],
      [
        164.81,
        196,
        246.94
      ]
    ]
  },
  {
    "name": "3: Aurora Summit",
    "osc": "triangle",
    "decay": 0.16,
    "lead": [
      261.63,
      null,
      329.63,
      392,
      523.25,
      null,
      392,
      null,
      392,
      null,
      493.88,
      587.33,
      783.99,
      null,
      587.33,
      null,
      440,
      null,
      523.25,
      659.25,
      880,
      null,
      659.25,
      null,
      349.23,
      null,
      440,
      523.25,
      698.46,
      null,
      523.25,
      null,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      null,
      392,
      null,
      493.88,
      587.33,
      783.99,
      null,
      493.88,
      null,
      329.63,
      null,
      392,
      493.88,
      659.25,
      null,
      392,
      null,
      523.25,
      null,
      659.25,
      783.99,
      1046.5,
      null,
      783.99,
      null,
      523.25,
      659.25,
      783.99,
      1046.5,
      1318.51,
      1567.98,
      1318.51,
      1046.5,
      587.33,
      783.99,
      987.77,
      1174.66,
      1567.98,
      1396.91,
      1174.66,
      987.77,
      880,
      1046.5,
      1318.51,
      1760,
      1567.98,
      1318.51,
      1046.5,
      880,
      698.46,
      880,
      1046.5,
      1396.91,
      1318.51,
      1046.5,
      880,
      698.46,
      659.25,
      null,
      783.99,
      1046.5,
      1318.51,
      null,
      1174.66,
      null,
      587.33,
      null,
      698.46,
      880,
      1046.5,
      null,
      987.77,
      null,
      783.99,
      null,
      987.77,
      1174.66,
      1396.91,
      null,
      1318.51,
      null,
      523.25,
      null,
      659.25,
      783.99,
      1046.5,
      null,
      null,
      null
    ],
    "bass": [
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      65.41,
      null,
      65.41,
      null,
      98,
      null,
      130.81,
      null,
      98,
      null,
      98,
      null,
      73.42,
      null,
      98,
      null,
      110,
      null,
      110,
      null,
      82.41,
      null,
      110,
      null,
      87.31,
      null,
      87.31,
      null,
      65.41,
      null,
      87.31,
      null,
      82.41,
      null,
      null,
      null,
      130.81,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        130.81,
        164.81,
        196
      ]
    ]
  },
  {
    "name": "4: Mirror Temple",
    "osc": "sine",
    "decay": 0.24,
    "chime": true,
    "lead": [
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      349.23,
      233.08,
      null,
      293.66,
      349.23,
      466.16,
      null,
      349.23,
      293.66,
      196,
      null,
      233.08,
      293.66,
      392,
      null,
      293.66,
      233.08,
      220,
      null,
      277.18,
      329.63,
      440,
      null,
      329.63,
      277.18,
      349.23,
      null,
      440,
      523.25,
      698.46,
      null,
      523.25,
      440,
      261.63,
      null,
      329.63,
      392,
      523.25,
      null,
      392,
      329.63,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      440,
      349.23,
      220,
      null,
      261.63,
      329.63,
      440,
      null,
      329.63,
      261.63,
      587.33,
      698.46,
      880,
      1174.66,
      null,
      880,
      698.46,
      587.33,
      466.16,
      587.33,
      698.46,
      932.33,
      null,
      698.46,
      587.33,
      466.16,
      392,
      466.16,
      587.33,
      783.99,
      null,
      587.33,
      466.16,
      392,
      440,
      554.37,
      659.25,
      880,
      null,
      659.25,
      554.37,
      440,
      466.16,
      null,
      587.33,
      698.46,
      880,
      null,
      783.99,
      null,
      392,
      null,
      466.16,
      587.33,
      698.46,
      null,
      659.25,
      null,
      440,
      null,
      554.37,
      659.25,
      783.99,
      null,
      698.46,
      null,
      293.66,
      null,
      349.23,
      440,
      587.33,
      null,
      null,
      null
    ],
    "bass": [
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      116.54,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      130.81,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      73.42,
      null,
      73.42,
      null,
      110,
      null,
      null,
      null,
      116.54,
      null,
      116.54,
      null,
      87.31,
      null,
      null,
      null,
      98,
      null,
      98,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      110,
      null,
      82.41,
      null,
      null,
      null,
      116.54,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        146.83,
        174.61,
        220
      ],
      [
        116.54,
        146.83,
        174.61
      ],
      [
        196,
        233.08,
        293.66
      ],
      [
        110,
        138.59,
        164.81
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        110,
        130.81,
        164.81
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        233.08,
        293.66,
        349.23
      ],
      [
        196,
        233.08,
        293.66
      ],
      [
        110,
        138.59,
        164.81
      ],
      [
        233.08,
        293.66,
        349.23
      ],
      [
        196,
        233.08,
        293.66
      ],
      [
        110,
        138.59,
        164.81
      ],
      [
        146.83,
        174.61,
        220
      ]
    ]
  },
  {
    "name": "5: Chasm Abyss",
    "osc": "triangle",
    "decay": 0.18,
    "lead": [
      329.63,
      null,
      493.88,
      659.25,
      null,
      493.88,
      null,
      392,
      246.94,
      null,
      349.23,
      493.88,
      null,
      349.23,
      null,
      293.66,
      261.63,
      null,
      392,
      523.25,
      null,
      392,
      null,
      329.63,
      196,
      null,
      293.66,
      392,
      null,
      293.66,
      null,
      246.94,
      220,
      null,
      329.63,
      440,
      null,
      329.63,
      null,
      261.63,
      329.63,
      null,
      493.88,
      659.25,
      null,
      493.88,
      null,
      392,
      293.66,
      null,
      440,
      587.33,
      null,
      440,
      null,
      349.23,
      246.94,
      null,
      349.23,
      493.88,
      null,
      349.23,
      null,
      293.66,
      329.63,
      392,
      493.88,
      659.25,
      783.99,
      659.25,
      493.88,
      392,
      261.63,
      329.63,
      392,
      523.25,
      659.25,
      523.25,
      392,
      329.63,
      392,
      493.88,
      587.33,
      783.99,
      987.77,
      783.99,
      587.33,
      493.88,
      440,
      523.25,
      659.25,
      880,
      1046.5,
      880,
      659.25,
      523.25,
      523.25,
      null,
      659.25,
      783.99,
      987.77,
      null,
      880,
      null,
      587.33,
      null,
      698.46,
      880,
      1046.5,
      null,
      987.77,
      null,
      493.88,
      null,
      587.33,
      698.46,
      880,
      null,
      783.99,
      null,
      329.63,
      null,
      392,
      493.88,
      659.25,
      null,
      null,
      null
    ],
    "bass": [
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      61.74,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      55,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      61.74,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      82.41,
      null,
      82.41,
      null,
      null,
      82.41,
      null,
      null,
      65.41,
      null,
      65.41,
      null,
      null,
      65.41,
      null,
      null,
      98,
      null,
      98,
      null,
      null,
      98,
      null,
      null,
      110,
      null,
      110,
      null,
      null,
      110,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      61.74,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        164.81,
        196,
        246.94
      ],
      [
        123.47,
        146.83,
        174.61
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        98,
        123.47,
        146.83
      ],
      [
        110,
        130.81,
        164.81
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        123.47,
        146.83,
        174.61
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        130.81,
        164.81,
        196
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        123.47,
        146.83,
        174.61
      ],
      [
        164.81,
        196,
        246.94
      ]
    ]
  },
  {
    "name": "6: Molten Core",
    "osc": "sawtooth",
    "decay": 0.12,
    "lead": [
      440,
      440,
      523.25,
      587.33,
      null,
      587.33,
      523.25,
      440,
      349.23,
      349.23,
      440,
      523.25,
      null,
      523.25,
      440,
      349.23,
      392,
      392,
      493.88,
      523.25,
      null,
      523.25,
      493.88,
      392,
      329.63,
      392,
      493.88,
      659.25,
      587.33,
      493.88,
      392,
      329.63,
      293.66,
      293.66,
      349.23,
      440,
      null,
      440,
      349.23,
      293.66,
      349.23,
      349.23,
      440,
      523.25,
      null,
      523.25,
      440,
      349.23,
      329.63,
      329.63,
      392,
      493.88,
      null,
      493.88,
      392,
      329.63,
      440,
      523.25,
      659.25,
      880,
      783.99,
      659.25,
      523.25,
      440,
      880,
      880,
      783.99,
      659.25,
      587.33,
      523.25,
      587.33,
      659.25,
      698.46,
      698.46,
      659.25,
      587.33,
      523.25,
      440,
      523.25,
      587.33,
      783.99,
      783.99,
      698.46,
      587.33,
      493.88,
      392,
      493.88,
      587.33,
      659.25,
      783.99,
      987.77,
      1318.51,
      1174.66,
      987.77,
      783.99,
      659.25,
      698.46,
      null,
      587.33,
      null,
      523.25,
      null,
      440,
      null,
      587.33,
      null,
      523.25,
      null,
      440,
      null,
      392,
      null,
      659.25,
      null,
      587.33,
      null,
      493.88,
      null,
      392,
      null,
      440,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "bass": [
      110,
      110,
      null,
      110,
      110,
      null,
      82.41,
      null,
      87.31,
      87.31,
      null,
      87.31,
      87.31,
      null,
      65.41,
      null,
      98,
      98,
      null,
      98,
      98,
      null,
      73.42,
      null,
      82.41,
      82.41,
      null,
      82.41,
      82.41,
      null,
      123.47,
      null,
      73.42,
      73.42,
      null,
      73.42,
      73.42,
      null,
      110,
      null,
      87.31,
      87.31,
      null,
      87.31,
      87.31,
      null,
      65.41,
      null,
      82.41,
      82.41,
      null,
      82.41,
      82.41,
      null,
      123.47,
      null,
      110,
      110,
      null,
      110,
      110,
      null,
      82.41,
      null,
      110,
      null,
      110,
      110,
      null,
      82.41,
      null,
      110,
      87.31,
      null,
      87.31,
      87.31,
      null,
      65.41,
      null,
      87.31,
      98,
      null,
      98,
      98,
      null,
      73.42,
      null,
      98,
      82.41,
      null,
      82.41,
      82.41,
      null,
      123.47,
      null,
      82.41,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        220,
        261.63,
        329.63
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        220,
        261.63,
        329.63
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        196,
        246.94,
        293.66
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        174.61,
        220,
        261.63
      ],
      [
        146.83,
        174.61,
        220
      ],
      [
        164.81,
        196,
        246.94
      ],
      [
        220,
        261.63,
        329.63
      ]
    ]
  },
  {
    "name": "7: Celestial Apex",
    "osc": "triangle",
    "decay": 0.16,
    "chime": true,
    "lead": [
      523.25,
      null,
      783.99,
      659.25,
      1046.5,
      null,
      783.99,
      659.25,
      587.33,
      null,
      880,
      698.46,
      1174.66,
      null,
      880,
      698.46,
      659.25,
      null,
      987.77,
      783.99,
      1318.51,
      null,
      987.77,
      783.99,
      698.46,
      null,
      1046.5,
      880,
      1396.91,
      1318.51,
      1046.5,
      880,
      783.99,
      null,
      1174.66,
      987.77,
      1567.98,
      null,
      1174.66,
      987.77,
      880,
      null,
      1318.51,
      1046.5,
      1760,
      null,
      1318.51,
      1046.5,
      698.46,
      null,
      1046.5,
      880,
      1396.91,
      null,
      1046.5,
      880,
      783.99,
      null,
      1174.66,
      987.77,
      1567.98,
      null,
      1174.66,
      987.77,
      1046.5,
      1567.98,
      1318.51,
      2093,
      1975.53,
      1567.98,
      1318.51,
      1046.5,
      1174.66,
      1760,
      1396.91,
      null,
      2093,
      1760,
      1396.91,
      1174.66,
      1318.51,
      1975.53,
      1567.98,
      null,
      null,
      1975.53,
      1567.98,
      1318.51,
      1396.91,
      2093,
      1760,
      null,
      null,
      2093,
      1760,
      1396.91,
      1567.98,
      null,
      1318.51,
      null,
      1046.5,
      null,
      783.99,
      null,
      1396.91,
      null,
      1174.66,
      null,
      987.77,
      null,
      783.99,
      null,
      1318.51,
      null,
      1046.5,
      null,
      880,
      null,
      698.46,
      null,
      523.25,
      null,
      659.25,
      783.99,
      1046.5,
      null,
      null,
      null
    ],
    "bass": [
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      123.47,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      146.83,
      null,
      null,
      null,
      110,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      73.42,
      null,
      null,
      null,
      65.41,
      null,
      65.41,
      null,
      98,
      null,
      130.81,
      null,
      73.42,
      null,
      73.42,
      null,
      110,
      null,
      146.83,
      null,
      82.41,
      null,
      82.41,
      null,
      123.47,
      null,
      164.81,
      null,
      87.31,
      null,
      87.31,
      null,
      65.41,
      null,
      174.61,
      null,
      98,
      null,
      null,
      null,
      146.83,
      null,
      null,
      null,
      87.31,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      82.41,
      null,
      null,
      null,
      98,
      null,
      null,
      null,
      65.41,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ],
    "chords": [
      [
        261.63,
        329.63,
        392
      ],
      [
        293.66,
        349.23,
        440
      ],
      [
        329.63,
        392,
        493.88
      ],
      [
        349.23,
        440,
        523.25
      ],
      [
        392,
        493.88,
        587.33
      ],
      [
        440,
        523.25,
        659.25
      ],
      [
        349.23,
        440,
        523.25
      ],
      [
        392,
        493.88,
        587.33
      ],
      [
        261.63,
        329.63,
        392
      ],
      [
        293.66,
        349.23,
        440
      ],
      [
        329.63,
        392,
        493.88
      ],
      [
        349.23,
        440,
        523.25
      ],
      [
        392,
        493.88,
        587.33
      ],
      [
        349.23,
        440,
        523.25
      ],
      [
        329.63,
        392,
        493.88
      ],
      [
        261.63,
        329.63,
        392
      ]
    ]
  }
];

    const stepInterval = 0.13; // Calming 115 BPM
    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.musicStep = 0;

    const schedule = () => {
      if (!this.ctx) return;
      const curTime = this.ctx.currentTime;

      if (this.nextStepTime < curTime) {
        this.nextStepTime = curTime + 0.05;
      }

      while (this.nextStepTime < curTime + 0.25) {
        if (this.musicEnabled && !this.muted && this.ctx.state === 'running') {
          const track = TRACKS[this.currentBiome % TRACKS.length];
          const totalSteps = 128;
          const stepIdx = this.musicStep % totalSteps;
          const section = Math.floor(stepIdx / 32); // 0: Intro, 1: Development, 2: Peak / Climax, 3: Resolution

          // 1. Layer 1: Lead Melody Note
          const leadFreq = track.lead[stepIdx];
          if (leadFreq) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = track.osc;
            osc.frequency.setValueAtTime(leadFreq, this.nextStepTime);

            const leadVol = (section === 2) ? 0.20 : 0.16;
            gain.gain.setValueAtTime(leadVol, this.nextStepTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.nextStepTime + track.decay);

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.start(this.nextStepTime);
            osc.stop(this.nextStepTime + track.decay + 0.02);
          }

          // 2. Layer 2: Ambient Harmony Chords / Pad (Triggers every 8 steps)
          if (stepIdx % 8 === 0 && track.chords) {
            const chordIdx = Math.floor(stepIdx / 8) % track.chords.length;
            const chordNotes = track.chords[chordIdx];
            for (const cFreq of chordNotes) {
              const pOsc = this.ctx.createOscillator();
              const pGain = this.ctx.createGain();
              pOsc.type = 'sine';
              pOsc.frequency.setValueAtTime(cFreq, this.nextStepTime);

              pGain.gain.setValueAtTime(0.001, this.nextStepTime);
              pGain.gain.linearRampToValueAtTime(0.05, this.nextStepTime + 0.16);
              pGain.gain.exponentialRampToValueAtTime(0.0005, this.nextStepTime + stepInterval * 7.4);

              pOsc.connect(pGain);
              pGain.connect(this.musicGain);

              pOsc.start(this.nextStepTime);
              pOsc.stop(this.nextStepTime + stepInterval * 7.8);
            }
          }

          // 3. Layer 3: Bassline & Sub-Bass
          const bassFreq = track.bass[stepIdx];
          if (bassFreq) {
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = 'triangle';
            bOsc.frequency.setValueAtTime(bassFreq, this.nextStepTime);

            const bassVol = (section === 2) ? 0.28 : 0.22;
            bGain.gain.setValueAtTime(bassVol, this.nextStepTime);
            bGain.gain.exponentialRampToValueAtTime(0.001, this.nextStepTime + stepInterval * 1.8);

            bOsc.connect(bGain);
            bGain.connect(this.musicGain);

            bOsc.start(this.nextStepTime);
            bOsc.stop(this.nextStepTime + stepInterval * 2);
          }

          // 4. Layer 4: Evolving Chiptune Percussion across the 128-step arrangement
          let shouldKick = false;
          if (section === 0 && (stepIdx % 16 === 0)) shouldKick = true;
          else if ((section === 1 || section === 2) && (stepIdx % 8 === 0)) shouldKick = true;
          else if (section === 3 && (stepIdx % 16 === 0)) shouldKick = true;

          if (shouldKick) {
            const kOsc = this.ctx.createOscillator();
            const kGain = this.ctx.createGain();
            kOsc.type = 'sine';
            kOsc.frequency.setValueAtTime(125, this.nextStepTime);
            kOsc.frequency.exponentialRampToValueAtTime(30, this.nextStepTime + 0.08);

            kGain.gain.setValueAtTime(section === 2 ? 0.26 : 0.19, this.nextStepTime);
            kGain.gain.exponentialRampToValueAtTime(0.001, this.nextStepTime + 0.09);

            kOsc.connect(kGain);
            kGain.connect(this.musicGain);

            kOsc.start(this.nextStepTime);
            kOsc.stop(this.nextStepTime + 0.095);
          }

          // Snare:
          if (section === 2 && (stepIdx % 8 === 4)) {
            this.playSnare(this.nextStepTime, 0.13);
          } else if (section === 1 && (stepIdx % 16 === 8)) {
            this.playSnare(this.nextStepTime, 0.08);
          } else if (section === 3 && (stepIdx % 16 === 12)) {
            this.playSnare(this.nextStepTime, 0.08);
          }

          // Hi-hat ticks:
          if (section === 2 && (stepIdx % 4 === 2)) {
            this.playHiHat(this.nextStepTime, 0.04);
          } else if (section === 1 && (stepIdx % 8 === 4)) {
            this.playHiHat(this.nextStepTime, 0.03);
          }

          // 5. Layer 5: Sparkling Bell Chimes on ethereal biomes
          if (track.chime && (stepIdx % 16 === 6 || stepIdx % 16 === 14)) {
            const chimeFreq = (track.lead[stepIdx] || track.lead[stepIdx - 2] || 660) * 2;
            const cOsc = this.ctx.createOscillator();
            const cGain = this.ctx.createGain();
            cOsc.type = 'sine';
            cOsc.frequency.setValueAtTime(chimeFreq, this.nextStepTime);

            cGain.gain.setValueAtTime(0.06, this.nextStepTime);
            cGain.gain.exponentialRampToValueAtTime(0.0001, this.nextStepTime + 0.35);

            cOsc.connect(cGain);
            cGain.connect(this.musicGain);

            cOsc.start(this.nextStepTime);
            cOsc.stop(this.nextStepTime + 0.36);
          }
        }

        this.nextStepTime += stepInterval;
        this.musicStep++;
      }

      this.schedulerTimer = setTimeout(schedule, 45);
    };

    schedule();
  }
}

export const sfx = new SoundFX();

// Auto-unlock Web Audio on first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sfx.ensureContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}
