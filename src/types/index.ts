export interface TemplateGuidelines {
  topBound: number;        // Kırmızı üst yatay sınır (px)
  bottomBound: number;     // Kırmızı alt yatay sınır (px)
  leftColumnX: number;     // Mavi sol dikey çizgi (öncül/paragraf yaslanma noktası) (px)
  rightColumnX: number;    // Mavi sağ dikey çizgi (soru kökü yaslanma noktası) (px)
  columnWidth: number;     // İkiye bölündüğünde sütun genişliği (px)
  targetWidthCm: number;   // Otomatik ayarlanan genişlik: 12 cm
  maxHeightCm: number;     // Bölünme eşiği yükseklik: 15 cm
  pixelsPerCm: number;     // 1 cm kaç piksel?
}

export interface Template {
  id: string;
  name: string;
  imageDataUrl: string;    // 1920x1080 Şablon görseli
  guidelines: TemplateGuidelines;
  createdAt: number;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type QuestionStatus = 'idle' | 'analyzing' | 'splitting' | 'rendered' | 'error';

export interface QuestionItem {
  id: string;
  originalFileName: string; // Orijinal dosya adı (çıktıda birebir kullanılacak)
  file: File;
  previewUrl: string;
  categoryId: string;
  width: number;
  height: number;
  status: QuestionStatus;
  statusMessage?: string;
  isSplit: boolean;         // 15 cm'yi aştığı için ikiye bölündü mü?
  splitRatio?: number;      // Kesme noktası oranı (0 - 1 arası, dikey Y oranı)
  splitY?: number;          // Orijinal görsel üzerinde dikey kesme pikseli
  renderedDataUrl?: string; // 1920x1080 Nihai render görseli (Data URL)
  renderedBlob?: Blob;      // İndirme için blob
  errorMessage?: string;
}

export interface AppSettings {
  selectedTemplateId: string;
  selectedCategoryId: string;
}
