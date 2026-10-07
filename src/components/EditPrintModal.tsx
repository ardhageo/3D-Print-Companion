import React, { useState } from 'react';
import { PrintItem, FAILURE_REASONS, PrinterProfile, FilamentProfile, CurrencyCode, SUPPORTED_CURRENCIES } from '../types';
import { money, todayLocal } from '../utils/calc';
import { triggerHaptic } from '../utils/haptics';
import { X, Check } from 'lucide-react';

interface EditPrintModalProps {
  item: PrintItem | null;
  profiles: PrinterProfile[];
  filaments?: FilamentProfile[];
  currency?: CurrencyCode;
  onClose: () => void;
  onSave: (updatedItem: PrintItem) => void;
}

export const EditPrintModal: React.FC<EditPrintModalProps> = ({
  item,
  profiles,
  filaments = [],
  currency = 'IDR',
  onClose,
  onSave,
}) => {
  if (!item) return null;

  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;

  const [name, setName] = useState(item.name || '');
  const [selectedPrinterId, setSelectedPrinterId] = useState(
    item.printerId || profiles[0]?.id || 'bambu-a1-mini'
  );
  const [selectedFilamentId, setSelectedFilamentId] = useState(
    item.filamentId || filaments[0]?.id || ''
  );
  const [printDate, setPrintDate] = useState(
    item.printDate || (item.date ? item.date.slice(0, 10) : todayLocal())
  );
  const [grams, setGrams] = useState(String(item.grams || 0));
  const [hours, setHours] = useState(String(Math.floor(Number(item.time || 0))));
  const [minutes, setMinutes] = useState(String(Math.round((Number(item.time || 0) % 1) * 60)));

  const p = item.params || {};
  const [filamentPrice, setFilamentPrice] = useState(String(p.filamentPrice ?? '300000'));
  const [power, setPower] = useState(String(p.power ?? '75'));
  const [printerPrice, setPrinterPrice] = useState(String(p.printerPrice ?? '4400000'));
  const [life, setLife] = useState(String(p.life ?? '3500'));
  const [electricity, setElectricity] = useState(String(p.electricity ?? '1444.70'));
  const [consumables, setConsumables] = useState(String(p.consumables ?? '0'));
  const [labor, setLabor] = useState(String(p.labor ?? '0'));
  const [waste, setWaste] = useState(String(p.waste ?? '0'));
  const [margin, setMargin] = useState(String(p.margin ?? '30'));

  const [status, setStatus] = useState<'success' | 'failed'>(item.status || 'success');
  const [failureReason, setFailureReason] = useState(item.failureReason || '');
  const [failureNotes, setFailureNotes] = useState(item.failureNotes || '');

  // Live recalculate
  const numGrams = Number(grams) || 0;
  const numHours = Number(hours) || 0;
  const numMins = Math.max(0, Number(minutes) || 0);
  const time = numHours + numMins / 60;
  const numFilamentPrice = Number(filamentPrice) || 0;
  const numPower = Number(power) || 0;
  const numPrinterPrice = Number(printerPrice) || 0;
  const numLife = Math.max(1, Number(life) || 1);
  const numElectricityRate = Number(electricity) || 0;
  const numConsumables = Number(consumables) || 0;
  const numLabor = Number(labor) || 0;
  const numWastePct = Number(waste) || 0;
  const numMargin = Math.min(99.9, Math.max(0, Number(margin) || 0));

  const filamentCost = (numFilamentPrice * numGrams) / 1000;
  const electricCost = (numPower / 1000) * time * numElectricityRate;
  const printerCost = (numPrinterPrice / numLife) * time;
  const base = filamentCost + electricCost + printerCost + numConsumables + numLabor;
  const wasteCost = (base * numWastePct) / 100;
  const total = base + wasteCost;
  const selling = numMargin >= 100 ? total : total / (1 - numMargin / 100);

  const matchedProfile = profiles.find((pr) => pr.id === selectedPrinterId);
  const matchedFilament = filaments.find((fil) => fil.id === selectedFilamentId);

  const handleSelectFilament = (filId: string) => {
    setSelectedFilamentId(filId);
    const fil = filaments.find((f) => f.id === filId);
    if (fil) {
      const spoolWeight = Math.max(1, Number(fil.spoolWeightGrams) || 1000);
      const filPrice = Number(fil.price) || 0;
      const ratePerKg = (filPrice / spoolWeight) * 1000;
      setFilamentPrice(String(Math.round(ratePerKg * 100) / 100));
    }
  };

  const handleSave = () => {
    triggerHaptic('success');
    const updated: PrintItem = {
      ...item,
      printerId: selectedPrinterId,
      printerName: matchedProfile?.name || item.printerName || 'Printer',
      filamentId: selectedFilamentId || item.filamentId,
      filamentName: matchedFilament?.name || item.filamentName,
      filamentMaterial: matchedFilament?.material || item.filamentMaterial,
      filamentColor: matchedFilament?.colorHex || item.filamentColor,
      name: name.trim() || 'Untitled Print',
      printDate: printDate || todayLocal(),
      grams: numGrams,
      time,
      cost: total,
      selling,
      currency,
      status,
      failureReason: status === 'failed' ? failureReason : '',
      failureNotes: status === 'failed' ? failureNotes.trim() : '',
      actualRevenue: status === 'failed' ? 0 : item.actualRevenue ?? null,
      params: {
        filamentPrice,
        power,
        printerPrice,
        life,
        electricity,
        consumables,
        labor,
        waste,
        margin,
        hours: String(numHours),
        minutes: String(numMins),
        grams: String(numGrams),
      },
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <h3 className="text-base font-extrabold text-white">Edit saved print</h3>
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

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Print name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Skadis Basket"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Assigned printer</label>
              <select
                value={selectedPrinterId}
                onChange={(e) => setSelectedPrinterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filament Profile Selector */}
          {filaments.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Filament profile
              </label>
              <select
                value={selectedFilamentId}
                onChange={(e) => handleSelectFilament(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="">None / Custom</option>
                {filaments.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.material}) — {currencySymbol}{f.price}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Print date</label>
              <input
                type="date"
                value={printDate}
                onChange={(e) => setPrintDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Filament used</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">g</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Print hours</label>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Print minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cost Parameters ({currencyConfig.code})</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Filament ({currencySymbol}/kg)</label>
                <input
                  type="number"
                  value={filamentPrice}
                  onChange={(e) => setFilamentPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Power (W)</label>
                <input
                  type="number"
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Printer price ({currencySymbol})</label>
                <input
                  type="number"
                  value={printerPrice}
                  onChange={(e) => setPrinterPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service life (h)</label>
                <input
                  type="number"
                  value={life}
                  onChange={(e) => setLife(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Electricity ({currencySymbol}/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={electricity}
                  onChange={(e) => setElectricity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consumables ({currencySymbol})</label>
                <input
                  type="number"
                  value={consumables}
                  onChange={(e) => setConsumables(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Labor ({currencySymbol})</label>
                <input
                  type="number"
                  value={labor}
                  onChange={(e) => setLabor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Waste %</label>
                <input
                  type="number"
                  value={waste}
                  onChange={(e) => setWaste(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profit margin %</label>
                <input
                  type="number"
                  max="99.9"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <label className="block text-xs font-bold text-slate-300 mb-1">Print result</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'success' | 'failed')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="success">✅ Successful</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>

          {status === 'failed' && (
            <div className="space-y-3 p-3 rounded-2xl bg-rose-950/20 border border-rose-800/40">
              <div>
                <label className="block text-xs font-bold text-rose-300 mb-1">Failure reason</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-800/60 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:border-rose-500"
                >
                  <option value="">Select reason</option>
                  {FAILURE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-300 mb-1">Failure notes</label>
                <input
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="Optional details"
                  className="w-full bg-slate-950 border border-rose-800/60 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* Live Preview Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Recalculated total cost:</span>
              <b className="text-white font-extrabold text-sm">{money(total, currency)}</b>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Recalculated selling price:</span>
              <b className="text-emerald-400 font-extrabold text-sm">
                {status === 'failed' ? 'No sale' : money(selling, currency)}
              </b>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 grid grid-cols-2 gap-3">
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
