import React, { useState } from 'react';
import { MaintenanceTaskDef } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { X, Check, Plus } from 'lucide-react';

interface AddTaskModalProps {
  onClose: () => void;
  onSave: (task: MaintenanceTaskDef) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [cat, setCat] = useState('🧼 Cleaning');
  const [interval, setInterval] = useState('100');
  const [desc, setDesc] = useState('');

  const categories = [
    '🧼 Cleaning',
    '🔩 Inspection',
    '🛢️ Lubrication',
    '⚙️ Calibration',
    '🛠️ Replacement',
    '📝 General',
  ];

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Please enter a task name.');
      return;
    }
    const intVal = Math.max(1, Number(interval) || 100);
    triggerHaptic('success');
    const task: MaintenanceTaskDef = {
      id: 'task_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)),
      name: trimmed,
      cat,
      interval: intVal,
      desc: desc.trim() || 'Custom maintenance task.',
      isCustom: true,
    };
    onSave(task);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-lg">➕</span>
            <h3 className="text-base font-extrabold text-white">Add custom maintenance task</h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Task name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inspect Bowden tube couplers"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Interval (hours)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 pr-8 text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">h</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description / Procedure</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Step-by-step notes or maintenance procedure..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition"
          >
            <Check className="w-4 h-4" /> Add Task
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
