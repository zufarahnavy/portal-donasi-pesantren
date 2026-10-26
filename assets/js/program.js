/* ============================================================================
   program.js — Halaman detail program donasi
   Alamat: program.html?slug=nama-program
   ============================================================================ */

(function () {
  'use strict';

  /**
   * Label legalitas yang dipakai sebagai tanda "terverifikasi" di halaman
   * program. Diambil dari baris legalitas yang Superadmin tandai untuk
   * disorot; pemasangan lama yang belum punya daftar itu tetap memakai
   * pengaturan legalitas_bwi.
   */
  function sorotLegal() {
    try { return UI.legalitasSorot(cfg, 'badge'); } catch (e) { return null; }
  }
  function labelNazhir() {
    var l = sorotLegal();
    if (l) return l.judul + (l.nomor ? ' — ' + l.nomor : '');
    return cfg.legalitas_bwi || '';
  }
  function ikonNazhir() {
    var l = sorotLegal();
    return (l && l.ikon) || 'perisai';
  }

  var D = document;
  var $ = function (id) { return D.getElementById(id); };
  var slug = UI.paramUrl('slug') || UI.paramUrl('id');
  var cfg = {};
  var prog = null;

  var LABEL_KATEGORI = { wakaf: 'Wakaf Produktif', beasiswa: 'Beasiswa Santri', infaq: 'Infaq & Sedekah' };

  UI.mulaiHalaman('program').then(function (c) {
    cfg = c;
    if (!slug) {
      UI.tampilkanGalat($('program-isi'), 'Program tidak disebutkan di alamat halaman.');
      return;
    }
    return API.swr('prog_' + slug, 'programDetail', { slug: slug }, function (data) {
      if (!data) return;
      prog = data;
      gambar(data);
    }, { umur: 600 });
  }).catch(function (err) {
    UI.tampilkanGalat($('program-isi'), err.message, function () { location.reload(); });
  });

  // ====================================================== Perakit
  function gambar(p) {
    D.title = p.judul + ' — ' + (cfg.nama_pesantren || 'Portal Donasi');

    $('remah').innerHTML =
      '<a href="index.html">Beranda</a><span>›</span>' +
      '<a href="index.html#program">Program Donasi</a><span>›</span>' +
      '<span>' + UI.aman(p.judul) + '</span>';

    $('program-isi').innerHTML =
      '<div class="lajur" style="gap:var(--s-md);margin-bottom:var(--s-xl)">' +
        '<div class="baris" style="flex-wrap:wrap;gap:.5rem">' +
          '<span class="lencana lencana-emas">' + UI.aman(LABEL_KATEGORI[p.kategori] || p.kategori) + '</span>' +
          (labelNazhir() ? '<span class="lencana">' + UI.ikon(ikonNazhir(), 'ikon-sm') +
            'Terverifikasi ' + UI.aman(labelNazhir()) + '</span>' : '') +
          (p.sisa_hari ? '<span class="lencana lencana-netral">' + UI.ikon('jam', 'ikon-sm') + p.sisa_hari + ' hari tersisa</span>' : '') +
        '</div>' +
        '<h1 style="font-size:clamp(1.75rem,4vw,2.75rem)">' + UI.aman(p.judul) + '</h1>' +
        '<p class="redup" style="max-width:70ch;margin:0">' + UI.aman(p.ringkasan || '') + '</p>' +
      '</div>' +

      '<div class="detail-kisi">' +
        '<div class="lajur" style="gap:var(--s-lg);min-width:0">' + kolomKiri(p) + '</div>' +
        '<aside>' + panelDonasi(p) + '</aside>' +
      '</div>';

    pasangGaleri(p);
    pasangTab(p);
    pasangPanel(p);
  }

  // ====================================================== Kolom kiri
  function kolomKiri(p) {
    var galeri = [p.gambar_url].concat(p.galeri || []).filter(Boolean);

    return (galeri.length
      ? '<div><div class="galeri-utama" id="galeri-utama">' + UI.gambar(galeri[0], p.judul) + '</div>' +
        (galeri.length > 1 ? '<div class="galeri-mini" id="galeri-mini">' + galeri.map(function (g, i) {
          return '<button type="button" data-url="' + UI.aman(g) + '" aria-selected="' + (i === 0) + '">' +
            UI.gambar(g, 'Foto ' + (i + 1)) + '</button>';
        }).join('') + '</div>' : '') + '</div>'
      : '') +

      '<div class="tab-pil" id="tab-detail" role="tablist" aria-label="Bagian program">' +
        '<button type="button" role="tab" data-tab="deskripsi" aria-selected="true">Deskripsi Program</button>' +
        (p.kabarProgres && p.kabarProgres.length
          ? '<button type="button" role="tab" data-tab="progres" aria-selected="false">Kabar Progres (' + p.kabarProgres.length + ')</button>' : '') +
        (p.doa && p.doa.length
          ? '<button type="button" role="tab" data-tab="doa" aria-selected="false">Doa Muhsinin (' + p.doa.length + ')</button>' : '') +
      '</div>' +

      '<div id="panel-deskripsi">' + panelDeskripsi(p) + '</div>' +
      '<div id="panel-progres" hidden>' + panelProgres(p) + '</div>' +
      '<div id="panel-doa" hidden>' + panelDoa(p) + '</div>';
  }

  function panelDeskripsi(p) {
    var rab = Array.isArray(p.rab) ? p.rab : [];
    var legal = Array.isArray(p.legalitas) ? p.legalitas : [];
    var totalRab = rab.reduce(function (a, r) { return a + (Number(r.nominal) || 0); }, 0);

    return (p.kutipan_dalil ? '<div class="dalil">' +
        '<span class="label-atas" style="color:rgba(255,255,255,.75)">Pahala Jariyah Abadi</span>' +
        '<p>“' + UI.aman(String(p.kutipan_dalil).split('—')[0].trim()) + '”</p>' +
        (String(p.kutipan_dalil).indexOf('—') > -1
          ? '<span>— ' + UI.aman(String(p.kutipan_dalil).split('—').slice(1).join('—').trim()) + '</span>' : '') +
      '</div>' : '') +

      (p.deskripsi_html
        ? '<div class="kartu kartu-isi"><h2 style="font-size:1.375rem">Latar Belakang & Urgensi</h2>' +
          '<div class="isi-kaya">' + p.deskripsi_html + '</div></div>'
        : '') +

      (rab.length ? '<div class="kartu kartu-isi" style="margin-top:var(--s-lg)">' +
        '<div class="baris-sela" style="margin-bottom:var(--s-sm)">' +
          '<h2 style="font-size:1.375rem;margin:0">Rincian Alokasi Dana</h2>' +
          '<span class="lencana lencana-sukses">Akuntabel & Diaudit</span>' +
        '</div>' +
        '<p class="kecil redup">Transparansi pembagian anggaran sesuai kebutuhan program.</p>' +
        rab.map(function (r) {
          return '<div class="rab-baris">' +
            '<span class="ikon-wadah" style="width:34px;height:34px">' + UI.ikon('kuitansi', 'ikon-sm') + '</span>' +
            '<div style="min-width:0"><b style="font-size:.9375rem">' + UI.aman(r.label) + '</b>' +
            '<div class="mini redup">' + UI.aman(r.ket || '') + '</div></div>' +
            '<div class="rab-nominal angka"><b>' + UI.rupiah(r.nominal) + '</b>' +
            (r.persen ? '<span class="mini redup">' + r.persen + '% anggaran</span>' : '') + '</div>' +
          '</div>';
        }).join('') +
        '<div class="rab-baris" style="border-top:2px solid var(--garis);border-bottom:0;font-weight:700">' +
          '<span>Total Kebutuhan Dana</span>' +
          '<div class="rab-nominal angka"><b style="color:var(--primer);font-size:1.0625rem">' + UI.rupiah(totalRab || p.target_dana) + '</b></div>' +
        '</div>' +
      '</div>' : '') +

      (legal.length ? '<div class="kartu kartu-isi" style="margin-top:var(--s-lg)">' +
        '<h2 style="font-size:1.375rem">Legalitas & Surat Keputusan</h2>' +
        '<div class="kisi kisi-2" style="margin-top:var(--s-md)">' + legal.map(function (l) {
          return '<div style="padding:var(--s-md);border:1px solid var(--garis);border-radius:var(--r-md)">' +
            '<div class="baris" style="align-items:flex-start">' + UI.ikon('perisai', 'ikon-sm') +
            '<div><b style="font-size:.875rem">' + UI.aman(l.judul) + '</b>' +
            '<div class="mini redup" style="margin:.25rem 0">' + UI.aman(l.ket || '') + '</div>' +
            '<div class="mini mono">' + UI.aman(l.nomor || '') + '</div></div></div></div>';
        }).join('') + '</div>' +
      '</div>' : '');
  }

  function panelProgres(p) {
    var daftar = p.kabarProgres || [];
    if (!daftar.length) return '';
    return '<div class="lajur" style="gap:var(--s-md)">' + daftar.map(function (b) {
      var url = 'artikel.html?slug=' + encodeURIComponent(b.slug);
      return '<article class="kartu kartu-isi">' +
        '<span class="berita-meta">' + UI.aman(b.kategori || 'Kabar') + ' • ' + UI.tanggal(b.tanggal, true) + '</span>' +
        '<h3 style="font-family:var(--badan);font-size:1.0625rem;margin:.35rem 0">' +
          '<a href="' + url + '" style="color:inherit">' + UI.aman(b.judul) + '</a></h3>' +
        '<p class="kecil redup" style="margin:0">' + UI.aman(b.ringkasan || '') + '</p>' +
        '<a class="baris kecil" href="' + url + '" style="font-weight:600;margin-top:var(--s-sm)">' +
          '<span>Baca laporan lengkap</span>' + UI.ikon('lanjut', 'ikon-sm') + '</a>' +
      '</article>';
    }).join('') + '</div>';
  }

  function panelDoa(p) {
    var daftar = p.doa || [];
    if (!daftar.length) return '';
    return '<div class="kisi kisi-2">' + daftar.map(function (t) {
      return '<div class="kartu doa-kartu">' +
        '<div class="doa-orang">' +
          '<span class="doa-inisial">' + UI.aman(UI.inisial(t.nama)) + '</span>' +
          '<span class="lajur"><b style="font-size:.875rem">' + UI.aman(t.nama) + '</b>' +
          '<span class="mini redup">' + UI.aman(t.kota || 'Muhsinin') + '</span></span>' +
        '</div>' +
        '<p class="doa-isi" style="margin:0">“' + UI.aman(t.isi) + '”</p>' +
      '</div>';
    }).join('') + '</div>';
  }

  // ====================================================== Panel donasi
  function panelDonasi(p) {
    var nominal = cfg.nominal_cepat || [50000, 100000, 500000];
    var tutup = String(p.status) !== 'aktif';

    return '<div class="kaca panel-donasi">' +
      '<span class="label-atas">Dana Terkumpul</span>' +
      '<div class="nominal-besar angka" style="font-size:clamp(1.6rem,4vw,2rem)">' + UI.rupiah(p.terkumpul) + '</div>' +
      '<div class="kecil redup angka" style="margin-bottom:.6rem">dari target ' + UI.rupiah(p.target_dana) + '</div>' +
      '<div class="progres"><i id="bar-progres" data-lebar="' + Math.min(100, p.persen) + '"></i></div>' +

      '<div class="ringkas-3" style="margin:var(--s-md) 0">' +
        '<div><b class="angka">' + UI.angkaID(p.jumlah_donatur) + '</b><span>Muhsinin</span></div>' +
        '<div><b class="angka">' + p.persen + '%</b><span>Tercapai</span></div>' +
        '<div><b class="angka">' + (p.sisa_hari === null || p.sisa_hari === undefined ? '∞' : p.sisa_hari) + '</b><span>Hari tersisa</span></div>' +
      '</div>' +

      (tutup
        ? '<div class="pesan pesan-ingat">' + UI.ikon('info', 'ikon-sm') +
          '<span>Program ini sudah tidak menerima donasi baru. Silakan pilih program lain yang masih berjalan.</span></div>' +
          '<a class="tombol tombol-hantu tombol-penuh" href="index.html#program" style="margin-top:var(--s-md)">Lihat Program Lain</a>'

        : '<div class="bidang"><label for="pilih-nominal">Pilih nominal donasi</label>' +
            '<div class="kampanye-chip" id="pilih-nominal" style="grid-template-columns:repeat(3,1fr)">' +
              nominal.map(function (n) {
                return '<button type="button" class="chip-nominal" data-nominal="' + n + '" aria-pressed="false">' +
                  UI.rupiah(n, true) + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<div class="bidang">' +
            '<label for="nominal-lain">Atau isi nominal sendiri</label>' +
            '<input type="number" id="nominal-lain" inputmode="numeric" min="' + (cfg.nominal_minimal || 10000) + '" ' +
              'step="1000" placeholder="Contoh: 250000">' +
            '<span class="bantu">Minimal ' + UI.rupiah(cfg.nominal_minimal || 10000) + '</span>' +
          '</div>' +

          '<a class="tombol tombol-emas tombol-penuh" id="tombol-tunaikan" href="donasi.html?program=' +
            encodeURIComponent(p.slug) + '">' + UI.ikon('hati', 'ikon-sm') + 'Tunaikan Donasi Sekarang</a>' +

          '<div class="baris" style="gap:.5rem;margin-top:var(--s-sm)">' +
            '<button class="tombol tombol-lembut tombol-kecil tumbuh" type="button" id="kirim-wa">' +
              UI.ikon('obrolan', 'ikon-sm') + 'Tanya Dulu</button>' +
            '<button class="tombol tombol-lembut tombol-kecil tumbuh" type="button" id="salin-tautan">' +
              UI.ikon('bagikan', 'ikon-sm') + 'Bagikan</button>' +
          '</div>') +

      '<hr class="pemisah">' +
      '<div class="jaminan">' +
        '<div>' + UI.ikon('centang', 'ikon-sm') + '<span><b>100% tanpa potongan admin.</b> Seluruh nominal masuk ke pos program ini.</span></div>' +
        (labelNazhir() ? '<div>' + UI.ikon(ikonNazhir(), 'ikon-sm') +
          '<span><b>Lembaga terdaftar resmi.</b> ' + UI.aman(labelNazhir()) + '</span></div>' : '') +
        '<div>' + UI.ikon('kuitansi', 'ikon-sm') + '<span><b>Kuitansi digital.</b> Terbit otomatis lengkap dengan kode QR pemeriksaan keaslian.</span></div>' +
      '</div>' +
    '</div>';
  }

  // ====================================================== Perilaku
  function pasangGaleri(p) {
    var mini = $('galeri-mini');
    if (!mini) return;
    mini.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-url]');
      if (!b) return;
      $('galeri-utama').innerHTML = UI.gambar(b.getAttribute('data-url'), p.judul);
      Array.prototype.forEach.call(mini.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-selected', String(x === b));
      });
    });
  }

  function pasangTab() {
    var tab = $('tab-detail');
    if (!tab) return;
    tab.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]');
      if (!b) return;
      var nama = b.getAttribute('data-tab');
      Array.prototype.forEach.call(tab.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-selected', String(x === b));
      });
      ['deskripsi', 'progres', 'doa'].forEach(function (n) {
        var el = $('panel-' + n);
        if (el) el.hidden = (n !== nama);
      });
    });
  }

  function pasangPanel(p) {
    var bar = $('bar-progres');
    if (bar) requestAnimationFrame(function () { bar.style.width = bar.getAttribute('data-lebar') + '%'; });

    var pilih = $('pilih-nominal');
    var lain = $('nominal-lain');
    var tombol = $('tombol-tunaikan');

    function perbaruiTautan(nominal) {
      if (!tombol) return;
      var dasar = 'donasi.html?program=' + encodeURIComponent(p.slug);
      tombol.href = nominal ? dasar + '&nominal=' + nominal : dasar;
    }

    if (pilih) {
      pilih.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-nominal]');
        if (!b) return;
        Array.prototype.forEach.call(pilih.querySelectorAll('button'), function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        if (lain) lain.value = b.getAttribute('data-nominal');
        perbaruiTautan(b.getAttribute('data-nominal'));
      });
    }

    if (lain) {
      lain.addEventListener('input', function () {
        if (pilih) {
          Array.prototype.forEach.call(pilih.querySelectorAll('button'), function (x) {
            x.setAttribute('aria-pressed', String(x.getAttribute('data-nominal') === lain.value));
          });
        }
        perbaruiTautan(lain.value);
      });
    }

    var wa = $('kirim-wa');
    if (wa) {
      wa.addEventListener('click', function () {
        var tujuan = String(cfg.no_wa_admin || '').replace(/\D/g, '').replace(/^0/, '62');
        if (!tujuan) { UI.toast('Nomor WhatsApp layanan belum diatur.', 'galat'); return; }
        var pesan = 'Assalamu\'alaikum, saya ingin bertanya tentang program "' + p.judul + '".';
        window.open('https://wa.me/' + tujuan + '?text=' + encodeURIComponent(pesan), '_blank', 'noopener');
      });
    }

    var bagikan = $('salin-tautan');
    if (bagikan) {
      bagikan.addEventListener('click', function () {
        var url = location.href;
        if (navigator.share) {
          navigator.share({ title: p.judul, text: p.ringkasan || '', url: url }).catch(function () {});
        } else {
          UI.salin(url, 'Tautan program berhasil disalin.');
        }
      });
    }
  }
})();
