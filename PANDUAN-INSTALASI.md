# Panduan Instalasi — Portal Donasi Pondok Pesantren

Panduan ini ditulis untuk orang yang **belum pernah memakai Git atau Google Apps
Script**. Tidak ada langkah yang dilewati, dan setiap istilah asing dijelaskan
saat pertama kali muncul.

Waktu yang dibutuhkan: **sekitar 45 menit**, sudah termasuk membaca.

Anda tidak perlu membayar apa pun. Yang dibutuhkan hanya satu akun Google dan
satu akun GitHub.

---

## Peta perjalanan

| Tahap | Isi | Perkiraan waktu |
|---|---|---|
| **A** | Menyiapkan backend di Google Apps Script | 15 menit |
| **B** | Menerbitkan backend sebagai Web App | 5 menit |
| **C** | Mengisi alamat backend ke berkas frontend | 2 menit |
| **D** | Mengunggah frontend ke GitHub Pages | 15 menit |
| **E** | Merapikan isi situs dari panel | 10 menit |
| **F** | Menyalakan WhatsApp (opsional) | 10 menit |

Kerjakan berurutan. Tahap D tidak akan berhasil kalau Tahap B belum selesai.

---

## Istilah yang akan Anda temui

- **Apps Script** — tempat menaruh program yang dijalankan Google, gratis, satu
  paket dengan akun Google Anda.
- **Web App / URL `/exec`** — alamat internet tempat program Anda bisa dihubungi.
  Alamat ini publik, dan memang seharusnya begitu.
- **Script Properties** — brankas kecil di dalam Apps Script untuk menyimpan
  rahasia (sandi, token). Isinya tidak pernah ikut terkirim ke pengunjung situs.
- **Repository (repo)** — folder proyek di GitHub.
- **Commit** — menyimpan perubahan beserta catatan singkat.
- **Push** — mengirim hasil simpanan dari komputer ke GitHub.
- **Personal Access Token** — "sandi khusus" dari GitHub untuk dipakai di
  terminal. GitHub sudah tidak menerima sandi akun biasa.

---

# TAHAP A — Menyiapkan Backend di Google Apps Script

### A1. Buat proyek Apps Script

1. Buka **https://script.google.com** (masuk dengan akun Google pesantren, bukan
   akun pribadi — supaya kepemilikan data jelas di kemudian hari).
2. Klik **Proyek baru / New project**.
3. Klik judul "Untitled project" di kiri atas, ganti menjadi
   **Portal Donasi Pesantren**.

### A2. Salin ke-16 berkas kode

Di panel kiri ada daftar berkas, berisi satu berkas bawaan bernama `Code.gs`.

1. Klik titik tiga di sebelah `Code.gs` → **Rename** → ganti namanya menjadi
   `00_Config` (tanpa `.gs`, Apps Script menambahkannya sendiri).
2. Hapus seluruh isinya, lalu tempel isi berkas `00_Config.gs` yang saya kirim.
3. Untuk 15 berkas sisanya: klik tanda **+** di samping tulisan "Files" →
   **Script** → beri nama sesuai berkasnya, lalu tempel isinya.

Urutannya penting. Beri nama persis seperti ini:

```
00_Config      04_Auth        08_Superadmin   12_Trigger
01_Setup       05_Publik      09_Notif        13_QR
02_Migrasi     06_Donasi      10_DocEngine    14_CRM
03_Router      07_Admin       11_Util         15_Blast
```

> **Kenapa diberi nomor?** Apps Script memuat berkas sesuai urutan abjad nama.
> Beberapa bagian kode dipakai saat pemuatan, bukan saat dipanggil — kalau
> urutannya kacau, aplikasi gagal di permintaan pertama. Nomor di depan nama
> menjaga urutan itu tetap benar.

4. Tekan **Ctrl+S** (atau ikon disket) untuk menyimpan.

### A3. Izinkan akses yang dibutuhkan

1. Klik ikon **gerigi (Project Settings)** di sidebar kiri.
2. Centang **"Show appsscript.json manifest file in editor"**.
3. Kembali ke **Editor**, buka berkas `appsscript.json` yang kini muncul.
4. Ganti seluruh isinya dengan:

