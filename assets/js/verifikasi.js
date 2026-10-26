/* ============================================================================
   verifikasi.js — Pemeriksaan keaslian kuitansi donasi
   ----------------------------------------------------------------------------
   Halaman ini adalah tujuan kode QR pada kuitansi. Sengaja menampilkan
   sesedikit mungkin: cukup untuk membuktikan donasi itu benar tercatat, tanpa
   membuka identitas kontak donatur kepada siapa pun yang memindai QR.
   ============================================================================ */

(function () {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };
  var kode = (UI.paramUrl('kode') || UI.paramUrl('k')).trim().toUpperCase();
  var cfg = {};

  UI.mulaiHalaman('').then(function (c) {
    cfg = c;
    if (!kode) { formulir(); return; }
    return periksa(kode);
  }).catch(function (err) {
    UI.tampilkanGalat($('verifikasi-isi'), err.message, function () { location.reload(); });
  });

  function periksa(k) {
    $('verifikasi-isi').innerHTML =
      '<div class="kaca verifikasi-kotak"><div class="rangka rangka-baris" style="width:60%;margin:0 auto 12px"></div>' +
      '<div class="rangka rangka-baris" style="width:80%;margin:0 auto"></div></div>';

    return API.get('verifikasi', { kode: k }).then(function (res) {
      sah(res.data);
    }).catch(function (err) {
      tidakSah(err.message);
    });
  }

  function sah(d) {
    $('verifikasi-isi').innerHTML =
      '<div class="kaca-tinggi verifikasi-kotak">' +
        '<div class="sukses-bulat">' + UI.ikon('perisai', 'ikon-lg') + '</div>' +
        '<span class="verifikasi-cap verifikasi-sah">' + UI.ikon('centang', 'ikon-sm') + 'Kuitansi Sah &amp; Terdaftar</span>' +
        '<h1 style="font-size:1.5rem;margin:var(--s-md) 0 .25rem">' + UI.aman(d.lembaga) + '</h1>' +
        (d.nazhir ? '<p class="kecil redup" style="margin:0">' + UI.aman(d.nazhir) + '</p>' : '') +

        '<div class="kuitansi" style="margin-top:var(--s-lg);text-align:left">' +
          '<dl style="margin:0">' +
            baris('Nomor Donasi', d.id, true) +
            baris('Nama Muhsinin', d.nama) +
            baris('Program Penyaluran', d.program) +
            baris('Tanggal', UI.waktu(d.tanggal)) +
            baris('Status', d.status) +
          '</dl>' +
          '<div style="margin-top:var(--s-md);padding-top:var(--s-md);border-top:2px solid var(--garis)">' +
            '<div class="kecil redup">Nominal donasi</div>' +
            '<div class="nominal-besar angka">' + UI.aman(d.nominal_teks || UI.rupiah(d.nominal)) + '</div>' +
            '<div class="kecil redup" style="font-style:italic">Terbilang: ' + UI.aman(d.terbilang || '') + '</div>' +
          '</div>' +
        '</div>' +

        '<p class="mini redup" style="margin-top:var(--s-md)">' +
          'Diperiksa pada ' + UI.waktu(d.diverifikasi_pada) + '. ' +
          'Halaman ini sengaja tidak menampilkan email maupun nomor telepon donatur.</p>' +

        '<div class="baris" style="justify-content:center;gap:.6rem;margin-top:var(--s-md);flex-wrap:wrap">' +
          '<a class="tombol tombol-hantu tombol-kecil" href="index.html">Kembali ke Beranda</a>' +
          '<button class="tombol tombol-lembut tombol-kecil" type="button" id="periksa-lain">Periksa Kode Lain</button>' +
        '</div>' +
      '</div>';

    $('periksa-lain').addEventListener('click', formulir);
  }

  function tidakSah(pesan) {
    $('verifikasi-isi').innerHTML =
      '<div class="kaca verifikasi-kotak">' +
        '<div class="ikon-wadah ikon-wadah-emas" style="margin:0 auto var(--s-md);width:64px;height:64px">' +
          UI.ikon('ingat', 'ikon-lg') + '</div>' +
        '<span class="verifikasi-cap verifikasi-gagal">Kuitansi Tidak Ditemukan</span>' +
        '<p class="redup" style="margin-top:var(--s-md)">' + UI.aman(pesan) + '</p>' +
        '<p class="kecil redup">Pastikan kode yang dipindai atau diketik sudah benar. Bila Anda yakin kuitansi ini asli, ' +
          'hubungi pengelola' + (cfg.no_wa_admin ? ' di ' + UI.aman(cfg.no_wa_admin) : '') + '.</p>' +
        '<button class="tombol tombol-primer" type="button" id="periksa-lain">Coba Kode Lain</button>' +
      '</div>';

    $('periksa-lain').addEventListener('click', formulir);
  }

  function formulir() {
    $('verifikasi-isi').innerHTML =
      '<div class="kaca verifikasi-kotak">' +
        '<div class="ikon-wadah" style="margin:0 auto var(--s-md);width:64px;height:64px">' +
          UI.ikon('kode', 'ikon-lg') + '</div>' +
        '<h1 style="font-size:1.5rem">Verifikasi Kuitansi Donasi</h1>' +
        '<p class="kecil redup">Masukkan kode verifikasi yang tercetak di lembar kuitansi, ' +
          'atau pindai kode QR-nya langsung.</p>' +
        '<div class="bidang" style="text-align:left">' +
          '<label for="v-kode">Kode verifikasi</label>' +
          '<input type="text" id="v-kode" class="mono" maxlength="20" autocomplete="off" ' +
            'placeholder="Contoh: A7K2MQ9XZ4" value="' + UI.aman(kode) + '">' +
        '</div>' +
        '<button class="tombol tombol-primer tombol-penuh" type="button" id="v-periksa">Periksa Sekarang</button>' +
      '</div>';

    var input = $('v-kode');
    var jalan = function () {
      var k = input.value.trim().toUpperCase();
      if (k.length < 6) { UI.toast('Kode verifikasi terlalu pendek.', 'galat'); return; }
      try { history.replaceState(null, '', 'verifikasi.html?kode=' + encodeURIComponent(k)); } catch (e) {}
      periksa(k);
    };
    $('v-periksa').addEventListener('click', jalan);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') jalan(); });
    input.focus();
  }

  function baris(label, nilai, mono) {
    return '<div class="kuitansi-baris"><dt>' + UI.aman(label) + '</dt>' +
      '<dd class="' + (mono ? 'mono' : '') + '">' + UI.aman(nilai || '-') + '</dd></div>';
  }
})();
