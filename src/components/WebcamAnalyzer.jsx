import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, 
  VideoOff, 
  Crosshair, 
  RotateCw,
  Check,
  Zap
} from 'lucide-react';

export default function WebcamAnalyzer({ 
  detector, 
  onFrameResult, 
  isSimulated,
  setIsSimulated,
  simSpeed,
  setSimSpeed
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [metrics, setMetrics] = useState({ speed: 0, rpm: 0, frequencyHz: 0, confidence: 0 });
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Start / Stop Camera
  const startCamera = async () => {
    setIsSimulated(false);
    const ok = await detector.startCamera();
    if (ok) {
      setIsCameraActive(true);
      if (videoRef.current && detector.video) {
        videoRef.current.srcObject = detector.stream;
      }
    } else {
      setIsCameraActive(false);
      setIsSimulated(true);
    }
  };

  const stopCamera = () => {
    detector.stop();
    setIsCameraActive(false);
  };

  // Center tachometer on click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    detector.setTargetCenter(x, y);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.02 : 0.02;
    detector.setTargetRadius(detector.target.radius + delta);
  };

  // Render loop
  useEffect(() => {
    let animId = null;
    let lastStateUpdate = 0;
    const STATE_UPDATE_INTERVAL = 66; // ~15fps for React state (avoids 60fps re-renders)

    const render = (now) => {
      const res = detector.processFrame();

      // Only push state updates to React at a throttled rate to avoid
      // cascading re-renders at 60fps which cause visible stuttering
      if (now - lastStateUpdate > STATE_UPDATE_INTERVAL) {
        lastStateUpdate = now;
        setMetrics(res);
        if (onFrameResult) onFrameResult(res);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const target = detector.target;
        const cx = target.cx * w;
        const cy = target.cy * h;
        const r = target.radius * Math.min(w, h);

        // Circular Tachometer Ring in bold Neobrutalist styling
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = res.speed > 0.05 ? '#fde047' : '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center crosshair
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
        ctx.stroke();

        // Circumference sample dots
        const points = detector.sampleCoords;
        for (let i = 0; i < points.length; i++) {
          const px = (points[i].x / detector.width) * w;
          const py = (points[i].y / detector.height) * h;
          ctx.fillStyle = res.speed > 0.05 ? '#fde047' : '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Badge pill
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 65, cy - r - 26, 130, 22);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cx - 65, cy - r - 26, 130, 22);

        ctx.fillStyle = '#000000';
        ctx.font = '900 10px "Space Grotesk", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLICK FAN HUB', cx, cy - r - 11);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [detector]);

  return (
    <div className="nb-card p-4 space-y-3">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_#000]">
            <Camera className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">
              Camera Fan Tracker
            </h3>
            <p className="text-[11px] font-mono text-black/70">
              Click fan on feed to lock circular tachometer
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !isSimulated;
              setIsSimulated(next);
              detector.isSimulated = next;
              if (next) stopCamera();
            }}
            className={`px-3 py-1.5 rounded-none border-2 border-black font-black text-xs uppercase nb-btn ${
              isSimulated ? 'bg-amber-300' : 'bg-white hover:bg-slate-100'
            }`}
          >
            {isSimulated ? 'Exit Demo' : '🧪 Demo Mode'}
          </button>

          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-400 hover:bg-rose-500 border-2 border-black font-black text-xs uppercase nb-btn"
            >
              <VideoOff className="w-3.5 h-3.5" /> Stop Cam
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-300 hover:bg-emerald-400 border-2 border-black font-black text-xs uppercase nb-btn"
            >
              <Camera className="w-3.5 h-3.5" /> Start Cam
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport */}
      <div 
        className="relative aspect-video w-full border-3 border-black bg-white cursor-crosshair overflow-hidden shadow-[4px_4px_0px_#000]"
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        title="Click on fan hub to lock ring. Scroll wheel to resize."
      >
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isCameraActive && !isSimulated ? 'block' : 'none' }}
        />

        {/* Fallback preview */}
        {(!isCameraActive || isSimulated) && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#fffbeb]">
            {isSimulated ? (
              <div className="space-y-2">
                <div className="w-12 h-12 border-3 border-black bg-yellow-300 shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto animate-spin" style={{ animationDuration: `${Math.max(0.2, 2.5 - simSpeed * 2.3)}s` }}>
                  <RotateCw className="w-6 h-6 text-black" />
                </div>
                <h4 className="text-xs font-black uppercase text-black font-mono">
                  Fan Simulator Active ({Math.round(simSpeed * 450)} RPM)
                </h4>
                <p className="text-[11px] font-mono text-black/70">
                  Drag the speed slider below to test the inverse reaction!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5 text-black" />
                </div>
                <p className="text-xs font-mono font-bold text-black">
                  Click <strong>Start Cam</strong> to track your real fan, or <strong>Demo Mode</strong> to test.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reticle Canvas */}
        <canvas 
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Live HUD Pill */}
        <div className="absolute top-2 left-2 nb-badge bg-white text-black px-2 py-1 text-[10px]">
          REAL FAN: {metrics.rpm} RPM &bull; {metrics.frequencyHz} Hz
        </div>

        <div className="absolute bottom-2 right-2 nb-badge bg-yellow-300 text-black px-2 py-0.5 text-[9px]">
          Scroll to resize ring
        </div>
      </div>

      {/* Demo Slider (Only shown if in Demo Mode) */}
      {isSimulated && (
        <div className="p-3 border-2 border-black bg-yellow-200 shadow-[3px_3px_0px_#000] flex items-center gap-3">
          <span className="text-xs font-black uppercase whitespace-nowrap font-mono flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Real Fan Speed:
          </span>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={simSpeed}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setSimSpeed(v);
              detector.simSpeed = v;
            }}
            className="w-full accent-black cursor-pointer"
          />
          <span className="nb-badge bg-black text-white px-2 py-0.5 text-xs">
            {(simSpeed * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Calibration & Blade Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[11px]">Blades:</span>
          {[3, 4, 5].map(b => (
            <button
              key={b}
              onClick={() => { detector.bladeCount = b; }}
              className={`px-2 py-0.5 border-2 border-black font-bold text-xs nb-btn ${
                detector.bladeCount === b ? 'bg-yellow-300' : 'bg-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            detector.calibrateZero();
            setIsCalibrated(true);
            setTimeout(() => setIsCalibrated(false), 2000);
          }}
          className="px-2.5 py-1 bg-white hover:bg-yellow-100 border-2 border-black font-bold text-xs nb-btn flex items-center gap-1"
        >
          {isCalibrated ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Crosshair className="w-3.5 h-3.5" />}
          {isCalibrated ? 'Calibrated!' : 'Calibrate Stillness'}
        </button>
      </div>
    </div>
  );
}
