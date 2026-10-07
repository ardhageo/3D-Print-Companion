import React, { useState, useRef } from 'react';
import {
  PrinterMaintenanceData,
  MaintenanceSession,
  PartRecord,
  PrintItem,
  PrinterProfile,
  MaintenanceTaskDef,
  PRINTER_PRESETS,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
} from '../types';
import { money, formatHours } from '../utils/calc';
import {
  calculatePrinterRuntime,
  getEffectivePrinterHours,
  getEffectivePrinterTasks,
} from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import {
  Wrench,
  RotateCcw,
  PlusCircle,
  Trash2,
  Edit2,
  Plus,
} from 'lucide-react';

interface MaintenanceTabProps {
  activeProfile: PrinterProfile;
  profiles: PrinterProfile[];
  onSelectProfile: (id: string) => void;
  maintData: PrinterMaintenanceData;
  history: PrintItem[];
  onUpdateMaintData: (updated: PrinterMaintenanceData) => void;
  onEditSession: (session: MaintenanceSession) => void;
  onOpenAddTaskModal: () => void;
  onNotify: (msg: string) => void;
  currency?: CurrencyCode;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  activeProfile,
  profiles,
  onSelectProfile,
  maintData,
  history,
  onUpdateMaintData,
  onEditSession,
  onOpenAddTaskModal,
  onNotify,
  currency = 'IDR',
}) => {
  const checklistRef = useRef<HTMLDivElement>(null);
  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;
  const currencyLocale = currencyConfig.locale || 'en-US';

  const [maintNotes, setMaintNotes] = useState('');
  const [maintHours, setMaintHours] = useState('');
  const [maintKg, setMaintKg] = useState('');

  const [partName, setPartName] = useState('');
  const [partCost, setPartCost] = useState('0');
  const [partReason, setPartReason] = useState('');

  const printerRuntime = calculatePrinterRuntime(
    history,
    activeProfile.id,
    activeProfile.name
  );
  const currentPrinterHours = getEffectivePrinterHours(
    history,
    maintData,
    activeProfile.id,
    activeProfile.name
  );

  const tasks = getEffectivePrinterTasks(activeProfile, maintData);

  // Status helper for a specific task
  const getTaskStatus = (t: MaintenanceTaskDef) => {
    const sessions = maintData.sessions.filter((x) =>
      (x.itemIds || x.items.map((name) => {
        const found = tasks.find((k) => k.name === name);
        return found ? found.id : null;
      })).includes(t.id)
    );
    const last = sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!last) {
      return {
        type: currentPrinterHours >= t.interval ? 'overdue' : 'new',
        text: 'Never recorded',
        remaining: Math.max(0, t.interval - currentPrinterHours),
      };
    }

    const lastH = Number(last.hours ?? last.hoursSnapshot ?? 0);
    const elapsed = Math.max(0, currentPrinterHours - lastH);
    const remaining = t.interval - elapsed;

    if (remaining <= 0) return { type: 'overdue', text: 'Due now', remaining: 0 };
    if (remaining <= t.interval * 0.2) {
      return { type: 'due', text: `${Math.round(remaining)} h left`, remaining };
    }
    return { type: 'ok', text: `${Math.round(remaining)} h left`, remaining };
  };

  const taskStatuses = tasks.map(getTaskStatus);
  const dueCount = taskStatuses.filter((s) => s.type === 'overdue' || s.type === 'due').length;
  const overdueCount = taskStatuses.filter((s) => s.type === 'overdue').length;

  const lastSession = maintData.sessions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const handleSyncHours = () => {
    triggerHaptic('medium');
    const updated: PrinterMaintenanceData = { ...maintData, hourOffset: 0 };
    onUpdateMaintData(updated);
    alert(`Printer runtime for ${activeProfile.name} synced to print history: ${formatHours(printerRuntime)}.`);
  };

  const handleStartQuickMaintenance = () => {
    triggerHaptic('light');
    handleClearChecks();
    checklistRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleCheck = (id: string, checked: boolean) => {
    triggerHaptic('light');
    const updatedChecks = { ...maintData.checks, [id]: checked };
    onUpdateMaintData({ ...maintData, checks: updatedChecks });
  };

  const handleClearChecks = () => {
    triggerHaptic('light');
    onUpdateMaintData({ ...maintData, checks: {} });
  };

  const handleSaveSession = () => {
    const selectedTasks = tasks.filter((t) => maintData.checks[t.id]);
    if (!selectedTasks.length) {
      alert('Check at least one maintenance item first.');
      return;
    }

    triggerHaptic('success');
    let offset = maintData.hourOffset;
    if (maintHours.trim() !== '' && Number.isFinite(Number(maintHours))) {
      offset = Number(maintHours) - printerRuntime;
    }

    const effectiveHours = Math.max(0, printerRuntime + offset);
    const now = new Date();
    const newSession: MaintenanceSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      date: now.toISOString(),
      notes: maintNotes.trim(),
      hours: effectiveHours,
      kg: Number(maintKg) || null,
      items: selectedTasks.map((t) => t.name),
      itemIds: selectedTasks.map((t) => t.id),
    };

    const updated: PrinterMaintenanceData = {
      ...maintData,
      sessions: [newSession, ...maintData.sessions],
      checks: {},
      hourOffset: offset,
    };

    onUpdateMaintData(updated);
    setMaintNotes('');
    setMaintHours('');
    setMaintKg('');
    alert(`Maintenance session saved for ${activeProfile.name} at ${formatHours(effectiveHours)} runtime.`);
  };

  const handleDeleteSession = (id: string) => {
    triggerHaptic('warning');
    if (!confirm('Delete this maintenance session?')) return;
    const updated: PrinterMaintenanceData = {
      ...maintData,
      sessions: maintData.sessions.filter((x) => String(x.id) !== String(id)),
    };
    onUpdateMaintData(updated);
  };

  const handleClearAllSessions = () => {
    triggerHaptic('warning');
    if (confirm(`Delete all maintenance history and replacement records for ${activeProfile.name}?`)) {
      const reset: PrinterMaintenanceData = {
        sessions: [],
        parts: [],
        checks: {},
        hourOffset: 0,
        customTasks: maintData.customTasks,
      };
      onUpdateMaintData(reset);
    }
  };

  const handleAddPart = () => {
    const trimmed = partName.trim();
    if (!trimmed) {
      alert('Enter a part name.');
      return;
    }
    triggerHaptic('success');
    const newPart: PartRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      part: trimmed,
      cost: Number(partCost) || 0,
      reason: partReason.trim(),
    };
    onUpdateMaintData({
      ...maintData,
      parts: [newPart, ...maintData.parts],
    });
    setPartName('');
    setPartCost('0');
    setPartReason('');
  };

  const handleEditPart = (p: PartRecord) => {
    triggerHaptic('light');
    const part = prompt('Part name:', p.part);
    if (part === null) return;
    const cost = prompt(`Replacement cost (${currencySymbol}):`, String(p.cost));
    if (cost === null) return;
    const reason = prompt('Reason / notes:', p.reason || '');
    if (reason === null) return;

    const updatedParts = maintData.parts.map((item) =>
      item.id === p.id
        ? {
            ...item,
            part: part.trim() || item.part,
            cost: Number(cost) || 0,
            reason: reason,
          }
        : item
    );
    onUpdateMaintData({ ...maintData, parts: updatedParts });
  };

  const handleDeletePart = (id: string) => {
    triggerHaptic('warning');
    if (!confirm('Delete this replacement record?')) return;
    onUpdateMaintData({
      ...maintData,
      parts: maintData.parts.filter((x) => String(x.id) !== String(id)),
    });
  };

  const handleDeleteCustomTask = (taskId: string) => {
    triggerHaptic('warning');
    if (!confirm('Remove this custom maintenance task?')) return;
    const filtered = (maintData.customTasks || []).filter((t) => t.id !== taskId);
    onUpdateMaintData({
      ...maintData,
      customTasks: filtered,
    });
  };

  // Group tasks by category
  const categories: Record<string, MaintenanceTaskDef[]> = {};
  tasks.forEach((t) => {
    if (!categories[t.cat]) categories[t.cat] = [];
    categories[t.cat].push(t);
  });

  const checkedCount = tasks.filter((t) => maintData.checks[t.id]).length;

  return (
    <div className="space-y-4 pb-12">
      {/* 🔧 Maintenance Dashboard Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🔧</span>
            <h2 className="text-base font-extrabold text-white">Maintenance Dashboard</h2>
          </div>

          {/* Printer Switcher in Maintenance */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Printer:</span>
            <select
              value={activeProfile.id}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-blue-300 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer truncate max-w-[170px]"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overall status banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              STATUS FOR {activeProfile.name}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              {PRINTER_PRESETS[activeProfile.presetKey]?.label || 'Custom'}
            </span>
          </div>

          <div
            className={`text-xl font-black ${
              overdueCount
                ? 'text-rose-400'
                : dueCount
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {overdueCount
              ? '🔴 Needs attention'
              : dueCount
              ? '🟡 Due soon'
              : '🟢 Good'}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            {overdueCount
              ? `${overdueCount} maintenance task${overdueCount > 1 ? 's are' : ' is'} overdue.`
              : dueCount
              ? `${dueCount} maintenance task${dueCount > 1 ? 's are' : ' is'} due soon.`
              : 'No maintenance issues detected for this printer.'}
          </div>
        </div>

        {/* 3 stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Runtime
            </span>
            <b className="text-sm font-black text-white">{formatHours(currentPrinterHours)}</b>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Last maint
            </span>
            <b className="text-xs font-black text-white truncate block mt-0.5">
              {lastSession ? new Date(lastSession.date).toLocaleDateString(currencyLocale) : '—'}
            </b>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Tasks due
            </span>
            <b
              className={`text-sm font-black ${
                dueCount > 0 ? 'text-amber-400' : 'text-white'
              }`}
            >
              {dueCount}
            </b>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleStartQuickMaintenance}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm active:scale-95 transition"
          >
            <Wrench className="w-3.5 h-3.5" /> Quick Maint
          </button>
          <button
            onClick={handleSyncHours}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sync Hours
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-3">
          Runtime is calculated from print jobs assigned to <b>{activeProfile.name}</b>. You can also manually adjust the hours below.
        </p>
      </section>

      {/* 🛠️ Log Maintenance Session Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🛠️</span>
            <h2 className="text-base font-extrabold text-white">Log maintenance</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Session for {activeProfile.name}</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Maintenance notes</label>
            <input
              value={maintNotes}
              onChange={(e) => setMaintNotes(e.target.value)}
              placeholder="e.g. Cleaned rails and checked extruder"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Current printer hours</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={maintHours}
                onChange={(e) => setMaintHours(e.target.value)}
                placeholder="Auto from print history"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Filament used</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maintKg}
                  onChange={(e) => setMaintKg(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">kg</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2.5">
          Leave printer hours blank to use accumulated runtime. Enter a number to correct total accumulated machine hours.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            onClick={handleSaveSession}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition"
          >
            Save session
          </button>
          <button
            onClick={handleClearChecks}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs active:scale-95 transition"
          >
            Clear checks
          </button>
        </div>
      </section>

      {/* ☑️ Maintenance Checklist Card */}
      <section
        ref={checklistRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">☑️</span>
            <h2 className="text-base font-extrabold text-white">Maintenance checklist</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenAddTaskModal();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 py-1 px-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              {checkedCount} selected
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(categories).map(([cat, catTasks]) => (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 pt-2">
                <span className="w-1.5 h-3.5 rounded-full bg-blue-500" />
                {cat}
              </div>

              <div className="space-y-2">
                {catTasks.map((t) => {
                  const st = getTaskStatus(t);
                  const isChecked = !!maintData.checks[t.id];

                  const badgeClass =
                    st.type === 'overdue'
                      ? 'bg-rose-950 text-rose-300 border-rose-800/80'
                      : st.type === 'due'
                      ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                      : st.type === 'new'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800/80';

                  const badgeLabel =
                    st.type === 'overdue'
                      ? 'Overdue'
                      : st.type === 'due'
                      ? 'Due soon'
                      : st.type === 'new'
                      ? 'Not recorded'
                      : 'OK';

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isChecked
                          ? 'bg-blue-950/20 border-blue-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleCheck(t.id, e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded-lg text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <b className="text-xs font-bold text-slate-100">{t.name}</b>
                              {t.isCustom && (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeClass}`}
                              >
                                {badgeLabel}
                              </span>
                              {t.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomTask(t.id)}
                                  className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                                  title="Delete custom task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {t.desc}
                          </p>
                          <div className="text-[10px] text-slate-500 mt-1 font-medium">
                            Suggested tracking interval: {t.interval} h · {st.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🧩 Parts & Replacement Tracker Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🧩</span>
            <h2 className="text-base font-extrabold text-white">Parts & replacement tracker</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Logged for {activeProfile.name}</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Part</label>
            <input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="e.g. 0.4 mm Hardened Steel Nozzle"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Replacement cost ({currencySymbol})
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={currencyConfig.decimals === 0 ? '1000' : '1'}
                value={partCost}
                onChange={(e) => setPartCost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Reason / notes</label>
            <input
              value={partReason}
              onChange={(e) => setPartReason(e.target.value)}
              placeholder="Worn, clogged, upgrade, preventive..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleAddPart}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-sm active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4" /> Record replacement for {activeProfile.name}
          </button>
        </div>

        {/* Parts list */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          {maintData.parts.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No replacements recorded for {activeProfile.name} yet.
            </div>
          ) : (
            maintData.parts
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-100">{p.part}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(p.date).toLocaleDateString(currencyLocale)} ·{' '}
                        {p.reason || 'No reason recorded'}
                      </div>
                    </div>
                    <div className="font-extrabold text-xs text-white shrink-0">
                      {money(p.cost, currency)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => handleEditPart(p)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 py-0.5 px-2 rounded hover:bg-slate-800"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePart(p.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 py-0.5 px-2 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* 📝 Maintenance History Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <h2 className="text-base font-extrabold text-white">Maintenance history</h2>
          </div>
          {maintData.sessions.length > 0 && (
            <button
              onClick={handleClearAllSessions}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {maintData.sessions.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No maintenance sessions recorded for {activeProfile.name} yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {maintData.sessions
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((x) => (
                <div
                  key={x.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                        <span>🔧</span> {new Date(x.date).toLocaleDateString(currencyLocale)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatHours(x.hours || 0)}
                        {x.kg ? ` · ${x.kg} kg` : ''}
                        {x.notes ? ` · ${x.notes}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                      {x.items.length} items
                    </span>
                  </div>

                  {x.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {x.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onEditSession(x);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 py-0.5 px-2 rounded hover:bg-slate-800"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSession(x.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 py-0.5 px-2 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};
