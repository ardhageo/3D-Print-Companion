import { PrinterParams, CalculationResult, CurrencyCode, SUPPORTED_CURRENCIES } from '../types';

let currentCurrency: CurrencyCode = 'IDR';

export function setActiveCurrency(c: CurrencyCode): void {
  if (SUPPORTED_CURRENCIES[c]) {
    currentCurrency = c;
  }
}

export function getActiveCurrency(): CurrencyCode {
  return currentCurrency;
}

export function formatMoney(n: number, currencyCode?: CurrencyCode): string {
  const code = currencyCode || currentCurrency || 'IDR';
  const config = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.IDR;
  const sym = config.symbol;

  if (isNaN(n) || !isFinite(n)) {
    return `${sym}0`;
  }

  if (config.decimals === 0) {
    const val = Math.round(n);
    return `${sym}` + val.toLocaleString(config.locale || 'id-ID');
  } else {
    return (
      `${sym}` +
      n.toLocaleString(config.locale || 'en-US', {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      })
    );
  }
}

export function money(n: number, currencyCode?: CurrencyCode): string {
  return formatMoney(n, currencyCode);
}

export function formatHours(h: number): string {
  const num = Number(h) || 0;
  const whole = Math.floor(num);
  const mins = Math.round((num - whole) * 60);
  if (mins === 60) return `${whole + 1}h 0m`;
  return `${whole}h ${mins}m`;
}

export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function displayPrintDate(
  x: { printDate?: string; date?: string },
  currencyCode?: CurrencyCode
): string {
  const code = currencyCode || currentCurrency || 'IDR';
  const config = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.IDR;
  const locale = config.locale || 'en-US';

  if (x.printDate) {
    const d = new Date(`${x.printDate}T12:00:00`);
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }
  const d = new Date(x.date || Date.now());
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function calculateCost(params: PrinterParams | Record<string, string>): CalculationResult {
  const hours = Number(params.hours) || 0;
  const minutes = Math.max(0, Number(params.minutes) || 0);
  const time = hours + minutes / 60;

  const filamentPrice = Number(params.filamentPrice) || 0;
  const grams = Number(params.grams) || 0;
  const filamentCost = (filamentPrice * grams) / 1000;

  const power = Number(params.power) || 0;
  const electricityRate = Number(params.electricity) || 0;
  const electricCost = (power / 1000) * time * electricityRate;

  const printerPrice = Number(params.printerPrice) || 0;
  const life = Math.max(1, Number(params.life) || 1);
  const printerCost = (printerPrice / life) * time;

  const consumableCost = Number(params.consumables) || 0;
  const laborCost = Number(params.labor) || 0;

  const base = filamentCost + electricCost + printerCost + consumableCost + laborCost;
  const wastePct = Number(params.waste) || 0;
  const wasteCost = (base * wastePct) / 100;
  const total = base + wasteCost;

  const rawMargin = Number(params.margin) || 0;
  const margin = Math.min(99.9, Math.max(0, rawMargin));
  const selling = margin >= 100 ? total : total / (1 - margin / 100);

  return {
    time,
    filamentCost,
    electricCost,
    printerCost,
    consumableCost,
    laborCost,
    wasteCost,
    total,
    selling,
  };
}