```json
{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/userinfo.email"
  ],
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

5. Simpan (**Ctrl+S**).

> Daftar `oauthScopes` itu adalah izin yang Anda berikan ke program Anda sendiri:
> membaca-menulis spreadsheet, menyimpan berkas di Drive, menyusun PDF kuitansi,
> mengirim email, menghubungi Fonnte untuk WhatsApp, dan memasang pemicu
> terjadwal. Tidak ada izin yang bisa dipakai pihak lain.

### A4. Jalankan penyiapan

1. Di bagian atas editor, pada kotak dropdown fungsi, pilih
   **`setupAppEnvironment`**.
2. Klik **Run / Jalankan**.
3. Google akan meminta izin: **Review permissions** → pilih akun Anda →
   muncul layar "Google hasn't verified this app".

   Ini normal. Aplikasi ini milik Anda sendiri dan tidak didaftarkan ke Google.
   Klik **Advanced** → **Go to Portal Donasi Pesantren (unsafe)** → **Allow**.

4. Tunggu sampai muncul tulisan "Execution completed", lalu buka panel
   **Execution log** di bawah.

Yang akan Anda lihat di log:

```
✅ Sheet siap. Baru dibuat: AppConfig, Pengaturan, Pengguna, ...
✅ Data dummy: Pengaturan, Section, Program, Berita, ...
👤 AKUN ADMIN CONTOH — catat sekarang, hanya tampil sekali:
   Nama pengguna : admin
   Kata sandi    : xxxxxxxxxxxx
✅ CRM: n kontak terkumpul dari data yang ada.
═══════════════════════════════════════
✅ PENYIAPAN SELESAI
   Spreadsheet : https://docs.google.com/...
   Folder Drive: https://drive.google.com/...
```

> ⚠️ **Catat kata sandi admin itu sekarang.** Sandi tersebut dibangkitkan acak
> dan hanya ditampilkan satu kali. Kalau terlewat, lihat bagian "Kalau sandi
> admin hilang" di bawah.

Penyiapan ini **aman diulang**. Menjalankannya dua kali tidak menggandakan data
dan tidak mengganti sandi yang sudah ada.

### A5. Isi alamat email pengelola

1. Klik **gerigi (Project Settings)** → gulir ke **Script Properties** →
   **Add script property**.
2. Isi:
   - Property: `ADMIN_NOTIF_EMAIL`
   - Value: alamat email yang akan menerima pemberitahuan donasi masuk
3. **Save script properties**.

### A6. Pasang pemicu terjadwal

1. Kembali ke **Editor**, pilih fungsi **`pasangTrigger`**, klik **Run**.
2. Log akan menampilkan `✅ Pemicu terpasang`.

Dua pemicu akan hidup:

- **tiap 5 menit** — mengirim antrean email/WhatsApp dan satu batch blast
- **tiap pukul 02.00** — merapikan data, menghitung ulang progres program,
  membuat cadangan mingguan tiap Ahad

> Tanpa pemicu ini, notifikasi hanya terkirim saat ada orang membuka situs.
> Jangan dilewati.

### A7. Periksa kesiapan

Pilih fungsi **`cekKesiapan`** → **Run** → buka log.

Kalau muncul `✅ Semua siap`, lanjut ke Tahap B. Kalau masih ada daftar
nomor, kerjakan satu per satu — kalimatnya sudah menyebutkan apa yang kurang.
Peringatan soal `url_situs` boleh diabaikan dulu; itu akan terisi di Tahap E.

---

# TAHAP B — Menerbitkan Backend sebagai Web App

1. Klik tombol biru **Deploy** di kanan atas → **New deployment**.
2. Klik ikon gerigi di sebelah "Select type" → pilih **Web app**.
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Description | `Versi 1` |
   | Execute as | **Me (email Anda)** |
   | Who has access | **Anyone** |

4. Klik **Deploy** → izinkan bila diminta lagi.
5. Salin **Web app URL** yang muncul. Bentuknya:

   ```
   https://script.google.com/macros/s/AKfycbx..................../exec
   ```

6. Simpan alamat itu di Notepad. Anda membutuhkannya di Tahap C.

> **"Who has access: Anyone" apakah berbahaya?** Tidak. Yang terbuka hanya pintu
> masuknya. Di balik pintu, backend memeriksa token sesi dan peran untuk setiap
> permintaan panel; halaman publik memang seharusnya bisa dibuka siapa saja.
> Menyembunyikan alamat bukan pengamanan — token dan pemeriksaan peran itulah
> pengamanannya.

> **Setiap kali Anda mengubah kode backend**, buka **Deploy → Manage deployments
> → ikon pensil → Version: New version → Deploy**. Jangan membuat *New
> deployment* baru, karena itu menghasilkan URL berbeda dan situs Anda akan
> menunjuk alamat lama.

---

# TAHAP C — Mengisi Alamat Backend ke Frontend

1. Ekstrak berkas ZIP `portal-donasi-pesantren.zip` ke tempat yang mudah
   ditemukan, misalnya `Documents`.
2. Buka berkas **`assets/js/config.js`** dengan Notepad (Windows) atau
   TextEdit (Mac).
3. Cari baris:

   ```js
   GAS_URL: 'GANTI_DENGAN_URL_EXEC_ANDA',
   ```

4. Ganti menjadi alamat yang Anda salin tadi — **tanda kutipnya jangan dihapus**:

   ```js
   GAS_URL: 'https://script.google.com/macros/s/AKfycbx..../exec',
   ```

5. Simpan.

> Ini satu-satunya berkas yang perlu Anda sunting. Kalau langkah ini terlewat,
> situs akan tampil dengan pesan "Konfigurasi belum lengkap" setelah online.

---

# TAHAP D — Mengunggah Frontend ke GitHub Pages

## D1. Pasang Git

**Windows** — unduh di https://git-scm.com/download/win, pasang dengan pengaturan
bawaan (klik Next terus). Setelah selesai, buka **PowerShell** dari Start Menu.

**Mac** — buka Terminal, ketik `git --version`. Kalau belum terpasang, macOS
menawarkan pemasangan sendiri.

**Linux** — `sudo apt install git`.

Periksa:

```bash
git --version
```

Kalau muncul nomor versi, Git siap.

## D2. Buat akun GitHub

Daftar di **https://github.com**. Username yang Anda pilih akan menjadi bagian
alamat situs nanti: `https://username.github.io/nama-repo/`. Pilih yang pantas
dipakai di hadapan donatur.

