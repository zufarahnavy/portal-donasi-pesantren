/* ============================================================================
   terima-kasih.js — Halaman tanda terima donasi
   Alamat: terima-kasih.html?id=DNS-...&kode=XXXXXXXXXX
   ============================================================================ */

(function () {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };

  var idDonasi = UI.paramUrl('id');
  var kode = UI.paramUrl('kode');
  var cfg = {};
  var data = null;

  var DOA_ARAB = 'بَارَكَ اللَّهُ لَكَ فِيمَا أَعْطَيْتَ، وَجَعَلَهُ لَكَ طَهُورًا';
  var DOA_ARTI = '“Semoga Allah memberkahimu pada apa yang engkau berikan, ' +
                 'dan menjadikannya penyuci bagimu.”';

  UI.mulaiHalaman('program').then(function (c) {
    cfg = c;
    if (!idDonasi || !kode) {
      tampilkanPencarian();
      return;
    }
    return muat();
  }).catch(function (err) {
    UI.tampilkanGalat($('terima-isi'), err.message, function () { location.reload(); });
  });

  function muat() {
    return API.get('cekDonasi', { id: idDonasi, kode: kode }).then(function (res) {
      data = res.data;
      gambar();
    }).catch(function (err) {
      UI.tampilkanGalat($('terima-isi'), err.message);
    });
  }

  // ====================================================== Tampilan utama
  function gambar() {
    var terkonfirmasi = String(data.status).indexOf('Dikonfirmasi') > -1;

    $('terima-isi').innerHTML =
      '<div style="max-width:760px;margin:0 auto">' +

        '<div class="kaca-tinggi" style="padding:var(--s-2xl) var(--s-lg);text-align:center">' +
          '<div class="sukses-bulat">' + UI.ikon('centang', 'ikon-lg') + '</div>' +
          '<span class="lencana ' + (terkonfirmasi ? 'lencana-sukses' : 'lencana-ingat') + '">' +
            UI.aman(data.status) + ' • ' + UI.aman(data.id) + '</span>' +
          '<h1 style="margin:var(--s-md) 0 .5rem">Jazakumullah Khairan Katsiran</h1>' +
          '<p class="redup" style="max-width:52ch;margin-inline:auto">' +
            'Semoga Allah melipatgandakan pahala kebaikan Anda, menjadikannya amal jariyah yang abadi, ' +
            'serta menjadi wasilah keberkahan bagi keluarga tercinta di dunia dan akhirat.</p>' +

          '<div style="margin-top:var(--s-lg);padding-top:var(--s-lg);border-top:1px solid var(--garis)">' +
            '<span class="label-atas" style="color:var(--emas)">Doa untuk Orang yang Berinfak</span>' +
            '<p class="doa-arab">' + DOA_ARAB + '</p>' +
            '<p class="kecil redup" style="font-style:italic;margin:0">' + DOA_ARTI + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="kuitansi" style="margin-top:var(--s-lg)">' +
          '<div class="kuitansi-judul">Tanda Terima Donasi Digital</div>' +
          '<dl style="margin:0">' +
            baris('Nomor Donasi', data.id, true) +
            baris('Waktu Transaksi', UI.waktu(data.waktu)) +
            baris('Nama Muhsinin', data.nama || 'Hamba Allah') +
            baris('Program Penyaluran', data.program) +
            baris('Status', data.status) +
            baris('Kode Verifikasi', kode, true) +
          '</dl>' +

          '<div style="margin-top:var(--s-md);padding-top:var(--s-md);border-top:2px solid var(--garis)">' +
            '<div class="kecil redup">Total nominal donasi</div>' +
            '<div class="nominal-besar angka">' + UI.rupiah(data.nominal) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="baris" style="flex-wrap:wrap;gap:.6rem;margin-top:var(--s-lg);justify-content:center">' +
          (cfg.kuitansi_aktif !== false
            ? '<button class="tombol tombol-emas" type="button" id="unduh-kuitansi">' +
              UI.ikon('unduh', 'ikon-sm') + 'Unduh Kuitansi PDF</button>' : '') +
          '<button class="tombol tombol-lembut" type="button" id="kirim-email">' +
            UI.ikon('surat', 'ikon-sm') + 'Kirim ke Email</button>' +
          '<button class="tombol tombol-lembut" type="button" id="bagikan">' +
            UI.ikon('bagikan', 'ikon-sm') + 'Syiar Kebaikan</button>' +
        '</div>' +

        (!terkonfirmasi ? '<div class="pesan pesan-ingat" style="margin-top:var(--s-lg)">' + UI.ikon('info', 'ikon-sm') +
          '<span><b>Donasi Anda sudah tercatat.</b> Bila sudah membayar namun belum menekan tombol konfirmasi WhatsApp, ' +
          'silakan <a href="donasi.html?id=' + encodeURIComponent(data.id) + '&kode=' + encodeURIComponent(kode) +
          '&program=' + encodeURIComponent(cfg.slug || '') + '">lanjutkan konfirmasi di sini</a>.</span></div>' : '') +

        '<div class="kartu kartu-isi" style="margin-top:var(--s-lg)">' +
          '<b style="font-size:.9375rem">Dampak nyata donasi Anda</b>' +
          '<div style="margin-top:.6rem">' +
            dampak('Tercatat otomatis', 'Donasi Anda masuk ke pembukuan program ' + UI.aman(data.program) + ' dan ikut menaikkan progres penyaluran.') +
            dampak('Keaslian bisa diperiksa', 'Kuitansi memuat kode QR yang mengarah ke halaman verifikasi resmi.') +
            dampak('Laporan berkala', 'Perkembangan program dilaporkan terbuka di halaman berita.') +
          '</div>' +
          '<div class="baris" style="gap:.6rem;margin-top:var(--s-md);flex-wrap:wrap">' +
            '<a class="tombol tombol-hantu tombol-kecil" href="index.html#program">Jelajahi Program Lain</a>' +
            '<a class="tombol tombol-lembut tombol-kecil" href="verifikasi.html?kode=' + encodeURIComponent(kode) + '">' +
              UI.ikon('perisai', 'ikon-sm') + 'Periksa Keaslian</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    pasang();
  }

  function baris(label, nilai, mono) {
    return '<div class="kuitansi-baris"><dt>' + UI.aman(label) + '</dt>' +
      '<dd class="' + (mono ? 'mono' : '') + '">' + UI.aman(nilai || '-') + '</dd></div>';
  }

  function dampak(judul, isi) {
    return '<div class="dampak-butir">' + UI.ikon('centang', 'ikon-sm') +
      '<span><b>' + UI.aman(judul) + '.</b> ' + UI.aman(isi) + '</span></div>';
  }

  // ====================================================== Perilaku
  function pasang() {
    var unduh = $('unduh-kuitansi');
    if (unduh) {
      unduh.addEventListener('click', function () {
        unduh.disabled = true;
        unduh.innerHTML = 'Menyiapkan…';
        API.post('unduhKuitansi', { id: data.id, kode: kode }).then(function (res) {
          simpanBerkas(res.data.base64, res.data.mime, res.data.nama_file);
          UI.toast('Kuitansi berhasil diunduh.', 'sukses');
        }).catch(function (err) {
          UI.toast(err.message, 'galat', 7000);
        }).then(function () {
          unduh.disabled = false;
          unduh.innerHTML = UI.ikon('unduh', 'ikon-sm') + 'Unduh Kuitansi PDF';
        });
      });
    }

    $('kirim-email').addEventListener('click', function () {
      var email = prompt('Alamat email tujuan pengiriman kuitansi:');
      if (!email) return;
      API.post('kirimKuitansi', { id: data.id, kode: kode, email: email }).then(function (res) {
        UI.toast(res.pesan || 'Kuitansi sedang dikirim ke email Anda.', 'sukses', 6000);
      }).catch(function (err) { UI.toast(err.message, 'galat', 7000); });
    });

    $('bagikan').addEventListener('click', function () {
      var teks = 'Alhamdulillah, saya baru menunaikan donasi untuk program "' + data.program + '" di ' +
                 (cfg.nama_pesantren || 'pesantren') + '. Mari ikut serta.';
      var url = location.origin + location.pathname.replace(/terima-kasih\.html$/, 'index.html');
      if (navigator.share) {
        navigator.share({ title: cfg.nama_pesantren || 'Portal Donasi', text: teks, url: url }).catch(function () {});
      } else {
        UI.salin(teks + ' ' + url, 'Ajakan kebaikan disalin — siap Anda bagikan.');
      }
    });
  }

  function simpanBerkas(base64, mime, nama) {
    var biner = atob(base64);
    var arr = new Uint8Array(biner.length);
    for (var i = 0; i < biner.length; i++) arr[i] = biner.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([arr], { type: mime || 'application/pdf' }));
    var a = D.createElement('a');
    a.href = url;
    a.download = nama || 'kuitansi.pdf';
    D.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  // ====================================================== Tanpa nomor donasi
  function tampilkanPencarian() {
    $('terima-isi').innerHTML =
      '<div class="kaca" style="max-width:520px;margin:0 auto;padding:var(--s-xl);text-align:center">' +
        '<div class="ikon-wadah" style="margin:0 auto var(--s-md)">' + UI.ikon('cari', 'ikon-lg') + '</div>' +
        '<h1 style="font-size:1.5rem">Cek Status Donasi</h1>' +
        '<p class="kecil redup">Masukkan nomor donasi dan kode verifikasi yang Anda terima setelah mengisi formulir.</p>' +
        '<div class="bidang"><label for="c-id">Nomor donasi</label>' +
          '<input type="text" id="c-id" placeholder="DNS-20261026-0001" autocomplete="off"></div>' +
        '<div class="bidang"><label for="c-kode">Kode verifikasi</label>' +
          '<input type="text" id="c-kode" placeholder="10 karakter" autocomplete="off"></div>' +
        '<button class="tombol tombol-primer tombol-penuh" type="button" id="c-cari">Tampilkan Tanda Terima</button>' +
      '</div>';

    $('c-cari').addEventListener('click', function () {
      var a = $('c-id').value.trim();
      var b = $('c-kode').value.trim();
      if (!a || !b) { UI.toast('Nomor donasi dan kode verifikasi wajib diisi.', 'galat'); return; }
      location.href = 'terima-kasih.html?id=' + encodeURIComponent(a) + '&kode=' + encodeURIComponent(b);
    });
  }
})();
