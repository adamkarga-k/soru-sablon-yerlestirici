import React from 'react';
import { 
  HelpCircle, 
  Settings, 
  Layers, 
  Download, 
  Sparkles,
  LayoutTemplate
} from 'lucide-react';
import { Template } from '../types';

interface NavbarProps {
  templates: Template[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onOpenTemplateManager: () => void;
  onOpenHowToUse: () => void;
  onOpenSettings: () => void;
  onDownloadAllZip: () => void;
  hasRenderedQuestions: boolean;
  isProcessingZip: boolean;
  questionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onOpenTemplateManager,
  onOpenHowToUse,
  onOpenSettings,
  onDownloadAllZip,
  hasRenderedQuestions,
  isProcessingZip,
  questionCount,
}) => {
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Sol: Logo ve Başlık */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                Soru Şablon <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">1920x1080</span>
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                12cm x 15cm Kuralı
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Otomatik Paragraf Bölme & 1920x1080 Şablon Yerleşimi
            </p>
          </div>
        </div>

        {/* Orta: Şablon Seçici & Yönetici */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-1 text-sm">
            <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Şablon:
            </span>
            <select
              value={selectedTemplateId}
              onChange={(e) => onSelectTemplate(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs sm:text-sm font-medium rounded px-2.5 py-1 outline-none border border-slate-700 hover:border-slate-600 focus:border-blue-500 transition-colors cursor-pointer"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <button
              onClick={onOpenTemplateManager}
              title="Şablonları Düzenle veya Yeni Ekle"
              className="ml-1 p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors text-xs flex items-center gap-1"
            >
              <span className="hidden md:inline font-medium">Şablonları Düzenle</span>
            </button>
          </div>
        </div>

        {/* Sağ: Aksiyon Butonları */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nasıl Kullanılır Butonu */}
          <button
            onClick={onOpenHowToUse}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Nasıl Kullanılır?</span>
          </button>

          {/* Ayarlar & API Butonu */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-750 transition-colors"
            title="Gemini API ve Sistem Ayarları"
          >
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Ayarlar / API</span>
          </button>

          {/* Toplu İndir (.ZIP) Butonu */}
          <button
            onClick={onDownloadAllZip}
            disabled={!hasRenderedQuestions || isProcessingZip}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all ${
              hasRenderedQuestions && !isProcessingZip
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
            title="Tüm işlenmiş soruları orijinal isimleriyle ZIP olarak indir"
          >
            <Download className={`w-4 h-4 ${isProcessingZip ? 'animate-bounce' : ''}`} />
            <span>
              {isProcessingZip ? 'ZIP Hazırlanıyor...' : `Tümünü İndir (ZIP)`}
            </span>
            {questionCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-full text-[11px]">
                {questionCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
