import React, { useRef } from 'react';
import {
  PrintItem,
  PrinterParams,
  PrinterProfile,
  FilamentProfile,
  AllMaintenanceStore,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
} from '../types';
import { triggerHaptic } from '../utils/haptics';
import { Download, FileSpreadsheet, Upload, ShieldCheck, Globe } from 'lucide-react';

interface DataBackupTabProps {
  settings: PrinterParams;
  history: PrintItem[];
  profiles: PrinterProfile[];
  activePrinterId: string;
  filaments?: FilamentProfile[];
  activeFilamentId?: string;
  currency?: CurrencyCode;
  onSelectCurrency?: (c: CurrencyCode) => void;
  maintenanceStore: AllMaintenanceStore;
  theme?: string;
  onImportSuccess: (imported: {
    settings: PrinterParams;
    history: PrintItem[];
    profiles?: PrinterProfile[];
    activePrinterId?: string;
    filaments?: FilamentProfile[];
    activeFilamentId?: string;
    currency?: CurrencyCode;
    maintenanceStore?: AllMaintenanceStore;
  }) => void;
  onOpenExportModal: (filename: string, content: string, mime: string) => void;
}

export const DataBackupTab: React.FC<DataBackupTabProps> = ({
  settings,
  history,
  profiles,
  activePrinterId,
  filaments = [],
  activeFilamentId,
  currency = 'IDR',
  onSelectCurrency,
  maintenanceStore,
  onImportSuccess,
  onOpenExportModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;

  const downloadFile = async (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });

    // Try Android / WebView native Web Share API first
    try {
      if (navigator.share) {
        if (navigator.canShare) {
          const file = new File([blob], filename, { type: mime });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: '3D Print Companion export', text: filename, files: [file] });
            return;
          }
        } else {
          await navigator.share({ title: '3D Print Companion export', text: filename });
          onOpenExportModal(filename, content, mime);
          return;
        }
      }
    } catch (e: any) {
      if (e && e.name === 'AbortError') return;
    }

    // Try normal browser file download
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setTimeout(() => {
        onOpenExportModal(filename, content, mime);
      }, 600);
    } catch {
      onOpenExportModal(filename, content, mime);
    }
  };

  const handleExportBackup = () => {
    triggerHaptic('light');
    const data = {
      app: '3D Print Companion',
      version: '4.4',
      schema: 3,
      exportedAt: new Date().toISOString(),
      currency,
      settings,
      profiles,
      activePrinterId,
      filaments,
      activeFilamentId,
      maintenanceStore,
      history,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const filename = `3D_Print_Companion_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(filename, jsonStr, 'application/json;charset=utf-8');
  };

  const csvCell = (v: any) => {
    const s = String(v ?? '');
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const handleExportCSV = () => {
    triggerHaptic('light');
    if (!history.length) {
      alert('No print history to export.');
      return;
    }
    const rows = [
      [
        'ID',
        'Printer',
        'Print name',
        'Filament',
        'Material',
        'Date',
        'Filament (g)',
        'Time (hours)',
        `Total cost (${currencySymbol})`,
        `Selling price (${currencySymbol})`,
        'Status',
      ],
      ...history.map((x) => [
        x.id,
        x.printerName || 'Bambu Lab A1 Mini',
        x.name,
        x.filamentName || 'Generic',
        x.filamentMaterial || 'PLA',
        x.printDate || x.date,
        x.grams,
        x.time,
        Math.round(x.cost || 0),
        Math.round(x.selling || 0),
        x.status,
      ]),
    ];
    const csv = '\ufeff' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    const filename = `3D_Print_Companion_history_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(filename, csv, 'text/csv;charset=utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (
          (data.app !== 'PrintCost' && data.app !== '3D Print Companion') ||
          !Array.isArray(data.history)
        ) {
          throw new Error('Invalid backup file');
        }
        if (!confirm('Import this backup? Existing application data will be replaced.')) {
          return;
        }

        triggerHaptic('success');
        onImportSuccess({
          settings: data.settings || {},
          history: data.history,
          profiles: Array.isArray(data.profiles) ? data.profiles : undefined,
          activePrinterId: data.activePrinterId,
          filaments: Array.isArray(data.filaments)
            ? data.filaments
            : Array.isArray(data.filamentProfiles)
            ? data.filamentProfiles
            : undefined,
          activeFilamentId: data.activeFilamentId,
          currency: data.currency,
          maintenanceStore:
            data.maintenanceStore ||
            (data.maintenance ? { 'bambu-a1-mini': data.maintenance } : undefined),
        });
        alert('Backup imported successfully.');
      } catch {
        triggerHaptic('warning');
        alert('Could not import backup. Please select a valid 3D Print Companion / PrintCost backup file.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Currency Settings Card */}
      {onSelectCurrency && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-white">Currency & Region</h2>
            </div>
            <span className="text-xs font-bold text-amber-400">
              {currencyConfig.flag} {currencyConfig.symbol} {currencyConfig.code}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Active Currency</span>
              <span className="text-[11px] text-slate-400">
                All prices, costs, rates & exports use this currency.
              </span>
            </div>
            <select
              value={currency}
              onChange={(e) => {
                triggerHaptic('light');
                onSelectCurrency(e.target.value as CurrencyCode);
              }}
              className="bg-slate-900 border border-slate-700 text-xs font-extrabold text-white rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.label} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Backup Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">💾</span>
            <h2 className="text-base font-extrabold text-white">Data backup</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Protect your history & profiles</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            Export all printer profiles, filament profiles, machine-specific maintenance logs, replacement parts, and print history.
            Keep your 3D printing data protected across devices and browser updates.
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportBackup}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md active:scale-95 transition"
          >
            <Download className="w-4 h-4" /> ⬇️ Export full backup (JSON)
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs border border-slate-700 active:scale-95 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> 📄 Export CSV (History & Fleet)
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs border border-slate-700 active:scale-95 transition"
          >
            <Upload className="w-4 h-4 text-cyan-400" /> ⬆️ Import backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-500 font-medium">
            3D Print Companion v4.4 JSON & CSV format · Multi-profile & Multi-currency compatible
          </span>
        </div>
      </section>
    </div>
  );
};
