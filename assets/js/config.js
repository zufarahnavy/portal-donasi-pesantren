/* ============================================================================
   config.js — SATU-SATUNYA berkas yang perlu Anda sunting setelah deploy.
   ----------------------------------------------------------------------------
   Ganti nilai GAS_URL di bawah dengan URL Web App Apps Script Anda,
   yaitu alamat yang berakhiran /exec dan Anda salin pada langkah
   "Deploy → New deployment → Web app".

   Contoh bentuknya:
   https://script.google.com/macros/s/AKfycb....../exec

   URL ini BUKAN rahasia. Keamanan aplikasi dijaga oleh token sesi dan
   pemeriksaan peran di server, bukan dengan menyembunyikan alamat.
   Jangan pernah menaruh token, kata sandi, atau kunci API di berkas ini.
   ============================================================================ */

window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbztn2JYosL3FQHitJZwduGvBDeHqDtdHNiXLEtoodxkS5SmNTu2qmCUeoyodWKd-jo/exec',

  // Lama data publik boleh dipakai dari simpanan browser sebelum diambil ulang
  // (detik). Perubahan dari panel tetap muncul paling lambat setelah ini.
  UMUR_CACHE: 600
};
