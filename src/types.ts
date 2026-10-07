export type PrinterPresetKey =
  | 'bambu_a1'
  | 'bambu_p1_x1'
  | 'ender_3'
  | 'prusa_mk4'
  | 'creality_k1'
  | 'custom';

export interface MaintenanceTaskDef {
  id: string;
  name: string;
  cat: string;
  desc: string;
  interval: number; // hours
  isCustom?: boolean;
}

export interface PrinterPresetInfo {
  key: PrinterPresetKey;
  label: string;
  defaultName: string;
  defaultPower: string;
  defaultPrice: string;
  defaultLife: string;
  description: string;
}

export interface PrinterProfile {
  id: string;
  name: string;
  presetKey: PrinterPresetKey;
  power: string;
  printerPrice: string;
  life: string;
  customTasks?: MaintenanceTaskDef[];
}

export interface FilamentProfile {
  id: string;
  name: string;
  brand?: string;
  material: string; // PLA, PLA+, PETG, TPU, ABS, ASA, PC, PA-CF, PETG-CF, Resin, Other
  price: string; // price per roll / spool or per kg in active currency
  spoolWeightGrams?: string; // default "1000" (1kg)
  density?: string; // g/cm³
  colorName?: string;
  colorHex?: string;
  notes?: string;
}

export type CurrencyCode =
  | 'IDR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AUD'
  | 'CAD'
  | 'SGD'
  | 'MYR'
  | 'JPY'
  | 'PHP'
  | 'BRL'
  | 'INR'
  | 'CNY'
  | 'THB';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
  decimals: number;
  locale: string;
  defaultFilamentPrice: string;
  defaultPrinterPrice: string;
  defaultElectricity: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    label: 'Indonesian Rupiah',
    flag: '🇮🇩',
    decimals: 0,
    locale: 'id-ID',
    defaultFilamentPrice: '300000',
    defaultPrinterPrice: '4400000',
    defaultElectricity: '1444.70',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    flag: '🇺🇸',
    decimals: 2,
    locale: 'en-US',
    defaultFilamentPrice: '20.00',
    defaultPrinterPrice: '299.00',
    defaultElectricity: '0.15',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Euro',
    flag: '🇪🇺',
    decimals: 2,
    locale: 'de-DE',
    defaultFilamentPrice: '22.00',
    defaultPrinterPrice: '319.00',
    defaultElectricity: '0.28',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound',
    flag: '🇬🇧',
    decimals: 2,
    locale: 'en-GB',
    defaultFilamentPrice: '19.00',
    defaultPrinterPrice: '269.00',
    defaultElectricity: '0.26',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    label: 'Australian Dollar',
    flag: '🇦🇺',
    decimals: 2,
    locale: 'en-AU',
    defaultFilamentPrice: '32.00',
    defaultPrinterPrice: '469.00',
    defaultElectricity: '0.30',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    label: 'Canadian Dollar',
    flag: '🇨🇦',
    decimals: 2,
    locale: 'en-CA',
    defaultFilamentPrice: '28.00',
    defaultPrinterPrice: '419.00',
    defaultElectricity: '0.18',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    label: 'Singapore Dollar',
    flag: '🇸🇬',
    decimals: 2,
    locale: 'en-SG',
    defaultFilamentPrice: '28.00',
    defaultPrinterPrice: '399.00',
    defaultElectricity: '0.29',
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    label: 'Malaysian Ringgit',
    flag: '🇲🇾',
    decimals: 2,
    locale: 'ms-MY',
    defaultFilamentPrice: '75.00',
    defaultPrinterPrice: '1350.00',
    defaultElectricity: '0.45',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    label: 'Japanese Yen',
    flag: '🇯🇵',
    decimals: 0,
    locale: 'ja-JP',
    defaultFilamentPrice: '3000',
    defaultPrinterPrice: '45000',
    defaultElectricity: '31',
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    label: 'Philippine Peso',
    flag: '🇵🇭',
    decimals: 2,
    locale: 'en-PH',
    defaultFilamentPrice: '1100.00',
    defaultPrinterPrice: '16500.00',
    defaultElectricity: '11.50',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    label: 'Brazilian Real',
    flag: '🇧🇷',
    decimals: 2,
    locale: 'pt-BR',
    defaultFilamentPrice: '120.00',
    defaultPrinterPrice: '2200.00',
    defaultElectricity: '0.85',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'Indian Rupee',
    flag: '🇮🇳',
    decimals: 2,
    locale: 'en-IN',
    defaultFilamentPrice: '1600.00',
    defaultPrinterPrice: '25000.00',
    defaultElectricity: '7.50',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    label: 'Chinese Yuan',
    flag: '🇨🇳',
    decimals: 2,
    locale: 'zh-CN',
    defaultFilamentPrice: '60.00',
    defaultPrinterPrice: '1699.00',
    defaultElectricity: '0.65',
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    label: 'Thai Baht',
    flag: '🇹🇭',
    decimals: 2,
    locale: 'th-TH',
    defaultFilamentPrice: '680.00',
    defaultPrinterPrice: '10500.00',
    defaultElectricity: '4.80',
  },
};

