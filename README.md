# Soru Şablon Yerleştirici (1920x1080) 📐✨

Test ve sınav sorularını otomatik olarak analiz eden, **12 cm genişlik x 15 cm yükseklik kuralına** göre değerlendiren, uzun soruları Gemini Vision AI ile paragrafından ikiye bölüp **1920x1080** şablona yerleştiren profesyonel web uygulaması.

---

## 🌟 Öne Çıkan Özellikler

1. **1920x1080 Çözünürlük ve Boş Şablon Desteği**:
   - Dilediğiniz 1920x1080 şablonu yükleyebilir, şablonlara isim verebilir ve dilediğiniz zaman düzenleyebilirsiniz.
2. **12 cm x 15 cm Otomatik Kuralı**:
   - Şablona eklenen soru görselinin genişliği otomatik **12 cm** olarak ayarlanır ve en/boy oranı korunur.
   - Yükseklik **15 cm'ye kadar** ise soru şablonun tam merkezine konumlandırılır.
   - Yükseklik **15 cm'yi aştıysa** soru otomatik olarak taranıp ikiye bölünür.
3. **Kırmızı ve Mavi Kılavuz Çizgileri**:
   - **Kırmızı Yatay Çizgiler (Üst & Alt Sınır)**: Merkeze yerleştirilen soruların ve ikiye bölünen parçaların tavan/taban sınırlarıdır.
   - **Mavi Dikey Çizgiler (Sol & Sağ Sütun)**: İkiye bölünen sorularda **öncül (paragraf)** sol mavi çizgiye yaslanır; **soru kökü ve seçenekler** sağ mavi çizgiye yaslanır.
   - Çizgiler şablon düzenleme ekranında mouse ile serbestçe sürüklenip ayarlanabilir.
4. **Akıllı Otomatik Tarama & Canlı Kesme Çizgisi Ayarı**:
   - Tarayıcının yerel piksel analiz motoru ile sorunun öncülü/paragrafı ile soru kökü arasındaki dikey ayrım noktası milisaniyeler içinde tespit edilir.
   - Hiçbir harici API veya internet bağlantısı gerekmez, %100 gizli ve yerel çalışır.
   - Kullanıcı dilerse "Kesme Ayarı" butonu ile kesme çizgisini görsel üzerinde canlı olarak yukarı/aşağı sürükleyebilir.
5. **Orijinal Dosya Adı Garantisi**:
   - Yüklediğiniz sorular çıktıda kesinlikle **orijinal dosya adıyla** (`soru_01.png` -> `soru_01.png`) üretilir. Karışıklık yaşanmaz!
6. **50 Soruya Kadar Toplu İşlem & ZIP İndirme**:
   - Tek seferde 50 soruya kadar yükleyebilir, tek tek veya tümünü tek tıkla **ZIP** olarak indirebilirsiniz.
7. **Sağ Menüde Soru Kategorizasyonu & Şablon Yönetimi**:
   - Soruları branşlara (Türkçe, Matematik, Fen vb.) göre kategorize edebilir, filtreleyebilir ve yönetebilirsiniz.
8. **Yerel Veri Kalıcılığı (IndexedDB + LocalStorage)**:
   - Şablonlarınız, ayarlarınız, kategorileriniz ve sorularınız tarayıcınızda saklanır. Sayfa yenilendiğinde veya tekrar açıldığında hiçbir veri kaybolmaz.
9. **Gece / Gündüz Döngüsü**:
   - Göz yormayan açık tema ve şık koyu tema desteği.

---

## 🛠️ Teknolojiler

- **React 19** & **TypeScript**
- **Vite** (Hızlı derleme ve modern paketleme)
- **Tailwind CSS** (Ferah ve duyarlı arayüz tasarımı)
- **HTML5 Canvas API** (1920x1080 kayıpsız piksel işleme)
- **Yerel Görüntü İşleme Motoru** (Beyaz boşluk tespiti ve piksel projeksiyonu)
- **JSZip** (Toplu indirme ve arşivleme)
- **IndexedDB** (Yüksek kapasiteli yerel veri kalıcılığı)

---

## 💻 Yerel Geliştirme (Local Development)

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Canlı derleme (Production Build)
npm run build
```

---

## 👤 Geliştirici

**Ubeydullah Öz** • [Instagram (@adamkarga)](https://instagram.com/adamkarga)
