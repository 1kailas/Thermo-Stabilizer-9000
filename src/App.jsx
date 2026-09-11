import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FanSpeedDetector } from './utils/fanDetector';
import { audioEngine } from './utils/audioEngine';
import { laptopFanClient } from './utils/laptopFanClient';
import { useLaptopFan } from './utils/useLaptopFan';
import SideVirtualFan from './components/SideVirtualFan';
import WebcamAnalyzer from './components/WebcamAnalyzer';
import TelemetryDashboard from './components/TelemetryDashboard';
import UselessExplainModal from './components/UselessExplainModal';
import { RotateCcw, Volume2, Cpu } from 'lucide-react';

export default function App() {
  const detector = useMemo(() => new FanSpeedDetector(), []);
  const laptopFan = useLaptopFan();
  
  const [metrics, setMetrics] = useState({
    speed: 0,
    rpm: 0,
    frequencyHz: 0,
    confidence: 0
  });

  const [isSimulated, setIsSimulated] = useState(true);
  const [simSpeed, setSimSpeed] = useState(0.0);
  const [dockSide, setDockSide] = useState('right');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Keep detector in sync with simulation state
  useEffect(() => {
    detector.isSimulated = isSimulated;
    detector.simSpeed = simSpeed;
    if (isSimulated) {
      detector.filteredSpeed = simSpeed;
      detector.filteredRPM = simSpeed * 450;
    }
  }, [detector, isSimulated, simSpeed]);

  // Audio setup on user interaction
  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      audioEngine.init();
    }
  };

  // Store latest speed in a ref so audio & fan sync updates don't cause re-renders
  const latestSpeedRef = useRef(0);
  latestSpeedRef.current = metrics.speed;

  // Speed-based audio, voice & physical laptop fan updates (throttled via interval, not per-render)
  const prevSpeedCategory = useRef('stopped');
  useEffect(() => {
    const interval = setInterval(() => {
      const realSpd = latestSpeedRef.current;
      const virtSpd = Math.max(0, 1.0 - realSpd);
      audioEngine.updateSpeed(virtSpd);
      
      // Synchronize physical laptop fan hardware with virtual fan speed
      laptopFanClient.syncSpeed(virtSpd);

      let currentCategory = 'stopped';
      if (realSpd > 0.7) currentCategory = 'fast';
      else if (realSpd > 0.25) currentCategory = 'medium';

      if (currentCategory !== prevSpeedCategory.current) {
        prevSpeedCategory.current = currentCategory;
        if (currentCategory === 'fast') {
          audioEngine.speakState('Real fan fast! Stalling virtual fan to preserve room heat.');
        } else if (currentCategory === 'stopped') {
          audioEngine.speakState('Real fan stopped. Turbocharging virtual fan and laptop hardware to maximum.');
        }
      }
    }, 100); // Update at 10Hz
    return () => clearInterval(interval);
  }, []);

  // Set direct virtual fan speed (for preset buttons or direct testing)
  const handleSetVirtualSpeed = useCallback((targetVirtSpeed) => {
    setIsSimulated(true);
    const calculatedRealSpeed = Math.max(0, Math.min(1, 1.0 - targetVirtSpeed));
    setSimSpeed(calculatedRealSpeed);
    detector.isSimulated = true;
    detector.simSpeed = calculatedRealSpeed;
    detector.filteredSpeed = calculatedRealSpeed;
    detector.filteredRPM = calculatedRealSpeed * 450;
    const nextMetrics = {
      speed: calculatedRealSpeed,
      rpm: Math.round(calculatedRealSpeed * 450),
      frequencyHz: Number((calculatedRealSpeed * 7.5).toFixed(1)),
      confidence: 1.0
    };
    setMetrics(nextMetrics);
    latestSpeedRef.current = calculatedRealSpeed;
    audioEngine.updateSpeed(targetVirtSpeed);
    laptopFanClient.syncSpeed(targetVirtSpeed);
  }, [detector]);

  // Memoize callback to prevent child re-render cascades
  const handleFrameResult = useCallback((res) => setMetrics(res), []);
  const handleOpenExplainModal = useCallback(() => setIsExplainModalOpen(true), []);

  return (
    <div 
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      className="min-h-screen bg-[#f7f6f0] text-black flex flex-col relative antialiased"
    >
      {/* Neobrutalist Minimal Header */}
      <header className="border-b-3 border-black bg-white sticky top-0 z-30 px-4 py-3 shadow-[0px_4px_0px_#000]">
        <div className={`max-w-6xl mx-auto flex items-center justify-between ${
          dockSide === 'right' ? 'pr-16 md:pr-84' : 'pl-16 md:pl-84'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-black">
                Thermo-Stabilizer 9000
              </h1>
              <p className="text-[10px] text-black/70 font-mono font-bold">
                The Inversely Coupled Heat-Maintaining Anti-Fan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasInteracted && (
              <span className="nb-badge bg-amber-300 text-black px-2 py-1 text-[10px] flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Click anywhere for audio
              </span>
            )}
            <button
              onClick={handleOpenExplainModal}
              className="px-2.5 py-1 bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-black text-xs uppercase nb-btn"
            >
              Why? ℹ️
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 p-4 md:p-6 transition-all duration-200 ${
        dockSide === 'right' ? 'mr-16 md:mr-84' : 'ml-16 md:ml-84'
      }`}>
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Quick Explanatory Pill */}
          <div className="p-3 border-3 border-black bg-white shadow-[4px_4px_0px_#000] flex items-center justify-between text-xs font-mono">
            <span className="font-bold">
              ⚖️ <strong>THE LAW:</strong> Real Fan Faster &rarr; Virtual Fan Slower (Maintains heat!)
            </span>
            <span className="nb-badge bg-yellow-300 text-black px-2 py-0.5 text-[9px] hidden sm:inline">
              100% USELESS
            </span>
          </div>

          {/* Camera Viewport with Circular Tachometer */}
          <WebcamAnalyzer
            detector={detector}
            onFrameResult={handleFrameResult}
            isSimulated={isSimulated}
            setIsSimulated={setIsSimulated}
            simSpeed={simSpeed}
            setSimSpeed={setSimSpeed}
          />

          {/* Telemetry Dashboard */}
          <TelemetryDashboard
            metrics={metrics}
            isAudioMuted={isAudioMuted}
            setIsAudioMuted={setIsAudioMuted}
            isVoiceEnabled={isVoiceEnabled}
            setIsVoiceEnabled={setIsVoiceEnabled}
            onOpenExplainModal={handleOpenExplainModal}
            laptopFan={laptopFan}
            onSetVirtualSpeed={handleSetVirtualSpeed}
          />
        </div>
      </main>

      {/* Pinned Virtual Fan on Side of Screen */}
      <SideVirtualFan
        realSpeed={metrics.speed}
        realRPM={metrics.rpm}
        dockSide={dockSide}
        onToggleDock={() => setDockSide(dockSide === 'right' ? 'left' : 'right')}
        laptopFan={laptopFan}
      />

      {/* Explanatory Modal */}
      <UselessExplainModal 
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
      />
    </div>
  );
}
