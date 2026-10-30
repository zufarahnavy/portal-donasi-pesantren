# Checklist Uji Terima — Portal Donasi Pondok Pesantren

Dua belas skenario untuk dijalankan **setelah pemasangan selesai**, sebelum situs
diumumkan kepada donatur. Semuanya bisa dikerjakan dari browser; tidak perlu
membaca kode.

Isi kolom paling kanan dengan ✅ atau catatan temuan. Perkiraan waktu seluruhnya
**sekitar 40 menit**.

Siapkan dulu:

- Satu nomor WhatsApp dan satu alamat email yang bisa Anda buka sendiri
- Ponsel, untuk menguji tampilan layar kecil dan memindai QR
- Jendela penyamaran (Ctrl+Shift+N), supaya Anda melihat situs sebagai pengunjung
  baru, bukan sebagai pengelola yang sudah login

---

## 1 · Beranda tampil utuh

| Langkah | Yang diharapkan |
|---|---|
| Buka alamat situs di jendela penyamaran | Halaman tampil berwarna, bukan teks polos |
| Perhatikan navbar | Nama pesantren Anda, bukan "Nurul Hikmah" |
| Gulir ke bawah | Statistik, tiga pilar, program, berita, doa, kontak, footer tampil |
| Tekan F12 → tab Console | Tidak ada baris merah |

> Teks polos tanpa warna berarti folder `assets/` tidak ikut terunggah.
> Nama yang masih "Nurul Hikmah" berarti Tahap E3 belum dikerjakan.

**Hasil:** ______

---

## 2 · Tampilan di ponsel

| Langkah | Yang diharapkan |
|---|---|
| Buka situs dari ponsel | Tidak ada bagian yang terpotong ke samping |
| Geser layar ke kiri-kanan | Halaman tidak bisa digeser horizontal |
| Ketuk tombol menu | Menu terbuka, bisa ditutup lagi |
| Ketuk tombol donasi | Formulir terbuka dan bisa diisi dengan jempol |

**Hasil:** ______

---

## 3 · Mode gelap

| Langkah | Yang diharapkan |
|---|---|
| Ketuk ikon bulan di navbar | Seluruh halaman berubah gelap |
| Baca teks di atas latar gelap | Masih terbaca jelas, tidak ada teks hitam di latar hitam |
| Muat ulang halaman | Pilihan tema tetap bertahan |

**Hasil:** ______

---

## 4 · Donasi dari awal sampai selesai

Inilah pengujian terpenting. Kerjakan sebagai donatur sungguhan.

| Langkah | Yang diharapkan |
|---|---|
| Buka satu program → **Tunaikan Donasi** | Formulir terbuka, nama program terbawa |
| Isi nominal di bawah batas minimal | Ditolak dengan pesan ramah, bukan diam saja |
| Isi nominal wajar, nama, email, nomor WA Anda | Tombol kirim aktif |
| Centang "tampilkan doa", tulis doa | Tersimpan |
| Kirim | Pindah ke layar pembayaran dalam hitungan detik |
| Periksa layar pembayaran | Nomor donasi `DNS-YYYYMMDD-NNNN`, nominal, QRIS, dan nomor rekening **Anda** |
| Unggah bukti transfer (foto apa saja) | Muncul konfirmasi berhasil |
| Tekan tombol konfirmasi WhatsApp | WhatsApp terbuka dengan pesan siap kirim |

**Hasil:** ______

---

## 5 · Donasi tercatat dengan benar

| Langkah | Yang diharapkan |
|---|---|
| Buka panel → **Daftar Donasi** | Donasi percobaan tadi ada di baris teratas |
| Perhatikan kolom kontak | Email dan nomor **tersamar** (`ah•••@email.id`) |
| Klik barisnya | Rincian terbuka, kontak kini terbaca utuh |
| Klik "Lihat bukti transfer" | Foto yang Anda unggah tampil |
| Kembali ke beranda publik | Angka terkumpul program itu **sudah bertambah** |

> Kalau angka belum bertambah, pastikan bukti sudah terunggah atau konfirmasi WA
> sudah ditekan. Donasi tanpa salah satunya memang sengaja belum dihitung.

**Hasil:** ______

---

## 5b · Memutuskan status donasi

