import React, { useEffect, useRef, useState } from 'react';
import { 
  Wind, 
  Flame, 
  Snowflake, 
  ExternalLink, 
  RotateCcw,
  Palette,
  Cpu,
  Thermometer
} from 'lucide-react';

export default function SideVirtualFan({ 
  realSpeed = 0, 
  realRPM = 0,
  dockSide = 'right',
  onToggleDock,
  laptopFan
}) {
  const canvasRef = useRef(null);
  const pipVideoRef = useRef(null);
  const [fanPalette, setFanPalette] = useState('cyan'); // 'cyan', 'yellow', 'pink', 'lime'
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Inversely Proportional calculation:
  // Real Speed 0.0 -> Virtual 1.0 (Turbo)
  // Real Speed 1.0 -> Virtual 0.0 (Stall)
  const virtualSpeed = Math.max(0, Math.min(1, 1.0 - realSpeed));
  const virtualRPM = Math.round(virtualSpeed * 3200 + (virtualSpeed > 0.02 ? 20 : 0));

  // Keep virtualSpeed in a ref so the animation loop reads the latest value
  // without needing to be re-created on every speed change
  const virtualSpeedRef = useRef(virtualSpeed);
  virtualSpeedRef.current = virtualSpeed;

  // Physics animation state
  const stateRef = useRef({
    angle: 0,
    currentSpeed: 1.0,
    smokeParticles: [],
    windStreaks: [],
    lastTime: performance.now()
  });

  // Neobrutalist Canvas Fan Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = null;

    // Initialize wind streaks
    stateRef.current.windStreaks = Array.from({ length: 14 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: Math.random() * 40 + 20,
      speed: Math.random() * 8 + 6
    }));

    const render = (time) => {
      const state = stateRef.current;
      const dt = Math.min(0.1, (time - state.lastTime) / 1000);
      state.lastTime = time;

      // Smooth inertia — read from ref so the loop doesn't need to restart
      state.currentSpeed = state.currentSpeed * 0.92 + virtualSpeedRef.current * 0.08;
      const spd = state.currentSpeed;

      // Rotation angle
      const maxRotRate = 48.0; // rad/s
      state.angle = (state.angle + spd * maxRotRate * dt) % (Math.PI * 2);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Color palette mapping
      const colors = {
        cyan: { blade: '#38bdf8', accent: '#0284c7', hub: '#fde047' },
        yellow: { blade: '#fde047', accent: '#eab308', hub: '#f43f5e' },
        pink: { blade: '#f43f5e', accent: '#e11d48', hub: '#38bdf8' },
        lime: { blade: '#a3e635', accent: '#65a30d', hub: '#000000' }
      }[fanPalette] || { blade: '#38bdf8', accent: '#0284c7', hub: '#fde047' };

      const cx = w / 2;
      const cy = h / 2 - 15;
      const radius = Math.min(w, h) * 0.38;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Stand Base (Hard Neobrutalist Drop Shadow + Thick Stroke)
      ctx.fillStyle = '#000000';
      ctx.fillRect(-radius * 0.5 + 6, radius + 36, radius, 20); // hard shadow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-radius * 0.5, radius + 30, radius, 20);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(-radius * 0.5, radius + 30, radius, 20);

      // Stand Neck
      ctx.fillStyle = '#000000';
      ctx.fillRect(-6, radius * 0.2, 12, radius + 15);

      // 2. Outer Fan Guard (Thick Comic Outline)
      // Hard offset shadow circle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(6, 6, radius, 0, Math.PI * 2);
      ctx.fill();

      // Guard Backing
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Radial Spokes
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      const spokes = 8;
      for (let i = 0; i < spokes; i++) {
        const rad = (i * Math.PI * 2) / spokes;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rad) * radius, Math.sin(rad) * radius);
        ctx.stroke();
      }

      // Outer Ring Border
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Rotating Blades (Chunky, Pop-Art, Thick Outlines)
      ctx.save();
      ctx.rotate(state.angle);

      const bladeCount = 3;
      const bladeLen = radius * 0.84;
      for (let i = 0; i < bladeCount; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / bladeCount);

        // Blade shape
        ctx.fillStyle = colors.blade;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.ellipse(bladeLen * 0.5, 0, bladeLen * 0.46, radius * 0.24, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Decorative inner accent stripe
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bladeLen * 0.2, 0);
        ctx.lineTo(bladeLen * 0.78, 0);
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();

      // 4. Center Motor Hub
      ctx.fillStyle = colors.hub;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center Hub Text
      ctx.fillStyle = colors.hub === '#000000' ? '#ffffff' : '#000000';
      ctx.font = '900 11px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spd < 0.05 ? 'STALL' : 'ANTI', 0, 0);

      ctx.restore();

      // 5. Comic Wind Streaks when Fast
      if (spd > 0.12) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        state.windStreaks.forEach(strk => {
          strk.x -= strk.speed * (spd * 2.5 + 0.5);
          if (strk.x < -strk.len) {
            strk.x = w + Math.random() * 20;
            strk.y = cy + (Math.random() - 0.5) * radius * 1.5;
          }

          ctx.beginPath();
          ctx.moveTo(strk.x, strk.y);
          ctx.lineTo(strk.x + strk.len * spd, strk.y);
          ctx.stroke();
        });
      }

      // 6. Smoke Puffs when Stalled
      if (spd < 0.1) {
        if (Math.random() < 0.2) {
          state.smokeParticles.push({
            x: cx + (Math.random() - 0.5) * 20,
            y: cy + (Math.random() - 0.5) * 20,
            vy: -(Math.random() * 2 + 1),
            size: Math.random() * 8 + 6,
            life: 1.0
          });
        }
      }

      for (let i = state.smokeParticles.length - 1; i >= 0; i--) {
        const p = state.smokeParticles[i];
        p.y += p.vy;
        p.size += 0.3;
        p.life -= dt * 1.2;

        if (p.life <= 0) {
          state.smokeParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fanPalette]);

  // Picture in Picture
  const togglePiP = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        let video = pipVideoRef.current;
        if (!video) {
          video = document.createElement('video');
          video.muted = true;
          video.playsInline = true;
          pipVideoRef.current = video;
        }
        video.srcObject = canvas.captureStream(30);
        await video.play();
        await video.requestPictureInPicture();
        setIsPiPActive(true);

        video.addEventListener('leavepictureinpicture', () => setIsPiPActive(false), { once: true });
      }
    } catch (err) {
      alert('PiP error: ' + err.message);
    }
  };

  return (
    <aside 
      className={`fixed top-0 bottom-0 z-40 flex flex-col transition-all duration-200 ${
        dockSide === 'right' ? 'right-0 border-l-4' : 'left-0 border-r-4'
      } border-black bg-[#ffffff] w-72 md:w-84 shadow-[-6px_0px_0px_0px_rgba(0,0,0,1)]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b-3 border-black bg-yellow-300">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
            <Wind className={`w-4 h-4 ${virtualSpeed > 0.1 ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">
              Pinned Anti-Fan
            </h3>
            <p className="text-[10px] font-mono font-bold text-black/70">
              INVERSE SPEED LINKED
            </p>
          </div>
        </div>

        {/* Dock flip */}
        <button
          onClick={onToggleDock}
          className="p-1.5 bg-white border-2 border-black nb-btn text-xs font-bold"
          title={`Dock ${dockSide === 'right' ? 'Left' : 'Right'}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Fan Area */}
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
        {/* Canvas Card */}
        <div className="nb-card p-3 flex flex-col items-center relative bg-[#fafaf9]">
          {/* Top Label Badge */}
          <div className="w-full flex items-center justify-between mb-1">
            <span className="nb-badge bg-black text-white px-2 py-0.5 text-[10px]">
              {virtualRPM} RPM
            </span>
            <span className="nb-badge bg-cyan-300 text-black px-2 py-0.5 text-[10px]">
              {(virtualSpeed * 100).toFixed(0)}% THROTTLE
            </span>
          </div>

          {/* 60fps Fan Canvas */}
          <div className="w-full aspect-square max-w-[240px]">
            <canvas 
              ref={canvasRef}
              width={300}
              height={300}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Mini Inverse Meter */}
          <div className="w-full mt-2 space-y-1">
            <div className="flex justify-between text-[10px] font-mono font-bold">
              <span>ROOM: {realRPM} RPM</span>
              <span className="text-blue-600">VIRT: {virtualRPM} RPM</span>
            </div>
            <div className="h-3 w-full border-2 border-black bg-white p-0.5 flex">
              <div 
                className="h-full bg-rose-400 border-r-2 border-black transition-all duration-150"
                style={{ width: `${realSpeed * 100}%` }}
                title="Real Room Fan Speed"
              />
              <div 
                className="h-full bg-sky-300 transition-all duration-150"
                style={{ width: `${virtualSpeed * 100}%` }}
                title="Virtual Screen Fan Speed"
              />
            </div>
          </div>

          {/* Physical Laptop Hardware Link Indicator */}
          <div className="w-full p-2 border-2 border-black bg-emerald-100 shadow-[2px_2px_0px_#000] text-[10px] font-mono mt-2">
            <div className="flex justify-between items-center font-black">
              <span className="flex items-center gap-1 text-emerald-950">
                <Cpu className="w-3.5 h-3.5 text-emerald-700" /> LAPTOP HARDWARE:
              </span>
              <span className="nb-badge bg-black text-emerald-300 px-1.5 py-0 text-[9px]">
                {laptopFan?.targetSpeed !== undefined ? laptopFan.targetSpeed : Math.round(virtualSpeed * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-black/80 mt-1 text-[9px]">
              <span className="flex items-center gap-0.5">
                <Thermometer className="w-3 h-3 text-rose-600" />
                {laptopFan?.temperature ? `${laptopFan.temperature.toFixed(1)}°C` : 'Connected'}
              </span>
              <span className="font-bold text-emerald-800">
                {laptopFan?.syncEnabled ? '● SYNCED' : '○ BIOS AUTO'}
              </span>
            </div>
          </div>
        </div>

        {/* Humorous Verdict Pill */}
        <div className={`p-3 border-3 border-black shadow-[3px_3px_0px_#000] font-mono text-xs ${
          virtualSpeed < 0.15 ? 'bg-rose-200' : virtualSpeed > 0.85 ? 'bg-sky-200' : 'bg-lime-200'
        }`}>
          <div className="font-black text-xs uppercase flex items-center gap-1.5 mb-1">
            {virtualSpeed < 0.15 ? <Flame className="w-4 h-4 text-rose-600" /> : <Snowflake className="w-4 h-4 text-sky-600" />}
            {virtualSpeed < 0.15 ? 'HEAT PRESERVED!' : virtualSpeed > 0.85 ? 'COLD EMERGENCY!' : 'INVERSE EQUILIBRIUM'}
          </div>
          <p className="text-[11px] leading-snug">
            {virtualSpeed < 0.15 
              ? 'Real fan is fast. Virtual fan is stalled to stop room heat from escaping.' 
              : virtualSpeed > 0.85 
              ? 'Real fan is off. Virtual fan running at 3,200 RPM to save you from heat.'
              : 'Balancing ambient heat by resisting real fan airflow.'}
          </p>
        </div>

        {/* Color Switcher */}
        <div className="nb-card-sm p-2.5 space-y-1.5 bg-white">
          <span className="text-xs font-black uppercase flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Blade Color
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'cyan', bg: 'bg-cyan-300' },
              { id: 'yellow', bg: 'bg-yellow-300' },
              { id: 'pink', bg: 'bg-rose-300' },
              { id: 'lime', bg: 'bg-lime-300' }
            ].map(col => (
              <button
                key={col.id}
                onClick={() => setFanPalette(col.id)}
                className={`h-7 border-2 border-black ${col.bg} font-bold text-xs ${
                  fanPalette === col.id ? 'shadow-[2px_2px_0px_#000] translate-x-[1px] translate-y-[1px]' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* PiP Floating Window Button */}
        <button
          onClick={togglePiP}
          className="w-full py-2.5 px-3 bg-yellow-300 hover:bg-yellow-400 border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] font-black text-xs uppercase flex items-center justify-center gap-2 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          {isPiPActive ? 'Close Floating Widget' : 'Float on Desktop (PiP)'}
        </button>
      </div>
    </aside>
  );
}
