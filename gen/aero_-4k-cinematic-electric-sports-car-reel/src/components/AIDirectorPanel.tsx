import React, { useState, useEffect } from 'react';
import { CinematicSettings, DirectorAnalysis } from '../types';
import { Sparkles, Clapperboard, SunMedium, Music, Camera, Download, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIDirectorPanelProps {
  settings: CinematicSettings;
}

export const AIDirectorPanel: React.FC<AIDirectorPanelProps> = ({ settings }) => {
  const [analysis, setAnalysis] = useState<DirectorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const cameraAngleNames: Record<string, string> = {
        profile_tracking: 'Parallel Side-Profile Tracking',
        chase_front: 'Low-Angle 3/4 Front Chase',
        cliff_drone: 'Panoramic Cliffside Drone Vista',
        wheel_macro: '21-inch Wheel & Dust Macro',
        cockpit_sunset: 'Cockpit Sunset Horizon View',
      };

      const res = await fetch('/api/director/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraAngle: cameraAngleNames[settings.cameraAngle] || settings.cameraAngle,
          speed: settings.speedMph,
          slowMoRate: settings.slowMoRate,
          lut: settings.lutPreset,
          timeOfDay: 'Golden Hour (Sunset)',
          dustDensity: settings.dustDensity,
          focalLength: '50mm Anamorphic T1.5',
          location: 'Pacific Coast Highway 1, Big Sur, CA',
        }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error('Error fetching director critique:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAnalysis();
  }, [settings.cameraAngle, settings.lutPreset]);

  const handleCaptureFrame = () => {
    const canvas = document.getElementById('cinema-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AERO_Cinematic_Frame_${settings.cameraAngle}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 36, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 36, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-20 right-6 z-20 select-none flex flex-col items-end gap-3"
    >
      {/* Action Buttons: AI Director Toggle & Frame Capture */}
      <div className="flex items-center gap-2.5">
        <button
          id="btn-capture-frame"
          onClick={handleCaptureFrame}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xl transition-all shadow-2xl hover:border-amber-500/50 hover:scale-105 active:scale-95"
          title="Save 4K Still Frame PNG"
        >
          <Download size={15} className="text-amber-400" />
          <span>4K Frame Capture</span>
        </button>

        <button
          id="btn-ai-director-toggle"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider backdrop-blur-xl transition-all shadow-2xl border ${
            isOpen
              ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-amber-500/50'
          }`}
        >
          <Sparkles size={15} className={isOpen ? 'text-black' : 'text-amber-400'} />
          <span>ASC Director Breakdown</span>
        </button>
      </div>

      {/* Slide-out AI Director Analysis Frosted Glass Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-80 md:w-96 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 text-white shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clapperboard size={17} className="text-amber-500" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cinematography Analysis</div>
                  <div className="font-black text-sm tracking-tight text-white">ASC Shot Breakdown</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAnalysis}
                  disabled={loading}
                  className="text-[10px] uppercase font-bold tracking-widest text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50 bg-white/5 border border-white/10 px-2 py-1 rounded-full"
                >
                  {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {analysis && (
              <div className="space-y-3">
                {/* Score / Grade */}
                <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Commercial Grade</span>
                  <span className="font-black text-lg italic text-amber-400 tracking-tight">{analysis.directorScore || '98/100 Commercial'}</span>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    <Camera size={12} className="text-amber-400" />
                    <span>Cinematography & Framing</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed p-3.5 bg-white/5 rounded-2xl border border-white/10 text-[11px] font-light">
                    {analysis.cinematographerNotes}
                  </p>
                </div>

                {/* Lighting */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    <SunMedium size={12} className="text-amber-400" />
                    <span>Lighting & Optical Flares</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed p-3.5 bg-white/5 rounded-2xl border border-white/10 text-[11px] font-light">
                    {analysis.lightingBreakdown}
                  </p>
                </div>

                {/* Sound Design */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    <Music size={12} className="text-amber-400" />
                    <span>Audio Sound Design</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed p-3.5 bg-white/5 rounded-2xl border border-white/10 text-[11px] font-light">
                    {analysis.audioDirectorCues}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
