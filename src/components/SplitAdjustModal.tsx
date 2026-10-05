import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Scissors, 
  Check, 
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
  const canvasPart1Ref = useRef<HTMLCanvasElement>(null);
  const canvasPart2Ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (question) {
      setRatio(question.splitRatio !== undefined ? question.splitRatio : 0.5);
    }
  }, [question]);

  // Canlı Parça Kesme Önizlemesi (İki Sütun Canvas)
  useEffect(() => {
    if (!question || !isOpen) return;

    const img = new Image();
    img.onload = () => {
      const qW = img.naturalWidth || img.width;
      const qH = img.naturalHeight || img.height;
      const splitY = Math.round(qH * ratio);

      // 1. Sol Parça (Paragraf / Öncül: 0 -> splitY)
      if (canvasPart1Ref.current && splitY > 0) {
        canvasPart1Ref.current.width = qW;
        canvasPart1Ref.current.height = splitY;
        const ctx1 = canvasPart1Ref.current.getContext('2d');
        if (ctx1) {
          ctx1.drawImage(img, 0, 0, qW, splitY, 0, 0, qW, splitY);
        }
      }

      // 2. Sağ Parça (Soru Kökü + Şıklar: splitY -> qH)
      if (canvasPart2Ref.current && qH - splitY > 0) {
        canvasPart2Ref.current.width = qW;
        canvasPart2Ref.current.height = qH - splitY;
        const ctx2 = canvasPart2Ref.current.getContext('2d');
        if (ctx2) {
          ctx2.drawImage(img, 0, splitY, qW, qH - splitY, 0, 0, qW, qH - splitY);
        }
      }
    };
    img.src = question.previewUrl;
  }, [question, ratio, isOpen]);

  if (!isOpen || !question) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateRatio(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      updateRatio(e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const updateRatio = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    let newRatio = relativeY / rect.height;
    newRatio = Math.max(0.05, Math.min(0.95, newRatio));
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
                {question.originalFileName} ({question.width}x{question.height}px)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ana Editör Alanı */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol Panel: İnteraktif Görsel Üzerinde Çizgi Sürükleme */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                Kırmızı Çizgiyi Sürükleyerek Ayarlayın
              </span>
              <span className="font-mono text-purple-400 font-bold">
                %{Math.round(ratio * 100)} (Y: {Math.round(question.height * ratio)}px)
              </span>
            </div>

            {/* Birebir görsel en/boy oranına kilitli konteyner (Sıfır siyah boşluk, birebir piksel hassasiyeti) */}
            <div className="flex-1 flex items-center justify-center bg-slate-950/80 rounded-xl p-2 border border-slate-800 min-h-[360px]">
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                style={{
                  aspectRatio: `${question.width} / ${question.height}`,
                  maxHeight: '440px',
                }}
                className="relative w-full h-auto mx-auto rounded-lg overflow-hidden border-2 border-slate-700 cursor-ns-resize shadow-2xl flex items-center justify-center"
              >
                <img
                  src={question.previewUrl}
                  alt="Soru"
                  className="w-full h-full object-fill pointer-events-none select-none block"
                />

                {/* Üst Kısım Gölgelendirme (Öncül/Paragraf) */}
                <div
                  className="absolute top-0 left-0 right-0 bg-blue-500/25 pointer-events-none border-b-2 border-dashed border-blue-400"
                  style={{ height: `${ratio * 100}%` }}
                >
                  <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    SOL SÜTUN: Paragraf
                  </span>
                </div>

                {/* Alt Kısım Gölgelendirme (Soru Kökü + Şıklar) */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-purple-500/25 pointer-events-none"
                  style={{ height: `${(1 - ratio) * 100}%` }}
                >
                  <span className="absolute bottom-2 left-2 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    SAĞ SÜTUN: Soru & Şıklar
                  </span>
                </div>

                {/* İnteraktif Kırmızı Kesme Çizgisi */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center justify-center"
                  style={{ top: `${ratio * 100}%` }}
                >
                  <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 -translate-y-1/2">
                    <Scissors className="w-3 h-3" />
                    Kesme Çizgisi
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Kırmızı çizgiyi yukarı/aşağı sürükleyerek paragrafın bittiği boşluğa getirin.
            </p>
          </div>

          {/* Sağ Panel: Canlı İki Sütun Gerçek Canvas Dilimleme Önizlemesi */}
          <div className="space-y-3 flex flex-col">
            <span className="font-semibold text-white text-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              Şablondaki İki Sütun Canlı Görünümü
            </span>

            <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 flex gap-3 min-h-[360px]">
              {/* Sol Sütun (Paragraf) */}
              <div className="flex-1 bg-slate-900/80 rounded-lg p-2.5 border border-blue-500/30 flex flex-col">
                <span className="text-[10px] font-bold text-blue-400 mb-1.5 block">
                  1. Parça (Sol Sütun / Paragraf)
                </span>
                <div className="flex-1 bg-slate-950 rounded overflow-auto relative border border-slate-800 flex items-start justify-center p-1">
                  <canvas
                    ref={canvasPart1Ref}
                    className="w-full h-auto object-contain rounded shadow"
                  />
                </div>
              </div>

              {/* Sağ Sütun (Soru Kökü ve Şıklar) */}
              <div className="flex-1 bg-slate-900/80 rounded-lg p-2.5 border border-purple-500/30 flex flex-col">
                <span className="text-[10px] font-bold text-purple-400 mb-1.5 block">
                  2. Parça (Sağ Sütun / Soru & Şıklar)
                </span>
                <div className="flex-1 bg-slate-950 rounded overflow-auto relative border border-slate-800 flex items-start justify-center p-1">
                  <canvas
                    ref={canvasPart2Ref}
                    className="w-full h-auto object-contain rounded shadow"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 text-[11px] text-slate-300">
              Bu iki parça şablonunuzdaki kırmızı ve mavi hizalama çizgilerine birebir yerleştirilecektir.
            </div>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setRatio(0.5)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ortala (%50)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