export const MATERIAL_DENSITIES: Record<string, number> = {
  PLA: 1.24,
  'PLA+': 1.24,
  PETG: 1.27,
  TPU: 1.21,
  ABS: 1.04,
  ASA: 1.07,
  PC: 1.20,
  PA: 1.14,
  'PA-CF': 1.18,
  'PETG-CF': 1.29,
  'PLA-CF': 1.26,
  Resin: 1.10,
};

export interface PrinterParams {
  printer: string;
  power: string;
  printerPrice: string;
  life: string;
  filamentPrice: string;
  grams: string;
  hours: string;
  minutes: string;
  electricity: string;
  consumables: string;
  labor: string;
  waste: string;
  margin: string;
  [key: string]: string;
}

export interface PrintItem {
  id: string;
  printerId?: string;
  printerName?: string;
  filamentId?: string;
  filamentName?: string;
  filamentMaterial?: string;
  filamentColor?: string;
  name: string;
  date: string;
  printDate?: string;
  grams: number;
  time: number; // in hours
  cost: number;
  selling: number;
  actualRevenue?: number | null;
  status: 'success' | 'failed';
  failureReason?: string;
  failureNotes?: string;
  currency?: CurrencyCode;
  params?: Partial<PrinterParams>;
}

export interface MaintenanceSession {
  id: string;
  date: string;
  notes?: string;
  hours: number;
  hoursSnapshot?: number;
  kg?: number | null;
  items: string[];
  itemIds?: string[];
}

export interface PartRecord {
  id: string;
  date: string;
  part: string;
  cost: number;
  reason?: string;
}

export interface PrinterMaintenanceData {
  sessions: MaintenanceSession[];
  parts: PartRecord[];
  checks: Record<string, boolean>;
  hourOffset: number;
  customTasks?: MaintenanceTaskDef[];
}

export type AllMaintenanceStore = Record<string, PrinterMaintenanceData>;

export interface CalculationResult {
  time: number;
  filamentCost: number;
  electricCost: number;
  printerCost: number;
  consumableCost: number;
  laborCost: number;
  wasteCost: number;
  total: number;
  selling: number;
}

