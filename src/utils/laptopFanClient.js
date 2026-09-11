// Client-side controller and synchronizer for the real physical laptop fan

class LaptopFanClient {
  constructor() {
    this.state = {
      available: false,
      model: 'Checking...',
      fanName: 'CPU fan',
      temperature: 0,
      autoControl: true,
      currentSpeed: 0,
      targetSpeed: 0,
      syncEnabled: true,
      lastError: null,
      lastUpdated: 0
    };

    this.listeners = new Set();
    this.lastSentSpeed = null;
    this.lastSendTime = 0;
    this.sendTimeout = null;
    this.pollInterval = null;

    this.init();
  }

  init() {
    this.fetchStatus();
    this.startPolling();
    this.setupUnloadHandler();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.state });
      } catch (e) {
        console.error('Error notifying fan listener', e);
      }
    }
  }

  setupUnloadHandler() {
    if (typeof window === 'undefined') return;

    const restore = () => {
      try {
        if (this.state.syncEnabled && !this.state.autoControl) {
          const payload = JSON.stringify({ auto: true });
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/laptop-fan', blob);
          } else {
            fetch('/api/laptop-fan', {
              method: 'POST',
              body: payload,
              headers: { 'Content-Type': 'application/json' },
              keepalive: true
            });
          }
        }
      } catch {
        // Ignore during unload
      }
    };

    window.addEventListener('beforeunload', restore);
    window.addEventListener('pagehide', restore);
  }

  async fetchStatus() {
    try {
      const res = await fetch('/api/laptop-fan');
      if (res.ok) {
        const data = await res.json();
        this.state = {
          ...this.state,
          available: data.available,
          model: data.model || this.state.model,
          fanName: data.fanName || this.state.fanName,
          temperature: data.temperature || this.state.temperature,
          autoControl: data.autoControl,
          currentSpeed: data.currentSpeed || 0,
          targetSpeed: data.targetSpeed || 0,
          lastError: null,
          lastUpdated: Date.now()
        };
        this.notify();
      }
    } catch (err) {
      this.state.lastError = err.message;
      this.notify();
    }
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.fetchStatus();
    }, 2500);
  }

  setSyncEnabled(enabled) {
    this.state.syncEnabled = enabled;
    if (!enabled) {
      this.setAuto();
    } else {
      this.notify();
    }
  }

  async setAuto() {
    try {
      const res = await fetch('/api/laptop-fan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto: true })
      });
      if (res.ok) {
        const data = await res.json();
        this.state = {
          ...this.state,
          autoControl: true,
          targetSpeed: data.targetSpeed || 0,
          temperature: data.temperature || this.state.temperature
        };
        this.lastSentSpeed = null;
        this.notify();
      }
    } catch (err) {
      console.error('Failed to restore auto fan:', err);
    }
  }

  // Throttle syncing speed to physical hardware fan
  syncSpeed(virtualSpeedNormalized) {
    if (!this.state.syncEnabled || !this.state.available) return;

    const targetPercent = Math.max(0, Math.min(100, Math.round(virtualSpeedNormalized * 100)));

    // Skip if speed is identical or within 1% threshold to avoid hardware chatter
    if (this.lastSentSpeed !== null && Math.abs(this.lastSentSpeed - targetPercent) < 2) {
      return;
    }

    const now = Date.now();
    const minInterval = 350; // ms

    if (now - this.lastSendTime < minInterval) {
      if (this.sendTimeout) clearTimeout(this.sendTimeout);
      this.sendTimeout = setTimeout(() => {
        this.dispatchSpeed(targetPercent);
      }, minInterval - (now - this.lastSendTime));
      return;
    }

    this.dispatchSpeed(targetPercent);
  }

  async dispatchSpeed(targetPercent) {
    this.lastSendTime = Date.now();
    this.lastSentSpeed = targetPercent;

    try {
      const res = await fetch('/api/laptop-fan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: targetPercent })
      });
      if (res.ok) {
        const data = await res.json();
        this.state = {
          ...this.state,
          autoControl: false,
          targetSpeed: data.targetSpeed !== undefined ? data.targetSpeed : targetPercent,
          temperature: data.temperature || this.state.temperature,
          lastUpdated: Date.now()
        };
        this.notify();
      }
    } catch (err) {
      console.error('Failed to sync fan speed to hardware:', err);
    }
  }
}

export const laptopFanClient = new LaptopFanClient();
