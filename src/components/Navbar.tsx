import React from 'react';
import { 
  HelpCircle, 
  Settings, 
  Download, 
  LayoutTemplate,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  onOpenHowToUse: () => void;
  onDownloadAllZip: () => void;
  hasRenderedQuestions: boolean;
  isProcessingZip: boolean;
  questionCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHowToUse,
  onDownloadAllZip,
  hasRenderedQuestions,
  isProcessingZip,
  questionCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Sol: Sade ve Ferah Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                Şablona Soru Yerleştirme
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Otomatik Paragraf Bölme & Şablon Yerleştirici
            </p>
          </div>
        </div>

        {/* Sağ: Sade Aksiyonlar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gece / Gündüz Döngüsü Butonu */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title={theme === 'dark' ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
            aria-label="Tema Değiştir"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Nasıl Kullanılır */}
          <button
            onClick={onOpenHowToUse}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Nasıl Kullanılır?</span>
          </button>

          {/* Toplu İndir (ZIP) */}
          <button
            onClick={onDownloadAllZip}
            disabled={!hasRenderedQuestions || isProcessingZip}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all ${
              hasRenderedQuestions && !isProcessingZip
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 cursor-pointer active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
            }`}
            title="Tüm işlenmiş soruları orijinal isimleriyle ZIP olarak indir"
          >
            <Download className={`w-4 h-4 ${isProcessingZip ? 'animate-bounce' : ''}`} />
            <span>
              {isProcessingZip ? 'Hazırlanıyor...' : 'Tümünü İndir (ZIP)'}
            </span>
            {questionCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-black/20 dark:bg-black/40 rounded-full text-[11px]">
                {questionCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
