/* ============================================================================
   ui.js — Komponen & perkakas antarmuka bersama
   ----------------------------------------------------------------------------
   Berisi: kumpulan ikon SVG, saklar mode terang/gelap, pemformat angka dan
   tanggal, pesan sembul, serta navbar dan footer yang dirakit dari pengaturan
   server — sehingga mengganti nama atau logo dari panel langsung berlaku di
   seluruh halaman tanpa menyentuh kode.
   ============================================================================ */

(function (global) {
  'use strict';

  var D = global.document;

  // ====================================================== Ikon
  var IKON = {
    hati: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    perisai: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    panahKanan: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    panahKiri: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    lanjut: '<path d="m9 18 6-6-6-6"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    tutup: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    matahari: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    bulan: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    orang: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    orangBanyak: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    kitab: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    wisuda: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    kuitansi: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    gedung: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/>',
    peta: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    obrolan: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    jam: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    surat: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7"/>',
    salin: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    unduh: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    unggah: '<path d="M12 13v8"/><path d="m8 17 4-4 4 4"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>',
    centang: '<path d="M21.8 10A10 10 0 1 1 17 3.34"/><path d="m9 11 3 3L22 4"/>',
    kalender: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
    diagram: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    putar: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z"/>',
    dunia: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    bintang: '<path d="M11.5 3.2a.6.6 0 0 1 1 0l2.3 4.7 5.2.8c.5.1.7.7.3 1l-3.7 3.7.9 5.1a.6.6 0 0 1-.9.6L12 16.7l-4.6 2.4a.6.6 0 0 1-.9-.6l.9-5.1-3.7-3.7a.6.6 0 0 1 .3-1l5.2-.8z"/>',
    pustaka: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    cari: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    mata: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    mataTutup: '<path d="M10.7 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a18 18 0 0 1-2.7 3.4"/>' +
               '<path d="M6.6 6.6A18 18 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 4-.8"/>' +
               '<path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    ingat: '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    bagikan: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    gembok: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    kode: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h2v2h-2z"/><path d="M19 19h2v2h-2z"/><path d="M15 19v2"/><path d="M19 15h2"/>',
    berkas: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    masjid: '<path d="M4 21V11h16v10"/><path d="M12 3s3 2.5 3 5H9c0-2.5 3-5 3-5"/><path d="M2 21h20"/><path d="M6 11V8"/><path d="M18 11V8"/>'
  };

  function ikon(nama, kelas) {
    var isi = IKON[nama] || IKON.info;
    return '<svg class="ikon ' + (kelas || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + isi + '</svg>';
  }

  // ====================================================== Perkakas teks
  function aman(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function rupiah(n, ringkas) {
    n = Number(n) || 0;
    if (ringkas) {
      if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1).replace('.', ',') + ' M';
      if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + ' jt';
      if (n >= 1e3) return 'Rp ' + Math.round(n / 1e3) + 'rb';
    }
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  }

  function angkaID(n) { return (Number(n) || 0).toLocaleString('id-ID'); }

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function tanggal(v, panjang) {
    if (!v) return '-';
    var d = new Date(String(v).length === 10 ? v + 'T00:00:00' : v);
    if (isNaN(d.getTime())) return String(v);
    var b = panjang ? BULAN[d.getMonth()] : BULAN[d.getMonth()].slice(0, 3);
    return d.getDate() + ' ' + b + ' ' + d.getFullYear();
  }

  function waktu(v) {
    if (!v) return '-';
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return tanggal(v, true) + ', ' +
      String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0') + ' WIB';
  }

  function inisial(nama) {
    var k = String(nama || '?').trim().split(/\s+/).filter(Boolean);
    if (!k.length) return '?';
    return (k[0][0] + (k.length > 1 ? k[k.length - 1][0] : '')).toUpperCase();
  }

  function paramUrl(nama) {
    try { return new URLSearchParams(global.location.search).get(nama) || ''; }
    catch (e) { return ''; }
  }

  // ====================================================== Mode terang/gelap
  function temaTersimpan() { return global.API ? API.simpanAmbil('pd_tema') : null; }

  function pasangTema(mode) {
    var akhir = mode;
    if (!akhir || akhir === 'sistem') {
      akhir = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang';
    }
    D.documentElement.setAttribute('data-tema', akhir);
    var tombol = D.getElementById('tombol-tema');
    if (tombol) {
      tombol.innerHTML = ikon(akhir === 'gelap' ? 'matahari' : 'bulan');
      tombol.setAttribute('aria-label', akhir === 'gelap' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap');
    }
    return akhir;
  }

  function mulaiTema(bawaanServer) {
    var pilihan = temaTersimpan() || bawaanServer || 'sistem';
    pasangTema(pilihan);
    if (!temaTersimpan() && global.matchMedia) {
      try {
        global.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
          if (!temaTersimpan()) pasangTema('sistem');
        });
      } catch (e) {}
    }
  }

  function gantiTema() {
    var sekarang = D.documentElement.getAttribute('data-tema');
    var baru = sekarang === 'gelap' ? 'terang' : 'gelap';
    if (global.API) API.simpanTaruh('pd_tema', baru);
    pasangTema(baru);
  }

  // ====================================================== Pesan sembul
  function toast(pesan, jenis, lama) {
    var wadah = D.getElementById('toast-wadah');
    if (!wadah) {
      wadah = D.createElement('div');
      wadah.id = 'toast-wadah';
      D.body.appendChild(wadah);
    }
    var el = D.createElement('div');
    el.className = 'toast ' + (jenis ? 'toast-' + jenis : '');
    el.setAttribute('role', jenis === 'galat' ? 'alert' : 'status');
    el.innerHTML = ikon(jenis === 'galat' ? 'ingat' : jenis === 'sukses' ? 'centang' : 'info') +
                   '<span>' + aman(pesan) + '</span>';
    wadah.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 320);
    }, lama || 4200);
  }

  function salin(teks, pesan) {
    var selesai = function () { toast(pesan || 'Berhasil disalin.', 'sukses'); };
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(teks)).then(selesai, function () { salinCadangan(teks, selesai); });
    } else { salinCadangan(teks, selesai); }
  }

  function salinCadangan(teks, selesai) {
    try {
      var ta = D.createElement('textarea');
      ta.value = String(teks);
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      D.body.appendChild(ta);
      ta.select();
      D.execCommand('copy');
      ta.remove();
      selesai();
    } catch (e) { toast('Tidak bisa menyalin otomatis. Salin manual: ' + teks, 'galat', 7000); }
  }

  // ====================================================== Angka menghitung naik
  function hitungNaik(el, nilai, format) {
    var kurangGerak = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var akhir = Number(nilai) || 0;
    if (kurangGerak || akhir === 0) { el.textContent = format(akhir); return; }

    var mulai = performance.now(), lama = 900;
    function langkah(t) {
      var p = Math.min(1, (t - mulai) / lama);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(akhir * e));
      if (p < 1) requestAnimationFrame(langkah);
    }
    requestAnimationFrame(langkah);
  }

  /**
   * Ungkap sekali saat sebuah bagian pertama kali terlihat.
   *
   * Gerakannya sengaja pendek dan hanya sekali per elemen: tujuannya memberi
   * tahu mata bahwa ada bagian baru yang masuk, bukan menghibur. Pengguna yang
   * meminta "kurangi gerakan" di sistem operasinya langsung melihat halaman
   * dalam keadaan final tanpa animasi sama sekali.
   */
  var KURANG_GERAK = false;
  try {
    KURANG_GERAK = !!(global.matchMedia &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* peramban lama — anggap gerakan boleh */ }

  var pengamatUngkap = null;

  function siapkanUngkap() {
    if (KURANG_GERAK || !global.IntersectionObserver) {
      Array.prototype.forEach.call(D.querySelectorAll('.ungkap'), function (el) {
        el.classList.add('ungkap-tampil');
      });
      return;
    }

    if (!pengamatUngkap) {
      pengamatUngkap = new IntersectionObserver(function (entri) {
        entri.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('ungkap-tampil');
          // Sebagian polyfill IntersectionObserver tidak punya unobserve.
          if (pengamatUngkap.unobserve) pengamatUngkap.unobserve(e.target);
        });
      // threshold 0, bukan 0.12: sebuah bagian yang lebih tinggi daripada
      // layar tidak akan pernah mencapai rasio 12%, dan isinya akan tetap
      // tak terlihat selamanya. Dengan 0, cukup tepinya yang masuk.
      }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    }

    Array.prototype.forEach.call(D.querySelectorAll('.ungkap:not(.ungkap-tampil)'), function (el) {
      pengamatUngkap.observe(el);
    });
  }

  /** Tandai sekumpulan elemen untuk diungkap, lalu mulai mengamatinya. */
  function ungkap(pemilih, dariIndeks) {
    var daftar = typeof pemilih === 'string'
      ? Array.prototype.slice.call(D.querySelectorAll(pemilih))
      : [].concat(pemilih || []);

    daftar.forEach(function (el, i) {
      if (!el || el.classList.contains('ungkap')) return;
      el.classList.add('ungkap');
      var tunda = ((dariIndeks ? i : 0) % 3) + 1;
      if (dariIndeks) el.classList.add('ungkap-tunda-' + tunda);
    });

    siapkanUngkap();
  }

  function amatiSekali(el, saatTampil) {
    if (!global.IntersectionObserver) { saatTampil(); return; }
    var o = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) {
        if (e.isIntersecting) { saatTampil(); o.disconnect(); }
      });
    }, { threshold: 0.25 });
    o.observe(el);
  }

  // ====================================================== Gambar
  /** Alamat gambar yang aman dipakai; kosong → kotak penampung. */
  function gambar(url, alt, kelas) {
    if (!url) return '<div class="rangka" style="width:100%;height:100%"></div>';
    return '<img src="' + aman(url) + '" alt="' + aman(alt || '') + '" loading="lazy" class="' + (kelas || '') + '"' +
           ' onerror="this.style.display=\'none\'">';
  }

  // ====================================================== Navbar & footer
  var HALAMAN = [
    { teks: 'Beranda', url: 'index.html', kunci: 'beranda' },
    { teks: 'Profil & Pilar', url: 'index.html#pilar', kunci: 'pilar' },
    { teks: 'Program Donasi', url: 'index.html#program', kunci: 'program' },
    { teks: 'Berita', url: 'berita.html', kunci: 'berita' },
    { teks: 'Kontak', url: 'index.html#kontak', kunci: 'kontak' }
  ];

  function rakitNavbar(cfg, aktif) {
    var el = D.getElementById('navbar');
    if (!el) return;

    var nama = cfg.nama_singkat || cfg.nama_pesantren || 'Portal Donasi';
    var merek = cfg.logo_url
      ? '<img src="' + aman(cfg.logo_url) + '" alt="Logo ' + aman(nama) + '">'
      : '<span class="merek-tanda">' + aman(inisial(nama)) + '</span>';

    var tautan = function (kelas) {
      return HALAMAN.map(function (h) {
        var kini = h.kunci === aktif ? ' aria-current="page"' : '';
        return '<a href="' + h.url + '"' + kini + '>' + aman(h.teks) + '</a>';
      }).join('');
    };

    el.className = 'navbar';
    el.innerHTML =
      '<div class="wadah">' +
        '<div class="navbar-isi">' +
          '<a class="merek" href="index.html">' + merek +
            '<span class="lajur">' +
              '<span class="merek-nama">' + aman(nama) + '</span>' +
              (cfg.tagline ? '<span class="merek-tagline">' + aman(cfg.tagline) + '</span>' : '') +
            '</span>' +
          '</a>' +
          '<nav class="menu" aria-label="Menu utama">' + tautan() + '</nav>' +
          '<div class="navbar-aksi">' +
            '<button class="tombol-bulat" id="tombol-tema" type="button" aria-label="Ganti mode tampilan"></button>' +
            '<a class="tombol tombol-emas tombol-kecil" href="index.html#program">' + ikon('hati', 'ikon-sm') + 'Donasi Sekarang</a>' +
            '<button class="tombol-bulat tombol-burger" id="tombol-burger" type="button" aria-label="Buka menu" aria-expanded="false">' + ikon('menu') + '</button>' +
          '</div>' +
        '</div>' +
        '<nav class="menu-hp" id="menu-hp" aria-label="Menu ponsel">' + tautan() +
          '<a class="tombol tombol-emas" href="index.html#program" style="margin-top:8px">' + ikon('hati', 'ikon-sm') + 'Donasi Sekarang</a>' +
        '</nav>' +
      '</div>';

    pasangTema(temaTersimpan() || cfg.tema_default);

    D.getElementById('tombol-tema').addEventListener('click', gantiTema);

    var burger = D.getElementById('tombol-burger');
    var menuHp = D.getElementById('menu-hp');
    burger.addEventListener('click', function () {
      var buka = menuHp.classList.toggle('buka');
      burger.setAttribute('aria-expanded', String(buka));
      burger.innerHTML = ikon(buka ? 'tutup' : 'menu');
    });

    var saatGulir = function () { el.classList.toggle('melayang', global.scrollY > 8); };
    saatGulir();
    global.addEventListener('scroll', saatGulir, { passive: true });
  }

  function rakitFooter(cfg, section) {
    var el = D.getElementById('footer');
    if (!el) return;

    var nama = cfg.nama_pesantren || 'Portal Donasi';
    var sosial = Array.isArray(cfg.sosial_json) ? cfg.sosial_json : [];
    var badge = Array.isArray(cfg.badge_json) ? cfg.badge_json : [];
    var tautanCepat = (section && section.footer && section.footer.konten && section.footer.konten.tautan) || [];

    el.className = 'footer';
    el.innerHTML =
      '<div class="wadah">' +
        '<div class="footer-kisi">' +

          '<div class="lajur" style="gap:var(--s-md)">' +
            '<div class="baris">' +
              (cfg.logo_url
                ? '<img src="' + aman(cfg.logo_url) + '" alt="" style="height:32px;filter:brightness(0) invert(1)">'
                : '<span class="merek-tanda">' + aman(inisial(nama)) + '</span>') +
              '<span style="font-family:var(--judul);font-size:1.0625rem;color:#fff">' + aman(nama) + '</span>' +
            '</div>' +
            '<p>' + aman(cfg.deskripsi_footer || '') + '</p>' +
            (sosial.length ? '<div class="footer-sosial">' + sosial.map(function (s) {
              return '<a href="' + aman(s.url || '#') + '" aria-label="' + aman(s.nama || 'Tautan') + '" rel="noopener" target="_blank">' +
                ikon(s.ikon === 'forum' ? 'obrolan' : s.ikon === 'play_circle' ? 'putar' : 'dunia', 'ikon-sm') + '</a>';
            }).join('') + '</div>' : '') +
          '</div>' +

          '<div><h3>Tautan Cepat</h3><ul>' +
            (tautanCepat.length ? tautanCepat : [
              { teks: 'Profil Pesantren', url: 'index.html#pilar' },
              { teks: 'Program Donasi', url: 'index.html#program' },
              { teks: 'Berita & Laporan', url: 'berita.html' }
            ]).map(function (t) {
              return '<li><a href="' + aman(t.url || '#') + '">' + aman(t.teks) + '</a></li>';
            }).join('') +
          '</ul></div>' +

          '<div><h3>Kontak & Layanan</h3><div class="lajur" style="gap:var(--s-sm)">' +
            (cfg.alamat ? '<div class="baris" style="align-items:flex-start">' + ikon('peta', 'ikon-sm') + '<span>' + aman(cfg.alamat) + '</span></div>' : '') +
            (cfg.no_wa_admin ? '<div class="baris">' + ikon('obrolan', 'ikon-sm') + '<span>WhatsApp: ' + aman(cfg.no_wa_admin) + '</span></div>' : '') +
            (cfg.email_resmi ? '<div class="baris">' + ikon('surat', 'ikon-sm') + '<span>' + aman(cfg.email_resmi) + '</span></div>' : '') +
            (cfg.jam_layanan ? '<div class="baris">' + ikon('jam', 'ikon-sm') + '<span>' + aman(cfg.jam_layanan) + '</span></div>' : '') +
          '</div></div>' +

          '<div><h3>Legalitas & Keamanan</h3>' +
            '<p>Terdaftar dan diawasi secara resmi oleh otoritas syariah dan perizinan nasional.</p>' +
            badge.map(function (b) {
              return '<div class="footer-legal">' + ikon(b.ikon === 'account_balance' ? 'gedung' : b.ikon === 'credit_card' ? 'kuitansi' : 'perisai', 'ikon-sm') +
                '<div><b>' + aman(b.judul) + '</b><span>' + aman(b.nilai) + '</span></div></div>';
            }).join('') +
          '</div>' +

        '</div>' +
        '<div class="footer-bawah">' +
          '<p style="margin:0">© ' + new Date().getFullYear() + ' ' + aman(nama) + '. Hak cipta dilindungi undang-undang.</p>' +
          '<a href="panel/index.html" class="baris" style="gap:6px">' + ikon('gembok', 'ikon-sm') + '<span>Masuk Panel</span></a>' +
        '</div>' +
      '</div>';
  }

  // ====================================================== Galat & pemeliharaan
  function tampilkanGalat(el, pesan, saatCoba) {
    if (!el) return;
    el.innerHTML =
      '<div class="kosong">' +
        '<div class="ikon-wadah ikon-wadah-emas">' + ikon('ingat', 'ikon-lg') + '</div>' +
        '<h3 style="font-family:var(--badan);font-size:1.0625rem">Belum bisa menampilkan data</h3>' +
        '<p style="max-width:44ch;margin-inline:auto">' + aman(pesan) + '</p>' +
        (saatCoba ? '<button class="tombol tombol-hantu" id="tombol-coba-lagi" type="button">Coba lagi</button>' : '') +
      '</div>';
    if (saatCoba) {
      var t = D.getElementById('tombol-coba-lagi');
      if (t) t.addEventListener('click', saatCoba);
    }
  }

  function periksaPemeliharaan(cfg) {
    if (!cfg || !cfg.maintenance) return false;
    D.body.innerHTML =
      '<div class="wadah" style="min-height:100vh;display:grid;place-items:center;text-align:center">' +
        '<div class="kaca" style="padding:var(--s-2xl);max-width:520px">' +
          '<div class="ikon-wadah ikon-wadah-emas" style="margin:0 auto var(--s-md)">' + ikon('jam', 'ikon-lg') + '</div>' +
          '<h1 style="font-size:1.75rem">Sedang Dalam Pemeliharaan</h1>' +
          '<p class="redup">Situs ' + aman(cfg.nama_pesantren || '') + ' sedang kami rapikan sebentar. ' +
          'Mohon kembali beberapa saat lagi.</p>' +
          (cfg.no_wa_admin ? '<a class="tombol tombol-primer" href="https://wa.me/62' +
            aman(String(cfg.no_wa_admin).replace(/\D/g, '').replace(/^0/, '')) + '">Hubungi Kami</a>' : '') +
        '</div>' +
      '</div>';
    return true;
  }

  /**
   * Dipanggil setiap halaman publik: ambil konfigurasi, rakit navbar & footer.
   * Mengembalikan konfigurasi supaya halaman bisa memakainya lebih lanjut.
   */
  function mulaiHalaman(halamanAktif) {
    if (!global.API || !API.siap) {
      D.body.insertAdjacentHTML('afterbegin',
        '<div class="pesan pesan-ingat" style="margin:16px;border-radius:12px">' + ikon('ingat') +
        '<span><b>Konfigurasi belum lengkap.</b> Buka <code>assets/js/config.js</code> lalu isi ' +
        '<code>GAS_URL</code> dengan alamat Web App Apps Script Anda (berakhiran <code>/exec</code>).</span></div>');
      return Promise.reject(new Error('GAS_URL belum diisi'));
    }

    API.panaskan('pub');

    return new Promise(function (selesai, gagal) {
      var sudah = false;
      API.swr('config', 'config', {}, function (cfg) {
        if (periksaPemeliharaan(cfg)) return;
        rakitNavbar(cfg, halamanAktif);
        rakitFooter(cfg, null);
        D.title = (D.title || '').replace(/\{nama\}/g, cfg.nama_pesantren || 'Portal Donasi');
        if (cfg.favicon_url) {
          var ic = D.querySelector('link[rel="icon"]');
          if (ic) ic.href = cfg.favicon_url;
        }
        if (!sudah) { sudah = true; selesai(cfg); }
        // Bagian statis (hero, judul bagian) diungkap begitu kerangka siap.
        setTimeout(function () { ungkap('.bagian, .hero-visual'); }, 30);
      }, { umur: 3600 }).catch(function (e) {
        if (!sudah) gagal(e);
      });
    });
  }

  // ====================================================== Ekspor
  global.UI = {
    ikon: ikon, aman: aman, rupiah: rupiah, angkaID: angkaID,
    tanggal: tanggal, waktu: waktu, inisial: inisial, paramUrl: paramUrl,
    gambar: gambar, toast: toast, salin: salin,
    hitungNaik: hitungNaik, amatiSekali: amatiSekali,
    ungkap: ungkap, kurangGerak: function () { return KURANG_GERAK; },
    mulaiTema: mulaiTema, gantiTema: gantiTema,
    rakitNavbar: rakitNavbar, rakitFooter: rakitFooter,
    tampilkanGalat: tampilkanGalat, mulaiHalaman: mulaiHalaman
  };
})(window);
