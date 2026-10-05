/**
 * Görseldeki metin blokları (paragraf ve soru kökü) arasındaki
 * en belirgin beyaz satır boşluğunu tespit eden yerel görüntü işleme algoritması.
 * Tamamen tarayıcıda çalışır, hiçbir API veya internet bağlantısı gerektirmez.
 */
export function detectSplitByWhitespace(img: HTMLImageElement): number {
  try {
    const canvas = document.createElement('canvas');
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    
    if (width <= 0 || height <= 0) return 0.5;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0.5;

    ctx.drawImage(img, 0, 0);

    // Soru paragrafı ve kökü genellikle görselin %20 ile %80'lik orta kesitindedir
    const startY = Math.floor(height * 0.20);
    const endY = Math.floor(height * 0.80);
    const scanHeight = endY - startY;

    if (scanHeight <= 10) return 0.5;

    const imgData = ctx.getImageData(0, startY, width, scanHeight);
    const data = imgData.data;

    // Her satırın beyaz piksel yoğunluğunu hesapla
    const rowWhiteDensities: number[] = new Array(scanHeight).fill(0);
    for (let y = 0; y < scanHeight; y++) {
      let whiteCount = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Beyaz veya çok açık renk zemin (> 235)
        if (r > 235 && g > 235 && b > 235) {
          whiteCount++;
        }
      }
      rowWhiteDensities[y] = whiteCount / width;
    }

    // Hareketli pencere (moving window) ile en belirgin boşluk aralığını bul
    const windowSize = Math.max(5, Math.floor(height * 0.015));
    let maxGapScore = -1;
    let bestGapIndex = Math.floor(scanHeight / 2);

    for (let i = windowSize; i < scanHeight - windowSize; i++) {
      let sum = 0;
      for (let j = -windowSize; j <= windowSize; j++) {
        sum += rowWhiteDensities[i + j];
      }
      const score = sum / (windowSize * 2 + 1);
      
      // Merkeze yakın boşluklara hafif öncelik veren ağırlık katsayısı
      const centerFactor = 1 - Math.abs(i - scanHeight / 2) / scanHeight * 0.2;
      const weightedScore = score * centerFactor;

      if (weightedScore > maxGapScore) {
        maxGapScore = weightedScore;
        bestGapIndex = i;
      }
    }

    const calculatedY = startY + bestGapIndex;
    const calculatedRatio = calculatedY / height;

    // Güvenli aralık: %15 ile %85 arasında sınırla
    return Math.max(0.15, Math.min(0.85, Number(calculatedRatio.toFixed(3))));
  } catch (e) {
    console.error('detectSplitByWhitespace error:', e);
    return 0.5;
  }
}
