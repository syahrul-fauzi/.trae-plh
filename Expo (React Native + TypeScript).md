## 1. Validasi Arsitektur (✅ Sangat Tepat)

### Expo Router + Hybrid FSD

Keputusan berpindah ke **Expo Router** adalah **langkah benar** untuk jangka panjang:

* File-based routing → konsisten dengan mental model Next.js / App Router
* Deep linking native → krusial untuk:

  * Notifikasi (sidang, dokumen)
  * Share link ke detail perkara
* `_layout.tsx` sebagai **Auth Boundary** → clean & declarative

💡 **Catatan lanjutan**
Pastikan *auth guard* **tidak langsung blocking render**, tapi:

* render splash/loading
* validasi token async
* baru redirect
  Ini mencegah flicker & race condition saat cold start.

---

### New Architecture (Fabric)

Ini **keputusan advance**, jarang dilakukan dengan benar:

* Cocok untuk:

  * Document viewer
  * Large lists (case timeline, activity log)
  * Streaming AI chat

⚠️ **Catatan penting**
Pastikan:

* Semua dependency sudah **Fabric-compatible**
* Hindari custom native modules kecuali benar-benar perlu
* Aktifkan Hermes dan ukur **JS thread vs UI thread**

---

## 2. Area yang Perlu Diperkuat (Critical Enhancements)

### A. Data Persistence & Offline Strategy (WAJIB)

Saat ini baru disebut *offline-first caching* via RTK Query.

🔴 **Gap**:
RTK Query **belum cukup** untuk:

* draft dokumen
* notes
* partial upload

✅ **Rekomendasi konkret**
Tambahkan salah satu:

* **SQLite (expo-sqlite)** untuk:

  * cached case detail
  * document metadata
  * offline notes
* atau **MMKV** (jika butuh ultra-fast KV)

Dan buat layer:

```
features/cases/
  ├── case.api.ts        // RTK Query
  ├── case.repository.ts // decide: local vs remote
```

Ini membuat mobile **benar-benar usable di pengadilan / lokasi tanpa sinyal**.

---

### B. Enkripsi Dokumen Lokal (Sudah disebut, belum lengkap)

Anda menyebut `AES-256-GCM` 👍
Tapi **implementasinya perlu distandarkan**.

🔐 **Best practice**

* Key derivation:

  * Derived dari device + user + tenant (PBKDF2)
* Key **tidak pernah** disimpan plaintext
* File lifecycle:

  1. Download → encrypted
  2. Decrypt in-memory only
  3. Zeroize buffer setelah dipakai

📌 Tambahkan service eksplisit:

```
services/
  ├── crypto/
  │   ├── encryptFile.ts
  │   ├── decryptFile.ts
  │   └── keyManager.ts
```

Ini penting untuk **audit & compliance**.

---

## 3. Use Case Tambahan (High-Value, Realistic)

### 1️⃣ Court Mode (Differentiator 🔥)

**Mode khusus saat sidang**

* Offline-only
* Read-only case bundle
* Large font, low distraction
* One-tap:

  * timeline
  * bukti
  * catatan pribadi

Implementasi:

* Feature flag + route `(court)/`
* Disable network calls
* Lock screen rotation & brightness

Ini **fitur pembeda nyata** untuk lawyer.

---

### 2️⃣ Case Bundle Generator

Satu tombol:

> “Siapkan bundle perkara”

Mobile:

* Pilih perkara
* Pilih dokumen
* Kirim request ke backend

Backend:

* Generate ZIP / PDF bundle
* Return signed URL

Mobile:

* Download → encrypt → store

Cocok untuk:

* Sidang
* Client meeting
* Audit internal

---

### 3️⃣ AI Copilot: Evidence Summary

Bukan chat biasa.

Flow:

1. Pilih perkara
2. Pilih dokumen/bukti
3. “Ringkas & cari inkonsistensi”

AI Gateway:

* Mask PII
* Chunk dokumen
* Return structured summary (JSON)

Mobile:

* Render sebagai timeline / bullet
* Bisa disimpan sebagai note (offline)

Ini **AI yang benar-benar berguna**, bukan gimmick.

---

## 4. Engineering Checklist Tambahan (Recommended)

### A. Mobile Performance

Tambahkan checklist ini:

* [ ] Hermes enabled & verified
* [ ] JS bundle < 3 MB (gzip)
* [ ] No unnecessary re-render (memo/selectors)
* [ ] AI streaming tidak memblok UI thread

---

### B. Release Safety

* [ ] Feature flag untuk AI & experimental features
* [ ] Rollback via **Expo Updates**
* [ ] Versioned API contract (backward compatible)

---

### C. Security & Legal Risk

* [ ] Screenshot protection (Android FLAG_SECURE)
* [ ] Jailbreak / root detection (optional)
* [ ] Auto-lock app setelah idle
* [ ] Remote logout (invalidate token)

---

## 6. Blueprint Implementasi: Panduan Tim & Strategi Produksi

