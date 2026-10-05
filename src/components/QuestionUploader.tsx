import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { QuestionItem } from '../types';
import { checkQuestionSplit } from '../services/renderer';

interface QuestionUploaderProps {
  onQuestionsAdded: (newQuestions: QuestionItem[]) => void;
  currentCount: number;
  maxQuestions?: number;
  selectedCategoryId: string;
}

export const QuestionUploader: React.FC<QuestionUploaderProps> = ({
  onQuestionsAdded,
  currentCount,
  maxQuestions = 50,
  selectedCategoryId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxQuestions - currentCount;
    if (remainingSlots <= 0) {
      alert(`Maksimum ${maxQuestions} soru sınırına ulaştınız.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsProcessingFiles(true);

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
        categoryId: selectedCategoryId === 'cat-all' ? 'cat-turkce' : selectedCategoryId,
        width,
        height,
        status: 'idle',
        statusMessage: 'İşlenmeye hazır',
        isSplit,
        splitRatio: 0.5,
        splitY: Math.round(height * 0.5),
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
