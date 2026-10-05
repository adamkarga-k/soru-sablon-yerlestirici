import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Scissors, 
  Eye, 
  CheckCircle2, 
  Split, 
  RefreshCw, 
  Sparkles,
  Maximize2,
  Folder
} from 'lucide-react';
import { QuestionItem, Category } from '../types';

interface QuestionCardProps {
  question: QuestionItem;
  categories: Category[];
  onDelete: (id: string) => void;
  onEditSplit: (question: QuestionItem) => void;
  onCategoryChange: (id: string, newCategoryId: string) => void;
  onDownloadSingle: (question: QuestionItem) => void;
  onReRender: (question: QuestionItem) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  categories,
  onDelete,
  onEditSplit,
  onCategoryChange,
  onDownloadSingle,
  onReRender,
}) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // 12 cm genişliğe göre orantılı yükseklik (cm)
  const calculatedHeightCm = ((question.height / question.width) * 12).toFixed(1);

  return (
    <>
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 shadow-md hover:shadow-xl hover:shadow-blue-500/5 group">
        {/* Üst Kısım: Dosya Adı ve Durum */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 
                className="font-bold text-white text-xs sm:text-sm truncate" 
                title={question.originalFileName}
              >
                {question.originalFileName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                <span>{question.width}x{question.height}px</span>
                <span>•</span>
                <span className={question.isSplit ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                  12cm x {calculatedHeightCm}cm
                </span>
              </div>
            </div>

            {/* Rozet */}
            {question.isSplit ? (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Split className="w-3 h-3" />
                İkiye Bölündü
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Merkezde
              </span>
            )}
          </div>

          {/* Kategori Seçici */}
          <div className="flex items-center gap-1.5 text-xs">
            <Folder className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={question.categoryId}
              onChange={(e) => onCategoryChange(question.id, e.target.value)}
              className="bg-slate-950 text-slate-300 text-[11px] rounded px-2 py-1 border border-slate-800 hover:border-slate-700 outline-none cursor-pointer"
            >
              {categories.filter(c => c.id !== 'cat-all').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Görsel Önizleme (1920x1080 Şablon Çıktısı) */}
        <div 
          onClick={() => question.renderedDataUrl && setIsPreviewModalOpen(true)}
          className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 cursor-pointer group/img flex items-center justify-center"
        >
          {question.renderedDataUrl ? (
            <>
              <img
                src={question.renderedDataUrl}
                alt={question.originalFileName}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="px-2.5 py-1 bg-black/70 backdrop-blur rounded-lg text-white text-[11px] font-medium flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" /> Büyüt
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>İşleniyor...</span>
            </div>
          )}

          {/* 1920x1080 Çözünürlük Etiketi */}
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-slate-300 font-mono text-[9px] rounded">
            1920x1080
          </span>
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
          {question.isSplit ? (
            <button
              onClick={() => onEditSplit(question)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors cursor-pointer"
              title="Paragraf ve soru kökü kesme noktasını düzenle"
            >
              <Scissors className="w-3 h-3 text-purple-400" />
              <span>Kesme Ayarı</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 italic">
              Tek Parça
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDelete(question.id)}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Soruyu Sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onDownloadSingle(question)}
              disabled={!question.renderedDataUrl}
              className={`flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                question.renderedDataUrl
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title={`${question.originalFileName} olarak indir`}
            >
              <Download className="w-3 h-3" />
              <span>İndir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Büyük Önizleme Modal */}
      {isPreviewModalOpen && question.renderedDataUrl && (
        <div 
          onClick={() => setIsPreviewModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-6xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">{question.originalFileName}</h4>
                <span className="text-xs text-slate-400">1920x1080 Çıktı Görseli</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownloadSingle(question)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  İndir
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 aspect-video bg-black flex items-center justify-center">
              <img
                src={question.renderedDataUrl}
                alt={question.originalFileName}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
