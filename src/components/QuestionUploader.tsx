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
      // Yalnızca görsel dosyaları
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);

      // Görselin doğal genişlik ve yüksekliğini al
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        img.onerror = () => resolve({ width: 800, height: 600 });
        img.src = previewUrl;
      });

      // 12cm / 15cm kuralına göre bölünme ihtiyacını belirle
      const { isSplit } = checkQuestionSplit(width, height, 12, 15);

      newQuestions.push({
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalFileName: file.name, // ORİJİNAL DOSYA ADI KORUNUR!
        file,
        previewUrl,
        categoryId: selectedCategoryId === 'cat-all' ? 'cat-turkce' : selectedCategoryId,
        width,
        height,
        status: 'idle',
        statusMessage: 'İşlenmeye hazır',
        isSplit,
        splitRatio: 0.5, // Varsayılan oran
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
        className={`relative group border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70'
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

        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600/20 transition-all shadow-lg shadow-blue-500/5">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-white text-base">
            Soru Görsellerini Sürükleyin veya Dosya Seçin
          </h3>
          <p className="text-xs text-slate-400">
            Aynı anda <span className="text-blue-400 font-semibold">{maxQuestions} soruya kadar</span> yükleyebilirsiniz. Orijinal dosya adlarınız korunacaktır.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
          <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            PNG, JPG, WEBP
          </span>
          <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            12cm x 15cm Otomatik Oran
          </span>
          <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-blue-400 font-medium">
            Kalan Kontenjan: {maxQuestions - currentCount} soru
          </span>
        </div>
      </div>
    </div>
  );
};
