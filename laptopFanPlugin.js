import { exec, execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

class LaptopFanController {
  constructor() {
    this.isAvailable = false;
    this.model = 'Unknown';
    this.fanName = 'CPU fan';
    this.lastTargetSpeed = null;
    this.lastExecTime = 0;
    this.pendingSpeed = null;
    this.isExecuting = false;
    this.autoControl = true;
    this.temperature = 0;
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.syncEnabled = true;

    this.checkAvailability();
    this.setupCleanup();
  }

  async checkAvailability() {
    try {
      const { stdout } = await execAsync('which nbfc');
      if (stdout.trim()) {
        this.isAvailable = true;
        await this.pollStatus();
      }
    } catch {
      this.isAvailable = false;
    }
  }

  setupCleanup() {
    const restoreAuto = () => {
      try {
        if (this.isAvailable && !this.autoControl) {
          exec('nbfc set -a');
          console.log('[LaptopFan] Restored hardware fan auto-control on exit.');
        }
      } catch (err) {
        // ignore on exit
      }
    };

    process.on('SIGINT', () => {
      restoreAuto();
      process.exit();
    });
    process.on('SIGTERM', () => {
      restoreAuto();
      process.exit();
    });
    process.on('exit', restoreAuto);
  }

  async pollStatus() {
    if (!this.isAvailable) return this.getStatus();
    try {
      const { stdout } = await execFileAsync('nbfc', ['status'], { timeout: 3000 });
      const parsed = {};
      for (const line of stdout.split('\n')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          parsed[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      }

      this.model = parsed['Selected Config Name'] || this.model;
      this.fanName = parsed['Fan Display Name'] || this.fanName;
      this.temperature = parseFloat(parsed['Temperature']) || this.temperature;
      this.autoControl = parsed['Auto Control Enabled'] === 'true';
      this.currentSpeed = parseFloat(parsed['Current Fan Speed']) || 0;
      if (this.lastTargetSpeed !== null && !this.autoControl) {
        this.targetSpeed = this.lastTargetSpeed;
      } else {
        this.targetSpeed = parseFloat(parsed['Target Fan Speed']) || 0;
      }
    } catch (e) {
      // keep previous values if polling transiently fails
    }
    return this.getStatus();
  }

  getStatus() {
    return {
      available: this.isAvailable,
      model: this.model,
      fanName: this.fanName,
      temperature: this.temperature,
      autoControl: this.autoControl,
      currentSpeed: this.currentSpeed,
      targetSpeed: this.targetSpeed,
      syncEnabled: this.syncEnabled,
      timestamp: Date.now()
    };
  }

  async setAuto() {
    if (!this.isAvailable) return this.getStatus();
    try {
      await execFileAsync('nbfc', ['set', '-a'], { timeout: 3000 });
      this.autoControl = true;
      this.lastTargetSpeed = null;
      await this.pollStatus();
    } catch (err) {
      console.error('[LaptopFan] Failed to set auto control:', err.message);
    }
    return this.getStatus();
  }

  async setSpeed(target) {
    if (!this.isAvailable) return this.getStatus();
    const clamped = Math.max(0, Math.min(100, Math.round(target)));

    // Avoid running if already at target speed and manual control
    if (this.lastTargetSpeed === clamped && !this.autoControl) {
      return this.getStatus();
    }

    // Rate-limit hardware writes to at most once per 250ms
    const now = Date.now();
    if (this.isExecuting || now - this.lastExecTime < 250) {
      this.pendingSpeed = clamped;
      return this.getStatus();
    }

    this.isExecuting = true;
    try {
      await execFileAsync('nbfc', ['set', '-s', clamped.toString()], { timeout: 3000 });
      this.lastTargetSpeed = clamped;
      this.lastExecTime = Date.now();
      this.autoControl = false;
      this.targetSpeed = clamped;
    } catch (err) {
      console.error('[LaptopFan] Failed to set speed:', err.message);
    } finally {
      this.isExecuting = false;
      if (this.pendingSpeed !== null && this.pendingSpeed !== this.lastTargetSpeed) {
        const next = this.pendingSpeed;
        this.pendingSpeed = null;
        setTimeout(() => this.setSpeed(next), 250);
      }
    }

    return this.getStatus();
  }
}

export const laptopFanController = new LaptopFanController();

export function laptopFanPlugin() {
  const handler = async (req, res, next) => {
    if (!req.url.startsWith('/api/laptop-fan')) {
      return next();
    }

    if (req.method === 'GET') {
      const status = await laptopFanController.pollStatus();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(status));
      return;
    }

    if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', (chunk) => {
        bodyStr += chunk;
      });
      req.on('end', async () => {
        try {
          const body = bodyStr ? JSON.parse(bodyStr) : {};
          if (body.enabled !== undefined) {
            laptopFanController.syncEnabled = Boolean(body.enabled);
          }

          if (body.auto || laptopFanController.syncEnabled === false) {
            const status = await laptopFanController.setAuto();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, ...status }));
            return;
          }

          if (typeof body.speed === 'number') {
            const status = await laptopFanController.setSpeed(body.speed);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, ...status }));
            return;
          }

          const status = await laptopFanController.pollStatus();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, ...status }));
        } catch (e) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'laptop-fan-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}
