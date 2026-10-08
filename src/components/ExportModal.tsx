import React, { useState } from 'react';
import { Copy, Share2, Download, X, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { Capacitor } from '@capacitor/core';
import { saveExportFile, shareExportFile } from '../utils/nativeFiles';

interface ExportModalProps {
  isOpen: boolean;
  filename: string;
  content: string;
  mime: string;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  filename,
  content,
  mime,
  onClose,
  onNotify,
}) => {
  const [status, setStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleCopy = async () => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(content);
      setStatus('✓ Copied to clipboard');
      if (onNotify) onNotify('Copied to clipboard');
    } catch {
      setStatus('Select text and copy manually');
    }
  };

  const handleShare = async () => {
    triggerHaptic('medium');
    try {
      if (Capacitor.isNativePlatform()) {
        await shareExportFile(filename, content, mime);
        setStatus('✓ Shared successfully');
        return;
      }

      if (!navigator.share) {
        setStatus('Share is not supported here. Use Copy or Download.');
        return;
      }

      const blob = new Blob([content], { type: mime });
      const file = new File([blob], filename, { type: mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'PrintCost export', text: filename, files: [file] });
        setStatus('✓ Shared successfully');
        return;
      }
      await navigator.share({ title: 'PrintCost export — ' + filename, text: content });
      setStatus('✓ Shared as text');
    } catch (e: any) {
      if (e && (e.name === 'AbortError' || String(e.message || '').toLowerCase().includes('cancel'))) return;
      setStatus('Sharing not available. Try Copy or Download.');
    }
  };

  const handleDownload = async () => {
    triggerHaptic('light');
    try {
      if (Capacitor.isNativePlatform()) {
        await saveExportFile(filename, content, mime);
        setStatus('✓ Saved to Documents/PrintCost');
        return;
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus('Download request sent.');
    } catch {
      setStatus('Download failed. Use Copy or Share.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100">
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📦</span> {filename}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Copy the data below, save it as a file, or share with another Android app.
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 flex-1 flex flex-col min-h-0">
          <textarea
            readOnly
            value={content}
            spellCheck={false}
            className="w-full h-52 sm:h-64 p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500"
          />
          {status && (
            <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {status}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
    </div>
  );
};