export const PRINTER_PRESETS: Record<PrinterPresetKey, PrinterPresetInfo> = {
  bambu_a1: {
    key: 'bambu_a1',
    label: 'Bambu Lab A1 / A1 Mini',
    defaultName: 'Bambu Lab A1 Mini',
    defaultPower: '75',
    defaultPrice: '4400000',
    defaultLife: '3500',
    description: 'Cantilever bed-slinger with carbon rod X-axis and linear rails.',
  },
  bambu_p1_x1: {
    key: 'bambu_p1_x1',
    label: 'Bambu Lab P1S / P1P / X1C',
    defaultName: 'Bambu Lab P1S',
    defaultPower: '120',
    defaultPrice: '9500000',
    defaultLife: '4500',
    description: 'Enclosed CoreXY with carbon rods, chamber filter & triple Z-screws.',
  },
  ender_3: {
    key: 'ender_3',
    label: 'Creality Ender 3 Series',
    defaultName: 'Creality Ender 3 V3',
    defaultPower: '110',
    defaultPrice: '3200000',
    defaultLife: '3000',
    description: 'Popular bed-slinger with POM V-slot roller wheels and Bowden hotend.',
  },
  prusa_mk4: {
    key: 'prusa_mk4',
    label: 'Prusa MK3S+ / MK4 / MK4S',
    defaultName: 'Prusa MK4S',
    defaultPower: '100',
    defaultPrice: '13500000',
    defaultLife: '6000',
    description: 'Open-frame workhorse with smooth steel rods, linear ball bearings & Nextruder.',
  },
  creality_k1: {
    key: 'creality_k1',
    label: 'Creality K1 / K1 Max / K1C',
    defaultName: 'Creality K1 Max',
    defaultPower: '200',
    defaultPrice: '8800000',
    defaultLife: '4000',
    description: 'High-speed enclosed CoreXY with linear rails and active exhaust filter.',
  },
  custom: {
    key: 'custom',
    label: 'Custom / Other FDM Printer',
    defaultName: 'Custom 3D Printer',
    defaultPower: '100',
    defaultPrice: '5000000',
    defaultLife: '3500',
    description: 'Configurable profile where you can customize parameters and add custom tasks.',
  },
};