## D3. Perkenalkan diri ke Git (sekali seumur komputer)

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@akun-github-anda.com"
```

`user.name` bebas — ia hanya label di catatan perubahan, bukan username GitHub.

## D4. Buat repository

Di github.com: tombol **+** kanan atas → **New repository**.

| Kolom | Nilai |
|---|---|
| Repository name | `portal-donasi-pesantren` |
| Visibility | **Public** |
| Add a README file | **jangan dicentang** |
| .gitignore / license | **jangan dipilih** |

Klik **Create repository**. Biarkan halaman berikutnya terbuka.

> **Harus Public?** Ya — GitHub Pages gratis hanya untuk repositori publik.
> Aman: di folder ini tidak ada satu pun kata sandi atau token. Semua rahasia
> tersimpan di Script Properties, di sisi Google.

## D5. Masuk ke folder yang benar — langkah paling menentukan

> ⚠️ **Baca bagian ini pelan-pelan.** Kesalahan paling mahal dalam seluruh
> panduan bukan salah ketik perintah, melainkan menjalankan `git init` di folder
> yang salah. Git akan menerimanya tanpa satu pun pesan error, dan baru satu jam
> kemudian Anda tahu situsnya 404.

Folder kerja Anda adalah folder yang **langsung berisi `index.html`**, yaitu
`portal-donasi-pesantren` hasil ekstraksi ZIP.

**Cara cepat di Windows:** buka folder itu di File Explorer, klik kolom alamat di
atas, ketik `powershell`, tekan Enter. PowerShell terbuka tepat di folder itu.

Atau ketik manual:

```bash
cd "C:\Users\NamaAnda\Documents\portal-donasi-pesantren"
```

Sekarang periksa isinya:

```powershell
dir
```

(Di Mac/Linux/Git Bash: `ls -la`)

Yang **wajib** terlihat:

```
.nojekyll
404.html
artikel.html
assets          ← folder
berita.html
donasi.html
index.html      ← ini yang paling penting
panel           ← folder
program.html
README.md
terima-kasih.html
verifikasi.html
```

- Kalau Anda melihat `index.html` → **benar, lanjutkan.**
- Kalau yang terlihat justru folder bernama `portal-donasi-pesantren` →
  Anda satu tingkat terlalu tinggi. Ketik `cd portal-donasi-pesantren` lalu
  `dir` lagi.
- Kalau `assets` dan `panel` tidak terlihat sebagai folder, ekstraksi ZIP-nya
  belum sempurna — ekstrak ulang.

## D6. Unggah

Jalankan satu per satu, perhatikan hasil tiap perintah.

**1) Siapkan Git di folder ini:**

```bash
git init
```

Hasil normal: `Initialized empty Git repository in ...`

**2) Tandai semua berkas untuk diunggah:**

```bash
git add .
```

> Ada **titik** di akhirnya. Titik itu berarti "semua berkas di folder ini".
> Tanpa titik, tidak ada yang tertandai. Perintah ini tidak menampilkan apa pun
> kalau berhasil — diam berarti berhasil.

**3) Simpan dengan catatan:**

```bash
git commit -m "Pemasangan pertama"
```

Hasil normal: daftar panjang berisi `create mode 100644 index.html` dan
seterusnya.

**4) Beri nama cabang utama:**

```bash
git branch -M main
```

**5) Sambungkan ke GitHub** (ganti `USERNAME` dengan milik Anda):

```bash
git remote add origin https://github.com/USERNAME/portal-donasi-pesantren.git
```

**6) Kirim:**

```bash
git push -u origin main
```

Anda akan diminta:

- **Username:** ketik username GitHub Anda
- **Password:** tempel **Personal Access Token**, bukan sandi akun

> 💡 **Saat menempel token, layar tidak menampilkan apa pun** — tidak ada titik,
> tidak ada bintang. Itu normal, bukan tanda gagal. Di PowerShell tempel dengan
> klik kanan; di Git Bash dengan Shift+Insert. Lalu tekan Enter.

Kalau muncul `Password authentication is not supported`, lanjut ke D7.

Tanda berhasil: `Writing objects: 100%` dan `* [new branch] main -> main`.

## D7. Membuat Personal Access Token

1. Buka **https://github.com/settings/tokens**
2. **Generate new token** → **Generate new token (classic)**
3. Isi:
   - Note: `portal-donasi`
   - Expiration: `90 days` (atau `No expiration` bila tak mau repot)
   - Centang: ✅ **repo**
4. **Generate token**
5. Salin token yang muncul (diawali `ghp_`) — **hanya tampil satu kali**,
   simpan dulu di Notepad
6. Ulangi `git push -u origin main`, tempel token sebagai password

Kalau terminal terasa terlalu menyulitkan, ada jalan lain:
unduh **GitHub Desktop** (https://desktop.github.com), login lewat browser, lalu
**Add Local Repository** → pilih folder → **Publish repository**.

## D8. Nyalakan GitHub Pages

1. Buka repositori Anda di browser. Pastikan `index.html` terlihat di daftar
   paling atas, dan ada folder `assets/` dan `panel/`.
2. Klik tab **Settings** → menu **Pages** di sisi kiri.
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Source | **Deploy from a branch** |
   | Branch | **main** — folder **/ (root)** |
   | Enforce HTTPS | ✅ dicentang |

4. **Save**, tunggu 1–2 menit, muat ulang halaman.

Akan muncul: *"Your site is live at https://username.github.io/portal-donasi-pesantren/"*

Buka alamat itu. Beranda pesantren seharusnya tampil lengkap dengan warna, foto
penampung, dan tiga program donasi contoh.

---

# TAHAP E — Merapikan Isi Situs dari Panel

Sekarang semuanya sudah hidup, tinggal menggantinya dengan data pesantren Anda
yang sebenarnya.

### E1. Masuk panel

Buka `https://username.github.io/portal-donasi-pesantren/panel/` — atau klik
**Masuk Panel** di bagian bawah beranda.

