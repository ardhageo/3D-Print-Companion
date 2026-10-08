import React, { useState } from 'react';
import { PrintItem, PrinterProfile, CurrencyCode, SUPPORTED_CURRENCIES } from '../types';
import { money, formatHours, displayPrintDate } from '../utils/calc';
import { triggerHaptic } from '../utils/haptics';

interface StatsTabProps {
  history: PrintItem[];
  profiles: PrinterProfile[];
  activeProfile: PrinterProfile;
  currency?: CurrencyCode;
  onClearHistory: () => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  history,
  profiles,
  activeProfile,
  currency = 'IDR',
  onClearHistory,
}) => {
  const [filterPrinterId, setFilterPrinterId] = useState<string>('all');
  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;

  const selectedProfile = profiles.find((p) => p.id === filterPrinterId);
  const selectedLabel =
    filterPrinterId === 'all' ? 'All Printers (Fleet Total)' : selectedProfile?.name || 'Selected Printer';

  const filteredHistory = history.filter((x) => {
    if (filterPrinterId === 'all') return true;
    if (x.printerId) return x.printerId === filterPrinterId;
    if (x.printerName && selectedProfile) return x.printerName === selectedProfile.name;
    return filterPrinterId === 'bambu-a1-mini';
  });

  const successful = filteredHistory.filter((x) => x.status !== 'failed');
  const failed = filteredHistory.filter((x) => x.status === 'failed');

  const totalCost = filteredHistory.reduce((s, x) => s + (Number(x.cost) || 0), 0);
  const potential = successful.reduce((s, x) => s + (Number(x.selling) || 0), 0);
  const potentialProfit = potential - totalCost;
  const totalGrams = filteredHistory.reduce((s, x) => s + (Number(x.grams) || 0), 0);
  const totalTime = filteredHistory.reduce((s, x) => s + (Number(x.time) || 0), 0);

  // Filament & Material aggregations
  const materialUsage: Record<string, number> = {};
  const filamentProfileUsage: Record<string, { grams: number; name: string; color?: string; material?: string }> = {};

  filteredHistory.forEach((x) => {
    const g = Number(x.grams) || 0;
    const mat = x.filamentMaterial || 'PLA';
    materialUsage[mat] = (materialUsage[mat] || 0) + g;

    const filKey = x.filamentId || x.filamentName || 'Generic PLA';
    const filName = x.filamentName || 'Generic PLA';
    if (!filamentProfileUsage[filKey]) {
      filamentProfileUsage[filKey] = {
        grams: 0,
        name: filName,
        color: x.filamentColor,
        material: x.filamentMaterial || 'PLA',
      };
    }
    filamentProfileUsage[filKey].grams += g;
  });

  const sortedMaterials = Object.entries(materialUsage).sort((a, b) => b[1] - a[1]);
  const sortedFilaments = Object.values(filamentProfileUsage).sort((a, b) => b.grams - a.grams);

  // Cost breakdown
  const sums = {
    filament: 0,
    electricity: 0,
    depreciation: 0,
    consumables: 0,
    labor: 0,
    waste: 0,
  };

  filteredHistory.forEach((x) => {
    const p = x.params || {};
    const grams = Number(x.grams) || 0;
    const time = Number(x.time) || 0;
    const fp = Number(p.filamentPrice) || 0;
    const power = Number(p.power) || 0;
    const price = Number(p.printerPrice) || 0;
    const life = Math.max(1, Number(p.life) || 1);
    const rate = Number(p.electricity) || 0;
    const cons = Number(p.consumables) || 0;
    const lab = Number(p.labor) || 0;
    const w = Number(p.waste) || 0;

    const f = (fp * grams) / 1000;
    const e = (power / 1000) * time * rate;
    const d = (price / life) * time;
    const b = f + e + d + cons + lab;

    sums.filament += f;
    sums.electricity += e;
    sums.depreciation += d;
    sums.consumables += cons;
    sums.labor += lab;
    sums.waste += (b * w) / 100;
  });

  // Monthly activity
  const months: Record<string, number> = {};
  filteredHistory.forEach((x) => {
    const d = x.printDate || x.date || '';
    const key = String(d).slice(0, 7);
    if (key) months[key] = (months[key] || 0) + 1;
  });
  const monthEntries = Object.entries(months)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6);

  const failureRate = filteredHistory.length
    ? Math.round((failed.length / filteredHistory.length) * 100)
    : 0;
  const failedCost = failed.reduce((s, x) => s + (Number(x.cost) || 0), 0);

  return (
    <div className="space-y-4 pb-12">
      {/* 📊 Printer Scope Filter */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm text-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">🖨️</span>
          <span className="text-xs font-bold text-slate-400 shrink-0">Filter Stats:</span>
          <select
            value={filterPrinterId}
            onChange={(e) => {
              triggerHaptic('light');
              setFilterPrinterId(e.target.value);
            }}
            className="bg-slate-950 border border-slate-800 text-xs font-extrabold text-blue-400 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer truncate max-w-[200px]"
          >
            <option value="all">All Printers (Fleet Total)</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 shrink-0">
          {filteredHistory.length} prints ({currencySymbol})
        </span>
      </section>

      {/* 📊 Statistics Grid Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <h2 className="text-base font-extrabold text-white">Statistics</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
            {selectedLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <div className="text-xs text-slate-300">
              <b className="text-sm font-black text-white">{filteredHistory.length}</b> prints
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
            <div className="text-xs text-slate-300">
              <b className="text-sm font-black text-white">{Math.round(totalGrams * 10) / 10} g</b> filament
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <div className="text-xs text-slate-300">
              <b className="text-sm font-black text-white">{formatHours(totalTime)}</b> print time
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <div className="text-xs text-slate-300">
              <b className="text-sm font-black text-white">{money(totalCost, currency)}</b> total cost
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="text-xs text-slate-300">
              <b className="text-sm font-black text-white">{money(potential, currency)}</b> potential sales
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <b className="text-sm font-black text-white">{money(potentialProfit, currency)}</b> potential profit
            </div>
          </div>
        </div>
      </section>

      {/* 🧵 Filament & Material Analytics Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">🧵</span>
            <h2 className="text-base font-extrabold text-white">Filament & Material Usage</h2>
          </div>
          <span className="text-xs text-emerald-400 font-bold">
            {(totalGrams / 1000).toFixed(2)} kg ({(totalGrams / 1000).toFixed(1)} spools)
          </span>
        </div>

        {totalGrams === 0 ? (
          <div className="text-center py-5 text-slate-500 text-xs">
            No filament consumption recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Usage by Material */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">Usage by Material</span>
              <div className="space-y-2">
                {sortedMaterials.map(([mat, grams]) => {
                  const pct = Math.round((grams / totalGrams) * 100);
                  return (
                    <div key={mat} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-blue-300">
                            {mat}
                          </span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {Math.round(grams)}g ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Usage Breakdown */}
            {sortedFilaments.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  Top Spools & Filament Profiles
                </span>
                <div className="space-y-1.5">
                  {sortedFilaments.slice(0, 5).map((fil, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {fil.color ? (
                          <div
                            className="w-3 h-3 rounded-full border border-slate-600 shrink-0"
                            style={{ backgroundColor: fil.color }}
                          />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-slate-500 shrink-0" />
                        )}
                        <span className="font-bold text-slate-200 truncate">{fil.name}</span>
                        {fil.material && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {fil.material}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-blue-400 font-bold shrink-0">
                        {Math.round(fil.grams)}g
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 💰 Cost Breakdown Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <h2 className="text-base font-extrabold text-white">Cost breakdown</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Saved prints</span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">No saved prints found for this filter.</div>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
              <span>🧵 Filament</span>
              <b className="text-white font-bold">{money(sums.filament, currency)}</b>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
              <span>⚡ Electricity</span>
              <b className="text-white font-bold">{money(sums.electricity, currency)}</b>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
              <span>🖨️ Depreciation</span>
              <b className="text-white font-bold">{money(sums.depreciation, currency)}</b>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
              <span>🧰 Consumables</span>
              <b className="text-white font-bold">{money(sums.consumables, currency)}</b>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
              <span>👷 Labor</span>
              <b className="text-white font-bold">{money(sums.labor, currency)}</b>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
              <span>♻️ Failure allowance</span>
              <b className="text-white font-bold">{money(sums.waste, currency)}</b>
            </div>

            <div className="mt-3.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              ❌ Failed prints: <b className="text-slate-200">{failed.length}</b> · Failure rate:{' '}
              <b className="text-slate-200">{failureRate}%</b> · Failed print cost:{' '}
              <b className="text-rose-400">{money(failedCost, currency)}</b>
            </div>
          </div>
        )}
      </section>

      {/* 📅 Activity Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <h2 className="text-base font-extrabold text-white">Activity</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Recent months</span>
        </div>

        {monthEntries.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">No activity yet.</div>
        ) : (
          <div className="space-y-2 text-xs">
            {monthEntries.map(([m, n]) => (
              <div
                key={m}
                className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300"
              >
                <span className="font-semibold text-slate-300">{m}</span>
                <b className="text-blue-400 font-bold">
                  {n} print{n === 1 ? '' : 's'}
                </b>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📋 Print History Quick View */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h2 className="text-base font-extrabold text-white">Print history</h2>
          </div>
          {filteredHistory.length > 0 && (
            <button
              onClick={() => {
                triggerHaptic('warning');
                if (confirm('Delete all saved print history?')) {
                  onClearHistory();
                }
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">No saved prints yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {filteredHistory.map((x) => (
              <div key={x.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                    <span>{x.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-blue-300 font-medium shrink-0">
                      {x.printerName || 'A1 Mini'}
                    </span>
                    {x.filamentName && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-purple-300 font-medium shrink-0 flex items-center gap-1">
                        {x.filamentColor && (
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: x.filamentColor }}
                          />
                        )}
                        {x.filamentMaterial || 'PLA'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {displayPrintDate(x)} · {x.grams || 0} g · {formatHours(x.time || 0)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-white">{money(x.cost, currency)}</div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                      x.status === 'failed'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    }`}
                  >
                    {x.status === 'failed' ? 'Failed' : 'Success'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
