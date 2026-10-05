import { Template, Category, AppSettings } from '../types';

const DB_NAME = 'SoruSablonDB';
const DB_VERSION = 1;

interface DBSchema {
  templates: Template;
  categories: Category;
  settings: { key: string; value: any };
  questionCache: { id: string; originalFileName: string; dataUrl: string; renderedDataUrl?: string };
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
      if (!db.objectStoreNames.contains('questionCache')) {
        db.createObjectStore('questionCache', { keyPath: 'id' });
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
  name: 'Standart 1920x1080 Şablon',
  imageDataUrl: '', // Çalışma zamanında üretilecek
  createdAt: Date.now(),
  isDefault: true,
  guidelines: {
    topBound: 80,          // Kırmızı üst sınır
    bottomBound: 1000,     // Kırmızı alt sınır
    leftColumnX: 120,      // Mavi sol dikey çizgi (paragraf yaslanma)
    rightColumnX: 1000,    // Mavi sağ dikey çizgi (soru kökü yaslanma)
    columnWidth: 800,      // Sütun genişliği
    targetWidthCm: 12,     // 12 cm genişlik
    maxHeightCm: 15,       // 15 cm bölünme eşiği
    pixelsPerCm: 60,       // 60 px/cm (12 cm = 720 px, 15 cm = 900 px)
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
          const initial = { ...defaultTemplate, imageDataUrl: createDefaultTemplateCanvas() };
          saveTemplate(initial);
          list = [initial];
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
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    hasSeenOnboarding: false,
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
