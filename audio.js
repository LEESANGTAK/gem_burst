/**
 * Prism Cross: Gem Burst 사운드 엔진
 * 100% Web Audio API 기반 순수 자체 제작 오리지널 크리스탈/젬 신시사이저.
 * 외부 음원 라이선스 문제 0%의 완전한 독자 사운드트랙 & FX.
 */
class GemSoundEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.7;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * 보석(Gem) 매치 & 박살(Shatter) 사운드:
   * 쨍그랑! 크리스탈이 파쇄되는 맑은 타격음 + 콤보에 따른 펜타토닉 멜로디 상승
   */
  playGemMatch(combo = 1, count = 2) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, t);
    masterGain.connect(this.ctx.destination);

    // 1. 쨍그랑! 크리스탈 파쇄 어택음 (Glass / Crystal Shatter Click)
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2800, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    whiteNoise.start(t);

    // 2. 프리즘 크리스탈 하모닉 벨
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00];
    const baseFreq = scale[Math.min(combo - 1, scale.length - 1)];

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, t + 0.005);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.16);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2.01, t + 0.005);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, t + 0.2);

    const matchVol = Math.min(0.55, (0.32 + count * 0.06));
    bellGain.gain.setValueAtTime(0, t + 0.005);
    bellGain.gain.linearRampToValueAtTime(matchVol, t + 0.02);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc1.connect(bellGain);
    osc2.connect(bellGain);
    bellGain.connect(masterGain);

    osc1.start(t + 0.005);
    osc2.start(t + 0.005);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);

    // 3개 이상 멀티 매치 시 풍성한 하모닉스
    if (count >= 3) {
      const harmOsc = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(baseFreq * 1.25, t + 0.03);
      harmGain.gain.setValueAtTime(0, t + 0.03);
      harmGain.gain.linearRampToValueAtTime(matchVol * 0.65, t + 0.05);
      harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      harmOsc.connect(harmGain);
      harmGain.connect(masterGain);
      harmOsc.start(t + 0.03);
      harmOsc.stop(t + 0.4);
    }
  }

  /**
   * 특수 폭탄 폭발 사운드
   */
  playBombExplosion() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(150, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    boomGain.gain.setValueAtTime(0.6 * this.volume, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    boom.connect(boomGain);
    boomGain.connect(this.ctx.destination);
    boom.start(t);
    boom.stop(t + 0.42);
  }

  /**
   * 미스 클릭 워닝 사운드
   */
  playMiss() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.16);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * 피버 모드 진입 사운드 (네온 사이버 신스 팡파레)
   */
  playFeverActivate() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(320, t);
    sweep.frequency.exponentialRampToValueAtTime(1900, t + 0.35);

    sweepGain.gain.setValueAtTime(0.18 * this.volume, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    sweep.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweep.start(t);
    sweep.stop(t + 0.4);

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const st = t + 0.1 + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.38);
    });
  }

  /**
   * 피버 전방향 슈퍼 폭파 사운드 (슈팅 레이저 느낌 극대화)
   */
  playFeverBurst() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 강력한 레이저 발사음
    const laser = this.ctx.createOscillator();
    const laserGain = this.ctx.createGain();
    laser.type = 'sawtooth';
    laser.frequency.setValueAtTime(1400, t);
    laser.frequency.exponentialRampToValueAtTime(90, t + 0.25);

    laserGain.gain.setValueAtTime(0.45 * this.volume, t);
    laserGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    laser.connect(laserGain);
    laserGain.connect(this.ctx.destination);
    laser.start(t);
    laser.stop(t + 0.3);

    // 서브 베이스 쿵
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(220, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.38);

    boomGain.gain.setValueAtTime(0.55 * this.volume, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    boom.connect(boomGain);
    boomGain.connect(this.ctx.destination);
    boom.start(t);
    boom.stop(t + 0.42);
  }

  playShuffleSound() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450 + Math.random() * 650, st);

      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.15 * this.volume, st + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + 0.09);
    }
  }

  playTimeUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [587.33, 523.25, 440];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playVictory() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.50, d: 0.35 }
    ];

    let timeAcc = this.ctx.currentTime;
    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, timeAcc);

      gain.gain.setValueAtTime(0, timeAcc);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, timeAcc + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, timeAcc + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(timeAcc);
      osc.stop(timeAcc + note.d + 0.05);

      timeAcc += note.d * 0.85;
    });
  }
}

window.soundEngine = new GemSoundEngine();