Empat status donasi: **Masuk** (belum dicocokkan), **Dikonfirmasi WA** (donatur
sudah menekan tombol konfirmasi), **Terverifikasi** (pengurus sudah mencocokkan
dengan mutasi rekening), dan **Ditolak** (uangnya tidak pernah masuk, atau
kiriman ganda).

| Langkah | Yang diharapkan |
|---|---|
| Daftar Donasi → tekan ikon **⋮** di ujung kanan satu baris | Menu terbuka berisi rincian, ubah status, dan hapus |
| Pilih **Tandai terverifikasi** | Lencana status berubah, angka program dihitung ulang |
| Pilih **Tolak donasi** pada donasi percobaan | Diminta menulis alasan dulu — tanpa alasan, tidak bisa lanjut |
| Isi alasan, simpan | Status jadi "Ditolak" |
| Kembali ke beranda publik | Angka terkumpul **berkurang** sebanyak donasi yang ditolak |
| Buka **Statistik & Audit → Jejak Aktivitas** | Perubahan status tercatat lengkap dengan nama pengurusnya |

> Penolakan bersifat final terhadap hitungan: donasi "Ditolak" tidak pernah
> ikut menambah angka terkumpul, sekalipun buktinya terlanjur terunggah.

**Hasil:** ______

---

## 5c · Menghapus donasi dan kontak

| Langkah | Yang diharapkan |
|---|---|
| Masuk sebagai **Admin** (bukan Superadmin) → menu ⋮ | Pilihan "Hapus donasi" tidak tersedia |
| Masuk sebagai **Superadmin** → menu ⋮ → **Hapus donasi** | Diminta menulis alasan; tanpa alasan tidak bisa lanjut |
| Isi alasan, hapus | Baris hilang, angka program dihitung ulang |
| **Jejak Aktivitas** | Tercatat nama donatur, nominal, program, status terakhir, dan alasannya |
| CRM Kontak → menu ⋮ satu baris → **Hapus kontak** | Kontak hilang dari daftar |
| Jalankan **Sinkronkan** di CRM | Kontak yang dihapus **tidak muncul lagi**, walau donasinya masih ada |

> Berkas bukti dan kuitansi di Drive dipindahkan ke tempat sampah, bukan dihapus
> permanen — masih bisa dipulihkan selama 30 hari bila ternyata salah hapus.

**Hasil:** ______

---

## 6 · Notifikasi email sampai

| Langkah | Yang diharapkan |
|---|---|
| Tunggu paling lama 5 menit | Email ucapan terima kasih masuk ke kotak masuk Anda |
| Periksa isi email | Nama, nominal, nomor donasi, dan nama pesantren benar |
| Periksa email pengelola | Pemberitahuan "Donasi Masuk" diterima |
| Panel → **Notifikasi → Antrean Kirim** | Barisnya berstatus "Terkirim" |

> Kalau tetap di status "Antre" setelah 10 menit, pemicu belum terpasang.
> Jalankan `pasangTrigger` di Apps Script.

**Hasil:** ______

---

## 7 · Kuitansi PDF dan QR verifikasi

| Langkah | Yang diharapkan |
|---|---|
| Panel → rincian donasi → **Terbitkan kuitansi** | PDF terunduh dalam beberapa detik |
| Buka PDF-nya | Kop pesantren, nominal, terbilang dalam huruf, dan kode QR |
| Pindai QR dengan kamera ponsel | Browser terbuka ke halaman verifikasi situs Anda |
| Baca halaman verifikasi | Tertulis "Kuitansi Sah" dengan nominal yang cocok |
| Periksa halaman verifikasi itu | **Tidak** menampilkan email atau nomor WA donatur |

> QR yang tidak mengarah ke mana-mana berarti pengaturan **Url Situs** belum
> diisi (Tahap E2).

**Hasil:** ______

---

## 8 · Halaman berita

| Langkah | Yang diharapkan |
|---|---|
| Buka menu **Berita** | Arsip tampil dengan artikel sorotan di atas |
| Ketik kata kunci di kotak cari | Daftar menyempit sambil Anda mengetik |
| Ketik kata yang tidak ada | Muncul pesan ramah, bukan halaman kosong |
| Klik satu kategori | Hanya artikel kategori itu yang tampil |
| Buka satu artikel | Isi lengkap, panel samping, dan tombol bagikan tampil |
| Klik "Salin tautan" | Muncul pemberitahuan tautan tersalin |

