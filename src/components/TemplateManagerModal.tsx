import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Upload, 
  Sliders, 
  Layers, 
  Move
} from 'lucide-react';
import { Template, TemplateGuidelines } from '../types';
import { saveTemplate, deleteTemplate, createDefaultTemplateCanvas } from '../services/storage';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onTemplatesUpdated: (templates: Template[]) => void;
}

type DraggingLine = 'topBound' | 'bottomBound' | 'leftColumnX' | 'rightColumnX' | null;

// Kullanıcının MEBİ şablonundaki tam varsayılan koordinatlar
const DEFAULT_GUIDELINES: TemplateGuidelines = {
  topBound: 125,       // Üst Kırmızı Çizgi (1920x1080'de)
  bottomBound: 985,    // Alt Kırmızı Çizgi (1920x1080'de)
  leftColumnX: 920,    // Sol Mavi Çizgi (Orta sol sütun sınırı)
  rightColumnX: 1000,  // Sağ Mavi Çizgi (Orta sağ sütun sınırı)
  columnWidth: 720,    // 12 cm = 720 px
  targetWidthCm: 12,
  maxHeightCm: 15,
  pixelsPerCm: 60,
};

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onTemplatesUpdated,
}) => {
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateImage, setTemplateImage] = useState<string>('');
  const [guidelines, setGuidelines] = useState<TemplateGuidelines>(DEFAULT_GUIDELINES);

  // Mouse ile sürükleme state'i
  const [draggingLine, setDraggingLine] = useState<DraggingLine>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingTemplate(null);
    setTemplateName('Yeni Şablon ' + (templates.length + 1));
    setTemplateImage('/mebi_template_clean.png');
    setGuidelines({ ...DEFAULT_GUIDELINES });
  };

  const handleStartEdit = (tpl: Template) => {
    setEditingTemplate(tpl);
    setIsCreatingNew(false);
    setTemplateName(tpl.name);
    setTemplateImage(tpl.imageDataUrl);
    setGuidelines({ ...tpl.guidelines });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTemplateImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Lütfen şablon için bir isim girin.');
      return;
    }

    const tplToSave: Template = {
      id: editingTemplate ? editingTemplate.id : `tpl-${Date.now()}`,
      name: templateName.trim(),
      imageDataUrl: templateImage || '/mebi_template_clean.png',
      guidelines: { ...guidelines },
      createdAt: editingTemplate ? editingTemplate.createdAt : Date.now(),
      isDefault: editingTemplate ? editingTemplate.isDefault : false,
    };

    await saveTemplate(tplToSave);

    let updatedList: Template[];
    if (editingTemplate) {
      updatedList = templates.map((t) => (t.id === tplToSave.id ? tplToSave : t));
    } else {
      updatedList = [...templates, tplToSave];
      onSelectTemplate(tplToSave.id);
    }

    onTemplatesUpdated(updatedList);
    setEditingTemplate(null);
    setIsCreatingNew(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (templates.length <= 1) {
      alert('Sistemde en az bir şablon bulunmalıdır.');
      return;
    }
    if (!window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      return;
    }

    await deleteTemplate(id);
    const updated = templates.filter((t) => t.id !== id);
    if (selectedTemplateId === id) {
      onSelectTemplate(updated[0].id);
    }
    onTemplatesUpdated(updated);
    if (editingTemplate?.id === id) {
      setEditingTemplate(null);
    }
  };

  // ==========================================
  // MOUSE İLE KILAVUZ ÇİZGİLERİNİ SÜRÜKLEME
  // ==========================================
  const handlePointerDown = (line: DraggingLine, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingLine(line);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingLine || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    // 1920x1080 ölçeğine çevir
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;

    const currentX = Math.round(Math.max(0, Math.min(1920, relX * scaleX)));
    const currentY = Math.round(Math.max(0, Math.min(1080, relY * scaleY)));

    setGuidelines((prev) => {
      switch (draggingLine) {
        case 'topBound':
          return { ...prev, topBound: Math.min(currentY, prev.bottomBound - 50) };
        case 'bottomBound':
          return { ...prev, bottomBound: Math.max(currentY, prev.topBound + 50) };
        case 'leftColumnX':
          return { ...prev, leftColumnX: Math.min(currentX, prev.rightColumnX - 20) };
        case 'rightColumnX':
          return { ...prev, rightColumnX: Math.max(currentX, prev.leftColumnX + 20) };
        default:
          return prev;
      }
    });
  };

  const handlePointerUp = () => {
    setDraggingLine(null);
  };

  const isFormOpen = isCreatingNew || editingTemplate !== null;

  return (
    <div 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col transition-colors">
        {/* Üst Bar */}
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isFormOpen ? (editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Ekle') : 'Şablon Yönetimi'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1920x1080 Şablonlar ve Mouse ile Sürüklenebilir Kılavuz Çizgileri
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isFormOpen) {
                setIsCreatingNew(false);
                setEditingTemplate(null);
              } else {
                onClose();
              }
            }}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isFormOpen ? (
            /* ŞABLON LİSTESİ */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Kayıtlı Şablonlar ({templates.length})
                </span>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Şablon Yükle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`relative group bg-slate-50 dark:bg-slate-950/80 border rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                              {tpl.name}
                              {tpl.isDefault && (
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-normal">
                                  Varsayılan
                                </span>
                              )}
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              1920x1080 • Kırmızı: {tpl.guidelines.topBound}px-{tpl.guidelines.bottomBound}px
                            </span>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold shadow-sm">
                              Aktif
                            </span>
                          )}
                        </div>

                        {/* Önizleme */}
                        <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                          {tpl.imageDataUrl ? (
                            <img
                              src={tpl.imageDataUrl}
                              alt={tpl.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-slate-400">1920x1080 Şablon</div>
                          )}
                          <div
                            className="absolute left-0 right-0 border-b border-red-500/70 border-dashed"
                            style={{ top: `${(tpl.guidelines.topBound / 1080) * 100}%` }}
                          />
                          <div
                            className="absolute left-0 right-0 border-b border-red-500/70 border-dashed"
                            style={{ top: `${(tpl.guidelines.bottomBound / 1080) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 border-r border-blue-500/70 border-dashed"
                            style={{ left: `${(tpl.guidelines.leftColumnX / 1920) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 border-r border-blue-500/70 border-dashed"
                            style={{ left: `${(tpl.guidelines.rightColumnX / 1920) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Aksiyonlar */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(tpl);
                          }}
                          className="px-2.5 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Çizgileri Düzenle</span>
                        </button>
                        {!tpl.isDefault && (
                          <button
                            onClick={(e) => handleDelete(tpl.id, e)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors text-xs cursor-pointer"
                            title="Şablonu Sil"
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
          ) : (
            /* ŞABLON DÜZENLEME FORMU */
            <div className="space-y-5">
              {/* İsim ve Görsel Seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Şablon İsmi
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Örn: MEBİ Test Şablonu"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    1920x1080 Şablon Görseli
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-blue-500" />
                      Farklı Görsel Yükle (1920x1080)
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* CANLI VE SÜRÜKLENEBİLİR KILAVUZ ÇİZGİLERİ */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Çizgileri Mouse ile Tutup İstediğiniz Yere Sürükleyin
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <span className="w-3.5 h-1 bg-red-500 rounded-full inline-block"></span> Kırmızı: Yatay Sınırlar (Yukarı/Aşağı)
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span className="w-1 h-3.5 bg-blue-500 rounded-full inline-block"></span> Mavi: Sütunlar (Sağa/Sola)
                    </span>
                  </div>
                </div>

                {/* 1920x1080 İNTERAKTİF ÖNİZLEME ALANI */}
                <div 
                  ref={previewRef}
                  className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 select-none shadow-md"
                >
                  {templateImage ? (
                    <img
                      src={templateImage}
                      alt="Şablon"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center text-slate-400 text-sm">
                      Beyaz Şablon Zemin
                    </div>
                  )}

                  {/* 1. KIRMIZI ÜST SINIR (YUKARI / AŞAĞI SÜRÜKLENEBİLİR) */}
                  <div
                    onPointerDown={(e) => handlePointerDown('topBound', e)}
                    className="absolute left-0 right-0 group/top cursor-ns-resize z-20 flex items-center -translate-y-1/2 h-6"
                    style={{ top: `${(guidelines.topBound / 1080) * 100}%` }}
                    title="Yukarı/aşağı sürükleyin"
                  >
                    <div className={`w-full border-t-2 transition-all ${draggingLine === 'topBound' ? 'border-red-400 ring-2 ring-red-400/50' : 'border-red-500 group-hover/top:border-red-400'}`} />
                    <div className="absolute left-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 cursor-ns-resize transition-transform group-hover/top:scale-105">
                      <Move className="w-2.5 h-2.5" />
                      Üst Kırmızı: {guidelines.topBound}px
                    </div>
                  </div>

                  {/* 2. KIRMIZI ALT SINIR (YUKARI / AŞAĞI SÜRÜKLENEBİLİR) */}
                  <div
                    onPointerDown={(e) => handlePointerDown('bottomBound', e)}
                    className="absolute left-0 right-0 group/bottom cursor-ns-resize z-20 flex items-center -translate-y-1/2 h-6"
                    style={{ top: `${(guidelines.bottomBound / 1080) * 100}%` }}
                    title="Yukarı/aşağı sürükleyin"
                  >
                    <div className={`w-full border-t-2 transition-all ${draggingLine === 'bottomBound' ? 'border-red-400 ring-2 ring-red-400/50' : 'border-red-500 group-hover/bottom:border-red-400'}`} />
                    <div className="absolute left-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 cursor-ns-resize transition-transform group-hover/bottom:scale-105">
                      <Move className="w-2.5 h-2.5" />
                      Alt Kırmızı: {guidelines.bottomBound}px
                    </div>
                  </div>

                  {/* 3. MAVİ SOL ÇİZGİ (SAĞA / SOLA SÜRÜKLENEBİLİR) */}
                  <div
                    onPointerDown={(e) => handlePointerDown('leftColumnX', e)}
                    className="absolute top-0 bottom-0 group/left cursor-ew-resize z-20 flex justify-center -translate-x-1/2 w-6"
                    style={{ left: `${(guidelines.leftColumnX / 1920) * 100}%` }}
                    title="Sağa/sola sürükleyin"
                  >
                    <div className={`h-full border-l-2 transition-all ${draggingLine === 'leftColumnX' ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-blue-500 group-hover/left:border-blue-400'}`} />
                    <div className="absolute top-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 cursor-ew-resize whitespace-nowrap transition-transform group-hover/left:scale-105">
                      <Move className="w-2.5 h-2.5" />
                      Sol Mavi: {guidelines.leftColumnX}px
                    </div>
                  </div>

                  {/* 4. MAVİ SAĞ ÇİZGİ (SAĞA / SOLA SÜRÜKLENEBİLİR) */}
                  <div
                    onPointerDown={(e) => handlePointerDown('rightColumnX', e)}
                    className="absolute top-0 bottom-0 group/right cursor-ew-resize z-20 flex justify-center -translate-x-1/2 w-6"
                    style={{ left: `${(guidelines.rightColumnX / 1920) * 100}%` }}
                    title="Sağa/sola sürükleyin"
                  >
                    <div className={`h-full border-l-2 transition-all ${draggingLine === 'rightColumnX' ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-blue-500 group-hover/right:border-blue-400'}`} />
                    <div className="absolute top-12 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 cursor-ew-resize whitespace-nowrap transition-transform group-hover/right:scale-105">
                      <Move className="w-2.5 h-2.5" />
                      Sağ Mavi: {guidelines.rightColumnX}px
                    </div>
                  </div>
                </div>

                {/* SAYISAL DEĞERLER (CANLI GÜNCELLENİR VEYA ELLE DE YAZILABİLİR) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <label className="text-red-600 dark:text-red-400 font-bold block mb-1">
                      Kırmızı Üst Sınır (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.topBound}
                      onChange={(e) => setGuidelines({ ...guidelines, topBound: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-red-600 dark:text-red-400 font-bold block mb-1">
                      Kırmızı Alt Sınır (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.bottomBound}
                      onChange={(e) => setGuidelines({ ...guidelines, bottomBound: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-blue-600 dark:text-blue-400 font-bold block mb-1">
                      Sol Mavi Çizgi (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.leftColumnX}
                      onChange={(e) => setGuidelines({ ...guidelines, leftColumnX: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-blue-600 dark:text-blue-400 font-bold block mb-1">
                      Sağ Mavi Çizgi (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.rightColumnX}
                      onChange={(e) => setGuidelines({ ...guidelines, rightColumnX: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {isFormOpen ? (
            <>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Geri Dön
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGuidelines({ ...DEFAULT_GUIDELINES })}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 rounded-xl transition-colors cursor-pointer"
                  title="Varsayılan MEBİ koordinatlarına sıfırla"
                >
                  Varsayılana Sıfırla
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Şablonu Kaydet
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
