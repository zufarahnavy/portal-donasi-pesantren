/* ============================================================================
   artikel.js — Halaman baca satu warta
   Alamat: artikel.html?slug=...
   ============================================================================ */

(function () {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };
  var cfg = {};
  var slug = UI.paramUrl('slug') || UI.paramUrl('id');

  UI.mulaiHalaman('berita').then(function (c) {
    cfg = c;
    if (!slug) {
      UI.tampilkanGalat($('artikel'), 'Artikel yang Anda tuju tidak disebutkan di alamat halaman.');
      $('sidebar').innerHTML = '';
      return;
    }
    $('sidebar').innerHTML = SIDEBAR.rangka();

    return API.swr('brt_' + slug, 'beritaDetail', { slug: slug }, function (a) {
      if (!a) return;
      gambarArtikel(a);
      SIDEBAR.gambar($('sidebar'), a.sidebar);
      pasangBagi(a);
    }, { umur: 900 });
  }).catch(function (err) {
    UI.tampilkanGalat($('artikel'), err.message, null);
    var s = $('sidebar'); if (s) s.innerHTML = '';
  });

  // ====================================================== Penggambar
  function gambarArtikel(a) {
    var judul = UI.aman(a.judul);
    D.title = a.judul + ' — ' + (cfg.nama_pesantren || 'Portal Donasi');
    var md = D.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', String(a.ringkasan || '').slice(0, 155));

    $('remah').innerHTML =
      '<a href="index.html">Beranda</a><span>›</span>' +
      '<a href="berita.html">Berita</a><span>›</span>' +
      '<span>' + UI.aman(a.kategori || 'Warta') + '</span>';

    $('artikel').innerHTML =
      '<header class="artikel-kepala">' +
        '<span class="lencana lencana-netral">' + UI.aman(a.kategori || 'Kabar') + '</span>' +
        '<h1>' + judul + '</h1>' +
        '<p class="artikel-sari">' + UI.aman(a.ringkasan || '') + '</p>' +
        '<div class="artikel-meta">' +
          '<span class="baris" style="gap:.5rem">' +
            '<span class="avatar-mini">' + UI.aman(UI.inisial(a.penulis || 'Redaksi')) + '</span>' +
            '<b>' + UI.aman(a.penulis || 'Redaksi Pesantren') + '</b></span>' +
          '<span>' + UI.ikon('kalender', 'ikon-sm') + UI.tanggal(a.tanggal, true) + '</span>' +
          '<span>' + UI.ikon('jam', 'ikon-sm') + a.menit_baca + ' menit baca</span>' +
          '<span>' + UI.ikon('dunia', 'ikon-sm') + UI.angkaID(a.dilihat) + ' kali dibaca</span>' +
        '</div>' +
      '</header>' +

      (a.gambar_url
        ? '<figure class="artikel-sampul">' + UI.gambar(a.gambar_url, a.judul) +
          '<figcaption class="mini redup">Dokumentasi ' + UI.aman(cfg.nama_pesantren || 'pesantren') + '</figcaption></figure>'
        : '') +

      '<div class="artikel-isi prosa">' + (a.isi_html || '<p class="redup">Isi artikel belum tersedia.</p>') + '</div>' +

      galeri(a.galeri || []) +
      kotakProgram(a.program) +
      bagikan(a) +
      lainnya(a.lainnya || []);
  }

  function galeri(daftar) {
    if (!daftar.length) return '';
    return '<section class="artikel-galeri">' +
      '<h3 class="label-atas">Galeri Dokumentasi</h3>' +
      '<div class="kisi kisi-3">' + daftar.map(function (g, i) {
        return '<figure class="galeri-butir">' + UI.gambar(g, 'Dokumentasi ' + (i + 1)) + '</figure>';
      }).join('') + '</div>' +
    '</section>';
  }

  function kotakProgram(p) {
    if (!p) return '';
    return '<aside class="artikel-program">' +
      '<span class="ikon-wadah">' + UI.ikon('hati', 'ikon-lg') + '</span>' +
      '<div class="lajur tumbuh" style="min-width:0">' +
        '<span class="label-atas">Warta ini bagian dari program</span>' +
        '<b style="font-family:var(--judul);font-size:1.125rem">' + UI.aman(p.judul) + '</b>' +
        '<span class="kecil redup">Lihat rincian penggunaan dana, progres terkini, dan cara ikut berdonasi.</span>' +
      '</div>' +
      '<a class="tombol tombol-emas" href="program.html?slug=' + encodeURIComponent(p.slug) + '">' +
        'Buka Program' + UI.ikon('panahKanan', 'ikon-sm') + '</a>' +
    '</aside>';
  }

  function bagikan(a) {
    return '<div class="artikel-bagikan">' +
      '<span class="kecil redup">Bagikan kebaikan ini:</span>' +
      '<button type="button" class="tombol tombol-lembut tombol-kecil" data-bagi="wa">' +
        UI.ikon('obrolan', 'ikon-sm') + 'WhatsApp</button>' +
      '<button type="button" class="tombol tombol-lembut tombol-kecil" data-bagi="umum">' +
        UI.ikon('bagikan', 'ikon-sm') + 'Bagikan</button>' +
      '<button type="button" class="tombol tombol-lembut tombol-kecil" data-bagi="salin">' +
        UI.ikon('salin', 'ikon-sm') + 'Salin tautan</button>' +
    '</div>';
  }

  function lainnya(daftar) {
    if (!daftar.length) return '';
    return '<section class="artikel-lainnya">' +
      '<div class="baris-sela" style="margin-bottom:var(--s-md)">' +
        '<h3 style="margin:0;font-family:var(--judul)">Warta Lainnya</h3>' +
        '<a class="tombol tombol-hantu tombol-kecil" href="berita.html">Semua warta' + UI.ikon('panahKanan', 'ikon-sm') + '</a>' +
      '</div>' +
      '<div class="kisi kisi-3">' + daftar.map(function (b) {
        var url = 'artikel.html?slug=' + encodeURIComponent(b.slug);
        return '<article class="kartu kartu-naik berita-kartu">' +
          '<a href="' + url + '" class="berita-gambar">' + UI.gambar(b.gambar_url, b.judul) + '</a>' +
          '<div class="kartu-isi">' +
            '<span class="mini redup">' + UI.aman(b.kategori || 'Kabar') + ' · ' + UI.tanggal(b.tanggal) + '</span>' +
            '<h4 class="potong-2" style="margin:.35rem 0 0;font-size:.9375rem">' +
              '<a href="' + url + '" style="color:inherit">' + UI.aman(b.judul) + '</a></h4>' +
          '</div>' +
        '</article>';
      }).join('') + '</div>' +
    '</section>';
  }

  // ====================================================== Bagikan
  function pasangBagi(a) {
    var wadah = $('artikel').querySelector('.artikel-bagikan');
    if (!wadah) return;
    var tautan = location.href;
    var teks = a.judul + ' — ' + (cfg.nama_pesantren || 'Portal Donasi Pesantren');

    wadah.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-bagi]');
      if (!b) return;
      var jenis = b.getAttribute('data-bagi');

      if (jenis === 'salin') { UI.salin(tautan, 'Tautan artikel disalin.'); return; }

      if (jenis === 'wa') {
        window.open('https://wa.me/?text=' + encodeURIComponent(teks + '\n' + tautan), '_blank', 'noopener');
        return;
      }

      if (navigator.share) {
        navigator.share({ title: a.judul, text: teks, url: tautan }).catch(function () {});
      } else {
        UI.salin(tautan, 'Peramban tidak mendukung berbagi langsung — tautan disalin.');
      }
    });
  }
})();
