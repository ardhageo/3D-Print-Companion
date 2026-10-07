import {
  PrinterParams,
  PrintItem,
  PrinterProfile,
  PrinterMaintenanceData,
  AllMaintenanceStore,
  DEFAULT_PROFILES,
  DEFAULT_SETTINGS,
  DEFAULT_FILAMENTS,
  FilamentProfile,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  PRESET_MAINTENANCE_TASKS,
  MaintenanceTaskDef,
} from '../types';
import { setActiveCurrency } from './calc';

export const PROFILES_KEY = 'printcost-printer-profiles';
export const ACTIVE_PRINTER_KEY = 'printcost-active-printer-id';
export const FILAMENTS_KEY = 'printcost-filament-profiles';
export const ACTIVE_FILAMENT_KEY = 'printcost-active-filament-id';
export const CURRENCY_KEY = 'printcost-currency';
export const SETTINGS_KEY = 'printcost-settings';
export const HISTORY_KEY = 'printcost-history';
export const MAINTENANCE_STORE_KEY = 'printcost-maintenance-v2';
export const LEGACY_MAINTENANCE_KEY = 'printcost-maintenance';

export function loadCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(CURRENCY_KEY) as CurrencyCode;
    if (raw && SUPPORTED_CURRENCIES[raw]) {
      setActiveCurrency(raw);
      return raw;
    }
  } catch {}
  setActiveCurrency('IDR');
  return 'IDR';
}

export function saveCurrency(code: CurrencyCode): void {
  try {
    if (SUPPORTED_CURRENCIES[code]) {
      localStorage.setItem(CURRENCY_KEY, code);
      setActiveCurrency(code);
    }
  } catch (e) {
    console.error('Error saving currency', e);
  }
}

export function loadFilamentProfiles(): FilamentProfile[] {
  try {
    const raw = localStorage.getItem(FILAMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading filament profiles', e);
  }

  saveFilamentProfiles(DEFAULT_FILAMENTS);
  return DEFAULT_FILAMENTS;
}

export function saveFilamentProfiles(filaments: FilamentProfile[]): void {
  try {
    localStorage.setItem(FILAMENTS_KEY, JSON.stringify(filaments));
  } catch (e) {
    console.error('Error saving filament profiles', e);
  }
}

export function loadActiveFilamentId(filaments: FilamentProfile[]): string {
  try {
    const stored = localStorage.getItem(ACTIVE_FILAMENT_KEY);
    if (stored && filaments.some((f) => f.id === stored)) {
      return stored;
    }
  } catch {}
  return filaments[0]?.id || 'fil-bambu-pla';
}

export function saveActiveFilamentId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_FILAMENT_KEY, id);
  } catch {}
}

export function loadPrinterProfiles(): PrinterProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading printer profiles', e);
  }

  // Check legacy settings to preserve any custom values user entered
  try {
    const legacyRaw = localStorage.getItem(SETTINGS_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy.printer) {
        const initialProfile: PrinterProfile = {
          id: 'bambu-a1-mini',
          name: legacy.printer,
          presetKey: 'bambu_a1',
          power: legacy.power || '75',
          printerPrice: legacy.printerPrice || '4400000',
          life: legacy.life || '3500',
        };
        savePrinterProfiles([initialProfile]);
        return [initialProfile];
      }
    }
  } catch {}

  savePrinterProfiles(DEFAULT_PROFILES);
  return DEFAULT_PROFILES;
}

export function savePrinterProfiles(profiles: PrinterProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Error saving printer profiles', e);
  }
}

export function loadActivePrinterId(profiles: PrinterProfile[]): string {
  try {
    const stored = localStorage.getItem(ACTIVE_PRINTER_KEY);
    if (stored && profiles.some((p) => p.id === stored)) {
      return stored;
    }
  } catch {}
  return profiles[0]?.id || 'bambu-a1-mini';
}

export function saveActivePrinterId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PRINTER_KEY, id);
  } catch {}
}

export function loadSettings(): PrinterParams {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: PrinterParams): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadHistory(): PrintItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: PrintItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history', e);
  }
}

export function loadAllMaintenanceStore(defaultPrinterId: string): AllMaintenanceStore {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}

  // Check legacy maintenance format
  const store: AllMaintenanceStore = {};
  try {
    const legacyRaw = localStorage.getItem(LEGACY_MAINTENANCE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      store[defaultPrinterId] = {
        sessions: Array.isArray(legacy.sessions) ? legacy.sessions : [],
        parts: Array.isArray(legacy.parts) ? legacy.parts : [],
        checks: legacy.checks || {},
        hourOffset: Number(legacy.hourOffset) || 0,
      };
      saveAllMaintenanceStore(store);
      return store;
    }
  } catch {}

  return store;
}

export function saveAllMaintenanceStore(store: AllMaintenanceStore): void {
  try {
    localStorage.setItem(MAINTENANCE_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save maintenance store', e);
  }
}

export function getPrinterMaintenanceData(
  store: AllMaintenanceStore,
  printerId: string
): PrinterMaintenanceData {
  if (store[printerId]) {
    return store[printerId];
  }
  return {
    sessions: [],
    parts: [],
    checks: {},
    hourOffset: 0,
    customTasks: [],
  };
}

export function getEffectivePrinterTasks(profile: PrinterProfile, maintData?: PrinterMaintenanceData): MaintenanceTaskDef[] {
  const presetTasks = PRESET_MAINTENANCE_TASKS[profile.presetKey] || PRESET_MAINTENANCE_TASKS.custom;
  const customFromProfile = profile.customTasks || [];
  const customFromMaint = maintData?.customTasks || [];

  // Merge custom tasks without duplicate IDs
  const customTasksMap = new Map<string, MaintenanceTaskDef>();
  customFromProfile.forEach((t) => customTasksMap.set(t.id, t));
  customFromMaint.forEach((t) => customTasksMap.set(t.id, t));

  return [...presetTasks, ...Array.from(customTasksMap.values())];
}

export function calculatePrinterRuntime(
  history: PrintItem[],
  printerId: string,
  printerName?: string
): number {
  return history
    .filter((x) => {
      if (x.printerId) return x.printerId === printerId;
      if (printerName && x.printerName) return x.printerName === printerName;
      // Fallback: if no printer specified, attribute to first default printer
      return printerId === 'bambu-a1-mini';
    })
    .reduce((sum, x) => sum + (Number(x.time) || 0), 0);
}

export function calculateTotalRuntime(history: PrintItem[]): number {
  return history.reduce((sum, x) => sum + (Number(x.time) || 0), 0);
}

export function getEffectivePrinterHours(
  history: PrintItem[],
  maintData: PrinterMaintenanceData,
  printerId: string,
  printerName?: string
): number {
  const rt = calculatePrinterRuntime(history, printerId, printerName);
  return Math.max(0, rt + Number(maintData.hourOffset || 0));
}

export function sortHistoryByPrintDate(arr: PrintItem[]): PrintItem[] {
  return [...arr].sort((a, b) => {
    const da = a.printDate ? new Date(`${a.printDate}T12:00:00`) : new Date(a.date || 0);
    const db = b.printDate ? new Date(`${b.printDate}T12:00:00`) : new Date(b.date || 0);
    return db.getTime() - da.getTime();
  });
}
