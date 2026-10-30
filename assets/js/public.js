/* ============================================================================
   public.js — Perakit halaman beranda
   ----------------------------------------------------------------------------
   Seluruh isi halaman datang dari satu panggilan `publicContent`, sehingga
   membuka beranda hanya membangunkan satu eksekusi Apps Script. Tampilan
   pertama diambil dari simpanan browser bila ada, lalu disegarkan diam-diam.
   ============================================================================ */

(function () {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };
  var kategoriAktif = 'semua';
  var dataProgram = [];
  var cfgGlobal = {};

  // ====================================================== Mulai
  UI.mulaiHalaman('beranda').then(function (cfg) {
    cfgGlobal = cfg;
    return API.swr('landing', 'publicContent', {}, gambarHalaman, { umur: 600 });
  }).catch(function (err) {
    UI.tampilkanGalat($('hero'), err.message, function () { location.reload(); });
  });

  // ====================================================== Perakit utama
  function gambarHalaman(data) {
    if (!data) return;
    var s = data.section || {};
    cfgGlobal = Object.assign({}, cfgGlobal, data.pengaturan || {});

    UI.rakitFooter(cfgGlobal, s);

    gambarBanner(data.banner || []);
    gambarHero(s.hero, data);
    gambarJudul('judul-statistik', s.statistik);
    gambarStatistik(data.statistik || []);
    gambarJudul('judul-pilar', s.pilar);
    gambarPilar(s.pilar);
    gambarJudul('judul-program', s.program);
    dataProgram = data.program || [];
    gambarTabKategori();
    gambarProgram();
    gambarJudul('judul-berita', s.berita);
    gambarBerita(data.berita || []);
    gambarJudul('judul-doa', s.testimoni);
    gambarDoa(data.testimoni || []);
    gambarKontak(s.kontak);
    gambarCta(s.cta);

    // Kartu di dalam tiap bagian diungkap bertahap setelah isinya ada.
    UI.ungkap('#pilar-daftar > *, #berita-daftar > *, #doa-daftar > *', true);
    UI.ungkap('.bagian');
  }

  function gambarJudul(id, sec) {
    var el = $(id);
    if (!el || !sec) return;
    var tengah = el.classList.contains('judul-tengah');
    el.innerHTML =
      (sec.subjudul ? '<span class="label-atas">' + UI.aman(sec.subjudul) + '</span>' : '') +
      '<h2>' + UI.aman(sec.judul || '') + '</h2>' +
      (sec.konten && sec.konten.paragraf ? '<p>' + UI.aman(sec.konten.paragraf) + '</p>' : '');
    if (tengah) el.classList.add('judul-tengah');
  }

  // ====================================================== Banner hero
  /**
   * Latar bagian atas beranda yang berganti perlahan.
   *
   * Dua hal yang disengaja:
   *   • Gambar pertama dimuat biasa, sisanya baru dimuat setelah halaman
   *     tenang — supaya banner tidak menunda tampilnya tulisan utama.
   *   • Pergantian otomatis berhenti bila sistem pengunjung meminta
   *     "kurangi gerakan"; yang tampil hanya gambar pertama.
   */
  var jamBanner = null;

  function gambarBanner(daftar) {
    var el = $('hero-banner');
    if (!el) return;

    if (jamBanner) { clearInterval(jamBanner); jamBanner = null; }

    if (!daftar.length) {
      el.innerHTML = '';
      D.querySelector('.hero').classList.remove('hero-bergambar');
      return;
    }

    D.querySelector('.hero').classList.add('hero-bergambar');

    el.innerHTML = daftar.map(function (b, i) {
      return '<div class="hero-banner-lapis' + (i === 0 ? ' tampil' : '') + '" ' +
        'style="background-image:url(\'' + UI.aman(UI.aset(b.gambar_url)) + '\')" ' +
        'role="img" aria-label="' + UI.aman(b.judul || '') + '"></div>';
    }).join('') +
    (daftar.length > 1
      ? '<div class="hero-titik" role="tablist" aria-label="Pilih gambar latar">' +
        daftar.map(function (b, i) {
          return '<button type="button" role="tab" data-ke="' + i + '" aria-selected="' + (i === 0) +
            '"><span class="sr-only">' + UI.aman(b.judul || ('Gambar ' + (i + 1))) + '</span></button>';
        }).join('') + '</div>'
      : '');

    if (daftar.length < 2) return;

    var lapis = el.querySelectorAll('.hero-banner-lapis');
    var titik = el.querySelectorAll('.hero-titik button');
    var kini = 0;

    var ke = function (i) {
      kini = (i + lapis.length) % lapis.length;
      for (var n = 0; n < lapis.length; n++) {
        lapis[n].classList.toggle('tampil', n === kini);
        titik[n].setAttribute('aria-selected', String(n === kini));
      }
    };

    el.querySelector('.hero-titik').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ke]');
      if (!b) return;
      ke(Number(b.getAttribute('data-ke')));
      if (jamBanner) { clearInterval(jamBanner); jamBanner = null; }   // pengunjung memilih sendiri
    });

    if (UI.kurangGerak()) return;
    jamBanner = setInterval(function () { ke(kini + 1); }, 6500);
  }

  // ====================================================== Hero
  function gambarHero(sec, data) {
    var el = $('hero');
    if (!el) return;
    if (!sec) { el.innerHTML = ''; return; }

    var k = sec.konten || {};
    var t1 = k.tombol_utama || { teks: 'Mulai Berdonasi', tautan: '#program' };
    var t2 = k.tombol_kedua || { teks: 'Jelajahi Profil', tautan: '#pilar' };
    var metrik = Array.isArray(k.metrik) ? k.metrik : [];
    var kg = k.kartu_gambar || {};
    var lb = k.lencana_bawah || {};

    // Lencana di atas judul dan kartu mengambang HANYA datang dari daftar
    // legalitas. Tidak ada teks cadangan di Section: bila sebuah baris
    // dihapus dari panel, ia harus benar-benar hilang dari beranda.
    var sorotBadge = UI.legalitasSorot(cfgGlobal, 'badge');
    var sorotKartu = UI.legalitasSorot(cfgGlobal, 'kartu');
    var teksBadge = sorotBadge
      ? (sorotBadge.judul + (sorotBadge.nomor ? ' — ' + sorotBadge.nomor : ''))
      : '';
    var la = sorotKartu
      ? { judul: sorotKartu.judul, sub: sorotKartu.nomor, ikon: sorotKartu.ikon }
      : {};

    el.innerHTML =
      '<div class="lajur">' +
        (teksBadge ? '<span class="hero-badge">' +
          UI.ikon(sorotBadge ? sorotBadge.ikon : 'perisai', 'ikon-sm') +
          UI.aman(teksBadge) + '</span>' : '') +
        '<h1>' + UI.aman(sec.judul || '') + '</h1>' +
        '<p class="hero-sub">' + UI.aman(k.paragraf || sec.subjudul || '') + '</p>' +
        '<div class="hero-aksi">' +
          '<a class="tombol tombol-emas" href="' + UI.aman(t1.tautan) + '">' + UI.ikon('hati') + UI.aman(t1.teks) + '</a>' +
          '<a class="tombol tombol-lembut" href="' + UI.aman(t2.tautan) + '">' + UI.aman(t2.teks) + UI.ikon('panahKanan', 'ikon-sm') + '</a>' +
        '</div>' +
        (metrik.length ? '<div class="hero-metrik">' + metrik.map(function (m) {
          return '<div><b class="angka">' + UI.aman(m.nilai) + '</b><span>' + UI.aman(m.label) + '</span></div>';
        }).join('') + '</div>' : '') +
      '</div>' +

      '<div class="hero-visual">' +
        '<div class="hero-gambar">' + UI.gambar(k.gambar_url, k.gambar_alt || '') +
          (kg.judul ? '<div class="hero-kartu-gambar">' +
            '<div class="baris">' + '<span class="ikon-wadah" style="width:38px;height:38px">' + UI.ikon('kitab', 'ikon-sm') + '</span>' +
            '<span class="lajur"><b style="font-size:.8125rem">' + UI.aman(kg.judul) + '</b>' +
            '<span class="mini redup">' + UI.aman(kg.sub || '') + '</span></span></div>' +
            (kg.label ? '<span class="lencana">' + UI.aman(kg.label) + '</span>' : '') +
          '</div>' : '') +
        '</div>' +
        (la.judul ? '<div class="hero-apung hero-apung-atas">' +
          '<span class="ikon-wadah ikon-wadah-emas" style="width:36px;height:36px">' +
            UI.ikon(la.ikon || 'bintang', 'ikon-sm') + '</span>' +
          '<span class="lajur"><b style="font-size:.8125rem">' + UI.aman(la.judul) + '</b>' +
          '<span class="mini redup">' + UI.aman(la.sub || '') + '</span></span></div>' : '') +
        (lb.judul ? '<div class="hero-apung hero-apung-bawah">' +
          '<span class="ikon-wadah" style="width:36px;height:36px">' + UI.ikon('hati', 'ikon-sm') + '</span>' +
          '<span class="lajur"><b class="angka" style="font-size:.8125rem">' + UI.aman(lb.judul) + '</b>' +
          '<span class="mini redup">' + UI.aman(lb.sub || '') + '</span></span></div>' : '') +
      '</div>';
  }

  // ====================================================== Statistik
  var IKON_STAT = {
    groups: 'orangBanyak', auto_stories: 'kitab', school: 'wisuda',
    receipt_long: 'kuitansi', domain: 'gedung', volunteer_activism: 'hati'
  };

  function gambarStatistik(daftar) {
    var el = $('statistik');
    if (!el) return;
    if (!daftar.length) { $('bagian-statistik').style.display = 'none'; return; }

    el.innerHTML = daftar.map(function (s) {
      return '<div class="neraca-butir">' +
        '<span class="neraca-ikon">' + UI.ikon(IKON_STAT[s.ikon] || 'bintang', 'ikon-sm') + '</span>' +
        '<div class="statistik-nilai" data-nilai="' + Number(s.nilai || 0) + '" data-satuan="' + UI.aman(s.satuan || '') + '">0</div>' +
        '<div class="statistik-label">' + UI.aman(s.label) + '</div>' +
      '</div>';
    }).join('');

    UI.amatiSekali(el, function () {
      Array.prototype.forEach.call(el.querySelectorAll('.statistik-nilai'), function (n) {
        var satuan = n.getAttribute('data-satuan');
        UI.hitungNaik(n, n.getAttribute('data-nilai'), function (v) {
          if (satuan === 'rupiah') return UI.rupiah(v, true);
          if (satuan === '%') return v + '%';
          return UI.angkaID(v);
        });
      });
    });
  }

  // ====================================================== Pilar
  var IKON_PILAR = { local_library: 'pustaka', volunteer_activism: 'hati', domain: 'gedung' };
  var ANGKA_PILAR = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  /**
   * Tiga pilar ditulis sebagai ruas bernomor, bukan kartu sejajar.
   *
   * Kartu menuntut keputusan: ia minta dibandingkan lalu diklik. Pilar bukan
   * barang yang dipilih — ia bagian profil lembaga yang dibaca berurutan.
   * Karena itu bentuknya mengikuti halaman buku profil: nomor Romawi, garis
   * rambut antarruas, dan ajakan berupa tautan, bukan tombol penuh.
   */
  function gambarPilar(sec) {
    var el = $('pilar-daftar');
    if (!el) return;
    var daftar = (sec && sec.konten && sec.konten.pilar) || [];
    if (!daftar.length) { el.innerHTML = ''; return; }

    el.innerHTML = daftar.map(function (p, i) {
      var emas = p.warna === 'aksen';
      return '<article class="pilar-baris' + (emas ? ' pilar-emas' : '') + '">' +
        '<div class="pilar-urut">' +
          '<span class="pilar-angka" aria-hidden="true">' + (ANGKA_PILAR[i] || (i + 1)) + '</span>' +
          '<span class="pilar-tanda">' + UI.ikon(IKON_PILAR[p.ikon] || 'kitab', 'ikon-sm') +
            (p.label ? '<span>' + UI.aman(p.label) + '</span>' : '') + '</span>' +
        '</div>' +
        '<div class="pilar-tubuh">' +
          '<h3>' + UI.aman(p.judul) + '</h3>' +
          '<p>' + UI.aman(p.isi || '') + '</p>' +
          (Array.isArray(p.poin) && p.poin.length ? '<div class="pilar-poin">' + p.poin.map(function (x) {
            return '<div>' + UI.ikon('centang', 'ikon-sm') + '<span>' + UI.aman(x) + '</span></div>';
          }).join('') + '</div>' : '') +
        '</div>' +
        '<div class="pilar-ajak">' +
          '<a class="tautan-lanjut" href="#program"><span>' +
            UI.aman(p.tombol || 'Dukung Program Ini') + '</span>' + UI.ikon('lanjut', 'ikon-sm') + '</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  // ====================================================== Program
  var LABEL_KATEGORI = { semua: 'Semua Program', wakaf: 'Wakaf', beasiswa: 'Beasiswa Santri', infaq: 'Infaq & Sedekah' };
  var tabTerpasang = false;

  function gambarTabKategori() {
    var el = $('tab-kategori');
    if (!el) return;

    var ada = ['semua'];
    dataProgram.forEach(function (p) {
      if (ada.indexOf(p.kategori) === -1) ada.push(p.kategori);
    });
    if (ada.length < 2) { el.style.display = 'none'; return; }

    el.innerHTML = ada.map(function (k) {
      return '<button type="button" role="tab" data-kategori="' + k + '" aria-selected="' +
        (k === kategoriAktif) + '">' + UI.aman(LABEL_KATEGORI[k] || k) + '</button>';
    }).join('');

    // `#tab-kategori` adalah elemen tetap milik index.html — yang diganti di
    // atas hanya isinya. Karena beranda dirender dua kali (sekali dari
    // simpanan browser, sekali dari data segar), memasang pendengar di sini
    // tanpa penjaga akan menumpuk: satu klik tab berakhir merender daftar
    // program dua kali. Pendengarnya didelegasikan, jadi cukup satu untuk
    // seluruh tombol, termasuk tombol yang baru saja ditulis ulang.
    if (tabTerpasang) return;
    tabTerpasang = true;

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-kategori]');
      if (!b) return;
      kategoriAktif = b.getAttribute('data-kategori');
      Array.prototype.forEach.call(el.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-selected', String(x === b));
      });
      gambarProgram();
    });
  }

  function gambarProgram() {
    var el = $('program-daftar');
    if (!el) return;

    var daftar = kategoriAktif === 'semua'
      ? dataProgram
      : dataProgram.filter(function (p) { return p.kategori === kategoriAktif; });

    if (!daftar.length) {
      el.innerHTML = '<div class="kosong" style="grid-column:1/-1">' +
        '<div class="ikon-wadah">' + UI.ikon('hati', 'ikon-lg') + '</div>' +
        '<p>Belum ada program pada kategori ini.</p></div>';
      return;
    }

    el.innerHTML = daftar.map(kartuProgram).join('');

    // Kartu baru masuk berurutan supaya mata mengikuti perubahan daftar,
    // bukan tiba-tiba menemukan isi yang sudah berganti.
    el.classList.remove('masuk-halus');
    void el.offsetWidth;                       // paksa ulang animasi
    el.classList.add('masuk-halus');

    el.querySelectorAll('.progres > i').forEach(function (bar) {
      requestAnimationFrame(function () { bar.style.width = bar.getAttribute('data-lebar') + '%'; });
    });
  }

  function kartuProgram(p) {
    var nominalCepat = (cfgGlobal.nominal_cepat || [50000, 100000, 500000]).slice(0, 3);
    var emas = p.kategori === 'beasiswa';
    var tautan = 'program.html?slug=' + encodeURIComponent(p.slug);

    return '<article class="kampanye">' +
      '<div class="kampanye-gambar">' + UI.gambar(p.gambar_url, p.judul) +
        '<span class="kampanye-kategori">' + UI.aman(LABEL_KATEGORI[p.kategori] || p.kategori) + '</span>' +
        (p.sisa_hari !== null && p.sisa_hari !== undefined
          ? '<span class="kampanye-sisa">' + UI.ikon('jam', 'ikon-sm') +
            (p.sisa_hari > 0 ? 'Sisa ' + p.sisa_hari + ' hari' : 'Berakhir') + '</span>' : '') +
      '</div>' +
      '<div class="kampanye-isi">' +
        '<div>' +
          '<h3 class="potong-2"><a href="' + tautan + '" style="color:inherit">' + UI.aman(p.judul) + '</a></h3>' +
          '<p class="kecil redup potong-2" style="margin:.4rem 0 0">' + UI.aman(p.ringkasan || '') + '</p>' +
        '</div>' +
        '<div class="lajur" style="gap:.4rem">' +
          '<div class="kampanye-angka angka">' +
            '<b>' + UI.rupiah(p.terkumpul) + '</b>' +
            '<span class="redup">Target: ' + UI.rupiah(p.target_dana, true) + '</span>' +
          '</div>' +
          '<div class="progres' + (emas ? ' progres-emas' : '') + '">' +
            '<i data-lebar="' + Math.min(100, p.persen) + '"></i></div>' +
          '<div class="kampanye-kaki angka">' +
            '<span>' + p.persen + '% terkumpul</span>' +
            '<span>' + UI.angkaID(p.jumlah_donatur) + ' donatur</span>' +
          '</div>' +
        '</div>' +
        '<div class="kampanye-chip">' + nominalCepat.map(function (n) {
          return '<a class="chip-nominal" style="text-align:center;text-decoration:none" href="donasi.html?program=' +
            encodeURIComponent(p.slug) + '&nominal=' + n + '">' + UI.rupiah(n, true) + '</a>';
        }).join('') + '</div>' +
        '<a class="tombol ' + (emas ? 'tombol-emas' : 'tombol-primer') + ' tombol-penuh" href="donasi.html?program=' +
          encodeURIComponent(p.slug) + '">' + UI.ikon('hati', 'ikon-sm') + 'Bantu Sekarang</a>' +
      '</div>' +
    '</article>';
  }

  // ====================================================== Berita
  function gambarBerita(daftar) {
    var el = $('berita-daftar');
    if (!el) return;
    if (!daftar.length) { $('berita').style.display = 'none'; return; }

    el.innerHTML = daftar.map(function (b) {
      var tautan = 'artikel.html?slug=' + encodeURIComponent(b.slug);
      return '<article class="kartu kartu-naik berita-kartu">' +
        '<a href="' + tautan + '" class="berita-gambar">' + UI.gambar(b.gambar_url, b.judul) + '</a>' +
        '<div class="kartu-isi lajur tumbuh" style="justify-content:space-between">' +
          '<div>' +
            '<span class="berita-meta">' + UI.aman(b.kategori || 'Kabar') + ' • ' + UI.tanggal(b.tanggal) + '</span>' +
            '<h3 class="potong-2"><a href="' + tautan + '" style="color:inherit">' + UI.aman(b.judul) + '</a></h3>' +
            '<p class="kecil redup potong-3" style="margin:0">' + UI.aman(b.ringkasan || '') + '</p>' +
          '</div>' +
          '<a class="baris kecil" href="' + tautan + '" style="font-weight:600;margin-top:var(--s-md)">' +
            '<span>Baca selengkapnya</span>' + UI.ikon('lanjut', 'ikon-sm') + '</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  // ====================================================== Untaian doa
  function gambarDoa(daftar) {
    var el = $('doa-daftar');
    if (!el) return;
    if (!daftar.length) { $('doa').style.display = 'none'; return; }

    el.innerHTML = daftar.slice(0, 6).map(function (t, i) {
      return '<div class="kartu doa-kartu">' +
        '<div class="lajur" style="gap:var(--s-md)">' +
          '<div class="baris-sela">' +
            '<div class="doa-orang">' +
              '<span class="doa-inisial">' + UI.aman(UI.inisial(t.nama)) + '</span>' +
              '<span class="lajur"><b style="font-size:.875rem">' + UI.aman(t.nama) + '</b>' +
              '<span class="mini redup">' + UI.aman(t.kota || t.peran || 'Donatur') + '</span></span>' +
            '</div>' +
            (t.nominal_tampil ? '<span class="lencana' + (i % 2 ? ' lencana-emas' : '') + ' angka">' +
              UI.rupiah(t.nominal_tampil, true) + '</span>' : '') +
          '</div>' +
          '<p class="doa-isi" style="margin:0">“' + UI.aman(t.isi) + '”</p>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ====================================================== Kontak
  function gambarKontak(sec) {
    var el = $('kontak-isi');
    if (!el) return;
    var c = cfgGlobal;
    var k = (sec && sec.konten) || {};
    var waIntl = String(c.no_wa_admin || '').replace(/\D/g, '').replace(/^0/, '62');

    var baris = function (ik, judul, isi, emas) {
      if (!isi) return '';
      return '<div class="kontak-baris">' +
        '<span class="ikon-wadah' + (emas ? ' ikon-wadah-emas' : '') + '" style="width:40px;height:40px">' +
          UI.ikon(ik, 'ikon-sm') + '</span>' +
        '<span class="lajur"><b style="font-size:.9375rem">' + UI.aman(judul) + '</b>' +
        '<span class="kecil redup">' + UI.aman(isi) + '</span></span></div>';
    };

    el.innerHTML =
      '<div class="lajur" style="gap:var(--s-lg)">' +
        '<div>' +
          (sec && sec.subjudul ? '<span class="label-atas">' + UI.aman(sec.subjudul) + '</span>' : '') +
          '<h2>' + UI.aman((sec && sec.judul) || 'Hubungi Kami') + '</h2>' +
          '<p class="redup">' + UI.aman(k.paragraf || '') + '</p>' +
        '</div>' +
        baris('peta', c.nama_pesantren || 'Alamat Sekretariat', c.alamat) +
        baris('obrolan', 'Layanan Donatur via WhatsApp', c.no_wa_admin, true) +
        baris('jam', 'Jam Layanan Tamu', c.jam_layanan) +
        baris('surat', 'Surat Elektronik', c.email_resmi) +
        '<div class="baris" style="flex-wrap:wrap;gap:var(--s-md)">' +
          (waIntl ? '<a class="tombol tombol-primer" href="https://wa.me/' + waIntl + '" target="_blank" rel="noopener">' +
            UI.ikon('obrolan') + 'Hubungi WhatsApp</a>' : '') +
          (c.bank_rekening ? '<button class="tombol tombol-lembut" type="button" id="salin-rek">' +
            UI.ikon('salin') + 'Salin No. Rekening</button>' : '') +
        '</div>' +
      '</div>' +

      '<div class="peta-bingkai">' +
        (c.maps_embed
          ? '<iframe src="' + UI.aman(c.maps_embed) + '" loading="lazy" title="Peta lokasi" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>'
          : '<div class="peta-kosong"><div class="ikon-wadah" style="margin:0 auto var(--s-sm)">' + UI.ikon('peta', 'ikon-lg') + '</div>' +
            '<b>' + UI.aman((k.kartu_peta && k.kartu_peta.judul) || 'Lokasi Pesantren') + '</b>' +
            '<p class="kecil" style="margin:.4rem 0 1rem">' + UI.aman(c.alamat || '') + '</p>' +
            (c.maps_link ? '<a class="tombol tombol-hantu tombol-kecil" href="' + UI.aman(c.maps_link) +
              '" target="_blank" rel="noopener">Buka di Google Maps</a>' : '') + '</div>') +
      '</div>';

    var tombolSalin = $('salin-rek');
    if (tombolSalin) {
      tombolSalin.addEventListener('click', function () {
        UI.salin(c.bank_rekening, 'Nomor rekening ' + (c.bank_nama || '') + ' berhasil disalin.');
      });
    }
  }

  // ====================================================== Ajakan donasi rutin
  function gambarCta(sec) {
    var el = $('cta');
    if (!el) return;
    if (!sec) { el.style.display = 'none'; return; }
    var k = sec.konten || {};

    el.innerHTML =
      '<div class="wadah"><div class="cta-isi">' +
        '<div>' +
          (sec.subjudul ? '<span class="label-atas">' + UI.aman(sec.subjudul) + '</span>' : '') +
          '<h2 style="margin-bottom:.5rem">' + UI.aman(sec.judul || '') + '</h2>' +
          '<p>' + UI.aman(k.paragraf || '') + '</p>' +
        '</div>' +
        '<a class="tombol tombol-emas" href="#program" style="flex:none">' +
          UI.aman(k.tombol || 'Daftar Donatur Rutin') + UI.ikon('panahKanan', 'ikon-sm') + '</a>' +
      '</div></div>';
  }
})();
