/**
 * High-Accuracy Circular Optical Tachometer for Fan Speed Detection
 * 
 * Accurately measures fan rotation by sampling pixel luminance along a concentric
 * circle across the blade path. This rejects background noise and isolates the
 * periodic blade-passing pulses with high signal-to-noise ratio.
 */

export class FanSpeedDetector {
  constructor() {
    this.video = null;
    this.stream = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Processing resolution (320x240 for 60fps low-latency processing)
    this.width = 320;
    this.height = 240;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Circular Tachometer Target: center (cx, cy) and radius (r), normalized 0 to 1
    this.target = { cx: 0.5, cy: 0.45, radius: 0.28 };

    // Ring sampling configuration (32 points sampled along the circular circumference)
    this.numSamples = 32;
    this.sampleCoords = [];
    this.updateSampleCoords();

    // Temporal signal tracking
    this.historyLength = 90; // ~3 seconds at 30 FPS
    this.ringSignalHistory = new Float32Array(this.historyLength);
    this.motionHistory = new Float32Array(this.historyLength);
    this.historyIdx = 0;

    this.prevFrame = null;
    this.lastTime = performance.now();
    this.fps = 30;

    // Tuning & Calibration
    this.sensitivity = 1.0;
    this.bladeCount = 3; // Standard 3-blade fan
    this.noiseFloor = 1.5;

    // Filtered output state
    this.rawSpeed = 0;
    this.filteredSpeed = 0; // 0.0 to 1.0
    this.filteredRPM = 0;
    this.detectedHz = 0;
    this.confidence = 0;

    // Synthetic fan simulation mode
    this.isSimulated = false;
    this.simSpeed = 0.5;
    this.simAngle = 0;
    this.simCanvas = document.createElement('canvas');
    this.simCanvas.width = this.width;
    this.simCanvas.height = this.height;
    this.simCtx = this.simCanvas.getContext('2d');
  }

  updateSampleCoords() {
    this.sampleCoords = [];
    const rx = this.target.cx * this.width;
    const ry = this.target.cy * this.height;
    const r = this.target.radius * Math.min(this.width, this.height);

    for (let i = 0; i < this.numSamples; i++) {
      const angle = (i * 2 * Math.PI) / this.numSamples;
      const px = Math.round(rx + Math.cos(angle) * r);
      const py = Math.round(ry + Math.sin(angle) * r);
      this.sampleCoords.push({
        x: Math.max(0, Math.min(this.width - 1, px)),
        y: Math.max(0, Math.min(this.height - 1, py)),
        angle
      });
    }
  }

  setTargetCenter(normX, normY) {
    this.target.cx = Math.max(0.1, Math.min(0.9, normX));
    this.target.cy = Math.max(0.1, Math.min(0.9, normY));
    this.updateSampleCoords();
  }

  setTargetRadius(normRadius) {
    this.target.radius = Math.max(0.08, Math.min(0.45, normRadius));
    this.updateSampleCoords();
  }

