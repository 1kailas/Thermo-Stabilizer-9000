import React, { memo } from 'react';
import { X, Flame, Wind, AlertOctagon, Sparkles, ShieldAlert } from 'lucide-react';

export default memo(function UselessExplainModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-4 border-black rounded-none max-w-lg w-full p-6 shadow-[8px_8px_0px_#000] relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 border-2 border-black bg-white hover:bg-rose-200 nb-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_#000]">
            <AlertOctagon className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase font-heading">
              Why is this useless?
            </h3>
            <p className="text-xs font-mono font-bold text-black/70">
              The First Law of Fan Spite
            </p>
          </div>
        </div>

        {/* The Core Law */}
        <div className="p-3 border-2 border-black bg-yellow-100 shadow-[3px_3px_0px_#000] space-y-1 font-mono text-xs">
          <span className="nb-badge bg-black text-white px-2 py-0.5 text-[10px]">
            FUNDAMENTAL FORMULA
          </span>
          <p className="font-bold text-sm text-black">
            Speed(Virtual Fan) = 100% − Speed(Real Fan)
          </p>
          <p className="text-black/80 text-[11px] leading-relaxed">
            Standard cooling appliances cool your room. This project preserves room heat. If you turn your real fan on HIGH to cool down, the virtual fan stalls to keep you hot.
          </p>
        </div>

        {/* Points */}
        <div className="space-y-2 font-mono text-xs">
          <div className="p-2.5 border-2 border-black bg-rose-100 flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">1. Hot Day / Fan on Max</span>
              <p className="text-[11px] text-black/80">
                You crank your room fan to full speed. The virtual fan stops completely at 0 RPM, emits comic smoke puffs, and refuses to blow any virtual air.
              </p>
            </div>
          </div>

          <div className="p-2.5 border-2 border-black bg-sky-100 flex items-start gap-2.5">
            <Wind className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">2. Cold Room / Fan Turned Off</span>
              <p className="text-[11px] text-black/80">
                You turn off your real fan. The virtual fan immediately spools to 3,200 RPM, blowing comic wind streaks across your screen.
              </p>
            </div>
          </div>

          <div className="p-2.5 border-2 border-black bg-emerald-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">3. The Real Laptop Hardware Coupling</span>
              <p className="text-[11px] text-black/80">
                The virtual fan is directly bridged to your physical laptop fan via NoteBook FanControl (NBFC). When the virtual fan ramps to 100%, your laptop's real cooling fan physically screams at 100%. When the virtual fan stalls, your laptop fan goes quiet!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t-2 border-black flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-black text-xs uppercase nb-btn shadow-[3px_3px_0px_#000]"
          >
            I Accept The Uselessness
          </button>
        </div>
      </div>
    </div>
  );
});
