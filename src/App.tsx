/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  PrinterParams,
  PrintItem,
  PrinterProfile,
  PrinterMaintenanceData,
  AllMaintenanceStore,
  MaintenanceSession,
  MaintenanceTaskDef,
  FilamentProfile,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
} from './types';
import {
  loadPrinterProfiles,
  savePrinterProfiles,
  loadActivePrinterId,
  saveActivePrinterId,
  loadAllMaintenanceStore,
  saveAllMaintenanceStore,
  getPrinterMaintenanceData,
  getEffectivePrinterTasks,
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  sortHistoryByPrintDate,
  getEffectivePrinterHours,
  loadCurrency,
  saveCurrency,
  loadFilamentProfiles,
  saveFilamentProfiles,
  loadActiveFilamentId,
  saveActiveFilamentId,
} from './utils/storage';
import { calculateCost, setActiveCurrency } from './utils/calc';

import { AndroidTopBar, AppTab } from './components/AndroidTopBar';
import { CalculatorTab } from './components/CalculatorTab';
import { StatsTab } from './components/StatsTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { DataBackupTab } from './components/DataBackupTab';
import { EditPrintModal } from './components/EditPrintModal';
import { EditMaintenanceModal } from './components/EditMaintenanceModal';
import { ExportModal } from './components/ExportModal';
import { PrinterProfileModal } from './components/PrinterProfileModal';
import { FilamentProfileModal } from './components/FilamentProfileModal';
import { AddTaskModal } from './components/AddTaskModal';

