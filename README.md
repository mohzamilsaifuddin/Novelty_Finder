# Novelty Finder 🔬

> Sistem monitoring jurnal ilmiah berbasis web untuk menemukan **research gap** dan **novelty penelitian** secara otomatis.

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL 8 + Prisma ORM |
| Auth | JWT (access token) |
| External APIs | OpenAlex, Crossref, Semantic Scholar |
| Export | ExcelJS (Excel), Puppeteer (PDF) |

---

## 🚀 Setup & Menjalankan

### Prerequisites
- Node.js 18+
- MySQL 8 (running on localhost:3306)

### 1. Clone & Setup Database

Pastikan MySQL sudah berjalan. Buat database kosong:
```sql
CREATE DATABASE novelty_finder;
```

### 2. Backend Setup
```bash
cd backend

# Copy environment file
cp .env.example .env
# Edit .env: ganti DATABASE_URL dengan kredensial MySQL Anda

# Install dependencies
npm install

# Generate Prisma client + create tables
npx prisma generate
npx prisma db push

# Seed demo data (opsional)
node src/seed.js

# Jalankan server
npm run dev
# → Server berjalan di http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Jalankan dev server
npm run dev
# → Aplikasi berjalan di http://localhost:3000
```

---

## 👤 Demo Akun

| Role | Email | Password |
|---|---|---|
| Admin | admin@noveltyfinder.com | admin123 |
| Mahasiswa | mahasiswa@noveltyfinder.com | student123 |

---

## 📁 Struktur Folder

```
Novelty Findinf/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   └── src/
│       ├── app.js                 # Express app
│       ├── index.js               # Server entry
│       ├── seed.js                # Demo data seeder
│       ├── controllers/           # Route handlers
│       │   ├── auth.controller.js
│       │   ├── project.controller.js
│       │   ├── paper.controller.js
│       │   ├── analysis.controller.js
│       │   ├── novelty.controller.js
│       │   ├── saved.controller.js
│       │   ├── export.controller.js
│       │   └── admin.controller.js
│       ├── routes/                # Express routes
│       ├── services/
│       │   ├── paperSearch.service.js  # OpenAlex + Crossref + SemanticScholar
│       │   └── novelty.service.js      # Rule-based novelty scoring
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── error.middleware.js
│       └── lib/
│           └── prisma.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.jsx         # Root layout
        │   ├── page.jsx           # Redirect to /dashboard
        │   ├── providers.jsx      # QueryClient + Auth + Project
        │   ├── globals.css        # Tailwind + design system
        │   ├── auth/
        │   │   ├── login/page.jsx
        │   │   └── register/page.jsx
        │   └── (dashboard)/
        │       ├── layout.jsx     # Protected layout + Sidebar
        │       ├── dashboard/page.jsx
        │       ├── search/page.jsx
        │       ├── monitoring/page.jsx
        │       ├── matrix/page.jsx
        │       ├── novelty/page.jsx
        │       ├── saved/page.jsx
        │       ├── export/page.jsx
        │       ├── profile/page.jsx
        │       └── admin/page.jsx
        ├── components/layout/
        │   ├── Sidebar.jsx
        │   └── Topbar.jsx
        ├── contexts/
        │   ├── AuthContext.jsx
        │   └── ProjectContext.jsx
        └── lib/
            └── api.js
```

---

## 🔌 Backend API Endpoints

### Auth
| Method | Route | Keterangan |
|---|---|---|
| POST | /api/auth/register | Daftar akun |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Info user saat ini |
| PUT | /api/auth/profile | Update profil |
| PUT | /api/auth/change-password | Ubah password |

### Projects
| Method | Route | Keterangan |
|---|---|---|
| GET/POST | /api/projects | List + buat proyek |
| GET/PUT/DELETE | /api/projects/:id | Detail + edit + hapus |
| GET | /api/projects/:id/stats | Statistik proyek |

### Papers
| Method | Route | Keterangan |
|---|---|---|
| POST | /api/papers/search | Crawl 3 API eksternal |
| GET | /api/papers?projectId= | List paper per proyek |
| DELETE | /api/papers/:id | Hapus paper |

### Analysis, Novelty, Export, Saved, Admin
Semua endpoint tersedia sesuai `backend/src/routes/`.

---

## 📊 Fitur Utama

1. **Cari Jurnal** — Crawling otomatis dari OpenAlex, Crossref, dan Semantic Scholar sekaligus, dengan deduplication berbasis judul dan DOI.

2. **Monitoring Tren** — Visualisasi distribusi tahun publikasi, sumber database, dan metode penelitian menggunakan Recharts.

3. **Matriks Literatur** — Tabel interaktif dengan sel yang dapat diedit langsung (inline edit) untuk setiap dimensi analisis paper.

4. **Analisis Novelty** — Algoritma rule-based yang menghitung skor novelty (0–100%) berdasarkan 6 dimensi: Topik, Metode, Objek, Lokasi, Variabel, dan Teknologi. Divisualisasikan dengan radar chart.

5. **Export** — Unduh matriks literatur dan laporan analisis dalam format **Excel (.xlsx)** atau **PDF**.
