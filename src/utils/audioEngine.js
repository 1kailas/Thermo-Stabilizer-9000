// High-Fidelity Procedural Web Audio Engine for the Thermodynamic Anti-Fan
// Generates realistic aerodynamic wind, jet turbine whine, blade-passing vortex chop, and industrial motor drone.

class FanAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.voiceEnabled = true;

    // Audio Nodes
    this.masterGain = null;

    // Wind / Turbulence Pink Noise
    this.noiseNode = null;
    this.noiseFilter = null;
    this.noiseGain = null;

    // High-RPM Jet Turbine Whine (Screaming Overtones at 100%)
    this.turbineOsc = null;
    this.turbineFilter = null;
    this.turbineGain = null;

    // Blade Vortex Chopper (LFO for cyclical blade passing)
    this.chopperLFO = null;
    this.chopperGain = null;

    // Motor Core Drive (Triangle)
    this.motorOsc = null;
    this.motorFilter = null;
    this.motorGain = null;

    // Sub-Bass Mechanical Drone (Sine)
    this.bassOsc = null;
    this.bassGain = null;

    this.lastSpeechTime = 0;
    this.lastSpokenState = '';
    this.isInitialized = false;
    this.currentSpeed = 0;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      const t = this.ctx.currentTime;

      // Master Gain Stage
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, t);
      this.masterGain.connect(this.ctx.destination);

      // --- 1. Procedural High-Quality Pink Noise (Aerodynamic Airflow) ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.setValueAtTime(200, t);
      this.noiseFilter.Q.setValueAtTime(2.0, t);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0, t);

      // --- Blade Vortex Chopper LFO (Creates cyclical blade pulsing at speed) ---
      this.chopperLFO = this.ctx.createOscillator();
      this.chopperLFO.type = 'sine';
      this.chopperLFO.frequency.setValueAtTime(15, t);

      this.chopperGain = this.ctx.createGain();
      this.chopperGain.gain.setValueAtTime(0, t);

      this.chopperLFO.connect(this.chopperGain.gain);
      this.chopperLFO.start();

      this.noiseNode.connect(this.noiseFilter);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);
      this.noiseNode.start();

      // --- 2. Screaming Jet Turbine Oscillator (Max Power Howl at 100%) ---
      this.turbineOsc = this.ctx.createOscillator();
      this.turbineOsc.type = 'sawtooth';
      this.turbineOsc.frequency.setValueAtTime(220, t);

      this.turbineFilter = this.ctx.createBiquadFilter();
      this.turbineFilter.type = 'bandpass';
      this.turbineFilter.frequency.setValueAtTime(1400, t);
      this.turbineFilter.Q.setValueAtTime(3.5, t);

      this.turbineGain = this.ctx.createGain();
      this.turbineGain.gain.setValueAtTime(0, t);

      this.turbineOsc.connect(this.turbineFilter);
      this.turbineFilter.connect(this.turbineGain);
      this.turbineGain.connect(this.masterGain);
      this.turbineOsc.start();

      // --- 3. Motor Core Drive (Electric stator whine) ---
      this.motorOsc = this.ctx.createOscillator();
      this.motorOsc.type = 'triangle';
      this.motorOsc.frequency.setValueAtTime(45, t);

      this.motorFilter = this.ctx.createBiquadFilter();
      this.motorFilter.type = 'lowpass';
      this.motorFilter.frequency.setValueAtTime(800, t);

      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.setValueAtTime(0, t);

      this.motorOsc.connect(this.motorFilter);
      this.motorFilter.connect(this.motorGain);
      this.motorGain.connect(this.masterGain);
      this.motorOsc.start();

      // --- 4. Sub-Bass Mechanical Drone (Physical bearing presence) ---
      this.bassOsc = this.ctx.createOscillator();
      this.bassOsc.type = 'sine';
      this.bassOsc.frequency.setValueAtTime(32, t);

      this.bassGain = this.ctx.createGain();
      this.bassGain.gain.setValueAtTime(0, t);

      this.bassOsc.connect(this.bassGain);
      this.bassGain.connect(this.masterGain);
      this.bassOsc.start();

      this.isInitialized = true;
      console.log('[AudioEngine] Initialized with Turbo Jet Turbine & Dynamic Sound Engine.');
    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
    }
  }

  // Dynamically update audio parameters based on speed (0.0 to 1.0)
  updateSpeed(virtualSpeed) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const spd = Math.max(0, Math.min(1, virtualSpeed));
    this.currentSpeed = spd;

    if (spd < 0.01) {
      // Fan completely stopped / stalled
      this.noiseGain.gain.setTargetAtTime(0, t, 0.15);
      this.turbineGain.gain.setTargetAtTime(0, t, 0.15);
      this.motorGain.gain.setTargetAtTime(0, t, 0.15);
      this.bassGain.gain.setTargetAtTime(0, t, 0.15);
      return;
    }

    // Dynamic Master Gain: Scales up significantly as speed approaches 100%!
    // At idle: 0.35, At 100%: 0.88 (huge, powerful sound!)
    const dynamicMaster = 0.30 + Math.pow(spd, 1.4) * 0.58;
    this.masterGain.gain.setTargetAtTime(dynamicMaster, t, 0.08);

    // --- 1. Wind Filter Cutoff & Volume ---
    // At 100%, filter opens up to 6,500 Hz for full roaring wind velocity
    const cutoff = 220 + Math.pow(spd, 1.8) * 6200;
    this.noiseFilter.frequency.setTargetAtTime(cutoff, t, 0.06);
    this.noiseFilter.Q.setTargetAtTime(1.5 + spd * 2.5, t, 0.06);

    // Wind volume: scales exponentially up to 0.85 at full 100%
    const windVol = Math.pow(spd, 1.1) * 0.85;
    this.noiseGain.gain.setTargetAtTime(windVol, t, 0.06);

    // Blade chopper frequency: 12 Hz up to 48 Hz (pulsing aerodynamic vortex)
    const chopFreq = 12 + spd * 36;
    this.chopperLFO.frequency.setTargetAtTime(chopFreq, t, 0.06);

    // --- 2. Screaming Jet Turbine (Kicks in strongly from 60% to 100%) ---
    // Frequency climbs from 450 Hz up to 2,400 Hz for intense screaming server-fan effect
    const turbineFreq = 380 + Math.pow(spd, 2.0) * 2100;
    this.turbineOsc.frequency.setTargetAtTime(turbineFreq, t, 0.06);
    this.turbineFilter.frequency.setTargetAtTime(turbineFreq, t, 0.06);

    // Turbine volume spikes aggressively above 70% speed (peaks at 0.38 at 100%)
    const turbineVol = spd > 0.4 ? Math.pow((spd - 0.4) / 0.6, 1.6) * 0.42 : 0;
    this.turbineGain.gain.setTargetAtTime(turbineVol, t, 0.06);

    // --- 3. Motor Core Whine ---
    // Frequency from 40 Hz to 420 Hz
    const motorFreq = 40 + spd * 380;
    this.motorOsc.frequency.setTargetAtTime(motorFreq, t, 0.06);
    const motorVol = 0.03 + Math.pow(spd, 1.3) * 0.18;
    this.motorGain.gain.setTargetAtTime(motorVol, t, 0.06);

    // --- 4. Sub-Bass Rumble ---
    const bassFreq = 28 + spd * 42;
    this.bassOsc.frequency.setTargetAtTime(bassFreq, t, 0.06);
    const bassVol = 0.02 + Math.pow(spd, 1.2) * 0.16;
    this.bassGain.gain.setTargetAtTime(bassVol, t, 0.06);

    // Metallic rusty bearing chirp when struggling at low speeds
    if (spd > 0.02 && spd < 0.12 && Math.random() < 0.05) {
      this.playRustySqueak();
    }
  }

  playRustySqueak() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(700 + Math.random() * 200, now + 0.12);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (_) {}
  }

  speakState(text) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (now - this.lastSpeechTime < 5000 || this.lastSpokenState === text) return;
    this.lastSpeechTime = now;
    this.lastSpokenState = text;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.85;
      utterance.rate = 1.15;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, t, 0.05);
    }
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = enabled;
  }
}

export const audioEngine = new FanAudioEngine();