export default function App() {
  // Current tab (top only: calc, stats, maint, backup)
  const [currentTab, setCurrentTab] = useState<AppTab>('calc');

  // Active currency
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const c = loadCurrency();
    setActiveCurrency(c);
    return c;
  });

  // Multi-printer profiles
  const [profiles, setProfiles] = useState<PrinterProfile[]>(() => loadPrinterProfiles());
  const [activePrinterId, setActivePrinterId] = useState<string>(() => loadActivePrinterId(profiles));

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activePrinterId) || profiles[0];
  }, [profiles, activePrinterId]);

  // Multi-filament profiles
  const [filaments, setFilaments] = useState<FilamentProfile[]>(() => loadFilamentProfiles());
  const [activeFilamentId, setActiveFilamentId] = useState<string>(() => loadActiveFilamentId(filaments));

  const activeFilament = useMemo(() => {
    return filaments.find((f) => f.id === activeFilamentId) || filaments[0];
  }, [filaments, activeFilamentId]);

  // Core settings & history
  const [settings, setSettings] = useState<PrinterParams>(() => {
    const s = loadSettings();
    const prof = profiles.find((p) => p.id === activePrinterId) || profiles[0];
    const fil = filaments.find((f) => f.id === activeFilamentId) || filaments[0];

    const result = { ...s };
    if (prof) {
      result.printer = prof.name;
      result.power = prof.power;
      result.printerPrice = prof.printerPrice;
      result.life = prof.life;
    }
    if (fil) {
      const rollPrice = Number(fil.price) || 0;
      const rollGrams = Math.max(1, Number(fil.spoolWeightGrams) || 1000);
      result.filamentPrice = String(Math.round((rollPrice / rollGrams) * 1000));
    }
    return result;
  });

  const [history, setHistory] = useState<PrintItem[]>(() => loadHistory());

  // Maintenance store (multi-printer)
  const [maintenanceStore, setMaintenanceStore] = useState<AllMaintenanceStore>(() =>
    loadAllMaintenanceStore(activeProfile.id)
  );

  const activeMaintData = useMemo(() => {
    return getPrinterMaintenanceData(maintenanceStore, activeProfile.id);
  }, [maintenanceStore, activeProfile.id]);

  // Modal states
  const [editingPrint, setEditingPrint] = useState<PrintItem | null>(null);
  const [editingSession, setEditingSession] = useState<MaintenanceSession | null>(null);
  const [profileModalState, setProfileModalState] = useState<{
    isOpen: boolean;
    profile: PrinterProfile | null;
    isNew: boolean;
  }>({
    isOpen: false,
    profile: null,
    isNew: false,
  });
  const [filamentModalState, setFilamentModalState] = useState<{
    isOpen: boolean;
    profile: FilamentProfile | null;
    isNew: boolean;
  }>({
    isOpen: false,
    profile: null,
    isNew: false,
  });
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    filename: string;
    content: string;
    mime: string;
  }>({
    isOpen: false,
    filename: '',
    content: '',
    mime: 'text/plain',
  });

  // Notification toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Switch active printer
  const handleSelectPrinterProfile = (id: string) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    setActivePrinterId(target.id);
    saveActivePrinterId(target.id);

    // Sync settings to active profile
    setSettings((prev) => {
      const updated = {
        ...prev,
        printer: target.name,
        power: target.power,
        printerPrice: target.printerPrice,
        life: target.life,
      };
      saveSettings(updated);
      return updated;
    });
    showToast(`Switched to ${target.name}`);
  };

  // Save printer profile (add new or update existing)
  const handleSavePrinterProfile = (saved: PrinterProfile) => {
    const exists = profiles.some((p) => p.id === saved.id);
    let updatedProfiles: PrinterProfile[];
    if (exists) {
      updatedProfiles = profiles.map((p) => (p.id === saved.id ? saved : p));
    } else {
      updatedProfiles = [...profiles, saved];
    }
    setProfiles(updatedProfiles);
    savePrinterProfiles(updatedProfiles);
    handleSelectPrinterProfile(saved.id);
    setProfileModalState({ isOpen: false, profile: null, isNew: false });
    showToast(`Profile "${saved.name}" saved`);
  };

  // Delete printer profile
  const handleDeletePrinterProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert('You must have at least one printer profile.');
      return;
    }
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    savePrinterProfiles(updated);
    handleSelectPrinterProfile(updated[0].id);
    setProfileModalState({ isOpen: false, profile: null, isNew: false });
    showToast('Printer profile deleted');
  };

  // Switch currency
  const handleSelectCurrency = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    saveCurrency(newCurrency);
    setActiveCurrency(newCurrency);
    const cfg = SUPPORTED_CURRENCIES[newCurrency] || SUPPORTED_CURRENCIES.IDR;
    showToast(`Currency set to ${cfg.label} (${cfg.symbol})`);
  };

  // Switch active filament
  const handleSelectFilament = (id: string) => {
    const target = filaments.find((f) => f.id === id);
    if (!target) return;
    setActiveFilamentId(target.id);
    saveActiveFilamentId(target.id);

    // Sync filament price per kg to print settings
    const rollPrice = Number(target.price) || 0;
    const rollGrams = Math.max(1, Number(target.spoolWeightGrams) || 1000);
    const pricePerKg = Math.round((rollPrice / rollGrams) * 1000);
    setSettings((prev) => {
      const updated = {
        ...prev,
        filamentPrice: String(pricePerKg),
      };
      saveSettings(updated);
      return updated;
    });
    showToast(`Selected filament: ${target.name}`);
  };

  // Save filament profile (add or update)
  const handleSaveFilamentProfile = (saved: FilamentProfile) => {
    const exists = filaments.some((f) => f.id === saved.id);
    let updatedFilaments: FilamentProfile[];
    if (exists) {
      updatedFilaments = filaments.map((f) => (f.id === saved.id ? saved : f));
    } else {
      updatedFilaments = [...filaments, saved];
    }
    setFilaments(updatedFilaments);
    saveFilamentProfiles(updatedFilaments);
    setActiveFilamentId(saved.id);
    saveActiveFilamentId(saved.id);

    // Sync price per kg to print settings
    const rollPrice = Number(saved.price) || 0;
    const rollGrams = Math.max(1, Number(saved.spoolWeightGrams) || 1000);
    const pricePerKg = Math.round((rollPrice / rollGrams) * 1000);
    setSettings((prev) => {
      const updated = {
        ...prev,
        filamentPrice: String(pricePerKg),
      };
      saveSettings(updated);
      return updated;
    });

    setFilamentModalState({ isOpen: false, profile: null, isNew: false });
    showToast(`Filament "${saved.name}" saved`);
  };

  // Delete filament profile
  const handleDeleteFilamentProfile = (id: string) => {
    if (filaments.length <= 1) {
      alert('You must have at least one filament profile.');
      return;
    }
    const updated = filaments.filter((f) => f.id !== id);
    setFilaments(updated);
    saveFilamentProfiles(updated);
    handleSelectFilament(updated[0].id);
    setFilamentModalState({ isOpen: false, profile: null, isNew: false });
    showToast('Filament profile deleted');
  };

  // Live calculation results based on current settings
  const calcResult = useMemo(() => calculateCost(settings), [settings]);

  // Tasks due count for active printer
  const tasksDueCount = useMemo(() => {
    const effectiveHours = getEffectivePrinterHours(
      history,
      activeMaintData,
      activeProfile.id,
      activeProfile.name
    );
    const tasks = getEffectivePrinterTasks(activeProfile, activeMaintData);
    let due = 0;
    tasks.forEach((t) => {
      const sessions = activeMaintData.sessions.filter((x) =>
        (x.itemIds || x.items.map((name) => {
          const found = tasks.find((k) => k.name === name);
          return found ? found.id : null;
        })).includes(t.id)
      );
      const last = sessions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      if (!last) {
        if (effectiveHours >= t.interval) due++;
      } else {
        const lastH = Number(last.hours ?? last.hoursSnapshot ?? 0);
        const elapsed = Math.max(0, effectiveHours - lastH);
        const remaining = t.interval - elapsed;
        if (remaining <= t.interval * 0.2) due++;
      }
    });
    return due;
  }, [history, activeMaintData, activeProfile]);

  // Handlers for settings
  const handleUpdateSetting = (field: keyof PrinterParams, value: string) => {
    setSettings((prev) => {
      const updated = { ...prev, [field]: value };
      saveSettings(updated);
      return updated;
    });

    // If changing printer parameters directly, sync into active profile
    if ((['printer', 'power', 'printerPrice', 'life'] as (keyof PrinterParams)[]).includes(field)) {
      setProfiles((prev) => {
        const updated = prev.map((p) => {
          if (p.id === activeProfile.id) {
            return {
              ...p,
              name: field === 'printer' ? value : p.name,
              power: field === 'power' ? value : p.power,
              printerPrice: field === 'printerPrice' ? value : p.printerPrice,
              life: field === 'life' ? value : p.life,
            };
          }
          return p;
        });
        savePrinterProfiles(updated);
        return updated;
      });
    }
  };

  const handleResetInputs = () => {
    setSettings((prev) => {
      const reset = {
        ...prev,
        grams: '85',
        hours: '6',
        minutes: '0',
        consumables: '0',
        labor: '0',
        waste: '0',
      };
      saveSettings(reset);
      return reset;
    });
    showToast('Print inputs reset to defaults');
  };

  // Handlers for print history
  const handleSavePrint = (newItemData: Omit<PrintItem, 'id' | 'date'>) => {
    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const item: PrintItem = {
      ...newItemData,
      id,
      printerId: activeProfile.id,
      printerName: activeProfile.name,
      date: new Date().toISOString(),
    };
    const updated = [item, ...history];
    setHistory(updated);
    saveHistory(updated);
    showToast('Print saved to history');
  };

  const handleUpdatePrint = (updatedItem: PrintItem) => {
    const updated = history.map((x) => (x.id === updatedItem.id ? updatedItem : x));
    setHistory(updated);
    saveHistory(updated);
    setEditingPrint(null);
    showToast('Print updated');
  };

  const handleDeletePrint = (id: string) => {
    const updated = history.filter((x) => x.id !== id);
    setHistory(updated);
    saveHistory(updated);
    showToast('Print deleted');
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
    showToast('History cleared');
  };

  // Handlers for maintenance
  const handleUpdateActiveMaintData = (updatedMaintData: PrinterMaintenanceData) => {
    const updatedStore: AllMaintenanceStore = {
      ...maintenanceStore,
      [activeProfile.id]: updatedMaintData,
    };
    setMaintenanceStore(updatedStore);
    saveAllMaintenanceStore(updatedStore);
  };

  const handleUpdateSession = (updatedSession: MaintenanceSession) => {
    const updatedSessions = activeMaintData.sessions.map((x) =>
      x.id === updatedSession.id ? updatedSession : x
    );
    handleUpdateActiveMaintData({
      ...activeMaintData,
      sessions: updatedSessions,
    });
    setEditingSession(null);
    showToast('Maintenance session updated');
  };

  const handleAddCustomTask = (task: MaintenanceTaskDef) => {
    const existing = activeMaintData.customTasks || [];
    handleUpdateActiveMaintData({
      ...activeMaintData,
      customTasks: [...existing, task],
    });
    setIsAddTaskModalOpen(false);
    showToast(`Added task "${task.name}"`);
  };

  // Handlers for backup/import
  const handleImportSuccess = (imported: {
    settings: PrinterParams;
    history: PrintItem[];
    profiles?: PrinterProfile[];
    activePrinterId?: string;
    filaments?: FilamentProfile[];
    activeFilamentId?: string;
    currency?: CurrencyCode;
    maintenanceStore?: AllMaintenanceStore;
  }) => {
    setSettings(imported.settings);
    saveSettings(imported.settings);

    setHistory(imported.history);
    saveHistory(imported.history);

    if (imported.currency) {
      setCurrency(imported.currency);
      saveCurrency(imported.currency);
      setActiveCurrency(imported.currency);
    }

    if (imported.profiles && imported.profiles.length > 0) {
      setProfiles(imported.profiles);
      savePrinterProfiles(imported.profiles);
    }

    if (imported.activePrinterId) {
      setActivePrinterId(imported.activePrinterId);
      saveActivePrinterId(imported.activePrinterId);
    }

    if (imported.filaments && imported.filaments.length > 0) {
      setFilaments(imported.filaments);
      saveFilamentProfiles(imported.filaments);
    }

    if (imported.activeFilamentId) {
      setActiveFilamentId(imported.activeFilamentId);
      saveActiveFilamentId(imported.activeFilamentId);
    }

    if (imported.maintenanceStore) {
      setMaintenanceStore(imported.maintenanceStore);
      saveAllMaintenanceStore(imported.maintenanceStore);
    }

    showToast('Backup restored successfully');
  };

  const handleOpenExportModal = (filename: string, content: string, mime: string) => {
    setExportModalState({
      isOpen: true,
      filename,
      content,
      mime,
    });
  };

  const sortedHistory = useMemo(() => sortHistoryByPrintDate(history), [history]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Android App Bar with Icon-Only Top Tabs and Currency Selector */}
      <AndroidTopBar
        tasksDueCount={tasksDueCount}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currency={currency}
        onSelectCurrency={handleSelectCurrency}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-12">
        {currentTab === 'calc' && (
          <CalculatorTab
            settings={settings}
            onUpdateSetting={handleUpdateSetting}
            calcResult={calcResult}
            history={sortedHistory}
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={handleSelectPrinterProfile}
            onOpenNewProfileModal={() =>
              setProfileModalState({ isOpen: true, profile: null, isNew: true })
            }
            onOpenEditProfileModal={(prof) =>
              setProfileModalState({ isOpen: true, profile: prof, isNew: false })
            }
            filaments={filaments}
            activeFilament={activeFilament}
            onSelectFilament={handleSelectFilament}
            onOpenNewFilamentModal={() =>
              setFilamentModalState({ isOpen: true, profile: null, isNew: true })
            }
            onOpenEditFilamentModal={(fil) =>
              setFilamentModalState({ isOpen: true, profile: fil, isNew: false })
            }
            currency={currency}
            onSelectCurrency={handleSelectCurrency}
            onSavePrint={handleSavePrint}
            onResetInputs={handleResetInputs}
            onEditPrint={(item) => setEditingPrint(item)}
            onDeletePrint={handleDeletePrint}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentTab === 'stats' && (
          <StatsTab
            history={sortedHistory}
            profiles={profiles}
            activeProfile={activeProfile}
            currency={currency}
            onClearHistory={handleClearHistory}
          />
        )}

        {currentTab === 'maint' && (
          <MaintenanceTab
            activeProfile={activeProfile}
            profiles={profiles}
            onSelectProfile={handleSelectPrinterProfile}
            maintData={activeMaintData}
            history={history}
            currency={currency}
            onUpdateMaintData={handleUpdateActiveMaintData}
            onEditSession={(s) => setEditingSession(s)}
            onOpenAddTaskModal={() => setIsAddTaskModalOpen(true)}
            onNotify={showToast}
          />
        )}

        {currentTab === 'backup' && (
          <DataBackupTab
            settings={settings}
            history={history}
            profiles={profiles}
            activePrinterId={activeProfile.id}
            filaments={filaments}
            activeFilamentId={activeFilament?.id}
            currency={currency}
            onSelectCurrency={handleSelectCurrency}
            maintenanceStore={maintenanceStore}
            onImportSuccess={handleImportSuccess}
            onOpenExportModal={handleOpenExportModal}
          />
        )}
      </main>

      {/* Android Toast / Snackbar */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modals with fresh instance keys */}
      {editingPrint && (
        <EditPrintModal
          key={editingPrint.id}
          item={editingPrint}
          profiles={profiles}
          filaments={filaments}
          currency={currency}
          onClose={() => setEditingPrint(null)}
          onSave={handleUpdatePrint}
        />
      )}

      {editingSession && (
        <EditMaintenanceModal
          key={editingSession.id}
          session={editingSession}
          tasks={getEffectivePrinterTasks(activeProfile, activeMaintData)}
          onClose={() => setEditingSession(null)}
          onSave={handleUpdateSession}
        />
      )}

      {profileModalState.isOpen && (
        <PrinterProfileModal
          key={profileModalState.profile?.id || 'new_profile'}
          profile={profileModalState.profile}
          isNew={profileModalState.isNew}
          canDelete={profiles.length > 1}
          currency={currency}
          onClose={() =>
            setProfileModalState({ isOpen: false, profile: null, isNew: false })
          }
          onSave={handleSavePrinterProfile}
          onDelete={handleDeletePrinterProfile}
        />
      )}

      {filamentModalState.isOpen && (
        <FilamentProfileModal
          key={filamentModalState.profile?.id || 'new_filament'}
          isOpen={filamentModalState.isOpen}
          profile={filamentModalState.profile}
          isNew={filamentModalState.isNew}
          canDelete={filaments.length > 1}
          currency={currency}
          onClose={() =>
            setFilamentModalState({ isOpen: false, profile: null, isNew: false })
          }
          onSave={handleSaveFilamentProfile}
          onDelete={handleDeleteFilamentProfile}
        />
      )}

      {isAddTaskModalOpen && (
        <AddTaskModal
          onClose={() => setIsAddTaskModalOpen(false)}
          onSave={handleAddCustomTask}
        />
      )}

      <ExportModal
        isOpen={exportModalState.isOpen}
        filename={exportModalState.filename}
        content={exportModalState.content}
        mime={exportModalState.mime}
        onClose={() =>
          setExportModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onNotify={showToast}
      />
    </div>
  );
}
