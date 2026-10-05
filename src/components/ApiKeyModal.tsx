import React, { useState } from 'react';
import { Key, Sparkles, ExternalLink, Check, X, ShieldAlert, Cpu } from 'lucide-react';
import { AppSettings } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [model, setModel] = useState(settings.geminiModel || 'gemini-2.5-flash');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
      geminiModel: model,
      hasSeenOnboarding: true,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleDismiss = () => {
    onSaveSettings({
      ...settings,
      hasSeenOnboarding: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
        {/* Üst Başlık Gradient */}
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Gemini AI Vision Kurulumu
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  15 cm'yi aşan soruların paragraf/kök ayrımını yapay zeka ile otomatik taratın
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* İçerik */}
        <div className="p-6 space-y-5 text-sm">
          {/* Bilgi Kutusu */}
          <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4 text-blue-200/90 text-xs leading-relaxed space-y-2">
            <div className="font-semibold text-blue-300 flex items-center gap-1.5 text-sm">
              <Key className="w-4 h-4" />
              Gemini API Anahtarı Nasıl Alınır? (Ücretsiz)
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
              <li>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>{' '}
                adresine gidin ve Google hesabınızla giriş yapın.
              </li>
              <li><span className="font-medium text-white">"Create API key"</span> (API Anahtarı Oluştur) butonuna tıklayın.</li>
              <li>Oluşturulan anahtarı kopyalayıp aşağıdaki kutucuğa yapıştırın.</li>
            </ol>
            <p className="text-[11px] text-slate-400 pt-1">
              * Anahtarınız yalnızca kendi tarayıcınızda (Local Storage) saklanır, hiçbir sunucuya iletilmez.
            </p>
          </div>

          {/* Input Alanı */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Gemini API Anahtarı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Model Seçimi */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Kullanılacak Vision Modeli
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Önerilen - En Hızlı & Keskin)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Hafif ve Kararlı)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Detaylı Analiz)</option>
            </select>
          </div>

          {/* Yedek Bilgilendirme */}
          <div className="text-xs text-slate-400 flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Not:</strong> API anahtarı girmeden de devam edebilirsiniz. Bu durumda sistem otomatik akıllı beyaz boşluk analizi ve manuel dikey ayar arayüzü ile çalışacaktır.
            </span>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Daha Sonra Gir (Kapat)
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Kaydedildi!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Kaydet ve Başla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
