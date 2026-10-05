import { Template, QuestionItem } from '../types';

export interface RenderResult {
  dataUrl: string;
  blob: Blob;
  isSplit: boolean;
  calculatedHeightCm: number;
}

/**
 * Resmi yükleyip HTMLImageElement döner
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Sorunun 12cm genişliğe göre yüksekliğini ve ikiye bölünüp bölünmeyeceğini hesaplar
 */
export function checkQuestionSplit(
  originalWidth: number,
  originalHeight: number,
  targetWidthCm: number = 12,
  maxHeightCm: number = 15
): { isSplit: boolean; calculatedHeightCm: number; aspectRatio: number } {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { isSplit: false, calculatedHeightCm: 0, aspectRatio: 1 };
  }
  const aspectRatio = originalHeight / originalWidth;
  const calculatedHeightCm = targetWidthCm * aspectRatio;
  const isSplit = calculatedHeightCm > maxHeightCm;
  return { isSplit, calculatedHeightCm, aspectRatio };
}

/**
 * Verilen şablon ve soru görselini 1920x1080 canvas'a yerleştirir
 */
export async function renderQuestionOnTemplate(
  template: Template,
  question: QuestionItem,
  splitRatioOverride?: number
): Promise<RenderResult> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context alınamadı.');
  }

  // 1. Şablon Arka Planını Çiz
  if (template.imageDataUrl) {
    const templateImg = await loadImage(template.imageDataUrl);
    ctx.drawImage(templateImg, 0, 0, 1920, 1080);
  } else {
    // Varsayılan beyaz zemin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1920, 1080);
  }

  // 2. Soru Görselini Yükle
  const questionImg = await loadImage(question.previewUrl);
  const qW = questionImg.naturalWidth || questionImg.width;
  const qH = questionImg.naturalHeight || questionImg.height;

  const { guidelines } = template;
  const { topBound, bottomBound, leftColumnX, rightColumnX, columnWidth, targetWidthCm, maxHeightCm, pixelsPerCm } = guidelines;

  // 12 cm genişliğin piksel karşılığı
  const targetWidthPx = targetWidthCm * pixelsPerCm;
  const maxHeightPx = maxHeightCm * pixelsPerCm;

  // Oran analizi
  const { isSplit, calculatedHeightCm } = checkQuestionSplit(qW, qH, targetWidthCm, maxHeightCm);

  const availableHeight = bottomBound - topBound;

  if (!isSplit) {
    // ==========================================
    // DURUM 1: Soru 15 cm'yi aşmadı -> MERKEZE YERLEŞTİR
    // ==========================================
    let renderW = targetWidthPx;
    let renderH = renderW * (qH / qW);

    // Kırmızı üst ve alt çizgilerin arasına sığmama durumu güvenlik kontrolü
    if (renderH > availableHeight) {
      const scale = availableHeight / renderH;
      renderH = availableHeight;
      renderW = renderW * scale;
    }

    // Şablonun tam merkezine konumlandır:
    const posX = Math.round((1920 - renderW) / 2);
    const posY = Math.round(topBound + (availableHeight - renderH) / 2);

    ctx.drawImage(questionImg, posX, posY, renderW, renderH);
  } else {
    // ==========================================
    // DURUM 2: Soru 15 cm'yi aştı -> İKİYE BÖLÜNÜR!
    // Sol: Öncül (Paragraf) - Sol Mavi Çizgiye & Üst Kırmızı Çizgiye Yaslanacak
    // Sağ: Soru Kökü + Şıklar - Sağ Mavi Çizgiye & Üst Kırmızı Çizgiye Yaslanacak
    // ==========================================
    const splitRatio = splitRatioOverride !== undefined ? splitRatioOverride : question.splitRatio || 0.5;
    const splitY = Math.round(qH * splitRatio);

    // Parça 1: Öncül / Paragraf (0 -> splitY)
    const part1H = splitY;
    // Parça 2: Soru Kökü + Seçenekler (splitY -> qH)
    const part2H = qH - splitY;

    // Sütun hedef genişliği
    const colW = columnWidth || targetWidthPx;

    // 1. Sol Parça (Öncül / Paragraf)
    if (part1H > 0) {
      let part1RenderW = colW;
      let part1RenderH = part1RenderW * (part1H / qW);

      // Kırmızı alt sınıra taşmaması için koruma
      if (part1RenderH > availableHeight) {
        const scale = availableHeight / part1RenderH;
        part1RenderH = availableHeight;
        part1RenderW = part1RenderW * scale;
      }

      // Sol parça: Sol mavi çizgiye (leftColumnX) yaslanır.
      // Eğer sol mavi çizgi orta ayırıcı ise (örn: 920px), sol parçanın sağ kenarı bu çizgiye yaslanır.
      // Eğer sol kenar çizgisi olarak girilmişse (örn: < 500px), sol kenarı bu çizgiye yaslanır.
      const part1X = leftColumnX > 600 ? Math.round(leftColumnX - part1RenderW) : leftColumnX;
      const part1Y = topBound;

      ctx.drawImage(
        questionImg,
        0, 0, qW, part1H, // Kaynak kırpma (öncül / paragraf)
        part1X, part1Y, part1RenderW, part1RenderH // Hedef yerleşim
      );
    }

    // 2. Sağ Parça (Soru Kökü ve Seçenekler)
    if (part2H > 0) {
      let part2RenderW = colW;
      let part2RenderH = part2RenderW * (part2H / qW);

      // Kırmızı alt sınıra taşmaması için koruma
      if (part2RenderH > availableHeight) {
        const scale = availableHeight / part2RenderH;
        part2RenderH = availableHeight;
        part2RenderW = part2RenderW * scale;
      }

      // Sol kenar sağ mavi çizgiye (rightColumnX), üst kenar üst kırmızı çizgiye (topBound) yaslanır
      const part2X = rightColumnX;
      const part2Y = topBound;

      ctx.drawImage(
        questionImg,
        0, splitY, qW, part2H, // Kaynak kırpma (soru kökü + şıklar)
        part2X, part2Y, part2RenderW, part2RenderH // Hedef yerleşim
      );
    }
  }

  // Blob ve DataURL çıktıları üret
  const dataUrl = canvas.toDataURL('image/png', 0.98);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png', 0.98);
  });

  return {
    dataUrl,
    blob,
    isSplit,
    calculatedHeightCm,
  };
}
