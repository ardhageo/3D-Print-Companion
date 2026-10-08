import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/haptics';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../types';

export type AppTab = 'calc' | 'stats' | 'maint' | 'backup';

interface AndroidTopBarProps {
  tasksDueCount: number;
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  currency: CurrencyCode;
  onSelectCurrency: (currency: CurrencyCode) => void;
}

export const AndroidTopBar: React.FC<AndroidTopBarProps> = ({
  tasksDueCount,
  currentTab,
  onSelectTab,
  currency,
  onSelectCurrency,
}) => {
  const { isInstallable, install } = usePWAInstall();

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    await install();
  };

  const currentCurr =
    SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;

  const navItems = [
    { id: 'calc' as AppTab, emoji: '💰', title: 'Calculator' },
    { id: 'stats' as AppTab, emoji: '📊', title: 'Statistics' },
    {
      id: 'maint' as AppTab,
      emoji: '🔧',
      title: 'Maintenance',
      badge: tasksDueCount,
    },
    { id: 'backup' as AppTab, emoji: '💾', title: 'Data Backup' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100 shadow-xl pt-[env(safe-area-inset-top)]">
      {/* Main Top Header */}
      <div className="px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 max-w-2xl mx-auto w-full">
        {/* Brand, Currency & Mobile Install */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xs shrink-0">
              <span>3D</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white whitespace-nowrap">
                3D Print Companion
              </span>

              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300">
                v1.0.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Currency Selector */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 gap-1 text-xs hover:border-slate-700 transition">
              <span className="text-xs leading-none">
                {currentCurr.flag}
              </span>

              <span className="font-extrabold text-amber-400 text-[11px]">
                {currentCurr.code}
              </span>

              <select
                value={currency}
                onChange={(e) => {
                  triggerHaptic('light');
                  onSelectCurrency(e.target.value as CurrencyCode);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Select Currency"
                aria-label="Select Currency"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option
                    key={c.code}
                    value={c.code}
                  >
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>

              <span className="text-slate-400 text-[10px] pointer-events-none">
                ▼
              </span>
            </div>

            {/* Install Button on mobile view */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                aria-label="Install App"
                className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95 shrink-0"
                title="Install Android App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Install</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Icon-Only Navigation Tabs */}
        <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          <nav
            aria-label="App Navigation Tabs"
            className="w-full sm:w-auto grid grid-cols-4 sm:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90"
          >
            {navItems.map((tab) => {
              const isActive = currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectTab(tab.id);
                  }}
                  title={tab.title}
                  aria-label={tab.title}
                  className={`relative flex items-center justify-center h-9 sm:w-10 sm:h-9 rounded-xl text-base transition-all select-none active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400/40 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg leading-none">
                    {tab.emoji}
                  </span>

                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-black text-slate-950 flex items-center justify-center ring-2 ring-slate-950">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Install Button on tablet / desktop view */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              aria-label="Install App"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95 shrink-0"
              title="Install Android App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">Install</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};