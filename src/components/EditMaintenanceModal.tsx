import React, { useState } from 'react';
import { MaintenanceSession, MAINTENANCE_TASKS, MaintenanceTaskDef } from '../types';
import { todayLocal } from '../utils/calc';
import { triggerHaptic } from '../utils/haptics';
import { X, Check } from 'lucide-react';

interface EditMaintenanceModalProps {
  session: MaintenanceSession | null;
  tasks?: MaintenanceTaskDef[];
  onClose: () => void;
  onSave: (updated: MaintenanceSession) => void;
}

export const EditMaintenanceModal: React.FC<EditMaintenanceModalProps> = ({
  session,
  tasks = MAINTENANCE_TASKS,
  onClose,
  onSave,
}) => {
  if (!session) return null;

  const [date, setDate] = useState(
    session.date ? session.date.slice(0, 10) : todayLocal()
  );
  const [hours, setHours] = useState(
    String(session.hours ?? session.hoursSnapshot ?? 0)
  );
  const [notes, setNotes] = useState(session.notes || '');

  // Get initial itemIds
  const initialIds = session.itemIds || session.items.map((name) => {
    const t = tasks.find((x) => x.name === name);
    return t ? t.id : '';
  }).filter(Boolean);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  const toggleTask = (taskId: string) => {
    triggerHaptic('light');
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSave = () => {
    if (!selectedIds.length) {
      alert('Select at least one maintenance item.');
      return;
    }
    triggerHaptic('success');
    const selectedTasks = tasks.filter((t) => selectedIds.includes(t.id));
    const updated: MaintenanceSession = {
      ...session,
      date: (date || todayLocal()) + 'T12:00:00',
      hours: Number(hours) || 0,
      notes: notes.trim(),
      itemIds: selectedIds,
      items: selectedTasks.map((t) => t.name),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <h3 className="text-base font-extrabold text-white">Edit maintenance</h3>
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

        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Printer hours</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleaned rails and checked extruder"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Completed items</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
              {tasks.map((t) => {
                const checked = selectedIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium cursor-pointer transition select-none ${
                      checked
                        ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>{t.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 grid grid-cols-2 gap-3">
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md active:scale-95 transition"
          >
            <Check className="w-4 h-4" /> Save changes
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm active:scale-95 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
