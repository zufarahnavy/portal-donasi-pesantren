/* ============================================================================
   mulai.js — Titik nyala panel
   Dimuat paling akhir, setelah seluruh modul mendaftarkan dirinya.
   ============================================================================ */

(function () {
  'use strict';

  var P = PANEL.P;

  PANEL.pasang();

  // Identitas lembaga dibaca lebih dulu supaya layar masuk tidak tampil
  // sebagai kotak kosong tanpa nama pesantren.
  API.swr('config', 'config', {}, function (cfg) {
    P.cfg = cfg || {};
    if (PANEL.el('layar-masuk').hidden === false) PANEL.tampilkanMasuk();
  }, { umur: 3600 }).catch(function () { /* panel tetap bisa dipakai tanpa identitas */ });

  var sesi = PANEL.muatSesi();
  if (!sesi) {
    PANEL.tampilkanMasuk();
    return;
  }

  // Token dari tab sebelumnya belum tentu masih sah — tanyakan ke server
  // sebelum menampilkan panel, supaya pengguna tidak melihat layar kosong.
  P.sesi = sesi;
  API.post('sesiSaya', {}, sesi.token)
    .then(function (res) {
      P.sesi = { token: sesi.token, me: res.data.me || sesi.me };
      PANEL.simpanSesi(P.sesi);
      PANEL.tampilkanPanel();
    })
    .catch(function () {
      PANEL.simpanSesi(null);
      PANEL.tampilkanMasuk();
    });
})();
