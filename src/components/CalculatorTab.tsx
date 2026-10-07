import React, { useState } from 'react';
import {
  PrinterParams,
  PrintItem,
  CalculationResult,
  FAILURE_REASONS,
  PrinterProfile,
  PRINTER_PRESETS,
  FilamentProfile,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
} from '../types';
import { money, displayPrintDate, todayLocal } from '../utils/calc';
import { triggerHaptic } from '../utils/haptics';
import {
  Printer,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Trash2,
  Edit2,
  Plus,
  Settings,
} from 'lucide-react';

interface CalculatorTabProps {
  settings: PrinterParams;
  onUpdateSetting: (field: keyof PrinterParams, value: string) => void;
  calcResult: CalculationResult;
  history: PrintItem[];
  profiles: PrinterProfile[];
  activeProfile: PrinterProfile;
  onSelectProfile: (id: string) => void;
  onOpenNewProfileModal: () => void;
  onOpenEditProfileModal: (profile: PrinterProfile) => void;
  filaments: FilamentProfile[];
  activeFilament: FilamentProfile;
  onSelectFilament: (id: string) => void;
  onOpenNewFilamentModal: () => void;
  onOpenEditFilamentModal: (profile: FilamentProfile) => void;
  currency?: CurrencyCode;
  onSelectCurrency?: (c: CurrencyCode) => void;
  onSavePrint: (newItem: Omit<PrintItem, 'id' | 'date'>) => void;
  onResetInputs: () => void;
  onEditPrint: (item: PrintItem) => void;
  onDeletePrint: (id: string) => void;
  onClearHistory: () => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  settings,
  onUpdateSetting,
  calcResult,
  history,
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenNewProfileModal,
  onOpenEditProfileModal,
  filaments,
  activeFilament,
  onSelectFilament,
  onOpenNewFilamentModal,
  onOpenEditFilamentModal,
  currency = 'IDR',
  onSelectCurrency,
  onSavePrint,
  onResetInputs,
  onEditPrint,
  onDeletePrint,
  onClearHistory,
}) => {
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'current'>('all');

  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;

  const [printName, setPrintName] = useState('');
  const [printDate, setPrintDate] = useState(todayLocal());
  const [printStatus, setPrintStatus] = useState<'success' | 'failed'>('success');
  const [failureReason, setFailureReason] = useState('');
  const [failureNotes, setFailureNotes] = useState('');

  const handleSave = () => {
    triggerHaptic('success');
    onSavePrint({
      printerId: activeProfile.id,
      printerName: activeProfile.name,
      filamentId: activeFilament?.id,
      filamentName: activeFilament?.name,
      filamentMaterial: activeFilament?.material,
      filamentColor: activeFilament?.colorHex,
      name: printName.trim() || 'Untitled Print',
      printDate: printDate || todayLocal(),
      grams: Number(settings.grams) || 0,
      time: calcResult.time,
      cost: calcResult.total,
      selling: calcResult.selling,
      currency,
      status: printStatus,
      failureReason: printStatus === 'failed' ? failureReason : '',
      failureNotes: printStatus === 'failed' ? failureNotes.trim() : '',
      actualRevenue: printStatus === 'failed' ? 0 : null,
      params: { ...settings },
    });
    setPrintName('');
    setPrintDate(todayLocal());
    setPrintStatus('success');
    setFailureReason('');
    setFailureNotes('');
  };

  const handleReset = () => {
    triggerHaptic('light');
    onResetInputs();
  };

  const filteredHistory = history.filter((x) => {
    if (historyFilter === 'all') return true;
    if (x.printerId) return x.printerId === activeProfile.id;
    if (x.printerName) return x.printerName === activeProfile.name;
    return activeProfile.id === 'bambu-a1-mini';
  });

  return (
    <div className="space-y-4 pb-12">
      {/* 🖨️ Printer Profile Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🖨️</span>
            <h2 className="text-base font-extrabold text-white">Printer profile</h2>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenNewProfileModal();
            }}
            className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition py-1 px-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add Printer
          </button>
        </div>

        {/* Profile Switcher Bar */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl mb-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <select
                value={activeProfile.id}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="bg-transparent font-bold text-sm text-white focus:outline-none cursor-pointer truncate max-w-[220px] sm:max-w-xs"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenEditProfileModal(activeProfile);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Edit profile & model preset"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowPrinterSettings(!showPrinterSettings);
                }}
                className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition py-1 px-2 rounded-lg hover:bg-slate-800"
              >
                {showPrinterSettings ? (
                  <>
                    Done <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Edit <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium truncate">
              Model: {PRINTER_PRESETS[activeProfile.presetKey]?.label || 'Custom'}
            </span>
            <span>·</span>
            <span>{activeProfile.power} W</span>
            <span>·</span>
            <span>{activeProfile.life} h service life</span>
          </div>
        </div>

        {showPrinterSettings && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pb-1 border-t border-slate-800 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Printer name</label>
              <input
                value={settings.printer}
                onChange={(e) => onUpdateSetting('printer', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Average power</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={settings.power}
                  onChange={(e) => onUpdateSetting('power', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">W</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Purchase price</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step={currencyConfig.decimals === 0 ? '1000' : '1'}
                  value={settings.printerPrice}
                  onChange={(e) => onUpdateSetting('printerPrice', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">{currencySymbol}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Expected service life</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={settings.life}
                  onChange={(e) => onUpdateSetting('life', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 pr-14 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">hours</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-2">
          Depreciation formula: Purchase price ÷ Service life × Print hours. Values save automatically per profile.
        </p>
      </section>

      {/* 🧵 Filament Profile Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🧵</span>
            <h2 className="text-base font-extrabold text-white">Filament profile</h2>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenNewFilamentModal();
            }}
            className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition py-1 px-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add Filament
          </button>
        </div>

        {/* Profile Switcher Bar */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl mb-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 shadow-sm"
                style={{ backgroundColor: activeFilament?.colorHex || '#18181b' }}
              />
              <select
                value={activeFilament?.id}
                onChange={(e) => {
                  triggerHaptic('light');
                  onSelectFilament(e.target.value);
                }}
                className="bg-transparent font-bold text-sm text-white focus:outline-none cursor-pointer truncate max-w-[210px] sm:max-w-xs"
              >
                {filaments.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                    {f.name} ({f.material})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (activeFilament) onOpenEditFilamentModal(activeFilament);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Edit filament profile & price"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick details chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-900 text-xs">
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 font-bold text-blue-300">
              {activeFilament?.material || 'PLA'}
            </span>
            {activeFilament?.brand && (
              <span className="text-slate-400">
                Brand: <b className="text-slate-200">{activeFilament.brand}</b>
              </span>
            )}
            <span className="text-slate-400">
              Color: <b className="text-slate-200">{activeFilament?.colorName || 'Default'}</b>
            </span>
            <span className="text-emerald-400 font-bold ml-auto">
              Rate: {currencySymbol}
              {Math.round(
                ((Number(activeFilament?.price) || 0) /
                  Math.max(1, Number(activeFilament?.spoolWeightGrams) || 1000)) *
                  1000
              ).toLocaleString()}{' '}
              / kg
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Spool price: {currencySymbol}{activeFilament?.price} ({activeFilament?.spoolWeightGrams || 1000}g roll) · Density: {activeFilament?.density || '1.24'} g/cm³. Populated into print calculations.
        </p>
      </section>

      {/* 📏 Print Details Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🧵</span>
            <h2 className="text-base font-extrabold text-white">Print details</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">From Slicer</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Filament price</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={currencyConfig.decimals === 0 ? '1000' : '0.1'}
                value={settings.filamentPrice}
                onChange={(e) => onUpdateSetting('filamentPrice', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-20 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}/kg</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Filament used</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={settings.grams}
                onChange={(e) => onUpdateSetting('grams', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">g</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Print time — hours</label>
            <input
              type="number"
              min="0"
              value={settings.hours}
              onChange={(e) => onUpdateSetting('hours', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Print time — minutes</label>
            <input
              type="number"
              min="0"
              max="59"
              value={settings.minutes}
              onChange={(e) => onUpdateSetting('minutes', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ⚡ Other Costs Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <h2 className="text-base font-extrabold text-white">Other costs</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Optional ({currencyConfig.code})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Electricity price</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.electricity}
                onChange={(e) => onUpdateSetting('electricity', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-20 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}/kWh</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Consumables</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={currencyConfig.decimals === 0 ? '500' : '0.5'}
                value={settings.consumables}
                onChange={(e) => onUpdateSetting('consumables', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-12 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Labor</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={currencyConfig.decimals === 0 ? '500' : '0.5'}
                value={settings.labor}
                onChange={(e) => onUpdateSetting('labor', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-12 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Failure allowance</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={settings.waste}
                onChange={(e) => onUpdateSetting('waste', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-3">
          The slicer's filament weight already represents material used by the sliced job.
        </p>
      </section>

      {/* 💰 Selling Price Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <h2 className="text-base font-extrabold text-white">Selling price</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Optional</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Target profit margin</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="99.9"
              step="1"
              value={settings.margin}
              onChange={(e) => onUpdateSetting('margin', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5">
          30% margin means profit is 30% of the final selling price.
        </p>
      </section>

      {/* 🏷️ Result Card */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-blue-500/30 rounded-3xl p-5 shadow-xl text-white">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-300">
          TOTAL ESTIMATED COST ({activeProfile.name})
        </div>
        <div className="text-4xl font-black tracking-tight text-white my-2">
          {money(calcResult.total, currency)}
        </div>

        <div className="space-y-2 mt-4 pt-3 border-t border-slate-700/60 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>🧵 Filament</span>
            <b className="text-white font-bold">{money(calcResult.filamentCost, currency)}</b>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>⚡ Electricity</span>
            <b className="text-white font-bold">{money(calcResult.electricCost, currency)}</b>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>🖨️ Printer depreciation ({activeProfile.name})</span>
            <b className="text-white font-bold">{money(calcResult.printerCost, currency)}</b>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>🧰 Consumables</span>
            <b className="text-white font-bold">{money(calcResult.consumableCost, currency)}</b>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>👷 Labor</span>
            <b className="text-white font-bold">{money(calcResult.laborCost, currency)}</b>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>♻️ Failure allowance</span>
            <b className="text-white font-bold">{money(calcResult.wasteCost, currency)}</b>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-700/60 text-sm">
            <span className="font-semibold text-slate-200">Suggested selling price</span>
            <b className="text-emerald-300 font-extrabold text-base">{money(calcResult.selling, currency)}</b>
          </div>
        </div>
      </section>

      {/* 💾 Save This Print Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">💾</span>
            <h2 className="text-base font-extrabold text-white">Save this print</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-blue-300 font-semibold">
            {activeProfile.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Print name</label>
            <input
              value={printName}
              onChange={(e) => setPrintName(e.target.value)}
              placeholder="e.g. Skadis Basket"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Print date</label>
            <input
              type="date"
              value={printDate}
              onChange={(e) => setPrintDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className={printStatus === 'failed' ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Print result</label>
            <select
              value={printStatus}
              onChange={(e) => setPrintStatus(e.target.value as 'success' | 'failed')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="success">✅ Successful</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>

          {printStatus === 'failed' && (
            <div>
              <label className="block text-xs font-bold text-rose-300 mb-1.5">Failure reason</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full bg-slate-950 border border-rose-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500 font-medium"
              >
                <option value="">Select reason</option>
                {FAILURE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {printStatus === 'failed' && (
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-bold text-rose-300 mb-1.5">Failure notes</label>
              <input
                value={failureNotes}
                onChange={(e) => setFailureNotes(e.target.value)}
                placeholder="Optional details"
                className="w-full bg-slate-950 border border-rose-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-2">
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md active:scale-95 transition"
          >
            <Save className="w-4 h-4" /> Save print
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset inputs
          </button>
        </div>
      </section>

      {/* 📋 History Card with Total vs Printer Filter */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h2 className="text-base font-extrabold text-white">History</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  historyFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All (Total)
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('current')}
                className={`px-2.5 py-1 rounded-lg font-bold transition truncate max-w-[140px] ${
                  historyFilter === 'current'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {activeProfile.name}
              </button>
            </div>

            {history.length > 0 && (
              <button
                onClick={() => {
                  triggerHaptic('warning');
                  if (confirm('Delete all saved print history?')) {
                    onClearHistory();
                  }
                }}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition shrink-0"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {historyFilter === 'current'
              ? `No saved prints for ${activeProfile.name} yet.`
              : 'No saved prints yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredHistory.map((x) => {
              const d = displayPrintDate(x);
              const h = Math.floor(x.time);
              const m = Math.round((x.time - h) * 60);
              const isFailed = x.status === 'failed';
              const pName = x.printerName || 'Bambu Lab A1 Mini';

              return (
                <div key={x.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-slate-100 truncate flex items-center gap-2">
                        <span>{x.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-950 border border-slate-800 text-blue-300 font-semibold truncate max-w-[130px]">
                          {pName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {d} · {x.grams} g · {h}h {m}m
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {isFailed ? '❌ Failed' : '✅ Successful'}
                        {isFailed && x.failureReason ? ` · ${x.failureReason}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-white">{money(x.cost)}</div>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFailed
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {isFailed ? 'No sale' : `${money(x.selling)} sell`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onEditPrint(x);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic('warning');
                        if (confirm('Delete this saved print?')) {
                          onDeletePrint(x.id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