Gunakan nama pengguna `admin` dan kata sandi dari Tahap A4.

### E2. Isi alamat situs (penting untuk kuitansi)

**Identitas & Pengaturan** → cari **Url Situs** → isi dengan alamat GitHub Pages
Anda, lengkap sampai garis miring terakhir:

```
https://username.github.io/portal-donasi-pesantren/
```

→ **Simpan semua pengaturan**.

> Tanpa ini, QR pada kuitansi tidak punya tujuan dan donatur tidak bisa
> memeriksa keaslian tanda terimanya.

### E3. Ganti identitas pesantren

Masih di halaman yang sama, ganti satu per satu:

- **Identitas Lembaga** — nama pesantren, nama singkat, tagline, deskripsi
- **Kontak & Alamat** — alamat, kota, email resmi, nomor WhatsApp admin, peta
- **Rekening & QRIS** — nama bank, nomor rekening, atas nama, NMID QRIS
- **Aturan Donasi** — nominal minimal dan pilihan nominal cepat
- Legalitas Kemenkumham dan Badan Wakaf Indonesia

Gunakan tombol **Unggah Logo**, **Unggah Favicon**, dan **Unggah Gambar QRIS**
di bagian bawah halaman — alamat gambarnya tersimpan sendiri.

### E4. Ganti akun admin contoh

