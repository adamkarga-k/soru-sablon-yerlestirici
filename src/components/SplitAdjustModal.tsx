import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Scissors, 
  Check, 
  Sparkles, 
  Columns, 
  Eye, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { QuestionItem, Template } from '../types';

interface SplitAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionItem | null;
  template: Template;
  onApplySplit: (questionId: string, newSplitRatio: number) => void;
}

export const SplitAdjustModal: React.FC<SplitAdjustModalProps> = ({
  isOpen,
  onClose,
  question,
  template,
  onApplySplit,
}) => {
  const [ratio, setRatio] = useState<number>(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    if (question) {
      setRatio(question.splitRatio || 0.5);
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    updateRatio(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      updateRatio(e.clientY);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const updateRatio = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    let newRatio = relativeY / rect.height;
    newRatio = Math.max(0.1, Math.min(0.9, newRatio));
    setRatio(newRatio);
  };

  const handleApply = () => {
    onApplySplit(question.id, ratio);
    onClose();
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Üst Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Paragraf & Soru Kökü Kesme Çizgisi Ayarı
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {question.originalFileName} (Yükseklik: {question.height}px)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ana Editör Alanı */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol Panel: İnteraktif Görsel Üzerinde Çizgi Sürükleme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                Kırmızı Çizgiyi Sürükleyerek Ayarlayın
              </span>
              <span className="font-mono text-purple-400 font-bold">
                %{Math.round(ratio * 100)} (Y: {Math.round(question.height * ratio)}px)
              </span>
            </div>

            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              className="relative w-full aspect-[3/4] max-h-[480px] bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-700 cursor-ns-resize shadow-inner flex items-center justify-center"
            >
              <img
                src={question.previewUrl}
                alt="Soru"
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Üst Kısım Gölgelendirme (Öncül/Paragraf) */}
              <div
                className="absolute top-0 left-0 right-0 bg-blue-500/15 pointer-events-none border-b-2 border-dashed border-blue-400/60"
                style={{ height: `${ratio * 100}%` }}
              >
                <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  SOL SÜTUN: Paragraf / Öncül
                </span>
              </div>

              {/* Alt Kısım Gölgelendirme (Soru Kökü + Şıklar) */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-purple-500/15 pointer-events-none"
                style={{ height: `${(1 - ratio) * 100}%` }}
              >
                <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  SAĞ SÜTUN: Soru Kökü ve Seçenekler
                </span>
              </div>

              {/* İnteraktif Kırmızı Kesme Çizgisi */}
              <div
                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center justify-center"
                style={{ top: `${ratio * 100}%` }}
              >
                <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 -translate-y-1/2">
                  <Scissors className="w-3 h-3" />
                  Kesme Noktası
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Görselin üzerine tıklayarak veya kırmızı çizgiyi yukarı/aşağı sürükleyerek paragrafın bittiği yeri seçin.
            </p>
          </div>

          {/* Sağ Panel: İki Sütun Canlı Önizleme */}
          <div className="space-y-3 flex flex-col">
            <span className="font-semibold text-white text-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              Şablondaki İki Sütun Önizlemesi
            </span>

            <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 flex gap-4 min-h-[360px]">
              {/* Sol Sütun (Paragraf) */}
              <div className="flex-1 bg-slate-900/80 rounded-lg p-2.5 border border-blue-500/30 flex flex-col">
                <span className="text-[10px] font-bold text-blue-400 mb-1.5 block">
                  1. Parça (Sol Mavi Çizgiye Yaslanacak)
                </span>
                <div className="flex-1 bg-slate-950 rounded overflow-hidden relative border border-slate-800 flex items-start justify-center">
                  <div
                    className="w-full overflow-hidden"
                    style={{ height: '100%' }}
                  >
                    <img
                      src={question.previewUrl}
                      alt="Paragraf"
                      className="w-full object-cover object-top"
                      style={{
                        transformOrigin: 'top',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sağ Sütun (Soru Kökü ve Şıklar) */}
              <div className="flex-1 bg-slate-900/80 rounded-lg p-2.5 border border-purple-500/30 flex flex-col">
                <span className="text-[10px] font-bold text-purple-400 mb-1.5 block">
                  2. Parça (Sağ Mavi Çizgiye Yaslanacak)
                </span>
                <div className="flex-1 bg-slate-950 rounded overflow-hidden relative border border-slate-800 flex items-start justify-center">
                  <div
                    className="w-full overflow-hidden"
                    style={{ height: '100%' }}
                  >
                    <img
                      src={question.previewUrl}
                      alt="Soru Kökü"
                      className="w-full object-cover"
                      style={{
                        objectPosition: `center -${ratio * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 text-[11px] text-slate-300">
              Uyguladığınızda şablon üzerindeki sol mavi çizgi ve sağ mavi çizgi koordinatlarına otomatik olarak 1920x1080 çözünürlükte yeniden yerleştirilecektir.
            </div>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setRatio(0.5)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Varsayılan (%50) Yap
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Uygula ve Yeniden Yerleştir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