export const PRESET_MAINTENANCE_TASKS: Record<PrinterPresetKey, MaintenanceTaskDef[]> = {
  bambu_a1: [
    { id: 'plate', name: 'Build plate', cat: '🧼 Cleaning', desc: 'Clean with dish soap and warm water; inspect for scratches and adhesion issues.', interval: 10 },
    { id: 'extruder', name: 'Extruder gear', cat: '🧼 Cleaning', desc: 'Inspect/clean filament dust and debris; check extrusion grip.', interval: 50 },
    { id: 'cutter', name: 'Filament cutter blade', cat: '🔩 Inspection', desc: 'Check that filament cuts cleanly and blade mechanism is not bent or dull.', interval: 100 },
    { id: 'ptfe', name: 'PTFE tube', cat: '🔩 Inspection', desc: 'Inspect for kinks, wear, friction, and restricted filament movement.', interval: 200 },
    { id: 'fans', name: 'Toolhead fans', cat: '🧼 Cleaning', desc: 'Check hotend and part-cooling fans for dust, obstruction, or abnormal noise.', interval: 100 },
    { id: 'xrail', name: 'X-axis carbon rods', cat: '🔩 Inspection', desc: 'Wipe carbon rods clean with a dry cloth or IPA. Strictly DO NOT apply oil or grease.', interval: 100 },
    { id: 'yrail', name: 'Y-axis guide rails', cat: '🛢️ Lubrication', desc: 'Clean and lubricate linear guide rails according to A1 procedure.', interval: 100 },
    { id: 'zrail', name: 'Z-axis guide rail', cat: '🛢️ Lubrication', desc: 'Clean and lubricate steel guide rail as specified.', interval: 100 },
    { id: 'zlead', name: 'Z lead screw', cat: '🛢️ Lubrication', desc: 'Clean and apply grease; cycle Z axis to distribute evenly.', interval: 300 },
    { id: 'belts', name: 'X/Y belts', cat: '🔩 Inspection', desc: 'Inspect for fraying, abnormal slack, or skipped teeth.', interval: 500 },
    { id: 'screws', name: 'Frame & toolhead screws', cat: '🔩 Inspection', desc: 'Check accessible frame screws, toolhead cable connector, and loose hardware.', interval: 500 },
    { id: 'calibration', name: 'Full vibration calibration', cat: '⚙️ Calibration', desc: 'Run vibration resonance frequency & bed tramming calibration.', interval: 500 },
  ],
  bambu_p1_x1: [
    { id: 'plate', name: 'Build plate', cat: '🧼 Cleaning', desc: 'Wash with warm water and dish soap; inspect PEI coating.', interval: 10 },
    { id: 'wiper', name: 'Nozzle wiper & poop chute', cat: '🔩 Inspection', desc: 'Inspect silicone wiper for wear and clear any purged debris from chute.', interval: 50 },
    { id: 'xcarbon', name: 'X-axis carbon rods', cat: '🧼 Cleaning', desc: 'Wipe with lint-free cloth and IPA. Do NOT apply oil or grease.', interval: 100 },
    { id: 'yrods', name: 'Y-axis steel rods & bearings', cat: '🛢️ Lubrication', desc: 'Clean steel rods and apply low-viscosity mineral oil/PTFE lube.', interval: 100 },
    { id: 'zlead3', name: '3x Z-axis lead screws', cat: '🛢️ Lubrication', desc: 'Clean dust and apply white lithium grease to all three Z screws.', interval: 300 },
    { id: 'carbonfilter', name: 'Chamber carbon air filter', cat: '🔩 Inspection', desc: 'Inspect or replace activated carbon filter (especially after printing ABS/ASA).', interval: 300 },
    { id: 'extruder_p1', name: 'Extruder drive gears', cat: '🧼 Cleaning', desc: 'Inspect hardened steel gears and brush out filament powder.', interval: 100 },
    { id: 'chain_tube', name: 'Toolhead cable & Bowden tube', cat: '🔩 Inspection', desc: 'Check drag chain / PTFE tube rubbing against top glass cover.', interval: 200 },
    { id: 'belttension', name: 'CoreXY belt tensioners', cat: '⚙️ Calibration', desc: 'Loosen rear tensioner screws, move toolhead to equalize, retighten.', interval: 500 },
    { id: 'fans_mcu', name: 'Chamber & MC board fans', cat: '🧼 Cleaning', desc: 'Check MC board cooling fan and auxiliary chamber fan for dust buildup.', interval: 200 },
    { id: 'calibration_full', name: 'Auto bed & resonance calibration', cat: '⚙️ Calibration', desc: 'Run full system resonance compensation and bed level mesh.', interval: 500 },
  ],
  ender_3: [
    { id: 'bed_clean', name: 'Build plate surface', cat: '🧼 Cleaning', desc: 'Clean glass or magnetic PEI surface with IPA or warm dish soap.', interval: 10 },
    { id: 'vroller_wheels', name: 'POM V-slot roller wheels', cat: '🔩 Inspection', desc: 'Inspect for wear or flat spots; adjust eccentric nuts to eliminate carriage wobble.', interval: 50 },
    { id: 'vextrusion_dust', name: 'V-slot aluminum rails', cat: '🧼 Cleaning', desc: 'Wipe rubber dust and debris from V-slot grooves on X, Y, and Z axes.', interval: 50 },
    { id: 'zbrass_nut', name: 'Z lead screw & brass nut', cat: '🛢️ Lubrication', desc: 'Clean screw and lubricate brass nut with white lithium or PTFE grease.', interval: 150 },
    { id: 'hotend_ptfe', name: 'Bowden PTFE tube & throat', cat: '🔩 Inspection', desc: 'Check tube end inside hotend for heat degradation, gaps, or burning.', interval: 100 },
    { id: 'extruder_gear', name: 'Extruder brass drive gear', cat: '🧼 Cleaning', desc: 'Brush out filament teeth debris and check for groove wear.', interval: 50 },
    { id: 'belt_tension', name: 'X & Y belt tensioners', cat: '🔩 Inspection', desc: 'Check belt deflection; tighten tensioner knobs if loose.', interval: 200 },
    { id: 'fan_hotend', name: 'Hotend & part cooling fans', cat: '🧼 Cleaning', desc: 'Remove filament hairs and dust from fan blades.', interval: 100 },
    { id: 'frame_bolts', name: 'Frame screws & gantry square', cat: '🔩 Inspection', desc: 'Check that upright aluminum extrusions are square and screws tight.', interval: 300 },
    { id: 'bed_tramming', name: 'Bed tramming & Z-offset', cat: '⚙️ Calibration', desc: 'Perform manual 4-corner leveling / auto-level mesh calibration.', interval: 200 },
  ],
  prusa_mk4: [
    { id: 'pei_sheet', name: 'PEI spring steel sheet', cat: '🧼 Cleaning', desc: 'Degrease sheet with dish soap & warm water or 99% IPA.', interval: 10 },
    { id: 'smooth_rods', name: 'Smooth steel rods & bearings', cat: '🛢️ Lubrication', desc: 'Clean rods with a dry cloth and apply Misumi bearing grease.', interval: 200 },
    { id: 'nextruder_gear', name: 'Nextruder planetary gearbox', cat: '🔩 Inspection', desc: 'Inspect planetary drive gears, clean filament residue, and lightly grease.', interval: 150 },
    { id: 'zlead_trapezoid', name: 'Z trapezoidal lead screws', cat: '🛢️ Lubrication', desc: 'Clean threads and apply grease to trapezoidal nuts.', interval: 300 },
    { id: 'prusa_tuner', name: 'Belt audio frequency check', cat: '⚙️ Calibration', desc: 'Check belt acoustic resonance pitch using the Prusa Belt Tuner app.', interval: 300 },
    { id: 'hotend_fan', name: 'Blower & heatsink fans', cat: '🧼 Cleaning', desc: 'Inspect fan blades for stringing debris and dust.', interval: 100 },
    { id: 'hardware_check', name: 'Chassis fasteners & cables', cat: '🔩 Inspection', desc: 'Check toolhead cable textile sleeve and heatbed cable bracket.', interval: 500 },
    { id: 'self_test', name: 'Full self-test & loadcell test', cat: '⚙️ Calibration', desc: 'Run full electronic self-test and loadcell nozzle zero test.', interval: 500 },
  ],
  creality_k1: [
    { id: 'k1_pei', name: 'Textured PEI build plate', cat: '🧼 Cleaning', desc: 'Wash with warm water and soap; clean off purge strips.', interval: 10 },
    { id: 'linear_rails', name: 'Linear rails & guide rods', cat: '🛢️ Lubrication', desc: 'Wipe rails clean and apply thin lubricating oil or synthetic grease.', interval: 100 },
    { id: 'corexy_belts', name: 'CoreXY belt tension & gantry', cat: '⚙️ Calibration', desc: 'Check belt tension balance and verify gantry is square.', interval: 300 },
    { id: 'ext_latch', name: 'Extruder latch & drive gears', cat: '🔩 Inspection', desc: 'Check latch tension and clean filament dust from dual gears.', interval: 100 },
    { id: 'k1_zlead', name: 'Triple Z lead screws', cat: '🛢️ Lubrication', desc: 'Clean lead screws and apply grease.', interval: 300 },
    { id: 'exhaust_filter', name: 'Active carbon air filter', cat: '🔩 Inspection', desc: 'Inspect exhaust carbon filter pack and clean fan grill.', interval: 300 },
    { id: 'cooling_fans', name: 'Side auxiliary & model fans', cat: '🧼 Cleaning', desc: 'Clear dust from large auxiliary blower and toolhead fan.', interval: 150 },
    { id: 'resonance_test', name: 'Vibration compensation test', cat: '⚙️ Calibration', desc: 'Run built-in sensor input shaping and bed mesh calibration.', interval: 500 },
  ],
  custom: [
    { id: 'c_plate', name: 'Build plate', cat: '🧼 Cleaning', desc: 'Clean surface and inspect for damage, scratches, and adhesion.', interval: 10 },
    { id: 'c_extruder', name: 'Extruder gear & nozzle', cat: '🧼 Cleaning', desc: 'Clean filament dust from feeder gear; check nozzle for wear.', interval: 50 },
    { id: 'c_linear', name: 'Linear motion & guide rods', cat: '🛢️ Lubrication', desc: 'Clean guide rails/rods and apply appropriate lubricant.', interval: 100 },
    { id: 'c_zlead', name: 'Z lead screw(s)', cat: '🛢️ Lubrication', desc: 'Clean threads and apply grease.', interval: 200 },
    { id: 'c_belts', name: 'Drive belts & tension', cat: '🔩 Inspection', desc: 'Check belt tension, alignment, and wear.', interval: 300 },
    { id: 'c_fans', name: 'Cooling fans & wiring', cat: '🧼 Cleaning', desc: 'Remove dust from fans; inspect wiring and cable chains.', interval: 100 },
    { id: 'c_screws', name: 'Frame hardware', cat: '🔩 Inspection', desc: 'Check all accessible structural screws and brackets.', interval: 500 },
    { id: 'c_calibration', name: 'Bed level & calibration', cat: '⚙️ Calibration', desc: 'Verify bed tramming, Z-offset, and machine calibration.', interval: 300 },
  ],
};

