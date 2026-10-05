import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Layers, 
  Sliders, 
  ChevronRight,
  Sparkles,
  Edit3
} from 'lucide-react';
import { Category, QuestionItem, Template } from '../types';
import { saveCategory, deleteCategory } from '../services/storage';

interface CategorySidebarProps {
  // Şablon yönetimi
  templates: Template[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onOpenTemplateManager: () => void;
  onReapplyTemplate?: () => void;
  isReapplying?: boolean;
  // Kategori yönetimi
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onCategoriesUpdated: (categories: Category[]) => void;
  questions: QuestionItem[];
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onOpenTemplateManager,
  onReapplyTemplate,
  isReapplying,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCategoriesUpdated,
  questions,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const getQuestionCount = (catId: string) => {
    if (catId === 'cat-all') return questions.length;
    return questions.filter((q) => q.categoryId === catId).length;
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      color: randomColor,
    };

    await saveCategory(newCategory);
    const updated = [...categories, newCategory];
    onCategoriesUpdated(updated);
    setNewCatName('');
    setIsAdding(false);
    onSelectCategory(newCategory.id);
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'cat-all') return;
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    await deleteCategory(id);
    const updated = categories.filter((c) => c.id !== id);
    if (selectedCategoryId === id) {
      onSelectCategory('cat-all');
    }
    onCategoriesUpdated(updated);
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-5">
      {/* 1. ŞABLON YÖNETİMİ ALANI (KULLANICININ İSTEDİĞİ GİBİ ÜSTTE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
              Aktif Şablon
            </h2>
          </div>
          <button
            onClick={onOpenTemplateManager}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Şablonları Düzenle veya Yeni Ekle"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Şablonları Yönet</span>
          </button>
        </div>

        {/* Şablon Seçici Açılır Menü */}
        <div className="space-y-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>

          {/* Mini Şablon Kartı */}
          {currentTemplate && (
            <div 
              onClick={onOpenTemplateManager}
              className="group/tpl relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-center shadow-inner hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              title="Şablonu düzenlemek için tıklayın"
            >
              {currentTemplate.imageDataUrl ? (
                <img
                  src={currentTemplate.imageDataUrl}
                  alt={currentTemplate.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">1920x1080 Boş Şablon</span>
              )}
              {/* Kılavuz Çizgileri Mini İzi */}
              <div
                className="absolute left-0 right-0 border-b border-red-500/70 border-dashed pointer-events-none"
                style={{ top: `${(currentTemplate.guidelines.topBound / 1080) * 100}%` }}
              />
              <div
                className="absolute left-0 right-0 border-b border-red-500/70 border-dashed pointer-events-none"
                style={{ top: `${(currentTemplate.guidelines.bottomBound / 1080) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 border-r border-blue-500/70 border-dashed pointer-events-none"
                style={{ left: `${(currentTemplate.guidelines.leftColumnX / 1920) * 100}%` }}
              />
              <div
                className="absolute top-0 bottom-0 border-r border-blue-500/70 border-dashed pointer-events-none"
                style={{ left: `${(currentTemplate.guidelines.rightColumnX / 1920) * 100}%` }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/tpl:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white bg-black/70 px-2 py-1 rounded flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Çizgileri Düzenle
                </span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Kırmızı: {currentTemplate?.guidelines.topBound}px-{currentTemplate?.guidelines.bottomBound}px</span>
            <span>Mavi: {currentTemplate?.guidelines.leftColumnX}px / {currentTemplate?.guidelines.rightColumnX}px</span>
          </div>

          {/* Şablonu Hazırdaki Sorulara Yeniden Uygulama Butonu */}
          {questions.length > 0 && onReapplyTemplate && (
            <button
              onClick={onReapplyTemplate}
              disabled={isReapplying}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
              title="Mevcut kesimleri koruyarak tüm soruları bu güncel şablona göre yeniden oluştur"
            >
              <Sliders className={`w-3.5 h-3.5 ${isReapplying ? 'animate-spin' : ''}`} />
              <span>{isReapplying ? 'Yeniden Oluşturuluyor...' : 'Şablonu Sorulara Yeniden Uygula'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SORU KATEGORİLERİ ALANI (ŞABLONUN HEMEN ALTINDA) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
        {/* Başlık */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
              Soru Kategorileri
            </h2>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Yeni Kategori Ekle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kategori Ekle</span>
          </button>
        </div>

        {/* Yeni Kategori Ekleme Formu */}
        {isAdding && (
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Kategori Adı (Örn: Paragraf)"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-white px-2 py-1 rounded"
              >
                İptal
              </button>
              <button
                onClick={handleAddCategory}
                className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </div>
        )}

        {/* Kategori Listesi */}
        <div className="space-y-1">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = getQuestionCount(cat.id);
            const isAll = cat.id === 'cat-all';

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-white border border-blue-200 dark:border-blue-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                    }`}
                  >
                    {count}
                  </span>

                  {!isAll && (
                    <button
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 transition-opacity"
                      title="Kategoriyi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
