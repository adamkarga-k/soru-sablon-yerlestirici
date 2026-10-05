export interface SplitAnalysisResult {
  splitRatio: number; // 0.0 ile 1.0 arasında (örn: 0.45)
  source: 'gemini' | 'whitespace-algorithm' | 'fallback';
  explanation?: string;
}

/**
 * Gemini API ile sorunun paragraf ve soru kökü arasındaki kesme noktasını tespit eder.
 */
export async function analyzeQuestionWithGemini(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<SplitAnalysisResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API anahtarı girilmemiş.');
  }

  // Base64 veri temizleme (data:image/...;base64, kısmını ayır)
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

  const prompt = `Bu görsel bir test sorusudur. Soru görseli yüksekliği aştığı için ikiye bölünecektir:
1. Sol tarafa konulacak kısım: Sorunun öncülü / okuma parçası / paragrafı / tablosu (soru metninin başındaki açıklama veya pasaj).
2. Sağ tarafa konulacak kısım: Sorunun kökü (örn: "Buna göre hangisi...", "Aşağıdakilerden hangisi...") ve cevap seçenekleri (A, B, C, D, E).

Görseli dikeyde (Y ekseninde) yukarıdan aşağıya tara. Paragrafın bittiği ve soru kökünün başladığı iki blok arasındaki boşluğun Y koordinat oranını (0.10 ile 0.90 arasında) belirle.
Oran = (Kesme noktasının üstten mesafesi) / (Toplam görsel yüksekliği).

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin veya markdown ekleme:
{
  "splitRatio": 0.45,
  "explanation": "Paragraf ile soru kökü arasındaki ayrım noktası"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/png',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Gemini API Hatası: ${message}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini modelinden geçerli bir yanıt alınamadı.');
  }

  try {
    // JSON parse
    const cleanJson = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    let ratio = parseFloat(parsed.splitRatio);
    if (isNaN(ratio) || ratio <= 0.05 || ratio >= 0.95) {
      ratio = 0.50;
    }
    return {
      splitRatio: ratio,
      source: 'gemini',
      explanation: parsed.explanation || 'Gemini Vision tarafından tespit edildi.'
    };
  } catch (err) {
    console.error('Gemini JSON parse hatası:', err, text);
    throw new Error('Gemini yanıtı JSON olarak çözümlenemedi.');
  }
}

/**
 * Fallback: Canvas piksel analizi ile en belirgin beyaz boşluk satırını bulma
 */
export function detectSplitByWhitespace(img: HTMLImageElement): number {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0.5;

    ctx.drawImage(img, 0, 0);
    const width = canvas.width;
    const height = canvas.height;

    // Sadece görselin %25 ile %75'i arasındaki orta bölgeyi tara
    const startY = Math.floor(height * 0.25);
    const endY = Math.floor(height * 0.75);

    const imgData = ctx.getImageData(0, startY, width, endY - startY);
    const data = imgData.data;

    let bestGapY = Math.floor(height * 0.5);
    let maxWhiteness = -1;

    // Her satırın ortalama beyazlık / boşluk skorunu hesapla
    const rowScores: number[] = [];
    for (let y = 0; y < endY - startY; y++) {
      let whitePixels = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Beyaz veya çok açık piksel kontrolü (> 240)
        if (r > 235 && g > 235 && b > 235) {
          whitePixels++;
        }
      }
      rowScores.push(whitePixels / width);
    }

    // 15 satırlık hareketli ortalama ile en geniş beyaz boşluk aralığını bul
    const windowSize = Math.max(5, Math.floor(height * 0.015));
    for (let i = windowSize; i < rowScores.length - windowSize; i++) {
      let sum = 0;
      for (let j = -windowSize; j <= windowSize; j++) {
        sum += rowScores[i + j];
      }
      const avg = sum / (windowSize * 2 + 1);
      if (avg > maxWhiteness) {
        maxWhiteness = avg;
        bestGapY = startY + i;
      }
    }

    const calculatedRatio = bestGapY / height;
    return Math.max(0.15, Math.min(0.85, calculatedRatio));
  } catch (e) {
    console.error('detectSplitByWhitespace error:', e);
    return 0.5;
  }
}