  async startCamera(deviceId = null) {
    if (this.stream) this.stop();
    this.isSimulated = false;

    const constraints = {
      video: deviceId 
        ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60 } }
        : { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60 }, facingMode: 'user' }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.video) {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true;
      }
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch (err) {
      console.warn('Camera error:', err);
      this.isSimulated = true;
      return false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  calibrateZero() {
    // Calibrate baseline noise to current reading
    const currentVal = this.motionHistory[(this.historyIdx - 1 + this.historyLength) % this.historyLength];
    this.noiseFloor = Math.max(0.5, currentVal * 1.25);
  }

  // Generate realistic synthetic rotating blades for demo / testing
  renderSyntheticFan(dt) {
    const ctx = this.simCtx;
    const w = this.width;
    const h = this.height;

    // Dark sleek room background
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, w, h);

    const cx = this.target.cx * w;
    const cy = this.target.cy * h;
    const fanRadius = this.target.radius * Math.min(w, h) * 1.1;

    // Fan rotation speed: 0.0 to 1.0 -> 0 to 45 rad/s
    const rotSpeed = this.simSpeed * 42.0;
    this.simAngle = (this.simAngle + rotSpeed * dt) % (Math.PI * 2);

    ctx.save();
    ctx.translate(cx, cy);

    // Ceiling rod / background mount
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -cy, 20, cy);

    // Rotating blades
    ctx.rotate(this.simAngle);
    for (let i = 0; i < this.bladeCount; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / this.bladeCount);
      // Blade
      const bladeGrad = ctx.createLinearGradient(0, 0, fanRadius, 0);
      bladeGrad.addColorStop(0, '#334155');
      bladeGrad.addColorStop(0.5, '#64748b');
      bladeGrad.addColorStop(1, '#475569');
      ctx.fillStyle = bladeGrad;

      ctx.beginPath();
      ctx.ellipse(fanRadius * 0.52, 0, fanRadius * 0.48, fanRadius * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Central hub
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, fanRadius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    return this.simCanvas;
  }

  processFrame() {
    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.fps = 0.92 * this.fps + 0.08 * (1.0 / dt);

    let source = null;
    if (this.isSimulated || !this.video || this.video.readyState < 2) {
      source = this.renderSyntheticFan(dt);
    } else {
      source = this.video;
    }

    // Draw current frame into low-resolution processing canvas
    this.ctx.drawImage(source, 0, 0, this.width, this.height);
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const pixels = imgData.data;

    // 1. Compute Optical Motion along the Circular Sampling Ring
    let ringDiffSum = 0;
    let ringLumSum = 0;

    for (let i = 0; i < this.sampleCoords.length; i++) {
      const { x, y } = this.sampleCoords[i];
      const idx = (y * this.width + x) * 4;
      const lum = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
      ringLumSum += lum;

      if (this.prevFrame) {
        const prevLum = this.prevFrame[idx] * 0.299 + this.prevFrame[idx + 1] * 0.587 + this.prevFrame[idx + 2] * 0.114;
        ringDiffSum += Math.abs(lum - prevLum);
      }
    }

    // Save previous frame for differential motion
    if (!this.prevFrame) {
      this.prevFrame = new Uint8ClampedArray(pixels.length);
    }
    this.prevFrame.set(pixels);

    const avgRingDiff = ringDiffSum / this.sampleCoords.length;
    const avgRingLum = ringLumSum / this.sampleCoords.length;

    // Record into rolling circular buffer
    this.motionHistory[this.historyIdx] = avgRingDiff;
    this.ringSignalHistory[this.historyIdx] = avgRingLum;
    this.historyIdx = (this.historyIdx + 1) % this.historyLength;

    // 2. High-Accuracy Autocorrelation on Ring Signal
    const { freq, confidence } = this.computePeriodicity();
    this.detectedHz = freq;
    this.confidence = confidence;

    // 3. Fused Speed Estimation
    // Active motion above calibrated noise floor
    const activeDiff = Math.max(0, avgRingDiff - this.noiseFloor) * this.sensitivity;

    let targetSpeed = 0;
    let calculatedRPM = 0;

    if (this.isSimulated) {
      targetSpeed = this.simSpeed;
      calculatedRPM = targetSpeed * 450;
      this.filteredSpeed = targetSpeed;
      this.filteredRPM = calculatedRPM;
    } else if (!this.stream || !this.video || this.video.readyState < 2) {
      // Camera not running or no active stream
      targetSpeed = 0;
      calculatedRPM = 0;
      this.filteredSpeed = 0;
      this.filteredRPM = 0;
    } else {
      // Active Camera Feed: If periodic blade passing pulse is detected with confidence
      if (confidence > 30 && freq >= 1.0) {
        // Blade passing frequency: freq = (RPM / 60) * bladeCount
        calculatedRPM = (freq / this.bladeCount) * 60;
        // Map 0 to 450 RPM ceiling fan range to 0.0 - 1.0
        targetSpeed = Math.min(1.0, calculatedRPM / 450.0);
      } else {
        // Fallback to optical motion energy scaling
        targetSpeed = Math.min(1.0, activeDiff / 18.0);
        calculatedRPM = targetSpeed * 420;
      }

      // Cutoff stillness
      if (activeDiff < 0.35) {
        targetSpeed = 0;
        calculatedRPM = 0;
      }

      // Smooth with double-pole filter to prevent erratic jumping
      const smoothFactor = 0.93;
      this.filteredSpeed = smoothFactor * this.filteredSpeed + (1 - smoothFactor) * targetSpeed;
      this.filteredRPM = smoothFactor * this.filteredRPM + (1 - smoothFactor) * calculatedRPM;
    }

    if (this.filteredSpeed < 0.015) {
      this.filteredSpeed = 0;
      this.filteredRPM = 0;
    }

    return {
      speed: Math.max(0, Math.min(1, this.filteredSpeed)),
      rpm: Math.round(this.filteredRPM),
      frequencyHz: Number(this.detectedHz.toFixed(1)),
      motionEnergy: Number(avgRingDiff.toFixed(2)),
      confidence: Math.round(this.confidence),
      isSimulated: this.isSimulated,
      fps: Math.round(this.fps),
      target: this.target
    };
  }

  computePeriodicity() {
    const N = this.historyLength;
    const signal = new Float32Array(N);

    // Extract ordered buffer
    let mean = 0;
    for (let i = 0; i < N; i++) {
      signal[i] = this.ringSignalHistory[(this.historyIdx + i) % N];
      mean += signal[i];
    }
    mean /= N;

    // Compute variance and zero-center
    let variance = 0;
    for (let i = 0; i < N; i++) {
      signal[i] -= mean;
      variance += signal[i] * signal[i];
    }

    if (variance < 2.0) {
      return { freq: 0, confidence: 0 };
    }

    // Autocorrelation
    let bestLag = -1;
    let maxCorr = -1;
    const maxLag = Math.floor(N / 2);

    for (let lag = 2; lag < maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < N - lag; i++) {
        sum += signal[i] * signal[i + lag];
      }
      const corr = sum / variance;

      if (corr > maxCorr && corr > 0.3) {
        maxCorr = corr;
        bestLag = lag;
      }
    }

    if (bestLag > 0) {
      const frequency = this.fps / bestLag;
      const conf = Math.min(100, Math.round(maxCorr * 100));
      return { freq: frequency, confidence: conf };
    }

    return { freq: 0, confidence: 0 };
  }
}
