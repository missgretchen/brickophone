const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export default class SynthEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.analyser = null;
    this.waveformBuffer = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();
    this.analyser = this.ctx.createAnalyser();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 2200;
    this.filter.Q.value = 0.8;
    this.master.gain.value = 0.18;
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;
    this.waveformBuffer = new Uint8Array(this.analyser.frequencyBinCount);

    this.filter.connect(this.analyser);
    this.analyser.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.initialized = true;
  }

  async resume() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  setFilter(cutoff, resonance) {
    if (!this.initialized) return;
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.01);
    this.filter.Q.setTargetAtTime(resonance, this.ctx.currentTime, 0.01);
  }

  getWaveformData() {
    if (!this.initialized || !this.analyser || !this.waveformBuffer) return null;
    this.analyser.getByteTimeDomainData(this.waveformBuffer);
    return this.waveformBuffer;
  }

  triggerNote({
    key = "C",
    octave = 4,
    degree = 0,
    scale = [0, 3, 5, 7, 10],
    waveform = "square",
    velocity = 0.6,
    duration = 0.18,
  }) {
    if (!this.initialized || !this.ctx) return;
    const semitoneRoot = NOTE_TO_SEMITONE[key] ?? 0;
    const octaveOffset = Math.floor(degree / scale.length);
    const scaleIndex = degree % scale.length;
    const semitone = semitoneRoot + scale[scaleIndex] + octaveOffset * 12;
    const midi = 12 * (octave + 1) + semitone;
    const freq = 440 * 2 ** ((midi - 69) / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = waveform;
    osc.frequency.value = freq;

    const now = this.ctx.currentTime;
    const attack = 0.006;
    const decay = duration;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(velocity, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(now);
    osc.stop(now + attack + decay + 0.02);
  }
}
