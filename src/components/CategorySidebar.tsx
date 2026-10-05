import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Tag, 
  Check, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Category, QuestionItem } from '../types';
import { saveCategory, deleteCategory } from '../services/storage';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onCategoriesUpdated: (categories: Category[]) => void;
  questions: QuestionItem[];
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCategoriesUpdated,
  questions,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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
    <aside className="w-full lg:w-72 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-sm h-fit">
      {/* Başlık */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Soru Kategorileri
          </h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1"
          title="Yeni Kategori Ekle"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-semibold">Ekle</span>
        </button>
      </div>

      {/* Yeni Kategori Ekleme Formu */}
      {isAdding && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 space-y-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Kategori Adı (Örn: Paragraf)"
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              İptal
            </button>
            <button
              onClick={handleAddCategory}
              className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded transition-colors"
            >
              Ekle
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
              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#3b82f6' }}
                />
                <span className="truncate">{cat.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    isSelected
                      ? 'bg-blue-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {count}
                </span>

                {!isAll && (
                  <button
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
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

      {/* Alt Bilgi */}
      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
        Yüklediğiniz soruları bu listeden dilediğiniz branş veya konuya atayabilirsiniz.
      </div>
    </aside>
  );
};
