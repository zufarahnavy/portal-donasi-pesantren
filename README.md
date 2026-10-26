# Portal Donasi & Informasi Pondok Pesantren

Situs donasi dan profil pesantren dengan panel pengelola. Bagian yang Anda lihat
(halaman web) berjalan di GitHub Pages; seluruh data tersimpan di Google Sheets
dan Google Drive milik Anda sendiri, dilayani oleh Google Apps Script.

Tidak ada server sewaan, tidak ada biaya bulanan, dan tidak ada pihak ketiga yang
memegang data donatur Anda.

```
Pengunjung  →  GitHub Pages (folder ini)  →  Apps Script /exec  →  Google Sheets
                                                                →  Google Drive
```

---

## Isi folder ini

| Berkas / folder | Keterangan |
|---|---|
| `index.html` | Beranda |
| `program.html` | Rincian satu program donasi |
| `donasi.html` | Formulir donasi + halaman pembayaran |
| `terima-kasih.html` | Halaman setelah donasi tercatat |
| `verifikasi.html` | Pemeriksaan keaslian kuitansi (tujuan QR) |
| `berita.html`, `artikel.html` | Arsip warta dan halaman baca |
| `404.html` | Halaman "tidak ditemukan" |
| `assets/css/` | `base.css` (sistem desain) dan `public.css` (halaman publik) |
| `assets/js/` | Logika halaman publik |
| `panel/` | Panel pengelola (Admin & Superadmin) |
| `.nojekyll` | Memberi tahu GitHub Pages agar menyajikan berkas apa adanya |

**Backend tidak ada di folder ini.** Ke-16 berkas `.gs` disalin ke editor Apps
Script, bukan ke GitHub. Itu disengaja: repositori GitHub Pages harus publik,
dan tidak ada alasan menaruh kode backend di tempat publik.

---

## Satu-satunya berkas yang perlu Anda sunting

`assets/js/config.js` — ganti `GANTI_DENGAN_URL_EXEC_ANDA` dengan alamat Web App
Apps Script Anda (yang berakhiran `/exec`).

Selebihnya — nama pesantren, alamat, rekening, program, berita, warna — semuanya
diubah dari panel pengelola, bukan dengan menyunting berkas.

---

## Cara memasang

Ikuti **PANDUAN-INSTALASI.md** yang disertakan bersama paket ini. Urutannya:

1. Siapkan backend di Google Apps Script (± 15 menit)
2. Deploy sebagai Web App, salin URL `/exec`
3. Isi `GAS_URL` di `assets/js/config.js`
4. Unggah folder ini ke GitHub, aktifkan GitHub Pages
5. Masuk panel, ganti identitas pesantren dan data rekening

---

## Hal yang sebaiknya Anda tahu sejak awal

**Nomor WhatsApp di Google Sheets.** Sheets gemar mengubah `081234567890`
menjadi angka `81234567890` — nol di depannya hilang. Aplikasi ini sudah
menanganinya di dua tempat: kolom nomor diformat sebagai teks saat penyiapan,
dan setiap pembacaan dinormalisasi ulang. Jangan mengubah format kolom itu
secara manual di spreadsheet.

**Progres donasi baru bertambah setelah ada bukti bayar.** Donasi yang baru
mengisi formulir belum menambah angka "terkumpul" di halaman publik. Angka itu
naik setelah donatur mengunggah bukti transfer atau menekan tombol konfirmasi
WhatsApp. Ini menjaga agar bar progres tidak menggembung oleh niat yang belum
terbayar.

**Notifikasi tidak dikirim saat donatur menekan "Kirim".** Pesan masuk antrean,
lalu dikirim oleh pemicu terjadwal setiap lima menit. Karena itu donatur tidak
pernah menunggu, dan kegagalan mengirim email tidak pernah membatalkan
pencatatan donasi. Jalankan `pasangTrigger()` sekali agar pemicu ini hidup.

**Blast WhatsApp berjalan di server.** Menutup tab tidak menghentikannya. Satu
batch dikirim tiap lima menit, atau lebih cepat bila Anda menekan "Kirim batch
berikutnya".

**Panel dilindungi di server, bukan dengan menyembunyikan menu.** Admin yang
mengetik alamat halaman Superadmin tetap ditolak oleh backend.

---

## Memperbarui situs setelah ada perubahan berkas

Dari dalam folder ini:

```bash
git add .
git commit -m "Perbarui tampilan"
git push
```

GitHub Pages membangun ulang dalam 1–2 menit. Kalau halaman masih versi lama,
tekan `Ctrl+Shift+R`.

---

## Lisensi & atribusi

Kode ini dibuat untuk pesantren Anda. Seluruh nama, angka, legalitas, dan foto
yang ikut sebagai data contoh adalah **fiktif** — ganti lewat panel sebelum
situs diumumkan.
