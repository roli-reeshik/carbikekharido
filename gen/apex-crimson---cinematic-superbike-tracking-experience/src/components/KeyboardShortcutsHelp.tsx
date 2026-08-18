import React from 'react';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'W / ↑', desc: 'Accelerate / Open Throttle' },
    { key: 'S / ↓', desc: 'Apply Brakes / Decelerate' },
    { key: 'SPACE', desc: 'Engage Nitro Overboost' },
    { key: 'C', desc: 'Cycle Tracking Angles' },
    { key: 'M', desc: 'Toggle Engine Audio' },
    { key: 'H', desc: 'Toggle Clean Screen (Cinema Mode)' },
    { key: 'P', desc: 'Capture 4K Snapshot' },
  ];

  return (
    <div
      id="keyboard-shortcuts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none font-sans"
    >
      <div className="relative bg-[#050505] border border-zinc-800 p-6 rounded-lg max-w-md w-full shadow-2xl text-zinc-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-red-600" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-zinc-100">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition text-xs font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5 font-mono text-xs">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-sm bg-zinc-900/60 border border-zinc-800"
            >
              <span className="text-zinc-300">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-red-500 font-bold text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-zinc-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-sm bg-red-600 hover:bg-red-500 text-white font-mono font-bold uppercase tracking-wider text-xs transition cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
