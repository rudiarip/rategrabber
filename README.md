# 🌟 RateGrabber - Smart Google Review NFC & QR System

Sistem kartu & standee akrilik Google Review pintar dengan fitur **Auto-Aktivasi Dinamis**. Kartu dapat dicetak massal terlebih dahulu (dengan QR & chip NFC) tanpa perlu tahu siapa pembelinya. Pembeli mengaktifkan kartu sendiri cukup dengan sekali scan!

---

## 🚀 Fitur Utama

1. **Alur Smart Redirect (HTTP 302 Fast Redirect)**:
   - **Scan Pertama (Unactivated):** Mengarahkan pembeli langsung ke halaman aktivasi di HP.
   - **Scan Seterusnya (Activated):** Mengarahkan pengunjung cafe/toko langsung ke formulir rating bintang 5 Google Review (`https://search.google.com/local/writereview?placeid=...`) dalam hitungan milidetik.
2. **Auto-Aktivasi Google Maps**:
   - Integrasi pencarian autocomplete Google Places.
   - Pilihan lokasi otomatis mengambil Google `place_id`.
   - Dilindungi **PIN/Kata Sandi** pengaman agar kartu tidak bisa diubah oleh sembarang orang.
3. **Dashboard Admin**:
   - Generator kartu massal (Batch Generator) hingga ratusan kartu dalam 1 klik.
   - Ekspor otomatis **File ZIP** berisi:
     - Gambar QR Code resolusi tinggi (PNG) untuk percetakan standee.
     - Gambar Vector (SVG) untuk CorelDraw/Adobe Illustrator/Laser Engraving.
     - File CSV URL untuk aplikasi pemrogram NFC Writer (NFC Tools Pro, ACR122U).
   - Monitoring total kartu, kartu aktif, dan jumlah scan review.
4. **Simulator Interaktif**:
   - Uji coba perilaku tap kartu NFC dan scan QR langsung di browser.

---

## 🛠️ Tech Stack

- **Backend:** Python (FastAPI), SQLAlchemy, Segno QR Generator, Bcrypt.
- **Frontend:** React.js (Vite), Modern Vanilla CSS, Lucide Icons, Canvas Confetti.
- **Database:** SQLite (default/bisa diganti PostgreSQL).
- **External API:** Google Places API (tersedia mode demo interaktif langsung tanpa API key).

---

## 💻 Cara Menjalankan

### 1. Menjalankan Backend (FastAPI)
```bash
# Masuk ke virtualenv (jika belum aktif)
.venv\Scripts\activate

# Jalankan server FastAPI
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Akses Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Menjalankan Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Akses Web App: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Konfigurasi `.env`

File konfigurasi berada di root folder `.env`:
```env
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite:///./rate_grabber.db
GOOGLE_PLACES_API_KEY=
```
> **Catatan:** Jika `GOOGLE_PLACES_API_KEY` dikosongkan, sistem otomatis menggunakan **Demo Mode** interaktif (termasuk pencarian custom nama toko) sehingga Anda bisa langsung menguji seluruh alur tanpa perlu kartu kredit / Google Cloud terlebih dahulu.

---

## 🐳 Cara Deployment Menggunakan Docker (Production Ready)

Aplikasi ini sudah dilengkapi dengan konfigurasi **Docker & Docker Compose** multi-stage yang siap di-deploy ke VPS (DigitalOcean, AWS, GCP, Ubuntu/Debian, dll).

### 1. Salin Environment File
```bash
cp .env.docker.example .env
```
Sesuaikan `PUBLIC_BASE_URL` dengan domain atau IP publik server Anda (misal: `https://review.domainanda.com`).

### 2. Jalankan dengan Satu Perintah
```bash
docker compose up -d --build
```

### 3. Cek Status Container
```bash
docker compose ps
docker compose logs -f
```

### 4. Menghentikan Layanan
```bash
docker compose down
```

> **Keunggulan Setup Docker Ini:**
> - **Single-Domain Reverse Proxy (Nginx):** Frontend React dan Backend FastAPI berjalan di bawah port yang sama (Port 80/443), bebas masalah CORS!
> - **Persistent Data Volume:** Database kartu tersimpan aman di volume `rategrabber_db_data`, tidak akan hilang meskipun container diperbarui/direstart.
> - **Otomatis Health Check:** Nginx hanya akan melayani request setelah backend FastAPI berstatus *healthy*.

