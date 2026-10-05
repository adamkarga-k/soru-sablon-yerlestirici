import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Layers, 
  Download, 
  Trash2, 
  Filter, 
  HelpCircle, 
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
  createDefaultTemplateCanvas,
  saveStoredQuestion,
  saveAllStoredQuestions,
  getSavedQuestions,
  deleteStoredQuestion,
  clearAllStoredQuestions
} from './services/storage';

import { 
  renderQuestionOnTemplate, 
  checkQuestionSplit 
} from './services/renderer';

import { detectSplitByWhitespace } from './services/imageAnalysis';

import { Navbar } from './components/Navbar';
import { HowToUseModal } from './components/HowToUseModal';
import { TemplateManagerModal } from './components/TemplateManagerModal';
import { CategorySidebar } from './components/CategorySidebar';
import { QuestionUploader } from './components/QuestionUploader';
import { QuestionCard } from './components/QuestionCard';
import { SplitAdjustModal } from './components/SplitAdjustModal';

export const App: React.FC = () => {
  // Gece / Gündüz Döngüsü
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default-template-1');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-all');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getLocalSettings());

  // Modallar
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

      // Hafızadaki kayıtlı soruları yükle (F5 / Sayfa yenilemelerinde kaybolmaz)
      const savedQuestions = await getSavedQuestions();
      if (savedQuestions && savedQuestions.length > 0) {
        setQuestions(savedQuestions);
      }
    }
    init();
  }, []);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0] || defaultTemplate;

  // Aktif Şablon Değişimi
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const updated = { ...settings, selectedTemplateId: id };
    setSettings(updated);
    saveLocalSettings(updated);

    const targetTpl = templates.find((t) => t.id === id);
    if (targetTpl && questions.length > 0) {
      reRenderAllQuestions(targetTpl, questions);
    }
  };

  // Soru işleme fonksiyonu (Tamamen yerel & API'siz!)
  const processQuestion = useCallback(async (
    q: QuestionItem, 
    tpl: Template
  ): Promise<QuestionItem> => {
    try {
      let isSplit = q.isSplit;
      let splitRatio = q.splitRatio || 0.5;

      const splitCheck = checkQuestionSplit(
        q.width, 
        q.height, 
        tpl.guidelines.targetWidthCm, 
        tpl.guidelines.maxHeightCm
      );
      isSplit = splitCheck.isSplit;

      // 15 cm'yi aştıysa akıllı beyaz boşluk analizi ile otomatik kesme noktasını bul
      if (isSplit && !q.splitRatio) {
        const imgEl = await new Promise<HTMLImageElement>((resolve) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.src = q.previewUrl;
        });
        splitRatio = detectSplitByWhitespace(imgEl);
      }

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

  const reRenderAllQuestions = async (tpl: Template, qList: QuestionItem[]) => {
    setIsBatchProcessing(true);
    const updatedQuestions = await Promise.all(
      qList.map((q) => processQuestion(q, tpl))
    );
    setQuestions(updatedQuestions);
    await saveAllStoredQuestions(updatedQuestions);
    setIsBatchProcessing(false);
  };

  const handleReapplyTemplateToAll = async () => {
    if (questions.length === 0) return;
    await reRenderAllQuestions(currentTemplate, questions);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const handleTemplatesUpdated = async (newTemplates: Template[]) => {
    setTemplates(newTemplates);
    const updatedCurrent = newTemplates.find((t) => t.id === selectedTemplateId) || newTemplates[0];
    if (updatedCurrent && questions.length > 0) {
      await reRenderAllQuestions(updatedCurrent, questions);
    }
  };

  const handleQuestionsAdded = async (newOnes: QuestionItem[]) => {
    const combined = [...questions, ...newOnes];
    setQuestions(combined);
    setIsBatchProcessing(true);

    const processedNew: QuestionItem[] = [];
    for (const item of newOnes) {
      const res = await processQuestion(item, currentTemplate);
      processedNew.push(res);
      setQuestions((prev) => prev.map((q) => (q.id === res.id ? res : q)));
    }

    await saveAllStoredQuestions(processedNew);
    setIsBatchProcessing(false);
  };

  const handleApplySplitRatio = async (questionId: string, newSplitRatio: number) => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return;

    const renderRes = await renderQuestionOnTemplate(currentTemplate, targetQ, newSplitRatio);
    const updatedQ: QuestionItem = {
      ...targetQ,
      splitRatio: newSplitRatio,
      splitY: Math.round(targetQ.height * newSplitRatio),
      renderedDataUrl: renderRes.dataUrl,
      renderedBlob: renderRes.blob,
    };

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? updatedQ : q))
    );
    await saveStoredQuestion(updatedQ);
  };

  const handleDownloadSingle = (question: QuestionItem) => {
    if (!question.renderedDataUrl) return;

    const a = document.createElement('a');
    a.href = question.renderedDataUrl;
    a.download = question.originalFileName || `soru_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    const renderedList = filteredQuestions.filter((q) => q.renderedBlob);
    if (renderedList.length === 0) {
      alert('İndirilecek işlenmiş soru bulunamadı.');
      return;
    }

    setIsProcessingZip(true);
    try {
      const zip = new JSZip();

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

  const handleDeleteQuestion = async (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSelectedQuestionIds((prev) => prev.filter((itemId) => itemId !== id));
    await deleteStoredQuestion(id);
  };

  const handleClearAllQuestions = async () => {
    if (questions.length === 0) return;
    if (window.confirm('Yüklenen tüm soruları listeden silmek istediğinize emin misiniz?')) {
      setQuestions([]);
      setSelectedQuestionIds([]);
      await clearAllStoredQuestions();
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllQuestions = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map((q) => q.id));
    }
  };

  const handleBatchAssignCategory = async (targetCatId: string) => {
    if (!targetCatId || selectedQuestionIds.length === 0) return;
    const updatedQuestions = questions.map((q) =>
      selectedQuestionIds.includes(q.id) ? { ...q, categoryId: targetCatId } : q
    );
    setQuestions(updatedQuestions);
    const toSave = updatedQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    setSelectedQuestionIds([]);
    await saveAllStoredQuestions(toSave);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleCategoryChange = async (questionId: string, newCatId: string) => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (targetQ) {
      const updatedQ = { ...targetQ, categoryId: newCatId };
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updatedQ : q))
      );
      await saveStoredQuestion(updatedQ);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedCategoryId === 'cat-all') return true;
    return q.categoryId === selectedCategoryId;
  });

  const hasRenderedQuestions = questions.some((q) => q.status === 'rendered');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      {/* Üst Menü */}
      <Navbar
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onDownloadAllZip={handleDownloadAllZip}
        hasRenderedQuestions={hasRenderedQuestions}
        isProcessingZip={isProcessingZip}
        questionCount={filteredQuestions.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Ana Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* İşlem Durumu Bildirimi */}
        {isBatchProcessing && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 animate-pulse">
            <span className="flex items-center gap-2 font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              Sorular taranıyor ve 1920x1080 şablona yerleştiriliyor...
            </span>
            <span className="font-mono text-[11px] font-bold">Lütfen bekleyin</span>
          </div>
        )}

        {/* 2 Sütunlu Çalışma Alanı: Sol (Yükleme & Sorular) | Sağ (Şablon + Kategoriler) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sol / Ana Alan */}
          <div className="flex-1 w-full space-y-6">
            {/* Soru Yükleme Alanı (50 Soruya kadar) */}
            <QuestionUploader
              onQuestionsAdded={handleQuestionsAdded}
              currentCount={questions.length}
              maxQuestions={50}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
            />

            {/* Soru Listesi Başlık & Filtre Bilgisi */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Yüklenen Sorular
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                  {filteredQuestions.length} soru
                </span>
                {selectedCategoryId !== 'cat-all' && (
                  <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Filter className="w-3 h-3 text-blue-500" />
                    Filtre: {categories.find((c) => c.id === selectedCategoryId)?.name}
                  </span>
                )}
                {filteredQuestions.length > 0 && (
                  <button
                    onClick={handleSelectAllQuestions}
                    className="ml-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {selectedQuestionIds.length === filteredQuestions.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                  </button>
                )}
              </div>

              {questions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReapplyTemplateToAll}
                    disabled={isBatchProcessing}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer font-semibold disabled:opacity-50"
                    title="Mevcut kesimleri koruyarak tüm soruları güncel şablona yeniden yerleştir"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBatchProcessing ? 'animate-spin' : ''}`} />
                    <span>Şablonu Sorulara Uygula</span>
                  </button>
                  <button
                    onClick={handleClearAllQuestions}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Tüm soruları sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tümünü Temizle</span>
                  </button>
                </div>
              )}
            </div>

            {/* Toplu Kategori Atama Araç Çubuğu */}
            {selectedQuestionIds.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    ✓ {selectedQuestionIds.length} soru seçildi
                  </span>
                  <button
                    onClick={() => setSelectedQuestionIds([])}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white underline text-[11px] cursor-pointer"
                  >
                    Seçimi Temizle
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    Seçilenleri Kategoriye Taşı:
                  </span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBatchAssignCategory(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 text-xs outline-none cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <option value="" disabled>Kategori Seçin...</option>
                    {categories.filter(c => c.id !== 'cat-all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Soruların Grid Listesi */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Henüz soru yüklenmedi
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Yukarıdaki alana soru görsellerinizi sürükleyip bırakabilirsiniz. Otomatik olarak 12cm x 15cm kuralına göre taranacak ve sağda seçtiğiniz şablona yerleştirilecektir.
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
                    isSelected={selectedQuestionIds.includes(q.id)}
                    onToggleSelect={handleToggleSelectQuestion}
                    onDelete={handleDeleteQuestion}
                    onEditSplit={(target) => setEditingQuestion(target)}
                    onCategoryChange={handleCategoryChange}
                    onDownloadSingle={handleDownloadSingle}
                    onReRender={(target) =>
                      processQuestion(target, currentTemplate)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sağ Alan: Şablon Yönetimi (Üstte) + Soru Kategorileri (Altta) */}
          <CategorySidebar
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleSelectTemplate}
            onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
            onReapplyTemplate={handleReapplyTemplateToAll}
            isReapplying={isBatchProcessing}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCategoriesUpdated={setCategories}
            questions={questions}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/80 py-4 text-center text-xs transition-colors">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Ubeydullah Öz
          </span>
          <span>•</span>
          <a
            href="https://instagram.com/adamkarga"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold transition-colors"
          >
            Instagram (@adamkarga)
          </a>
          <span>•</span>
          <a
            href="http://adamkarga.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold transition-colors"
          >
            Blog (adamkarga.net)
          </a>
        </div>
      </footer>

      {/* MODALLAR */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
      />

      <TemplateManagerModal
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onTemplatesUpdated={handleTemplatesUpdated}
      />

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
