/**
 * Procedural Web Audio API Sound Synthesizer
 * Generates all arcade game sounds (Engine rumble, crash, metal clash, horn, UI) in code.
 * Zero external audio files (no 404s, offline capable).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Start procedural V8 Monster Truck engine rumble
   */
  public startEngine(speedMultiplier: number = 1.0) {
    if (this.isEngineRunning || this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      const baseFreq = 55 + (speedMultiplier - 1.0) * 25;
      this.engineOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Audio might be blocked until user gesture
    }
  }

  /**
   * Update engine pitch with driving speed
   */
  public updateEnginePitch(speedMultiplier: number) {
    if (!this.engineOsc || !this.ctx || !this.isEngineRunning) return;
    const freq = Math.min(140, 50 + (speedMultiplier - 1.0) * 45);
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      this.isEngineRunning = false;
    } catch {
      // Ignore
    }
  }

  public unlock() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Blockbuster Cinematic Bomb Explosion (쾅---!! / 펑---!!)
   * 1. Detonation Shockwave Transient (초기 고압 폭발 충격파)
   * 2. Heavy Sub-Bass Boom (180Hz -> 24Hz 초저역 폭음)
   * 3. Expanding Fireball & Gas Roar (화염 폭압 저주파 럼블)
   * 4. Shrapnel Crackle & Metal Shatter (파편 파열음)
   */
  public playCrush() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const blastDuration = 0.85;

    // === LAYER 1: Massive Bomb Shockwave & Noise Blast (초기 폭압 쾅!) ===
    const bufferSize = Math.floor(this.ctx.sampleRate * blastDuration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    // Multi-octave brown/pink explosive noise with sudden heavy attack and long rumble tail
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration for heavy explosive body
      lastOut = (lastOut + 0.04 * white) / 1.04;
      const progress = i / bufferSize;
      const decay = Math.exp(-progress * 4.2);
      // Random violent shrapnel/crackle spikes
      const crackle = Math.random() < 0.06 ? (Math.random() * 2 - 1) * 1.8 : 0;
      noiseData[i] = (lastOut * 3.5 + white * 0.4 + crackle) * decay;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Aggressive Soft-Clipping Distortion for explosive loudness
    const waveShaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      curve[i] = Math.tanh(x * 2.2);
    }
    waveShaper.curve = curve;

    // Dynamic sweeping Low-Pass Filter (from wide 2200Hz down to deep 45Hz)
    const sweepFilter = this.ctx.createBiquadFilter();
    sweepFilter.type = 'lowpass';
    sweepFilter.frequency.setValueAtTime(2400, t);
    sweepFilter.frequency.exponentialRampToValueAtTime(55, t + blastDuration);
    sweepFilter.Q.setValueAtTime(4.5, t);

    const blastGain = this.ctx.createGain();
    blastGain.gain.setValueAtTime(1.1, t);
    blastGain.gain.exponentialRampToValueAtTime(0.005, t + blastDuration);

    noiseSource.connect(waveShaper);
    waveShaper.connect(sweepFilter);
    sweepFilter.connect(blastGain);
    blastGain.connect(this.ctx.destination);
    noiseSource.start(t);

    // === LAYER 2: Deep Sub-Bass Explosive Punch (초저음 우퍼 쿵---!!) ===
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(190, t);
    subOsc.frequency.exponentialRampToValueAtTime(26, t + 0.55);

    subGain.gain.setValueAtTime(1.2, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.7);

    // === LAYER 3: Mid-Frequency TNT Detonation Thud (다이너마이트 타격 퍽!) ===
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(120, t);
    thudOsc.frequency.exponentialRampToValueAtTime(35, t + 0.25);

    thudGain.gain.setValueAtTime(0.8, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thudOsc.start(t);
    thudOsc.stop(t + 0.32);

    // === LAYER 4: High-frequency Shrapnel & Flame Sizzle (화염 & 파편 챠아악!) ===
    const sizzleDuration = 0.4;
    const sizzleBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * sizzleDuration), this.ctx.sampleRate);
    const sizzleData = sizzleBuffer.getChannelData(0);
    for (let i = 0; i < sizzleData.length; i++) {
      sizzleData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const sizzleSource = this.ctx.createBufferSource();
    sizzleSource.buffer = sizzleBuffer;

    const sizzleFilter = this.ctx.createBiquadFilter();
    sizzleFilter.type = 'bandpass';
    sizzleFilter.frequency.setValueAtTime(3400, t);
    sizzleFilter.frequency.exponentialRampToValueAtTime(900, t + sizzleDuration);
    sizzleFilter.Q.setValueAtTime(3.0, t);

    const sizzleGain = this.ctx.createGain();
    sizzleGain.gain.setValueAtTime(0.65, t);
    sizzleGain.gain.exponentialRampToValueAtTime(0.005, t + sizzleDuration);

    sizzleSource.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(this.ctx.destination);
    sizzleSource.start(t);
  }

  /**
   * Apocalyptic Thermonuclear Detonation (초대형 핵폭발 사운드 - 콰아아아아앙---!!!!)
   * 1. Blinding Shockwave Attack (초음속 핵폭압 스파이크)
   * 2. Double Sub-Harmonic Seismic Earthquake Rumble (지축을 흔드는 150Hz->16Hz 초저주파 지진파)
   * 3. Mushroom Cloud Firestorm Roar (1.8초 동안 대기를 집어삼키는 핵폭풍 굉음)
   * 4. Resonant Atmospheric Shock Front (대기 팽창 공명 파열음)
   * 5. Nuclear EMP Glitch Drone (전자기 펄스 왜곡음)
   */
  public playTankCrash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const nukeDuration = 1.8;

    // === LAYER 1: Colossal Atmospheric Firestorm & Nuclear Wind (핵폭풍 굉음) ===
    const bufferSize = Math.floor(this.ctx.sampleRate * nukeDuration);
    const nukeBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const nukeData = nukeBuffer.getChannelData(0);

    let brownAcc = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      brownAcc = (brownAcc + 0.035 * white) / 1.035;
      const progress = i / bufferSize;
      // Nuclear blast envelope: instant peak, sustained massive fireball, prolonged ground rumble
      const envelope = Math.pow(1.0 - progress, 1.8) * (1.0 + Math.sin(progress * 28) * 0.15);
      const crackle = Math.random() < 0.08 ? (Math.random() * 2 - 1) * 2.2 : 0;
      nukeData[i] = (brownAcc * 4.2 + white * 0.35 + crackle) * envelope;
    }

    const nukeSource = this.ctx.createBufferSource();
    nukeSource.buffer = nukeBuffer;

    // Extreme overdrive saturation for nuclear detonation clipping
    const waveShaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      curve[i] = Math.tanh(x * 3.2);
    }
    waveShaper.curve = curve;

    const nukeFilter = this.ctx.createBiquadFilter();
    nukeFilter.type = 'lowpass';
    nukeFilter.frequency.setValueAtTime(3200, t);
    nukeFilter.frequency.exponentialRampToValueAtTime(38, t + nukeDuration);
    nukeFilter.Q.setValueAtTime(5.5, t);

    const nukeGain = this.ctx.createGain();
    nukeGain.gain.setValueAtTime(1.4, t);
    nukeGain.gain.exponentialRampToValueAtTime(0.002, t + nukeDuration);

    nukeSource.connect(waveShaper);
    waveShaper.connect(nukeFilter);
    nukeFilter.connect(nukeGain);
    nukeGain.connect(this.ctx.destination);
    nukeSource.start(t);

    // === LAYER 2: Tectonic Seismic Infrasound (지축을 가르는 1차 초저음 진동 150Hz -> 16Hz) ===
    const sub1 = this.ctx.createOscillator();
    const subGain1 = this.ctx.createGain();
    sub1.type = 'sawtooth';
    sub1.frequency.setValueAtTime(160, t);
    sub1.frequency.exponentialRampToValueAtTime(18, t + 1.2);

    const subFilter1 = this.ctx.createBiquadFilter();
    subFilter1.type = 'lowpass';
    subFilter1.frequency.setValueAtTime(180, t);
    subFilter1.frequency.linearRampToValueAtTime(40, t + 1.2);

    subGain1.gain.setValueAtTime(1.3, t);
    subGain1.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    sub1.connect(subFilter1);
    subFilter1.connect(subGain1);
    subGain1.connect(this.ctx.destination);
    sub1.start(t);
    sub1.stop(t + 1.45);

    // === LAYER 3: Detuned Infrasound Interference (110Hz -> 12Hz 맥놀이 진동) ===
    const sub2 = this.ctx.createOscillator();
    const subGain2 = this.ctx.createGain();
    sub2.type = 'sine';
    sub2.frequency.setValueAtTime(115, t);
    sub2.frequency.exponentialRampToValueAtTime(14, t + 1.5);

    subGain2.gain.setValueAtTime(1.1, t);
    subGain2.gain.exponentialRampToValueAtTime(0.001, t + 1.6);

    sub2.connect(subGain2);
    subGain2.connect(this.ctx.destination);
    sub2.start(t);
    sub2.stop(t + 1.65);

    // === LAYER 4: Nuclear EMP & High Shockwave Tear (대기 찢김 고음 파열음) ===
    const empOsc = this.ctx.createOscillator();
    const empGain = this.ctx.createGain();
    empOsc.type = 'sawtooth';
    empOsc.frequency.setValueAtTime(680, t);
    empOsc.frequency.exponentialRampToValueAtTime(45, t + 0.6);

    const empFilter = this.ctx.createBiquadFilter();
    empFilter.type = 'bandpass';
    empFilter.frequency.setValueAtTime(1200, t);
    empFilter.frequency.exponentialRampToValueAtTime(180, t + 0.6);
    empFilter.Q.setValueAtTime(4.0, t);

    empGain.gain.setValueAtTime(0.75, t);
    empGain.gain.exponentialRampToValueAtTime(0.005, t + 0.6);

    empOsc.connect(empFilter);
    empFilter.connect(empGain);
    empGain.connect(this.ctx.destination);
    empOsc.start(t);
    empOsc.stop(t + 0.65);
  }

  /**
   * Quick whoosh when switching lanes
   */
  public playLaneSwitch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Warning buzzer when car escapes / heart lost
   */
  public playMissedCar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.setValueAtTime(130, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Combo cheer chime
   */
  public playCombo(streak: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    const baseFreq = notes[Math.min(streak - 1, notes.length - 1)] || 880;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Victory sound on 60s completion
   */
  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((note, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t + idx * 0.12);

      gain.gain.setValueAtTime(0.2, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }
}

export const soundManager = new SoundManager();
