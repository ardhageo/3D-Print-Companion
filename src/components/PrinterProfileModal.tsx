import React, { useState } from 'react';
import { PrinterProfile, PrinterPresetKey, PRINTER_PRESETS, CurrencyCode, SUPPORTED_CURRENCIES } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { X, Check, Trash2, Printer } from 'lucide-react';

interface PrinterProfileModalProps {
  profile: PrinterProfile | null; // null means create new
  isNew?: boolean;
  currency?: CurrencyCode;
  onClose: () => void;
  onSave: (saved: PrinterProfile) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export const PrinterProfileModal: React.FC<PrinterProfileModalProps> = ({
  profile,
  isNew = false,
  currency = 'IDR',
  onClose,
  onSave,
  onDelete,
  canDelete = false,
}) => {
  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;
  const [presetKey, setPresetKey] = useState<PrinterPresetKey>(
    profile?.presetKey || 'bambu_a1'
  );
  const [name, setName] = useState(profile?.name || PRINTER_PRESETS.bambu_a1.defaultName);
  const [power, setPower] = useState(profile?.power || PRINTER_PRESETS.bambu_a1.defaultPower);
  const [printerPrice, setPrinterPrice] = useState(
    profile?.printerPrice ||
      (currency === 'IDR'
        ? PRINTER_PRESETS.bambu_a1.defaultPrice
        : currencyConfig.defaultPrinterPrice || PRINTER_PRESETS.bambu_a1.defaultPrice)
  );
  const [life, setLife] = useState(profile?.life || PRINTER_PRESETS.bambu_a1.defaultLife);

  const handlePresetSelect = (key: PrinterPresetKey) => {
    triggerHaptic('light');
    setPresetKey(key);
    const p = PRINTER_PRESETS[key];
    if (isNew) {
      setName(p.defaultName);
      setPower(p.defaultPower);
      setPrinterPrice(
        currency === 'IDR' ? p.defaultPrice : currencyConfig.defaultPrinterPrice || p.defaultPrice
      );
      setLife(p.defaultLife);
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Please enter a printer name.');
      return;
    }
    triggerHaptic('success');
    const updated: PrinterProfile = {
      id:
        profile?.id ||
        (crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString(36) + Math.random().toString(36).slice(2)),
      name: trimmed,
      presetKey,
      power: String(Number(power) || 0),
      printerPrice: String(Number(printerPrice) || 0),
      life: String(Math.max(1, Number(life) || 1)),
      customTasks: profile?.customTasks || [],
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖨️</span>
            <h3 className="text-base font-extrabold text-white">
              {isNew ? 'Add printer profile' : 'Edit printer profile'}
            </h3>
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Preset selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Select printer model preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(PRINTER_PRESETS) as PrinterPresetKey[]).map((key) => {
                const info = PRINTER_PRESETS[key];
                const isSelected = presetKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`p-2.5 rounded-2xl border text-left transition select-none ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight truncate">{info.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{info.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Printer display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bambu Lab A1 Mini"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Average power</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">W</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Purchase price</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step={currencyConfig.decimals === 0 ? '1000' : '1'}
                  value={printerPrice}
                  onChange={(e) => setPrinterPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Expected life</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={life}
                  onChange={(e) => setLife(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-12 text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">hours</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Connected Maintenance Model:</span>
            <span>{PRINTER_PRESETS[presetKey].label} — {PRINTER_PRESETS[presetKey].description}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          {canDelete && onDelete && profile ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('warning');
                if (confirm(`Delete printer profile "${profile.name}"?`)) {
                  onDelete(profile.id);
                }
              }}
              className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-bold text-xs active:scale-95 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
