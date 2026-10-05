import { Template, Category, AppSettings, QuestionItem, QuestionStatus } from '../types';

const DB_NAME = 'SoruSablonDB';
const DB_VERSION = 2;

interface DBSchema {
  templates: Template;
  categories: Category;
  settings: { key: string; value: any };
  questions: StoredQuestionRecord;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('questions')) {
        db.createObjectStore('questions', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Varsayılan boş şablon (1920x1080 SVG/Canvas oluşturucu)
export function createDefaultTemplateCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Şık açık/koyu nötr şablon arka planı
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1920, 1080);

    // Üst başlık alanı dekorasyonu
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1920, 60);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 1920, 60);

    // Alt bilgi alanı dekorasyonu
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 1020, 1920, 60);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 1020, 1920, 60);

    // İnce şablon çerçevesi
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 1900, 1060);
  }
  return canvas.toDataURL('image/png');
}

export const defaultTemplate: Template = {
  id: 'default-template-1',
  name: 'MEBİ Tarama Testi Şablonu (1920x1080)',
  imageDataUrl: '/mebi_template_clean.png', // Kullanıcının gönderdiği orijinal MEBİ şablonu
  createdAt: Date.now(),
  isDefault: true,
  guidelines: {
    topBound: 125,         // Üst Kırmızı Çizgi (1920x1080 pikselde)
    bottomBound: 985,      // Alt Kırmızı Çizgi (1920x1080 pikselde)
    leftColumnX: 920,      // Sol Mavi Çizgi (Orta sol sınır - Paragraf yaslanma)
    rightColumnX: 1000,    // Sağ Mavi Çizgi (Orta sağ sınır - Soru kökü yaslanma)
    columnWidth: 720,      // 12 cm genişlik (60 px/cm)
    targetWidthCm: 12,     // 12 cm otomatik hedef genişlik
    maxHeightCm: 15,       // 15 cm aşılınca ikiye bölme eşiği
    pixelsPerCm: 60,       // 1 cm = 60 px
  }
};

export const defaultCategories: Category[] = [
  { id: 'cat-all', name: 'Tüm Sorular', color: '#3b82f6' },
  { id: 'cat-turkce', name: 'Türkçe', color: '#ef4444' },
  { id: 'cat-matematik', name: 'Matematik', color: '#10b981' },
  { id: 'cat-fen', name: 'Fen Bilimleri', color: '#f59e0b' },
  { id: 'cat-sosyal', name: 'Sosyal Bilimler', color: '#8b5cf6' },
];

export async function getTemplates(): Promise<Template[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('templates', 'readonly');
      const store = tx.objectStore('templates');
      const request = store.getAll();
      request.onsuccess = () => {
        let list = request.result as Template[];
        if (!list || list.length === 0) {
          const initial = { ...defaultTemplate, imageDataUrl: '/mebi_template_clean.png' };
          saveTemplate(initial);
          list = [initial];
        } else {
          // Eski versiyondan kalan şablonu en yeni temiz şablonla güncelle
          const defIdx = list.findIndex(t => t.id === 'default-template-1');
          if (defIdx !== -1) {
            list[defIdx].imageDataUrl = '/mebi_template_clean.png';
            saveTemplate(list[defIdx]);
          }
        }
        resolve(list);
      };
      request.onerror = () => resolve([defaultTemplate]);
    });
  } catch (err) {
    console.error('getTemplates error:', err);
    return [defaultTemplate];
  }
}

export async function saveTemplate(template: Template): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const request = store.put(template);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCategories(): Promise<Category[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const request = store.getAll();
      request.onsuccess = () => {
        let list = request.result as Category[];
        if (!list || list.length === 0) {
          defaultCategories.forEach(cat => saveCategory(cat));
          list = defaultCategories;
        }
        resolve(list);
      };
      request.onerror = () => resolve(defaultCategories);
    });
  } catch (err) {
    return defaultCategories;
  }
}

export async function saveCategory(category: Category): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    const request = store.put(category);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Settings
const SETTINGS_KEY = 'soru_sablon_settings';