**Akun Panel** → **+ Akun baru** → buat akun Superadmin atas nama Anda dengan
sandi yang Anda pilih. Keluar, masuk lagi dengan akun baru itu, lalu hapus akun
`admin` contoh.

### E5. Isi program dan berita yang sebenarnya

- **Program** — hapus tiga program contoh, buat program Anda sendiri beserta
  rincian anggaran dan dokumen legalitasnya
- **Berita** — hapus enam berita contoh, tulis kabar Anda sendiri
- **Statistik, Agenda & Audit** — sesuaikan angka santri, agenda, dan proporsi
  penyaluran dana
- **Dokumen Publik** — unggah laporan keuangan atau buletin bila ada

### E6. Periksa dari sisi pengunjung

Buka situs di jendela penyamaran (Ctrl+Shift+N), lakukan satu donasi percobaan
dengan nominal kecil, dan pastikan:

- nomor donasi muncul
- halaman QRIS menampilkan rekening yang benar
- email ucapan terima kasih masuk (tunggu sampai lima menit — ingat, antrean)
- kuitansi bisa diunduh dan QR-nya mengarah ke halaman verifikasi

Hapus donasi percobaan itu lewat spreadsheet bila mengganggu.

---

# TAHAP F — Menyalakan WhatsApp (Opsional)

Email berjalan tanpa persiapan apa pun. WhatsApp memerlukan layanan pihak ketiga
bernama **Fonnte**, yang berbayar.

1. Daftar di **https://fonnte.com**
2. Menu **Device** → **Add Device** → pindai kode QR dengan WhatsApp nomor
   pesantren (gunakan nomor khusus, jangan nomor pribadi pengurus)
3. Salin **Token** perangkat
4. Di panel: **Identitas & Pengaturan** → bagian **Kunci Rahasia** →
   `FONNTE_TOKEN` → **Isi** → tempel token
5. Masih di halaman yang sama, nyalakan saklar **Notif Wa Aktif** → **Simpan**
6. Buka **Notifikasi** → **Tes WA**, masukkan nomor Anda sendiri

Setelah itu, menu **CRM Kontak** dan **Blast WhatsApp** siap dipakai.

### Menjaga nomor WhatsApp tetap aman

- Mulai dari batch **10**, jeda **5** detik (atau rentang acak `3-8`)
- Nomor baru sebaiknya "dipanaskan" dulu: beberapa hari dipakai mengobrol biasa
  sebelum dipakai blast
- Jangan mengirim tautan yang sama ke ratusan orang dalam satu jam
- Hormati tanda "menolak dihubungi" di CRM — tombolnya sudah tersedia

---

# Kalau Terjadi Masalah

| Yang Anda lihat | Artinya | Yang harus dilakukan |
|---|---|---|
| "Konfigurasi belum lengkap" di situs | `GAS_URL` belum diisi | Ulangi Tahap C, lalu `git add . && git commit -m "isi url" && git push` |
| Halaman 404 dari GitHub Pages | `index.html` tidak ada di root repositori | Buka repo di browser. Kalau yang terlihat folder, bukan `index.html`, lihat "Salah folder" di bawah |
| Situs tampil polos tanpa warna | Folder `assets/` tidak ikut terunggah | Pastikan unggah lewat terminal, bukan "Upload files" di web GitHub |
| `fatal: not a git repository` | Belum `git init`, atau salah folder | Jalankan `dir`, pastikan `index.html` terlihat |
| `remote origin already exists` | Sudah pernah disambungkan | Lewati, langsung `git push -u origin main` |
| `Password authentication is not supported` | GitHub menolak sandi akun | Buat Personal Access Token (D7) |
| Tidak ada karakter muncul saat mengetik sandi | Perilaku normal terminal | Tetap tempel lalu Enter |
| `LF will be replaced by CRLF` | Perbedaan format baris Windows | Abaikan — ini peringatan, bukan error |
| `src refspec main does not match any` | Belum ada commit | Jalankan `git add .` lalu `git commit -m "Pemasangan pertama"` |
| `Updates were rejected` | Repo GitHub sudah berisi berkas | `git pull --rebase origin main` lalu `git push` |
| Situs masih versi lama setelah push | Cache browser | Ctrl+Shift+R, atau buka di jendela penyamaran |
| Email/WA tidak terkirim | Pemicu belum dipasang | Jalankan `pasangTrigger` di Apps Script (Tahap A6) |
| Donasi masuk tapi progres program tidak naik | Belum ada bukti bayar | Ini disengaja — angka naik setelah bukti diunggah atau konfirmasi WA ditekan |
| Nomor WA di spreadsheet kehilangan angka 0 | Format kolom berubah | Jangan ubah format kolom nomor di Sheets; aplikasi sudah menormalkannya saat dibaca |
| Blast tidak jalan | Token Fonnte kosong, perangkat terputus, atau pemicu mati | Cek **Notifikasi → status perangkat**, lalu **Status & Migrasi → pemicu** |

