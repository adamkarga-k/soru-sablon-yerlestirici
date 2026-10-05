import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Layers, 
  Download, 
  Trash2, 
  Filter, 
  AlertCircle,
  HelpCircle,
  Settings,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

import { 
  Template, 
  Category, 
  QuestionItem, 
  AppSettings 
} from './types';

import { 
  getTemplates, 
  getCategories, 
  getLocalSettings, 
  saveLocalSettings,
  defaultTemplate,
  createDefaultTemplateCanvas
} from './services/storage';

import { 
  renderQuestionOnTemplate, 
  checkQuestionSplit 
} from './services/renderer';

import { 
  analyzeQuestionWithGemini, 
  detectSplitByWhitespace 
} from './services/gemini';

import { Navbar } from './components/Navbar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HowToUseModal } from './components/HowToUseModal';
import { TemplateManagerModal } from './components/TemplateManagerModal';
import { CategorySidebar } from './components/CategorySidebar';
import { QuestionUploader } from './components/QuestionUploader';
import { QuestionCard } from './components/QuestionCard';
import { SplitAdjustModal } from './components/SplitAdjustModal';

export const App: React.FC = () => {
  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default-template-1');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-all');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getLocalSettings());

  // Modallar
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState<boolean>(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // İşlem durumları
  const [isProcessingZip, setIsProcessingZip] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // İlk yükleme
  useEffect(() => {
    async function init() {
      const savedTemplates = await getTemplates();
      setTemplates(savedTemplates);

      const savedCategories = await getCategories();
      setCategories(savedCategories);

      const localSets = getLocalSettings();
      setSettings(localSets);
      if (localSets.selectedTemplateId && savedTemplates.some(t => t.id === localSets.selectedTemplateId)) {
        setSelectedTemplateId(localSets.selectedTemplateId);
      } else if (savedTemplates.length > 0) {
        setSelectedTemplateId(savedTemplates[0].id);
      }

      // Kullanıcı ilk defa giriyorsa onboarding ApiKeyModal'ı göster
      if (!localSets.hasSeenOnboarding) {
        setIsApiKeyModalOpen(true);
      }
    }
    init();
  }, []);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0] || defaultTemplate;

  // Ayarları Güncelleme
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveLocalSettings(newSettings);
  };

  // Aktif Şablon Değişimi
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const updated = { ...settings, selectedTemplateId: id };
    setSettings(updated);
    saveLocalSettings(updated);

    // Seçilen şablona göre mevcut soruları yeniden render et
    const targetTpl = templates.find((t) => t.id === id);
    if (targetTpl && questions.length > 0) {
      reRenderAllQuestions(targetTpl, questions);
    }
  };

  // Tek bir soruyu işleme / render etme
  const processQuestion = useCallback(async (
    q: QuestionItem, 
    tpl: Template,
    apiKey: string,
    modelName: string
  ): Promise<QuestionItem> => {
    try {
      let isSplit = q.isSplit;
      let splitRatio = q.splitRatio || 0.5;

      // 12cm / 15cm kontrolü
      const splitCheck = checkQuestionSplit(
        q.width, 
        q.height, 
        tpl.guidelines.targetWidthCm, 
        tpl.guidelines.maxHeightCm
      );
      isSplit = splitCheck.isSplit;

      // Eğer ikiye bölünmesi gerekiyorsa ve henüz analiz edilmediyse
      if (isSplit && !q.splitRatio) {
        if (apiKey && apiKey.trim() !== '') {
          try {
            // Görseli base64 yapıp Gemini'ye sor
            const base64 = await fileToBase64(q.file);
            const geminiRes = await analyzeQuestionWithGemini(base64, q.file.type, apiKey, modelName);
            splitRatio = geminiRes.splitRatio;
          } catch (apiErr) {
            console.warn('Gemini analizi başarısız, beyaz boşluk algoritmasına geçiliyor:', apiErr);
            const imgEl = await new Promise<HTMLImageElement>((resolve) => {
              const im = new Image();
              im.onload = () => resolve(im);
              im.src = q.previewUrl;
            });
            splitRatio = detectSplitByWhitespace(imgEl);
          }
        } else {
          // API key yoksa doğrudan beyaz boşluk analizi
          const imgEl = await new Promise<HTMLImageElement>((resolve) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.src = q.previewUrl;
          });
          splitRatio = detectSplitByWhitespace(imgEl);
        }
      }

      // Render et (1920x1080)
      const renderRes = await renderQuestionOnTemplate(tpl, { ...q, splitRatio, isSplit }, splitRatio);

      return {
        ...q,
        isSplit,
        splitRatio,
        splitY: Math.round(q.height * splitRatio),
        status: 'rendered',
        statusMessage: 'Tamamlandı',
        renderedDataUrl: renderRes.dataUrl,
        renderedBlob: renderRes.blob,
      };
    } catch (err: any) {
      console.error('Soru işleme hatası:', err);
      return {
        ...q,
        status: 'error',
        errorMessage: err?.message || 'Render sırasında hata oluştu',
      };
    }
  }, []);

  // Tüm soruları yeniden render etme
  const reRenderAllQuestions = async (tpl: Template, qList: QuestionItem[]) => {
    setIsBatchProcessing(true);
    const updatedQuestions = await Promise.all(
      qList.map((q) => processQuestion(q, tpl, settings.geminiApiKey, settings.geminiModel))
    );
    setQuestions(updatedQuestions);
    setIsBatchProcessing(false);
  };

  // Yeni sorular eklendiğinde
  const handleQuestionsAdded = async (newOnes: QuestionItem[]) => {
    const combined = [...questions, ...newOnes];
    setQuestions(combined);
    setIsBatchProcessing(true);

    // Yeni soruları sırayla render et
    const processedNew: QuestionItem[] = [];
    for (const item of newOnes) {
      const res = await processQuestion(item, currentTemplate, settings.geminiApiKey, settings.geminiModel);
      processedNew.push(res);
      // Canlı güncelleme
      setQuestions((prev) => prev.map((q) => (q.id === res.id ? res : q)));
    }

    setIsBatchProcessing(false);
  };

  // Kesme oranı manuel güncellendiğinde
  const handleApplySplitRatio = async (questionId: string, newSplitRatio: number) => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    const renderRes = await renderQuestionOnTemplate(currentTemplate, targetQ, newSplitRatio);
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              splitRatio: newSplitRatio,
              splitY: Math.round(q.height * newSplitRatio),
              renderedDataUrl: renderRes.dataUrl,
              renderedBlob: renderRes.blob,
            }
          : q
      )
    );
  };

  // Tekil Soru İndirme (ORİJİNAL İSİMLE!)
  const handleDownloadSingle = (question: QuestionItem) => {
    if (!question.renderedDataUrl) return;

    const a = document.createElement('a');
    a.href = question.renderedDataUrl;
    // Orijinal dosya adıyla indirme:
    a.download = question.originalFileName || `soru_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Toplu İndir (ZIP) - 50 soruya kadar orijinal isimleriyle!
  const handleDownloadAllZip = async () => {
    const renderedList = filteredQuestions.filter((q) => q.renderedBlob);
    if (renderedList.length === 0) {
      alert('İndirilecek işlenmiş soru bulunamadı.');
      return;
    }

    setIsProcessingZip(true);
    try {
      const zip = new JSZip();

      // Her soruyu orijinal dosya adıyla ZIP'e ekle
      renderedList.forEach((q) => {
        if (q.renderedBlob) {
          zip.file(q.originalFileName, q.renderedBlob);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `Soru_Sablonlari_1920x1080_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.error('ZIP oluşturma hatası:', e);
      alert('ZIP dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setIsProcessingZip(false);
    }
  };

  // Soru Silme
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Tüm Soruları Temizle
  const handleClearAllQuestions = () => {
    if (questions.length === 0) return;
    if (window.confirm('Yüklenen tüm soruları listeden silmek istediğinize emin misiniz?')) {
      setQuestions([]);
    }
  };

  // Kategori Değiştirme
  const handleCategoryChange = (questionId: string, newCatId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, categoryId: newCatId } : q))
    );
  };

  // Filtrelenmiş sorular
  const filteredQuestions = questions.filter((q) => {
    if (selectedCategoryId === 'cat-all') return true;
    return q.categoryId === selectedCategoryId;
  });

  const hasRenderedQuestions = questions.some((q) => q.status === 'rendered');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Üst Menü */}
      <Navbar
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onDownloadAllZip={handleDownloadAllZip}
        hasRenderedQuestions={hasRenderedQuestions}
        isProcessingZip={isProcessingZip}
        questionCount={filteredQuestions.length}
      />

      {/* Ana Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Banner / Aktif Şablon Bilgisi */}
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900/60 border border-blue-900/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  Aktif Şablon:
                </span>
                <span className="font-bold text-white text-sm sm:text-base">
                  {currentTemplate.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kırmızı Üst/Alt: {currentTemplate.guidelines.topBound}px-{currentTemplate.guidelines.bottomBound}px • Mavi Sol/Sağ: {currentTemplate.guidelines.leftColumnX}px / {currentTemplate.guidelines.rightColumnX}px
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isBatchProcessing && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-semibold border border-blue-500/20 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sorular İşleniyor...
              </span>
            )}
            <button
              onClick={() => setIsTemplateManagerOpen(true)}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Şablonu Değiştir / Düzenle
            </button>
          </div>
        </div>

        {/* 2 Sütunlu Çalışma Alanı (Sol: Uploader & Liste, Sağ: Kategoriler) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sol / Ana Alan */}
          <div className="flex-1 w-full space-y-6">
            {/* Soru Yükleme Alanı (50 Soruya kadar) */}
            <QuestionUploader
              onQuestionsAdded={handleQuestionsAdded}
              currentCount={questions.length}
              maxQuestions={50}
              selectedCategoryId={selectedCategoryId}
            />

            {/* Soru Listesi Başlık & Filtre Bilgisi */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Yüklenen Sorular
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-blue-400 border border-slate-700">
                  {filteredQuestions.length} soru
                </span>
                {selectedCategoryId !== 'cat-all' && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    <Filter className="w-3 h-3 text-blue-400" />
                    Filtre: {categories.find((c) => c.id === selectedCategoryId)?.name}
                  </span>
                )}
              </div>

              {questions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearAllQuestions}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded transition-colors"
                    title="Tüm soruları sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tümünü Temizle</span>
                  </button>
                </div>
              )}
            </div>

            {/* Soruların Grid Listesi */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-300">
                    Henüz soru yüklenmedi
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Yukarıdaki alana test sorularınızı sürükleyip bırakabilirsiniz. Otomatik olarak 12cm x 15cm kuralına göre taranacak ve 1920x1080 şablona yerleştirilecektir.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    categories={categories}
                    onDelete={handleDeleteQuestion}
                    onEditSplit={(target) => setEditingQuestion(target)}
                    onCategoryChange={handleCategoryChange}
                    onDownloadSingle={handleDownloadSingle}
                    onReRender={(target) =>
                      processQuestion(target, currentTemplate, settings.geminiApiKey, settings.geminiModel)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sağ Alan: Soru Kategorileri Menüsü */}
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCategoriesUpdated={setCategories}
            questions={questions}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>
            Soru Şablon Yerleştirici (1920x1080) • Orijinal Dosya Adı Garantisi • Gemini Vision AI Entegrasyonu
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Sistemi Oluşturan:{' '}
            <a
              href="https://instagram.com/adamkarga"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-blue-500/40 hover:decoration-blue-400 transition-colors inline-flex items-center gap-1"
            >
              Ubeydullah Öz
            </a>
          </span>
        </div>
      </footer>

      {/* MODALLAR */}
      {/* 1. Gemini API / Ayarlar Modalı (İlk girişte de açılır) */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* 2. Nasıl Kullanılır Modalı */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
      />

      {/* 3. Şablon Yönetimi & Kılavuz Çizgileri Modalı */}
      <TemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onTemplatesUpdated={setTemplates}
      />

      {/* 4. İkiye Bölünmüş Soru Kesme Noktası İnce Ayar Modalı */}
      <SplitAdjustModal
        isOpen={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
        template={currentTemplate}
        onApplySplit={handleApplySplitRatio}
      />
    </div>
  );
};

// Yardımcı base64 çevirici
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