export function getLocalSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Settings parse error:', e);
  }
  return {
    selectedTemplateId: 'default-template-1',
    selectedCategoryId: 'cat-all',
  };
}

export function saveLocalSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Settings save error:', e);
  }
}

// ==========================================
// SORULARIN KALICI HAFIZA YÖNETİMİ (IndexedDB)
// ==========================================
export interface StoredQuestionRecord {
  id: string;
  originalFileName: string;
  originalBlob: Blob;
  categoryId: string;
  width: number;
  height: number;
  status: QuestionStatus;
  statusMessage?: string;
  isSplit: boolean;
  splitRatio?: number;
  splitY?: number;
  renderedDataUrl?: string;
  renderedBlob?: Blob;
  errorMessage?: string;
  createdAt: number;
}

export async function saveStoredQuestion(question: QuestionItem): Promise<void> {
  try {
    const db = await openDB();
    let originalBlob = question.file as Blob;
    if (!originalBlob && question.previewUrl) {
      try {
        const res = await fetch(question.previewUrl);
        originalBlob = await res.blob();
      } catch (e) {
        console.error('Blob fetch failed:', e);
      }
    }

    const record: StoredQuestionRecord = {
      id: question.id,
      originalFileName: question.originalFileName,
      originalBlob: originalBlob || new Blob([]),
      categoryId: question.categoryId,
      width: question.width,
      height: question.height,
      status: question.status,
      statusMessage: question.statusMessage,
      isSplit: question.isSplit,
      splitRatio: question.splitRatio,
      splitY: question.splitY,
      renderedDataUrl: question.renderedDataUrl,
      renderedBlob: question.renderedBlob,
      errorMessage: question.errorMessage,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('questions', 'readwrite');
      const store = tx.objectStore('questions');
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('saveStoredQuestion error:', err);
  }
}

export async function saveAllStoredQuestions(questionList: QuestionItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');

    for (const q of questionList) {
      const originalBlob = (q.file as Blob) || new Blob([]);
      const record: StoredQuestionRecord = {
        id: q.id,
        originalFileName: q.originalFileName,
        originalBlob,
        categoryId: q.categoryId,
        width: q.width,
        height: q.height,
        status: q.status,
        statusMessage: q.statusMessage,
        isSplit: q.isSplit,
        splitRatio: q.splitRatio,
        splitY: q.splitY,
        renderedDataUrl: q.renderedDataUrl,
        renderedBlob: q.renderedBlob,
        errorMessage: q.errorMessage,
        createdAt: Date.now(),
      };
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('saveAllStoredQuestions error:', err);
  }
}

export async function getSavedQuestions(): Promise<QuestionItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('questions', 'readonly');
      const store = tx.objectStore('questions');
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result as StoredQuestionRecord[]) || [];
        const items: QuestionItem[] = records.map((rec) => {
          const file = new File([rec.originalBlob], rec.originalFileName, {
            type: rec.originalBlob?.type || 'image/png',
          });
          const previewUrl = URL.createObjectURL(file);
          // Tarayıcı yenilendiğinde en taze ve hızlı render görseli
          const renderedDataUrl = rec.renderedBlob
            ? URL.createObjectURL(rec.renderedBlob)
            : rec.renderedDataUrl;

          return {
            id: rec.id,
            originalFileName: rec.originalFileName,
            file,
            previewUrl,
            categoryId: rec.categoryId,
            width: rec.width,
            height: rec.height,
            status: rec.status || 'rendered',
            statusMessage: rec.statusMessage,
            isSplit: rec.isSplit,
            splitRatio: rec.splitRatio,
            splitY: rec.splitY,
            renderedDataUrl,
            renderedBlob: rec.renderedBlob,
            errorMessage: rec.errorMessage,
          };
        });
        resolve(items);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error('getSavedQuestions error:', err);
    return [];
  }
}

export async function deleteStoredQuestion(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('questions', 'readwrite');
      const store = tx.objectStore('questions');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('deleteStoredQuestion error:', err);
  }
}

export async function clearAllStoredQuestions(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('questions', 'readwrite');
      const store = tx.objectStore('questions');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('clearAllStoredQuestions error:', err);
  }
}