**Hasil:** ______

---

## 9 · Panel: batas peran

| Langkah | Yang diharapkan |
|---|---|
| Buat satu akun uji berperan **Admin** | Tersimpan |
| Keluar, masuk dengan akun Admin itu | Menu yang tampil hanya 6, tanpa Pengaturan dan Akun Panel |
| Ketik `#/pengguna` di belakang alamat panel | Dialihkan ke dasbor, muncul pemberitahuan tidak berhak |
| Masuk lagi sebagai Superadmin | Seluruh 16 menu kembali tampil |
| Hapus akun uji tadi | Terhapus |

**Hasil:** ______

---

## 10 · CRM kontak

| Langkah | Yang diharapkan |
|---|---|
| Panel → **CRM Kontak** | Donatur percobaan Anda sudah ada di daftar |
| Perhatikan kotak KPI | Angka total, nomor terdaftar WA, dan total donasi terisi |
| Beri tag pada satu kontak | Tag muncul di bawah namanya |
| Tekan **Sinkron sekarang** | Tag tadi **tidak** hilang |
| Tandai satu kontak "menolak dihubungi" | Lencana "menolak" muncul |
| Masuk ke layar Blast, muat penerima | Kontak yang menolak **tidak** ikut terhitung |

**Hasil:** ______

---

## 11 · Blast WhatsApp

Lewati bila Anda belum berlangganan Fonnte.

| Langkah | Yang diharapkan |
|---|---|
| Panel → **Notifikasi** | Status perangkat Fonnte tertulis `connect` |
| **Tes WA** ke nomor Anda sendiri | Pesan masuk dalam satu menit |
| CRM → pilih 2–3 kontak → **Kirim blast** | Pindah ke layar blast, penerima terbawa |
| Tulis pesan memakai `{nama}` | Pratinjau menampilkan nama penerima pertama |
| Pilih batch 10, jeda `3-8` | Perkiraan waktu selesai muncul |
| Mulai blast | Kartu "sedang berjalan" muncul di atas |
| Tekan **Kirim batch berikutnya** | Angka terkirim bertambah, pesan masuk ke ponsel |
| Tutup tab, buka lagi 5 menit kemudian | Pengiriman tetap berlanjut |

**Hasil:** ______

---

## 12 · Ketahanan & jejak

| Langkah | Yang diharapkan |
|---|---|
| Buka `situs-anda/halaman-yang-tidak-ada` | Halaman 404 bergaya, bukan halaman putih GitHub |
| Buka `verifikasi.html?kode=SALAH123` | "Tidak Ditemukan" dengan penjelasan, bukan error teknis |
| Panel → **Jejak Aktivitas** | Tercatat login, pembukaan bukti, dan penerbitan kuitansi Anda tadi |
| Panel → **Status & Migrasi** | Skema "Sesuai", kedua pemicu bertanda ✓ |
| Panel → **Laporan** → unduh CSV | Berkas terbuka rapi di Excel, kolom tidak berantakan |
| Buka spreadsheet di Google Sheets | Nomor WA masih diawali angka 0 |

**Hasil:** ______

---

## Setelah semuanya hijau

Sebelum alamat situs disebarkan:

- [ ] Akun `admin` contoh sudah dihapus, diganti akun atas nama pengurus
- [ ] Tiga program contoh dan enam berita contoh sudah dihapus atau diganti
- [ ] Nomor rekening dan gambar QRIS sudah milik pesantren
- [ ] Legalitas Kemenkumham dan Badan Wakaf diisi apa adanya — kosongkan bila
      memang belum ada, jangan diisi angka karangan
- [ ] Donasi percobaan sudah dihapus dari spreadsheet
- [ ] Alamat situs dicatat di tempat yang mudah ditemukan pengurus lain
- [ ] Satu orang selain Anda sudah mencoba masuk panel dan berhasil

---

## Kalau ada yang merah

Jangan menebak. Tiga tempat ini hampir selalu menjawab:

1. **Console browser** (F12 → Console) — untuk masalah tampilan
2. **Panel → Status & Migrasi** — untuk pemicu, skema, dan kuota
3. **Apps Script → Executions** — untuk melihat permintaan yang gagal di server

Catat pesan persisnya, bukan ringkasannya. Pesan asli hampir selalu menyebut
penyebabnya dengan tepat.