export const MAINTENANCE_TASKS: MaintenanceTaskDef[] = PRESET_MAINTENANCE_TASKS.bambu_a1;

export const DEFAULT_PROFILES: PrinterProfile[] = [
  {
    id: 'bambu-a1-mini',
    name: 'Bambu Lab A1 Mini',
    presetKey: 'bambu_a1',
    power: '75',
    printerPrice: '4400000',
    life: '3500',
  },
];

export const DEFAULT_FILAMENTS: FilamentProfile[] = [
  {
    id: 'fil-bambu-pla',
    name: 'Bambu PLA Basic',
    brand: 'Bambu Lab',
    material: 'PLA',
    price: '300000',
    spoolWeightGrams: '1000',
    density: '1.24',
    colorName: 'Jade White',
    colorHex: '#f8fafc',
    notes: '210–230°C nozzle, 55–65°C bed. Great everyday printing.',
  },
  {
    id: 'fil-bambu-pla-black',
    name: 'Bambu PLA Basic Black',
    brand: 'Bambu Lab',
    material: 'PLA',
    price: '300000',
    spoolWeightGrams: '1000',
    density: '1.24',
    colorName: 'Matte Charcoal',
    colorHex: '#18181b',
    notes: 'High speed certified, smooth finish.',
  },
  {
    id: 'fil-generic-petg',
    name: 'Generic PETG',
    brand: 'Generic',
    material: 'PETG',
    price: '280000',
    spoolWeightGrams: '1000',
    density: '1.27',
    colorName: 'Translucent Clear',
    colorHex: '#94a3b8',
    notes: '235–255°C nozzle, 70–85°C bed. High impact & heat resistance.',
  },
  {
    id: 'fil-generic-tpu',
    name: 'Generic TPU 95A',
    brand: 'Generic',
    material: 'TPU',
    price: '350000',
    spoolWeightGrams: '1000',
    density: '1.21',
    colorName: 'Cobalt Blue',
    colorHex: '#2563eb',
    notes: '215–230°C nozzle, 40–50°C bed. Print slow (25–40mm/s).',
  },
  {
    id: 'fil-generic-abs',
    name: 'Generic ABS',
    brand: 'Generic',
    material: 'ABS',
    price: '260000',
    spoolWeightGrams: '1000',
    density: '1.04',
    colorName: 'Industrial Grey',
    colorHex: '#64748b',
    notes: '240–260°C nozzle, 90–100°C bed. Requires enclosure.',
  },
  {
    id: 'fil-esun-plaplus',
    name: 'eSUN PLA+',
    brand: 'eSUN',
    material: 'PLA+',
    price: '270000',
    spoolWeightGrams: '1000',
    density: '1.24',
    colorName: 'Fire Red',
    colorHex: '#dc2626',
    notes: '205–225°C nozzle. High toughness, low brittleness.',
  },
];

export const DEFAULT_SETTINGS: PrinterParams = {
  printer: 'Bambu Lab A1 Mini',
  power: '75',
  printerPrice: '4400000',
  life: '3500',
  filamentPrice: '300000',
  grams: '85',
  hours: '6',
  minutes: '0',
  electricity: '1444.70',
  consumables: '0',
  labor: '0',
  waste: '0',
  margin: '30',
};

export const FAILURE_REASONS = [
  'Adhesion / bed issue',
  'Spaghetti',
  'Layer shift',
  'Support failure',
  'Filament problem',
  'Printer problem',
  'Model / slicer issue',
  'Other',
];
