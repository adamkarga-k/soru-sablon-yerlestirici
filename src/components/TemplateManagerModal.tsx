import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Upload, 
  Sliders, 
  Layers, 
  Maximize2,
  Sparkles
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
  const [guidelines, setGuidelines] = useState<TemplateGuidelines>({
    topBound: 80,
    bottomBound: 1000,
    leftColumnX: 120,
    rightColumnX: 1000,
    columnWidth: 800,
    targetWidthCm: 12,
    maxHeightCm: 15,
    pixelsPerCm: 60,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingTemplate(null);
    setTemplateName('Yeni Şablon ' + (templates.length + 1));
    setTemplateImage(createDefaultTemplateCanvas());
    setGuidelines({
      topBound: 80,
      bottomBound: 1000,
      leftColumnX: 120,
      rightColumnX: 1000,
      columnWidth: 800,
      targetWidthCm: 12,
      maxHeightCm: 15,
      pixelsPerCm: 60,
    });
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
      imageDataUrl: templateImage || createDefaultTemplateCanvas(),
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

  const isFormOpen = isCreatingNew || editingTemplate !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Üst Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isFormOpen ? (editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Ekle') : 'Şablon Yönetimi'}
              </h2>
              <p className="text-xs text-slate-400">
                1920x1080 Boş Şablonlar ve Kırmızı/Mavi Kılavuz Çizgileri
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
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isFormOpen ? (
            /* ŞABLON LİSTESİ */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Kayıtlı Şablonlar ({templates.length})
                </span>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
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
                      className={`relative group bg-slate-950/80 border rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                              {tpl.name}
                              {tpl.isDefault && (
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-normal">
                                  Varsayılan
                                </span>
                              )}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-mono">
                              1920x1080 • Kırmızı: {tpl.guidelines.topBound}px-{tpl.guidelines.bottomBound}px
                            </span>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">
                              Aktif
                            </span>
                          )}
                        </div>

                        {/* Küçük Şablon Önizlemesi */}
                        <div className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                          {tpl.imageDataUrl ? (
                            <img
                              src={tpl.imageDataUrl}
                              alt={tpl.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-slate-500">Boş Şablon</div>
                          )}
                          {/* Mini Kılavuz Çizgileri Gösterimi */}
                          <div
                            className="absolute left-0 right-0 border-b border-red-500/60 border-dashed"
                            style={{ top: `${(tpl.guidelines.topBound / 1080) * 100}%` }}
                          />
                          <div
                            className="absolute left-0 right-0 border-b border-red-500/60 border-dashed"
                            style={{ top: `${(tpl.guidelines.bottomBound / 1080) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 border-r border-blue-500/60 border-dashed"
                            style={{ left: `${(tpl.guidelines.leftColumnX / 1920) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 border-r border-blue-500/60 border-dashed"
                            style={{ left: `${(tpl.guidelines.rightColumnX / 1920) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(tpl);
                          }}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1"
                          title="Şablon Kılavuzlarını ve İsmini Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Düzenle</span>
                        </button>
                        {!tpl.isDefault && (
                          <button
                            onClick={(e) => handleDelete(tpl.id, e)}
                            className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs flex items-center gap-1"
                            title="Şablonu Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Sil</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ŞABLON DÜZENLEME / OLUŞTURMA FORMU */
            <div className="space-y-6">
              {/* İsim & Görsel Seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Şablon İsmi
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Örn: Türkçe Deneme Şablonu"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    1920x1080 Şablon Görseli
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-blue-400" />
                      Görsel Seç (PNG / JPG 1920x1080)
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

              {/* Canlı Kılavuz Çizgileri Önizlemesi & Düzenleme */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">
                      Kılavuz Çizgileri Önizlemesi & Kalibrasyonu
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <span className="w-3 h-0.5 bg-red-500 inline-block"></span> Kırmızı: Yatay Sınırlar
                    </span>
                    <span className="flex items-center gap-1 text-blue-400 font-medium">
                      <span className="w-0.5 h-3 bg-blue-500 inline-block"></span> Mavi: İkiye Bölünme Sütunları
                    </span>
                  </div>
                </div>

                {/* 1920x1080 Önizleme Alanı */}
                <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-700 select-none">
                  {templateImage ? (
                    <img
                      src={templateImage}
                      alt="Şablon"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center text-slate-400 text-sm">
                      Beyaz Şablon Arka Planı
                    </div>
                  )}

                  {/* Kırmızı Üst Sınır */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                    style={{ top: `${(guidelines.topBound / 1080) * 100}%` }}
                  >
                    <span className="absolute left-2 -top-5 text-[10px] font-mono bg-red-600 text-white px-1.5 py-0.5 rounded shadow">
                      Üst Kırmızı: {guidelines.topBound}px
                    </span>
                  </div>

                  {/* Kırmızı Alt Sınır */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                    style={{ top: `${(guidelines.bottomBound / 1080) * 100}%` }}
                  >
                    <span className="absolute left-2 top-1 text-[10px] font-mono bg-red-600 text-white px-1.5 py-0.5 rounded shadow">
                      Alt Kırmızı: {guidelines.bottomBound}px
                    </span>
                  </div>

                  {/* Mavi Sol Çizgi (Paragraf yaslanma) */}
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-10 pointer-events-none"
                    style={{ left: `${(guidelines.leftColumnX / 1920) * 100}%` }}
                  >
                    <span className="absolute top-2 left-1 text-[10px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded shadow">
                      Sol Mavi (Öncül): {guidelines.leftColumnX}px
                    </span>
                  </div>

                  {/* Mavi Sağ Çizgi (Soru kökü yaslanma) */}
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-10 pointer-events-none"
                    style={{ left: `${(guidelines.rightColumnX / 1920) * 100}%` }}
                  >
                    <span className="absolute top-2 left-1 text-[10px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded shadow">
                      Sağ Mavi (Kök): {guidelines.rightColumnX}px
                    </span>
                  </div>
                </div>

                {/* Sayısal Girişler */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <label className="text-red-400 font-semibold block mb-1">
                      Kırmızı Üst Sınır (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.topBound}
                      onChange={(e) => setGuidelines({ ...guidelines, topBound: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-red-400 font-semibold block mb-1">
                      Kırmızı Alt Sınır (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.bottomBound}
                      onChange={(e) => setGuidelines({ ...guidelines, bottomBound: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-blue-400 font-semibold block mb-1">
                      Sol Mavi Çizgi (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.leftColumnX}
                      onChange={(e) => setGuidelines({ ...guidelines, leftColumnX: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-blue-400 font-semibold block mb-1">
                      Sağ Mavi Çizgi (px)
                    </label>
                    <input
                      type="number"
                      value={guidelines.rightColumnX}
                      onChange={(e) => setGuidelines({ ...guidelines, rightColumnX: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {isFormOpen ? (
            <>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Geri Dön
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Şablonu Kaydet
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors"
              >
                Tamam
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
