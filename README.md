# Firsta Cake — Sistem Operasional

Sistem manajemen terpadu untuk toko kue **Firsta Cake**. Terdiri dari modul **Point of Sale (POS)**, **Inventaris**, **HR / Payroll**, dan **Servis Alat**. Dibangun dengan Next.js, TypeScript, Zustand, dan Tailwind CSS.

## Fitur

### 🧾 Point of Sale (POS)
- Input transaksi dengan pilihan produk dan quantity
- Custom order
- Pilihan channel order: Offline, WhatsApp, Instagram, Grab
- Metode pembayaran: Tunai & Transfer
- Cetak struk digital dengan modal
- Buka/tutup sesi kas dengan shift dan kasir
- Rekap penjualan harian & laporan PDF
- Hapus riwayat transaksi

### 📦 Inventaris
- Kelola bahan baku
- Kelola produk jadi
- Catat pemakaian bahan baku harian
- Catat produksi
- Penerimaan bahan dari supplier
- Mutasi stok
- Laporan PDF setiap tab
- Hapus data

### 👥 HR / Payroll
- Kelola data karyawan
- Input absensi harian (Hadir, Izin, Sakit, Alpa, Libur)
- Generate payroll otomatis per periode
- Laporan PDF (karyawan, absensi, payroll)
- Hapus data karyawan, absensi, payroll

### 🔧 Servis Alat
- Kelola daftar alat produksi
- Laporan kerusakan alat
- Catat riwayat servis
- Jadwal perawatan rutin
- Laporan PDF setiap tab



## Cara Menjalankan

### 1. Clone repository

```bash
git clone https://github.com/sitarenianggitaa/firstacake-v0.git
cd firstacake-v0
```

### 2. Install

```bash
npm install
```

### 3. Jalankan Development Server

```bash
npm run dev
```
