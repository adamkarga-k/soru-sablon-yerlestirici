import React from 'react';
import { 
  X, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  Split, 
  Scissors, 
  FolderSync, 
  Download,
  AlertCircle
} from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="bg-gradient-to-r from-emerald-600/20 via-blue-600/20 to-indigo-600/20 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Sistem Nasıl Çalışır? (Kullanım Kılavuzu)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                1920x1080 Çözünürlük, 12cm x 15cm Kuralı ve Kılavuz Çizgileri Mantığı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Adım 1: 12cm x 15cm Kuralı Şeması */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">1</span>
              12 cm Genişlik & 15 cm Yükseklik Kuralı
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yüklediğiniz her soru görseli şablon içine <strong>12 cm genişlikte</strong> yerleştirilmek üzere oran korunarak ölçeklenir:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Durum A: Tek Parça */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Yükseklik &le; 15 cm ise (Normal Soru)
                </div>
                <p className="text-xs text-slate-400">
                  Görsel 15 cm'yi aşmıyorsa ikiye bölünmez. <strong>1920x1080 şablonun tam merkezine</strong>, kırmızı üst ve alt sınırların arasına ortalanmış olarak yerleştirilir.
                </p>
                <div className="h-20 bg-slate-950 rounded border border-slate-800 flex items-center justify-center">
                  <div className="w-16 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center text-[10px] text-emerald-300 font-mono">
                    MERKEZ
                  </div>
                </div>
              </div>

              {/* Durum B: İkiye Bölünme */}
              <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <Split className="w-4 h-4" />
                  Yükseklik &gt; 15 cm ise (Uzun Soru)
                </div>
                <p className="text-xs text-slate-400">
                  Görsel otomatik taranarak paragrafından ikiye bölünür. Sol tarafa paragraf, sağ tarafa soru kökü ve şıklar konumlandırılır.
                </p>
                <div className="h-20 bg-slate-950 rounded border border-slate-800 flex items-center justify-around px-4">
                  <div className="w-12 h-14 bg-blue-500/20 border-l-2 border-l-blue-400 border-t-2 border-t-red-500 rounded-sm flex items-center justify-center text-[9px] text-blue-300 font-mono text-center">
                    SOL (Öncül)
                  </div>
                  <div className="w-12 h-14 bg-purple-500/20 border-l-2 border-l-blue-400 border-t-2 border-t-red-500 rounded-sm flex items-center justify-center text-[9px] text-purple-300 font-mono text-center">
                    SAĞ (Kök+Şık)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Adım 2: Kılavuz Çizgileri Açıklaması */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">2</span>
              Şablondaki Kırmızı ve Mavi Çizgiler Ne Anlama Gelir?
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-red-500 shrink-0 mt-0.5"></span>
                <div>
                  <strong className="text-red-400">Yatay Kırmızı Çizgiler (Üst ve Alt Sınır):</strong>
                  <span className="text-slate-300 ml-1">
                    Soru tek parça merkeze koyulurken üst ve alttaki dikey sınırları belirler. İkiye bölünen sorularda ise her iki parçanın (paragraf ve kök) tepe noktası bu üst kırmızı çizgiye yaslanır.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-500 shrink-0 mt-0.5"></span>
                <div>
                  <strong className="text-blue-400">Dikey Mavi Çizgiler (Sol ve Sağ Konum):</strong>
                  <span className="text-slate-300 ml-1">
                    Yüksekliği aştığı için ikiye bölünen sorularda:
                    <br />
                    • Sorunun öncülü (paragrafı) <strong>sol taraftaki mavi çizgiye</strong> yaslanır.
                    <br />
                    • Soru kökü ve seçenekler ise <strong>sağ taraftaki mavi çizgiye</strong> yaslanır.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Adım 3: Akıllı Tarama & Bölme Mantığı */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">3</span>
              Akıllı Tarama (Gemini Vision + Canlı Manuel Ayar)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sorunun paragrafı ile soru kökü arasındaki ayrım, Ayarlar'dan girdiğiniz <strong>Gemini Vision API</strong> sayesinde milimetrik olarak taranır. 
              Dilerseniz veya API anahtarınız yoksa, sistem akıllı beyaz boşluk tespiti yapar. Ayrıca her sorunun üzerinde bulunan 
              <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-slate-800 rounded text-blue-400 font-semibold border border-slate-700">
                <Scissors className="w-3 h-3" /> Kesme Çizgisini Düzenle
              </span> 
              butonuyla kesme noktasını görsel üzerinde canlı olarak yukarı-aşağı sürükleyebilirsiniz!
            </p>
          </div>

          {/* Adım 4: Dosya İsimlendirmesi ve İndirme */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">4</span>
              Orijinal Dosya İsimleri Korunur (50 Soruya Kadar)
            </h3>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <Download className="w-4 h-4" />
                Karışıklığı Önleme Garantisi
              </div>
              <p className="text-slate-400">
                Örneğin yüklediğiniz dosya <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">soru_05.png</code> ise, 
                çıktı görseli de tam 1920x1080 çözünürlüğünde <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">soru_05.png</code> adıyla indirilir.
                Toplu İndir (ZIP) butonuna bastığınızda tüm sorular bu orijinal adlarla arşivlenir.
              </p>
            </div>
          </div>

          {/* Adım 5: Şablon ve Kategori Yönetimi */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">5</span>
              Şablon Yönetimi & Sağ Panelde Kategorizasyon
            </h3>
            <p className="text-xs text-slate-300">
              • Üst menüden <strong>"Şablonları Düzenle"</strong> diyerek kendi 1920x1080 boş şablonlarınızı yükleyebilir, onlara özel isim verebilir ve kırmızı/mavi kılavuz çizgilerini ayarlayabilirsiniz.
              <br />
              • Sağ taraftaki menüde sorularınızı branşlara (Türkçe, Matematik vb.) göre kategorize edebilir ve filtreleyebilirsiniz.
              <br />
              • Yaptığınız tüm şablonlar, ayarlar ve kategoriler tarayıcınızın yerel belleğinde (IndexedDB) kalıcı olarak saklanır; siteye tekrar girdiğinizde hiçbir veriniz kaybolmaz!
            </p>
          </div>
        </div>

        {/* Kapat Butonu */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
