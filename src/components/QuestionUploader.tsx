import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, Folder } from 'lucide-react';
import { QuestionItem, Category } from '../types';
import { checkQuestionSplit } from '../services/renderer';

interface QuestionUploaderProps {
  onQuestionsAdded: (newQuestions: QuestionItem[]) => void;
  currentCount: number;
  maxQuestions?: number;
  categories: Category[];
  selectedCategoryId: string;
}

export const QuestionUploader: React.FC<QuestionUploaderProps> = ({
  onQuestionsAdded,
  currentCount,
  maxQuestions = 50,
  categories,
  selectedCategoryId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories = categories.filter((c) => c.id !== 'cat-all');

  const [targetCategoryId, setTargetCategoryId] = useState<string>(() => {
    if (selectedCategoryId !== 'cat-all') return selectedCategoryId;
    return availableCategories[0]?.id || 'cat-turkce';
  });

  useEffect(() => {
    if (selectedCategoryId !== 'cat-all') {
      setTargetCategoryId(selectedCategoryId);
    } else {
      if (!availableCategories.some((c) => c.id === targetCategoryId)) {
        setTargetCategoryId(availableCategories[0]?.id || 'cat-turkce');
      }
    }
  }, [selectedCategoryId, categories]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxQuestions - currentCount;
    if (remainingSlots <= 0) {
      alert(`Maksimum ${maxQuestions} soru sınırına ulaştınız.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsProcessingFiles(true);

    const resolvedCategoryId = selectedCategoryId !== 'cat-all'
      ? selectedCategoryId
      : (targetCategoryId || availableCategories[0]?.id || 'cat-turkce');

    const newQuestions: QuestionItem[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);

      const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        img.onerror = () => resolve({ width: 800, height: 600 });
        img.src = previewUrl;
      });

      const { isSplit } = checkQuestionSplit(width, height, 12, 15);

      newQuestions.push({
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalFileName: file.name,
        file,
        previewUrl,
        categoryId: resolvedCategoryId,
        width,
        height,
        status: 'idle',
        statusMessage: 'İşlenmeye hazır',
        isSplit,
      });
    }

    setIsProcessingFiles(false);
    if (newQuestions.length > 0) {
      onQuestionsAdded(newQuestions);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/70 shadow-sm hover:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-600/20 transition-all shadow-md shadow-blue-500/5">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">
            Soru Görsellerini Sürükleyin veya Dosya Seçin
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aynı anda <span className="text-blue-600 dark:text-blue-400 font-semibold">{maxQuestions} soruya kadar</span> yükleyebilirsiniz. Orijinal dosya adlarınız korunur.
          </p>
        </div>

        {/* Yüklenecek Kategori Seçim / Bilgi Rozeti */}
        {selectedCategoryId !== 'cat-all' ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-300 dark:border-emerald-800 text-xs shadow-sm z-10 text-emerald-800 dark:text-emerald-300"
          >
            <Folder className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">Yüklenecek Klasör:</span>
            <span className="font-bold underline text-emerald-700 dark:text-emerald-300">
              {categories.find((c) => c.id === selectedCategoryId)?.name || 'Aktif Klasör'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              (Sorular doğrudan bu klasöre kaydedilecektir)
            </span>
          </div>
        ) : availableCategories.length > 0 ? (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs shadow-sm z-10 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <Folder className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Yüklenecek Klasör:
            </span>
            <select
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
              className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none cursor-pointer hover:border-blue-500 transition-colors"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 font-medium">
            PNG, JPG, WEBP
          </span>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 font-medium">
            12cm x 15cm Otomatik Oran
          </span>
          <span className="px-2.5 py-1 bg-blue-50 dark:bg-slate-800/80 rounded-lg border border-blue-200 dark:border-slate-700/60 text-blue-600 dark:text-blue-400 font-semibold">
            Kalan Kontenjan: {maxQuestions - currentCount} soru
          </span>
        </div>
      </div>
    </div>
  );
};
