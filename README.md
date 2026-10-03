<div align="center">

# ⚡ AetherDrop Pro
**Ultra-Fast, Zero-Cloud, End-to-End Encrypted P2P Cross-Device Transfer**

[![Netlify Status](https://api.netlify.com/api/v1/badges/deploy-status?style=flat)](https://app.netlify.com)
[![WebRTC DataChannel](https://img.shields.io/badge/WebRTC-P2P%20Encrypted-purple.svg)](https://webrtc.org)
[![Platform: iPad • iOS • Android • macOS • Windows • Linux](https://img.shields.io/badge/Platform-iPad%20%7C%20iOS%20%7C%20Android%20%7C%20PC-06b6d4.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

*iPad, iPhone, Android ve Bilgisayarlar arasında sıfır sunucu depolaması ve dosya boyutu sınırı olmaksızın, doğrudan ve uçtan uca şifreli dosya & metin aktarımı.*

[Özellikler](#-özellikler) • [Nasıl Çalışır?](#-nasıl-çalışır) • [Netlify Yayını](#-netlify-üzerinde-tek-tıkla-yayınlama) • [PWA Kurulumu](#-ipad--iphone-pwa-kurulumu) • [Geliştirme](#-yerel-geliştirme)

</div>

---

## 🌟 Öne Çıkan Özellikler

- **📱 Akıllı Cihaz Tespiti & Apple / Android Entegrasyonu:**
  - iPad (iPadOS), iPhone, Android, Mac ve Windows sistemlerini anında tespit eder.
  - Radar ekranında her cihaza özel parlayan neon ikonlar ve cihaz kimlikleri gösterilir.
- **⚡ Sınırsız Dosya Boyutu (WebRTC P2P DataChannel):**
  - Dosyalar hiçbir ara sunucuya yüklenmez; doğrudan iki cihaz arasında şifreli tünelden (*DTLS-SRTP*) akar.
  - **SCTP Backpressure Flow Control:** 1 GB+, 5 GB+ 4K videolar ve devasa arşivler tarayıcıyı kasmadan ve bellek çökmesi yaşatmadan 64 KB'lık akıllı bloklar halinde akar.
- **🔗 QR Kod & 6 Haneli PIN ile 1 Saniyede Eşleşme:**
  - Bilgisayarda açık olan QR kodu iPad veya telefon kamerasından okutun; cihazlar doğrudan birbirinin P2P kimliğine kilitlenir.
- **📋 Hızlı Metin, Link & Pano Senkronizasyonu:**
  - PC'den kopyalanan bir web bağlantısını veya notu iPad'e tek dokunuşla gönderin, kopyalayın veya Safari'de açın.
- **💎 Lüks Cyber / Apple Estetiği & Web Audio Ses Efektleri:**
  - Glassmorphism karanlık tema, etkileşimli radar dalgaları, canlı hız göstergesi (MB/s), kalan süre (ETA) ve resim önizlemeleri.
  - Web Audio API ile sıfır harici varlık yüküyle sentetik dokunsal ses bildirimleri ve konfeti kutlaması.
- **📲 PWA (Progressive Web App):**
  - iPad ve iPhone Safari'de *"Ana Ekrana Ekle"* yapıldığında adres çubukları olmadan tam ekran yerel bir iOS uygulaması gibi çalışır.

---

## 🔄 Nasıl Çalışır?

```mermaid
sequenceDiagram
    autonumber
    actor PC as 💻 Masaüstü / PC (Host)
    actor iPad as 📱 iPad / Mobil (Peer)

    PC->>PC: Odayı ve P2P Kimliğini Başlatır
    PC->>PC: Ekranda QR Kod & PIN Gösterir
    iPad->>PC: Kamerayla QR Kodu Tarar (#room=...&peer=...)
    Note over PC,iPad: WebRTC DTLS Doğrudan El Sıkışması (P2P)
    PC-->>iPad: Karşılıklı Cihaz Bilgisi Değişimi
    Note over PC,iPad: ⚡ Bağlantı Kuruldu (Sesli & Görsel Bildirim)
    PC->>iPad: 64 KB Bloklar Halinde Akış (Gecikmesiz & Sınırsız)
    iPad->>iPad: Blob Birleştirme & Otomatik İndirme
```

---

## 🚀 Netlify Üzerinde Tek Tıkla Yayınlama

Proje kökünde bulunan `netlify.toml` dosyası SPA yönlendirmelerini (`/* -> /index.html`) ve önbellek güvenlik başlıklarını otomatik yönetir.

### 1. Yöntem: GitHub Üzerinden (Önerilen)
1. Bu depoyu GitHub'a aktarın:
   ```bash
   git remote add origin https://github.com/latryee/AetherDrop.git
   git branch -M main
   git push -u origin main
   ```
2. [Netlify Kontrol Paneli](https://app.netlify.com)'ne gidin.
3. **"Add new site"** -> **"Import an existing project"** -> **"GitHub"** seçeneğine tıklayın.
4. `AetherDrop` reposunu seçin. (Derleme komutu `npm run build` ve klasör `dist` otomatik gelecektir).
5. **"Deploy AetherDrop"** butonuna basın. 30 saniye içinde siteniz küresel CDN üzerinde yayında olacaktır!

### 2. Yöntem: Netlify CLI
```bash
npx netlify deploy --prod
```

---

## 📱 iPad & iPhone PWA Kurulumu

1. iPad veya iPhone'unuzda Safari tarayıcısını açıp yayınlanan URL'ye gidin.
2. Safari'nin alt menüsündeki **Paylaş** (`Share`) butonuna dokunun.
3. Listeden **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
4. Artık AetherDrop, ana ekranınızda bağımsız, tam ekran yerel bir Apple uygulaması olarak kullanılabilir.

---

## 🛠️ Yerel Geliştirme

```bash
# Depoyu klonlayın
git clone https://github.com/latryee/AetherDrop.git
cd AetherDrop

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Üretim derlemesi oluşturun
npm run build

# Derlemeyi önizleyin
npm run preview
```

---

## 🔒 Güvenlik & Gizlilik

- **Sıfır Depolama:** Hiçbir dosya, metin veya kullanıcı verisi sunucularda saklanmaz.
- **Uçtan Uca Şifreli:** Bütün veri akışı WebRTC'nin endüstri standardı **DTLS-SRTP** şifrelemesi ile korunur.

---

<div align="center">
Geliştirici: <b>latryee</b> • MIT Lisansı ile Lisanslanmıştır.
</div>
