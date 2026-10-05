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
4. **Gemini Vision AI & Akıllı Tarama**:
   - Google Gemini API (`gemini-2.5-flash`) ile sorunun öncülü/paragrafı ile soru kökü arasındaki dikey ayrım noktası otomatik tespit edilir.
   - API anahtarı olmadan da çalışan yerel Beyaz Boşluk Analizi mevcuttur.
   - Kullanıcı dilerse "Kesme Ayarı" butonu ile kesme çizgisini görsel üzerinde canlı olarak yukarı/aşağı sürükleyebilir.
5. **Orijinal Dosya Adı Garantisi**:
   - Yüklediğiniz sorular çıktıda kesinlikle **orijinal dosya adıyla** (`soru_01.png` -> `soru_01.png`) üretilir. Karışıklık yaşanmaz!
6. **50 Soruya Kadar Toplu İşlem & ZIP İndirme**:
   - Tek seferde 50 soruya kadar yükleyebilir, tek tek veya tümünü tek tıkla **ZIP** olarak indirebilirsiniz.
7. **Sağ Menüde Soru Kategorizasyonu**:
   - Soruları branşlara (Türkçe, Matematik, Fen vb.) göre kategorize edebilir, filtreleyebilir ve yönetebilirsiniz.
8. **Yerel Veri Kalıcılığı (IndexedDB + LocalStorage)**:
   - Şablonlarınız, ayarlarınız, kategorileriniz ve sorularınız tarayıcınızda saklanır. Sayfa yenilendiğinde veya tekrar açıldığında hiçbir veri kaybolmaz.

---

## 🚀 GitHub'a Yükleme ve Vercel'e Deploy Rehberi

Bu proje tamamen istemci taraflı (Client-side Canvas & Web API) çalıştığı için **Vercel üzerinde %100 ücretsiz ve statik olarak** çalışır.

### 1. Adım: Git Reposu Başlatma
Terminalde proje klasöründe (`soru-sablon-yerlestirici`) şu komutları çalıştırın:
```bash
git init
git add .
git commit -m "feat: Soru Şablon Yerleştirici (1920x1080) ilk sürüm"
```

### 2. Adım: GitHub Reposuna Gönderme
1. [GitHub](https://github.com/new) adresinde yeni bir repository oluşturun (Örn: `soru-sablon-yerlestirici`).
2. Terminalde deponuzu bağlayıp push yapın:
```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/soru-sablon-yerlestirici.git
git branch -M main
git push -u origin main
```

### 3. Adım: Vercel'e Bağlama (Deploy)
1. [Vercel](https://vercel.com) hesabınıza giriş yapın.
2. **"Add New..." -> "Project"** seçeneğine tıklayın.
3. GitHub reponuzu seçin (`soru-sablon-yerlestirici`).
4. Framework olarak **Vite** otomatik algılanacaktır.
5. **Deploy** butonuna tıklayın!
6. 1 dakika içinde siteniz canlıya alınacak ve tüm kullanıcılar tarafından kullanılabilecektir.

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
