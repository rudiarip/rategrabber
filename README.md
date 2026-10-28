# ⭐ TapStar - Smart NFC & QR Review Management System

Sistem kartu & standee akrilik Google Review pintar dengan fitur **Auto-Aktivasi Dinamis**, **Autentikasi JWT**, **Role-Based Access Control (RBAC)**, dan **Database PostgreSQL**.

---

## 🚀 Fitur Utama

1. **Keamanan & Autentikasi Modern (JWT & RBAC)**:
   - Login administrator menggunakan JSON Web Token (JWT).
   - Hak akses berjenjang berbasis peran (*Role-Based Access Control*):
     - **Super Admin**: Memiliki seluruh akses tanpa batas ke semua menu dan fungsi API.
     - **Admin / Operator / Staf**: Hak akses fungsional (`View`, `Create`, `Update`, `Delete`) dapat diatur secara modular.
2. **Dynamic Sidebar Berbasis Permissions**:
   - Sidebar menu hanya memuat modul yang diizinkan untuk role yang sedang login.
   - Tombol-tombol fungsional (generate barcode, ubah kartu, hapus) dilindungi oleh komponen `<Can />` di frontend dan *dependency guard* di backend.
3. **Penyimpanan PostgreSQL**:
   - Skema tabel relasional terstruktur: `users`, `mt_user_roles`, `menus`, `permissions`, `role_permissions`, `cards`, `scan_logs`.
   - Menggunakan `CURRENT_TIMESTAMP` untuk seluruh audit pencatatan waktu.
4. **Alur Smart Redirect (HTTP 302 Fast Redirect)**:
   - **Scan Pertama (Belum Aktif):** Mengarahkan pembeli langsung ke halaman aktivasi mandiri di HP.
   - **Scan Seterusnya (Aktif):** Mengarahkan pengunjung cafe/toko langsung ke formulir rating bintang 5 Google Review (`https://search.google.com/local/writereview?placeid=...`) dalam hitungan milidetik.
5. **Batch Barcode & QR Generator**:
   - Generator kartu massal hingga ratusan kartu dalam 1 klik.
   - Ekspor otomatis **File ZIP** berisi:
     - Gambar QR Code resolusi tinggi (PNG) 300 DPI untuk cetak standee.
     - Gambar Vector (SVG) untuk CorelDraw/Adobe Illustrator/Laser Engraving.
     - File CSV URL untuk alat pemrogram NFC Writer (NFC Tools Pro, ACR122U).
6. **Simulator Interaktif**:
   - Uji coba perilaku tap kartu NFC dan scan QR langsung di browser tanpa memerlukan kartu fisik.

---

## 🛠️ Tech Stack

- **Backend:** Python (FastAPI), SQLAlchemy 2.0, PostgreSQL (psycopg2-binary), PyJWT, Bcrypt, Segno QR Generator.
- **Frontend:** React 18, Vite, Dynamic RBAC Architecture, Lucide Icons, Canvas Confetti.
- **Database:** PostgreSQL (dengan fallback otomatis ke SQLite untuk pengujian lokal).

---

## 💻 Cara Menjalankan

### 1. Persiapan Database & Konfigurasi `.env`
Buka file `.env` di root folder dan sesuaikan kredensial PostgreSQL Anda:
```env
# Ganti dengan password PostgreSQL lokal Anda:
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/tapstar_db

# Akun bawaan Super Admin:
DEFAULT_SUPERADMIN_USERNAME=superadmin
DEFAULT_SUPERADMIN_PASSWORD=Password123!
```

### 2. Menjalankan Backend (FastAPI)
```bash
# Masuk ke virtualenv
.venv\Scripts\activate

# Jalankan server FastAPI
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Akses Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

> **Catatan:** Saat server pertama kali berjalan, sistem akan otomatis melakukan inisialisasi tabel skema database dan *seed* hak akses penuh untuk akun `superadmin`.

### 3. Menjalankan Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Akses Web App: [http://localhost:5173](http://localhost:5173)

---

## 🔐 Kredensial Akun Default
- **Username:** `superadmin`
- **Password:** `Password123!`
- **Role:** `Super Admin` (Akses Penuh Tanpa Batas)