### Salah folder yang di-push (404 padahal semua perintah berhasil)

Gejalanya: situs 404, tidak ada satu pun pesan error, dan di halaman repositori
GitHub yang terlihat di paling atas adalah **folder**, bukan `index.html`.

Tidak perlu menghapus repositori. Cukup kirim ulang dari folder yang benar:

```bash
cd "C:\Users\NamaAnda\Documents\portal-donasi-pesantren"
dir
```

Pastikan `index.html` terlihat, lalu:

```bash
git init
git add .
git commit -m "Perbaikan: kirim dari folder yang benar"
git branch -M main
git remote add origin https://github.com/USERNAME/portal-donasi-pesantren.git
git push -u origin main --force
```

`--force` menimpa isi repositori dengan versi di komputer Anda. Aman di sini
karena isi lamanya memang struktur yang keliru — tetapi Anda berhak tahu apa
yang sedang dijalankan, bukan menyalin perintah begitu saja.

### Kalau sandi admin hilang

Ada dua jalan keluar, dan keduanya hanya bisa dilakukan dari editor Apps Script
— bukan lewat internet. Itu memang disengaja.

**Jalan 1 — akses darurat:** jalankan fungsi `resetAksesDarurat`, lalu baca
nama pengguna dan sandi baru di Execution log. Masuk dengan akun itu, lalu
perbaiki akun panel Anda dari menu **Akun Panel**.

**Jalan 2 — ganti sandi satu akun:** jalankan fungsi `buatHashSandi`, salin
hasilnya dari log, lalu tempel ke kolom `sandi_hash` akun yang bersangkutan di
sheet `Pengguna`.

---

# Memperbarui Situs di Kemudian Hari

**Kalau yang berubah isi (program, berita, pengaturan):** cukup lewat panel.
Tidak ada yang perlu di-push.

**Kalau yang berubah berkas frontend:**

```bash
cd "C:\Users\NamaAnda\Documents\portal-donasi-pesantren"
git add .
git commit -m "Keterangan singkat perubahan"
git push
```

**Kalau yang berubah kode backend:** tempel kode baru di Apps Script, simpan,
lalu **Deploy → Manage deployments → pensil → Version: New version → Deploy**.
URL `/exec` Anda tidak berubah, jadi frontend tidak perlu disentuh.

Bila ada kolom atau sheet baru pada versi berikutnya, buka panel
**Status & Migrasi** → **Jalankan migrasi**. Migrasi hanya *menambah*; tidak
pernah menghapus atau menimpa data lama.

---

# Catatan Keamanan yang Jujur

Supaya Anda tahu persis apa yang dilindungi dan apa yang tidak:

- **Rahasia tidak pernah ada di repositori GitHub.** Sandi, token Fonnte, dan
  kunci sesi hanya tersimpan di Script Properties.
- **Sandi panel disimpan sebagai hash**, bukan teks asli — dan tidak pernah
  dikirim ke browser.
- **Token sesi berumur 8 jam** dan hilang begitu tab ditutup.
- **URL `/exec` Anda bersifat publik** dan tidak mungkin disembunyikan. Itulah
  sebabnya setiap permintaan panel diperiksa token dan perannya di server.
- **Apps Script tidak bisa membaca header permintaan**, sehingga pembatasan
  berdasarkan asal domain (CORS) tidak mungkin dilakukan di sisi server.
  Pengaman sesungguhnya adalah token sesi, pemeriksaan peran, pembatasan laju,
  dan daftar aksi yang dikenal — bukan pembatasan domain.
- **Bukti transfer tidak pernah dibagikan lewat tautan Drive publik.** Berkasnya
  dikirim ke panel lewat jalur yang memerlukan login, dan setiap pembukaannya
  tercatat di Jejak Aktivitas.
- **Setiap ekspor data dan pembukaan bukti tercatat** beserta nama pelakunya.

---

Selamat memasang. Semoga menjadi wasilah kebaikan yang panjang umurnya.
