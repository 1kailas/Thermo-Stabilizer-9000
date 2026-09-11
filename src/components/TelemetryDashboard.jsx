import React, { memo } from 'react';
import { 
  Flame, 
  Snowflake, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Wind,
  Cpu,
  Thermometer,
  Zap,
  RotateCcw,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default memo(function TelemetryDashboard({ 
  metrics, 
  isAudioMuted, 
  setIsAudioMuted, 
  isVoiceEnabled, 
  setIsVoiceEnabled,
  onOpenExplainModal,
  laptopFan,
  onSetVirtualSpeed
}) {
  const realSpeed = metrics.speed || 0;
  const realRPM = metrics.rpm || 0;
  // Inverse relationship: Virtual = 1.0 - Real
  const virtualSpeed = Math.max(0, Math.min(1, 1.0 - realSpeed));
  const virtualRPM = Math.round(virtualSpeed * 3200 + (virtualSpeed > 0.02 ? 20 : 0));

  const laptopTargetSpeed = laptopFan?.targetSpeed !== undefined 
    ? laptopFan.targetSpeed 
    : Math.round(virtualSpeed * 100);

  const getVerdict = () => {
    if (realSpeed > 0.75) {
      return {
        title: "CRITICAL COOLING DETECTED! LAPTOP FAN IDLING",
        desc: "Your room fan is on max! Virtual fan is stalled at 0 RPM & real laptop fan slows down to keep internal heat trapped inside the chassis.",
        bg: "bg-rose-300",
        icon: Flame
      };
    }
    if (realSpeed > 0.25) {
      return {
        title: "ENTROPY EQUILIBRIUM: HARDWARE MATCHED",
        desc: "Room fan is moderate. Virtual fan & physical laptop fan dynamically balance heat dissipation.",
        bg: "bg-amber-300",
        icon: Wind
      };
    }
    return {
      title: "ROOM FAN OFF: LAPTOP FAN TURBO OVERDRIVE!",
      desc: "Room fan stopped! Virtual fan screams at 3,200 RPM and real laptop hardware fan roars at 100% to dissipate nonexistent room heat.",
      bg: "bg-cyan-300",
      icon: Snowflake
    };
  };

  const verdict = getVerdict();
  const VerdictIcon = verdict.icon;

  return (
    <div className="nb-card p-4 space-y-4">
      {/* Top Header & Toggles */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight">
            Heat Maintenance Telemetry
          </h3>
          <p className="text-[11px] font-mono text-black/70">
            Formula: Virtual Speed = 100% − Real Speed
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !isAudioMuted;
              setIsAudioMuted(next);
              audioEngine.setMuted(next);
            }}
            className={`px-2.5 py-1.5 border-2 border-black font-bold text-xs uppercase nb-btn flex items-center gap-1.5 ${
              !isAudioMuted ? 'bg-yellow-300' : 'bg-white'
            }`}
          >
            {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{!isAudioMuted ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Voice Toggle */}
          <button
            onClick={() => {
              const next = !isVoiceEnabled;
              setIsVoiceEnabled(next);
              audioEngine.setVoiceEnabled(next);
            }}
            className={`px-2.5 py-1.5 border-2 border-black font-bold text-xs uppercase nb-btn flex items-center gap-1.5 ${
              isVoiceEnabled ? 'bg-lime-300' : 'bg-white'
            }`}
          >
            {isVoiceEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isVoiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          {/* Why? Modal */}
          <button
            onClick={onOpenExplainModal}
            className="px-2.5 py-1.5 border-2 border-black font-bold text-xs uppercase nb-btn bg-white hover:bg-yellow-200 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Why?</span>
          </button>
        </div>
      </div>

      {/* Triple Brutalist Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Real Fan Card */}
        <div className="p-4 border-3 border-black bg-rose-100 shadow-[4px_4px_0px_#000] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-black">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-rose-700" /> REAL ROOM FAN
            </span>
            <span className="nb-badge bg-white px-1.5 py-0.2 text-[10px]">
              {(realSpeed * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black font-heading">
              {realRPM}
            </span>
            <span className="text-sm font-bold font-mono">RPM</span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full border-2 border-black bg-white p-0.5">
            <div 
              className="h-full bg-rose-500 transition-all duration-150"
              style={{ width: `${realSpeed * 100}%` }}
            />
          </div>
          <p className="text-[10px] font-mono font-bold text-black/60">
            Source: Webcam Optical Tachometer
          </p>
        </div>

        {/* Virtual Fan Card */}
        <div className="p-4 border-3 border-black bg-sky-100 shadow-[4px_4px_0px_#000] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-black">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-sky-700" /> VIRTUAL SCREEN FAN
            </span>
            <span className="nb-badge bg-black text-white px-1.5 py-0.2 text-[10px]">
              {(virtualSpeed * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black font-heading">
              {virtualRPM}
            </span>
            <span className="text-sm font-bold font-mono">RPM</span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full border-2 border-black bg-white p-0.5">
            <div 
              className="h-full bg-sky-400 transition-all duration-150"
              style={{ width: `${virtualSpeed * 100}%` }}
            />
          </div>
          <p className="text-[10px] font-mono font-bold text-black/60">
            Formula: 100% − Real Fan Speed
          </p>
        </div>

        {/* Real Laptop Hardware Fan Card */}
        <div className="p-4 border-3 border-black bg-emerald-100 shadow-[4px_4px_0px_#000] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-black">
            <span className="flex items-center gap-1 text-emerald-900">
              <Cpu className="w-4 h-4 text-emerald-700" /> LAPTOP HARDWARE FAN
            </span>
            <span className="nb-badge bg-black text-emerald-300 px-1.5 py-0.2 text-[10px]">
              {laptopTargetSpeed}%
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black font-heading text-black">
                {laptopTargetSpeed}
              </span>
              <span className="text-sm font-bold font-mono">% PWR</span>
            </div>

            {laptopFan?.temperature ? (
              <span className="nb-badge bg-white border-2 border-black text-black px-1.5 py-0.5 text-[11px] flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                {laptopFan.temperature.toFixed(1)}°C
              </span>
            ) : null}
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full border-2 border-black bg-white p-0.5">
            <div 
              className="h-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${Math.max(4, laptopTargetSpeed)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-black/70">
            <span>{laptopFan?.model || 'Acer Aspire Lite'}</span>
            <span className={laptopFan?.syncEnabled ? 'text-emerald-800' : 'text-amber-800'}>
              {laptopFan?.syncEnabled ? '● SYNCED' : '○ BIOS AUTO'}
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Coupling & Fan Control Console */}
      <div className="p-4 border-3 border-black bg-white shadow-[4px_4px_0px_#000] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-300 border-2 border-black shadow-[2px_2px_0px_#000]">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase font-mono tracking-tight flex items-center gap-1.5">
                Physical Laptop Fan Coupling (NBFC EC Link)
              </h4>
              <p className="text-[10px] font-mono text-black/70">
                Laptop fan speed dynamically tracks virtual fan speed in real time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Toggle */}
            <button
              onClick={() => laptopFan?.setSyncEnabled(!laptopFan?.syncEnabled)}
              className={`px-2.5 py-1 border-2 border-black font-mono font-bold text-xs uppercase nb-btn flex items-center gap-1.5 ${
                laptopFan?.syncEnabled ? 'bg-emerald-300 text-black' : 'bg-gray-200 text-black/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {laptopFan?.syncEnabled ? 'Hardware Sync: ON' : 'Hardware Sync: OFF'}
            </button>

            {/* Restore Auto Button */}
            <button
              onClick={() => laptopFan?.setAuto()}
              className="px-2.5 py-1 bg-yellow-200 hover:bg-yellow-300 border-2 border-black font-mono font-bold text-xs uppercase nb-btn flex items-center gap-1"
              title="Reset laptop hardware fan to default BIOS thermal management"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              BIOS Auto
            </button>
          </div>
        </div>

        {/* Direct Virtual Fan & Laptop Power Slider */}
        <div className="p-2.5 border-2 border-black bg-yellow-100 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono">
          <span className="font-black uppercase whitespace-nowrap flex items-center gap-1.5 text-black">
            <Zap className="w-3.5 h-3.5 text-amber-600" /> Virtual & Laptop Throttle:
          </span>
          <div className="flex-1 flex items-center gap-2">
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={virtualSpeed}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (onSetVirtualSpeed) onSetVirtualSpeed(v);
              }}
              className="w-full accent-black cursor-pointer h-2 bg-white border border-black"
            />
            <span className={`nb-badge px-2 py-0.5 text-xs font-black min-w-[65px] text-center ${
              virtualSpeed >= 0.95 ? 'bg-rose-500 text-white animate-pulse' : 'bg-black text-white'
            }`}>
              {Math.round(virtualSpeed * 100)}% {virtualSpeed >= 0.95 ? '🔥' : ''}
            </span>
          </div>
        </div>

        {/* Interactive Quick Presets & Test Triggers */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] text-black/80 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Quick Presets:
            </span>
            <button
              onClick={() => onSetVirtualSpeed && onSetVirtualSpeed(1.0)}
              className="px-2.5 py-1 bg-rose-400 hover:bg-rose-500 text-black font-black text-xs nb-btn shadow-[2px_2px_0px_#000]"
            >
              🚀 Turbo 100% (Full Roar)
            </button>
            <button
              onClick={() => onSetVirtualSpeed && onSetVirtualSpeed(0.5)}
              className="px-2 py-1 bg-amber-200 hover:bg-amber-300 border-2 border-black font-bold text-[11px] nb-btn"
            >
              🍃 Cruise 50%
            </button>
            <button
              onClick={() => onSetVirtualSpeed && onSetVirtualSpeed(0.0)}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 border-2 border-black font-bold text-[11px] nb-btn"
            >
              🛑 Stall 0%
            </button>
          </div>

          <div className="text-[10px] font-mono text-black/60 flex items-center gap-2">
            <span>EC: <strong>{laptopFan?.fanName || 'CPU Fan'}</strong></span>
            <span>&bull;</span>
            <span>Target: <strong>{laptopTargetSpeed}%</strong></span>
          </div>
        </div>
      </div>

      {/* Sarcastic Verdict Banner */}
      <div className={`p-3.5 border-3 border-black shadow-[4px_4px_0px_#000] ${verdict.bg} flex items-center gap-3`}>
        <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
          <VerdictIcon className="w-5 h-5 text-black" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase font-heading">
            {verdict.title}
          </h4>
          <p className="text-xs font-mono font-bold leading-tight mt-0.5">
            {verdict.desc}
          </p>
        </div>
      </div>
    </div>
  );
});