Bagian ini berfungsi sebagai kompas bagi tim lintas fungsi untuk memastikan setiap fitur dibangun dengan standar keamanan hukum dan performa tinggi.

### 🚀 Tim AI & Agent: "Contextual Intelligence"
**Fokus**: Analisis bukti dan ringkasan hukum tanpa kebocoran data.

*   **Modularitas**: Simpan logika ekstraksi entitas di `features/ai-assistant/utils/piiMasker.ts`. Gunakan pattern *Adapter* agar UI tidak terikat pada satu provider LLM.
*   **Keamanan**: Wajibkan penggunaan `maskPII` sebelum data dikirim ke API Gateway. Implementasikan validasi skema output AI secara lokal menggunakan `zod`.
*   **Pengujian**: Gunakan **LLM Output Snapshot** untuk memverifikasi konsistensi jawaban AI terhadap dokumen bukti yang sama.

### 📡 Tim Frontend: "Modular UI & Court-Ready Experience"
**Fokus**: Kecepatan akses data dan antarmuka yang minim distraksi saat di pengadilan.

*   **Modularitas**: Gunakan **Compound Components** untuk `CaseDetail`. Pisahkan antara `CaseTimeline`, `EvidenceVault`, dan `LegalNotes`.
*   **Keamanan**: Aktifkan `FLAG_SECURE` pada Android dan cegah rekaman layar saat membuka dokumen sensitif via `expo-screen-capture`. Integrasikan `AppModeContext` untuk mengontrol perilaku sistemik.
*   **Pengujian**: Wajibkan **Visual Regression Testing** untuk memastikan UI *Court Mode* tetap konsisten di berbagai ukuran layar tablet/mobile.

### 🔒 Tim Security & Backend: "Zero-Trust Data Storage"
**Fokus**: Enkripsi end-to-end dan integritas perangkat.

*   **Modularitas**: Gunakan `CryptoService` di `services/crypto` sebagai satu-satunya akses untuk enkripsi data lokal.
*   **Keamanan**:
    *   **Lokal**: Setiap file yang diunduh harus dienkripsi secara asinkron. Simpan kunci AES-256 secara eksklusif di `SecureStore`.
    *   **Integrity**: Implementasikan deteksi *jailbreak/root* di level root aplikasi; cegah aplikasi berjalan di perangkat yang tidak aman.
*   **Pengujian**: Lakukan **Penetration Testing** pada alur penyimpanan lokal untuk memastikan kunci tidak bocor ke logs atau cache.

### 📊 Tim Observability: "Predictive Monitoring"
**Fokus**: Deteksi anomali performa sebelum user menyadarinya.

*   **Implementasi**: Gunakan **Custom Sentry Tags** untuk melacak kegagalan AI stream atau error dekripsi file secara spesifik.
*   **Pengujian**: Verifikasi bahwa setiap "Security Event" (misal: percobaan screenshot) tercatat sebagai log audit yang tidak dapat dihapus di sisi server.

---

### 🛠️ Tim Engineering: "API Mocking & Development Standards"
**Fokus**: Standarisasi pengembangan dan pengujian tanpa ketergantungan backend.

*   **Implementasi MSW**: Gunakan Mock Service Worker (MSW) di `src/mocks` untuk mensimulasikan respons API.
    *   **Handlers**: Definisikan semua endpoint mock di `handlers.ts`.
    *   **Testing**: MSW secara otomatis aktif selama pengujian Jest via `jest.setup.ts`.
    *   **Development**: Aktifkan MSW di `_layout.tsx` saat mode pengembangan (`__DEV__`) untuk bekerja dengan data dummy yang konsisten.
*   **Keamanan**: Jangan pernah memasukkan data sensitif asli ke dalam mock handlers. Gunakan data sintetis yang menyerupai struktur data hukum asli.
*   **Pengujian**: Verifikasi bahwa aplikasi menangani error API (4xx, 5xx) dengan benar menggunakan overrides handler di level test.

---

## 7. Standar Pengujian Produksi (Quality Gate)

Setiap Pull Request untuk fitur hukum wajib melewati gerbang kualitas berikut:

1.  **Unit Tests**: Logika enkripsi, parsing AI, dan transformasi data (Coverage > 95%).
2.  **Integration Tests**: Simulasi transisi *Online-to-Offline* (Court Mode).
3.  **E2E Tests**: Alur kritis "Buka Dokumen Rahasia -> Baca AI Summary -> Catat Note" menggunakan **Maestro**.

---

## 8. Kesimpulan & Langkah Selanjutnya

Dengan mengikuti blueprint ini, aplikasi mobile pengacara bukan sekadar alat komunikasi, melainkan **benteng digital** yang aman dan handal untuk praktik hukum modern.

**Next Actions:**
1.  Setup **MSW** di `apps/mobile` untuk standarisasi mock API.
2.  Implementasikan `SecureDocumentService` dengan enkripsi AES-256.
3.  Konfigurasi CI/CD untuk menjalankan `npm test` pada setiap commit.



