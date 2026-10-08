import React, { useState, useEffect } from 'react';
import { FilamentProfile, CurrencyCode, SUPPORTED_CURRENCIES, MATERIAL_DENSITIES } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { X, Check, Trash2, Sparkles } from 'lucide-react';

interface FilamentProfileModalProps {
  isOpen: boolean;
  profile: FilamentProfile | null;
  isNew: boolean;
  canDelete: boolean;
  currency: CurrencyCode;
  onClose: () => void;
  onSave: (savedProfile: FilamentProfile) => void;
  onDelete?: (id: string) => void;
}

const COMMON_BRANDS = [
  'Bambu Lab',
  'eSUN',
  'Polymaker',
  'Sunlu',
  'Creality',
  'Overture',
  'Elegoo',
  'Prusament',
  'Generic',
];

const COMMON_MATERIALS = [
  'PLA',
  'PLA+',
  'PETG',
  'TPU',
  'ABS',
  'ASA',
  'PC',
  'PLA-CF',
  'PETG-CF',
  'PA-CF',
  'Resin',
  'Other',
];

const PRESET_COLORS = [
  { hex: '#f8fafc', name: 'White / Ivory' },
  { hex: '#18181b', name: 'Black' },
  { hex: '#64748b', name: 'Slate Grey' },
  { hex: '#dc2626', name: 'Fire Red' },
  { hex: '#2563eb', name: 'Royal Blue' },
  { hex: '#059669', name: 'Emerald Green' },
  { hex: '#d97706', name: 'Sunflower Yellow' },
  { hex: '#ea580c', name: 'Bright Orange' },
  { hex: '#9333ea', name: 'Deep Purple' },
  { hex: '#ec4899', name: 'Vibrant Pink' },
  { hex: '#cbd5e1', name: 'Clear / Translucent' },
  { hex: '#b45309', name: 'Bronze / Brown' },
];

export const FilamentProfileModal: React.FC<FilamentProfileModalProps> = ({
  isOpen,
  profile,
  isNew,
  canDelete,
  currency,
  onClose,
  onSave,
  onDelete,
}) => {
  const currencyConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.IDR;
  const currencySymbol = currencyConfig.symbol;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Bambu Lab');
  const [material, setMaterial] = useState('PLA');
  const [price, setPrice] = useState('300000');
  const [spoolWeightGrams, setSpoolWeightGrams] = useState('1000');
  const [density, setDensity] = useState('1.24');
  const [colorName, setColorName] = useState('Black');
  const [colorHex, setColorHex] = useState('#18181b');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (profile && !isNew) {
      setName(profile.name || '');
      setBrand(profile.brand || 'Bambu Lab');
      setMaterial(profile.material || 'PLA');
      setPrice(String(profile.price || '300000'));
      setSpoolWeightGrams(String(profile.spoolWeightGrams || '1000'));
      setDensity(String(profile.density || '1.24'));
      setColorName(profile.colorName || 'Black');
      setColorHex(profile.colorHex || '#18181b');
      setNotes(profile.notes || '');
    } else {
      // Default for new
      const defaultPrice = currencyConfig.defaultFilamentPrice || '300000';
      setName('');
      setBrand('Bambu Lab');
      setMaterial('PLA');
      setPrice(defaultPrice);
      setSpoolWeightGrams('1000');
      setDensity('1.24');
      setColorName('Black');
      setColorHex('#18181b');
      setNotes('');
    }
  }, [profile, isNew, isOpen, currencyConfig]);

  if (!isOpen) return null;

  // Auto-generate name suggestion if empty
  const handleMaterialChange = (mat: string) => {
    setMaterial(mat);
    if (MATERIAL_DENSITIES[mat]) {
      setDensity(String(MATERIAL_DENSITIES[mat]));
    }
    if (!name || name === `${brand} ${material} ${colorName}`.trim()) {
      setName(`${brand} ${mat} ${colorName}`.trim());
    }
  };

  const handleBrandChange = (b: string) => {
    setBrand(b);
    if (!name || name === `${brand} ${material} ${colorName}`.trim()) {
      setName(`${b} ${material} ${colorName}`.trim());
    }
  };

  const handleColorSelect = (c: { hex: string; name: string }) => {
    setColorHex(c.hex);
    setColorName(c.name);
    if (!name || name === `${brand} ${material} ${colorName}`.trim()) {
      setName(`${brand} ${material} ${c.name}`.trim());
    }
  };

  // Calculated price per kg
  const numPrice = Number(price) || 0;
  const numWeight = Math.max(1, Number(spoolWeightGrams) || 1000);
  const pricePerKg = (numPrice / numWeight) * 1000;

  const handleSave = () => {
    triggerHaptic('success');
    const finalName = name.trim() || `${brand} ${material} ${colorName}`.trim();
    const id = !isNew && profile ? profile.id : `fil-${Date.now()}`;

    onSave({
      id,
      name: finalName,
      brand: brand.trim() || undefined,
      material: material.trim() || 'PLA',
      price: String(Math.round(numPrice * 100) / 100),
      spoolWeightGrams: String(numWeight),
      density: density.trim() || '1.24',
      colorName: colorName.trim() || undefined,
      colorHex,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!profile || !onDelete) return;
    if (confirm(`Delete filament profile "${profile.name}"?`)) {
      triggerHaptic('warning');
      onDelete(profile.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full border border-slate-600 shrink-0 shadow-sm"
              style={{ backgroundColor: colorHex }}
            />
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isNew ? 'New filament profile' : 'Edit filament profile'}
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                {brand} • {material} ({currencySymbol})
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Profile Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Profile name
            </label>
            <input
              type="text"
              value={name}
              placeholder={`${brand} ${material} ${colorName}`}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Brand Quick Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Brand / Manufacturer
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_BRANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBrandChange(b)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                    brand === b
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={brand}
              placeholder="Or enter custom brand"
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Material Type Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Material type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MATERIALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMaterialChange(m)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                    material === m
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatches & Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Color & Appearance
            </label>
            <div className="flex items-center gap-2 mb-2.5 overflow-x-auto py-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full shrink-0 border-2 transition active:scale-95 flex items-center justify-center ${
                    colorHex === c.hex
                      ? 'border-white shadow-md ring-2 ring-blue-500'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {colorHex === c.hex && (
                    <span
                      className={`text-[10px] font-black ${
                        c.hex === '#f8fafc' || c.hex === '#cbd5e1' ? 'text-black' : 'text-white'
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Color name</span>
                <input
                  type="text"
                  value={colorName}
                  placeholder="e.g. Matte Black"
                  onChange={(e) => setColorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Color hex</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Spool Weight */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Spool Pricing ({currencyConfig.code})
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                Rate: {currencySymbol}
                {Math.round(pricePerKg).toLocaleString()} / kg
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Price per spool
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step={currencyConfig.decimals === 0 ? '1000' : '0.1'}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Spool weight (net)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={spoolWeightGrams}
                    onChange={(e) => setSpoolWeightGrams(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    g
                  </span>
                </div>
              </div>
            </div>

            {/* Quick spool weight chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Standard rolls:</span>
              {['250', '500', '750', '1000', '2500'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSpoolWeightGrams(w)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                    spoolWeightGrams === w
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {w}g
                </button>
              ))}
            </div>
          </div>

          {/* Density & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Density (g/cm³)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="3.0"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Print notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                placeholder="Temps, bed type, etc."
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 gap-2">
          {!isNew && canDelete ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-3 py-2 rounded-xl transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md shadow-blue-600/30 active:scale-95 transition"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
