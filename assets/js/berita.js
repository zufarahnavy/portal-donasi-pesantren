/* ============================================================================
   berita.js — Arsip warta & laporan
   Alamat: berita.html?q=&kategori=&halaman=
   ============================================================================ */

(function () {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };
  var cfg = {};

  var keadaan = {
    q: UI.paramUrl('q'),
    kategori: UI.paramUrl('kategori') || 'semua',
    urut: UI.paramUrl('urut') || 'terbaru',
    halaman: Number(UI.paramUrl('halaman')) || 1
  };
  var jedaCari = null;

  UI.mulaiHalaman('berita').then(function (c) {
    cfg = c;
    $('remah').innerHTML = '<a href="index.html">Beranda</a><span>›</span><span>Berita &amp; Laporan</span>';
    $('kepala-berita').innerHTML =
      '<span class="label-atas">Jurnal Transparansi, Dakwah &amp; Kehidupan Santri</span>' +
      '<h1 style="font-size:clamp(1.875rem,4vw,3rem)">Warta Pesantren &amp; Jejak Kebaikan</h1>' +
      '<p>Dokumentasi amanah para muhsinin, kabar harian santri, serta laporan progres pembangunan ' +
      'yang diterbitkan berkala dan terbuka untuk diperiksa.</p>';

    $('cari').value = keadaan.q;
    $('urut').value = keadaan.urut;

    pasangKendali();
    return muat();
  }).catch(function (err) {
    UI.tampilkanGalat($('daftar'), err.message, function () { location.reload(); });
  });

  // ====================================================== Pemuat
  function muat() {
    tampilkanRangka();
    var p = {
      q: keadaan.q, kategori: keadaan.kategori,
      sort: keadaan.urut, page: keadaan.halaman, limit: 6
    };
    var kunci = 'brt_' + keadaan.kategori + '_' + keadaan.urut + '_' + keadaan.halaman + '_' + (keadaan.q || '');

    return API.swr(kunci, 'beritaList', p, function (data) {
      if (!data) return;
      gambarKategori(data.kategori || []);
      gambarUnggulan(data.unggulan);
      gambarDaftar(data.item || []);
      gambarPaginasi(data);
      SIDEBAR.gambar($('sidebar'), data.sidebar);
    }, { umur: 600, segar: !!keadaan.q }).catch(function (err) {
      UI.tampilkanGalat($('daftar'), err.message);
    });
  }

  function tampilkanRangka() {
    if (!$('sidebar').children.length) $('sidebar').innerHTML = SIDEBAR.rangka();
    $('daftar').innerHTML = new Array(4).join('x').split('x').map(function () {
      return '<div class="kartu"><div class="rangka" style="aspect-ratio:16/10"></div>' +
        '<div class="kartu-isi"><div class="rangka rangka-baris" style="width:40%"></div>' +
        '<div class="rangka rangka-baris"></div><div class="rangka rangka-baris" style="width:70%"></div></div></div>';
    }).join('');
  }

  // ====================================================== Kendali
  function pasangKendali() {
    $('cari').addEventListener('input', function (e) {
      clearTimeout(jedaCari);
      var nilai = e.target.value.trim();
      jedaCari = setTimeout(function () {
        keadaan.q = nilai;
        keadaan.halaman = 1;
        perbaruiAlamat();
        muat();
      }, 350);
    });

    $('urut').addEventListener('change', function (e) {
      keadaan.urut = e.target.value;
      keadaan.halaman = 1;
      perbaruiAlamat();
      muat();
    });

    $('kategori').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-kategori]');
      if (!b) return;
      keadaan.kategori = b.getAttribute('data-kategori');
      keadaan.halaman = 1;
      perbaruiAlamat();
      muat();
    });

    $('paginasi').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-halaman]');
      if (!b || b.disabled) return;
      keadaan.halaman = Number(b.getAttribute('data-halaman'));
      perbaruiAlamat();
      muat();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function perbaruiAlamat() {
    var q = [];
    if (keadaan.q) q.push('q=' + encodeURIComponent(keadaan.q));
    if (keadaan.kategori !== 'semua') q.push('kategori=' + encodeURIComponent(keadaan.kategori));
    if (keadaan.urut !== 'terbaru') q.push('urut=' + encodeURIComponent(keadaan.urut));
    if (keadaan.halaman > 1) q.push('halaman=' + keadaan.halaman);
    try { history.replaceState(null, '', 'berita.html' + (q.length ? '?' + q.join('&') : '')); } catch (e) {}
  }

  // ====================================================== Bagian halaman
  function gambarKategori(daftar) {
    var el = $('kategori');
    var semua = ['semua'].concat(daftar);
    el.innerHTML = semua.map(function (k) {
      return '<button type="button" role="tab" data-kategori="' + UI.aman(k) + '" aria-selected="' +
        (k === keadaan.kategori) + '">' + UI.aman(k === 'semua' ? 'Semua Warta' : k) + '</button>';
    }).join('');
  }

  function gambarUnggulan(b) {
    var el = $('unggulan');
    if (!b || keadaan.halaman > 1 || keadaan.q || keadaan.kategori !== 'semua') { el.innerHTML = ''; return; }
    var url = 'artikel.html?slug=' + encodeURIComponent(b.slug);

    el.innerHTML =
      '<div class="kaca unggulan">' +
        '<a class="unggulan-gambar" href="' + url + '" aria-label="' + UI.aman(b.judul) + '">' +
          UI.gambar(b.gambar_url, b.judul) + '</a>' +
        '<div class="unggulan-isi">' +
          '<span class="lencana lencana-emas">Sorotan Utama</span>' +
          '<div class="artikel-meta">' +
            '<span>' + UI.ikon('orang', 'ikon-sm') + UI.aman(b.penulis || 'Redaksi') + '</span>' +
            '<span>' + UI.ikon('kalender', 'ikon-sm') + UI.tanggal(b.tanggal, true) + '</span>' +
            '<span>' + UI.ikon('jam', 'ikon-sm') + b.menit_baca + ' menit baca</span>' +
          '</div>' +
          '<h2><a href="' + url + '" style="color:inherit">' + UI.aman(b.judul) + '</a></h2>' +
          '<p class="redup potong-3" style="margin:0">' + UI.aman(b.ringkasan || '') + '</p>' +
          '<a class="tombol tombol-emas" href="' + url + '" style="align-self:flex-start;margin-top:.5rem">' +
            'Baca Laporan Lengkap' + UI.ikon('panahKanan', 'ikon-sm') + '</a>' +
        '</div>' +
      '</div>';
  }

  function gambarDaftar(daftar) {
    var el = $('daftar');
    if (!daftar.length) {
      el.innerHTML = '<div class="kosong" style="grid-column:1/-1">' +
        '<div class="ikon-wadah">' + UI.ikon('cari', 'ikon-lg') + '</div>' +
        '<h3 style="font-family:var(--badan);font-size:1.0625rem">Tidak ada warta yang cocok</h3>' +
        '<p>Coba kata kunci lain, atau pilih kategori “Semua Warta”.</p></div>';
      return;
    }

    el.innerHTML = daftar.map(function (b) {
      var url = 'artikel.html?slug=' + encodeURIComponent(b.slug);
      return '<article class="kartu kartu-naik berita-kartu">' +
        '<a href="' + url + '" class="berita-gambar">' + UI.gambar(b.gambar_url, b.judul) + '</a>' +
        '<div class="kartu-isi lajur tumbuh" style="justify-content:space-between">' +
          '<div>' +
            '<span class="lencana lencana-netral">' + UI.aman(b.kategori || 'Kabar') + '</span>' +
            '<h3 class="potong-2" style="margin:.5rem 0 .35rem">' +
              '<a href="' + url + '" style="color:inherit">' + UI.aman(b.judul) + '</a></h3>' +
            '<p class="kecil redup potong-3" style="margin:0">' + UI.aman(b.ringkasan || '') + '</p>' +
          '</div>' +
          '<div class="artikel-meta" style="margin-top:var(--s-md)">' +
            '<span>' + UI.ikon('kalender', 'ikon-sm') + UI.tanggal(b.tanggal) + '</span>' +
            '<span>' + UI.ikon('jam', 'ikon-sm') + b.menit_baca + ' mnt</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function gambarPaginasi(data) {
    var el = $('paginasi');
    var total = data.totalHalaman || 1;
    if (total <= 1) { el.innerHTML = ''; return; }

    var kini = data.halaman;
    var nomor = [];
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - kini) <= 1) nomor.push(i);
      else if (nomor[nomor.length - 1] !== '…') nomor.push('…');
    }

    var dari = (kini - 1) * data.perHalaman + 1;
    var sampai = Math.min(kini * data.perHalaman, data.total);

    el.innerHTML =
      '<span>Menampilkan ' + dari + '–' + sampai + ' dari ' + UI.angkaID(data.total) + ' warta</span>' +
      '<button type="button" data-halaman="' + (kini - 1) + '"' + (kini <= 1 ? ' disabled' : '') +
        ' aria-label="Halaman sebelumnya">' + UI.ikon('panahKiri', 'ikon-sm') + '</button>' +
      nomor.map(function (n) {
        if (n === '…') return '<span>…</span>';
        return '<button type="button" data-halaman="' + n + '" aria-current="' + (n === kini) + '">' + n + '</button>';
      }).join('') +
      '<button type="button" data-halaman="' + (kini + 1) + '"' + (kini >= total ? ' disabled' : '') +
        ' aria-label="Halaman berikutnya">' + UI.ikon('panahKanan', 'ikon-sm') + '</button>';
  }

})();
