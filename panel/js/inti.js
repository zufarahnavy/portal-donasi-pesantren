/* ============================================================================
   inti.js — Inti panel: sesi, kerangka, navigasi, dan perkakas tampilan
   ----------------------------------------------------------------------------
   Token sesi disimpan di sessionStorage, bukan localStorage: menutup tab
   berarti keluar. Itu pilihan sadar untuk panel yang memuat data pribadi
   donatur, dan backend tetap punya umur token 8 jam sebagai batas keras.
   ============================================================================ */

(function (global) {
  'use strict';

  var D = document;
  var KUNCI_SESI = 'pd_panel_sesi';

  var P = {
    sesi: null,          // { token, me:{id,nama,peran,...} }
    cfg: {},             // pengaturan publik (nama lembaga, logo)
    halaman: '',
    data: {},            // simpanan ringan antar halaman
    modul: {}            // diisi oleh berkas modul
  };

  // ======================================================= Sesi & permintaan

  function muatSesi() {
    try {
      var mentah = global.sessionStorage.getItem(KUNCI_SESI);
      if (!mentah) return null;
      var s = JSON.parse(mentah);
      return (s && s.token) ? s : null;
    } catch (e) { return null; }
  }

  function simpanSesi(s) {
    P.sesi = s;
    try {
      if (s) global.sessionStorage.setItem(KUNCI_SESI, JSON.stringify(s));
      else global.sessionStorage.removeItem(KUNCI_SESI);
    } catch (e) { /* mode penyamaran — panel tetap jalan sampai tab ditutup */ }
  }

  /**
   * Satu pintu untuk semua panggilan panel.
   * Sesi kedaluwarsa (401) otomatis mengembalikan pengguna ke layar masuk,
   * tanpa menampilkan pesan teknis.
   */
  function panggil(action, data) {
    return API.post(action, data || {}, P.sesi && P.sesi.token)
      .then(function (res) { return res.data; })
      .catch(function (err) {
        if (err.kode === 401) {
          simpanSesi(null);
          tampilkanMasuk('Sesi Anda sudah berakhir. Silakan masuk kembali.');
          throw err;
        }
        throw err;
      });
  }

  /** Beberapa pembacaan sekaligus dalam satu eksekusi server. */
  function panggilBanyak(daftar) {
    return API.batch(daftar, P.sesi && P.sesi.token).then(function (res) {
      var out = {};
      Object.keys(res.data || {}).forEach(function (k) {
        out[k] = res.data[k] && res.data[k].ok ? res.data[k].data : null;
      });
      return out;
    });
  }

  // ======================================================= Perkakas tampilan

  function el(id) { return D.getElementById(id); }

  function aman(v) { return UI.aman(v); }
  function rupiah(n) { return UI.rupiah(n); }
  function angka(n) { return UI.angkaID(n); }

  /** Tanggal + jam singkat untuk tabel panel. */
  function waktu(v) {
    if (!v) return '—';
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return UI.tanggal(v) + ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function jarakWaktu(v) {
    if (!v) return '—';
    var d = new Date(v).getTime();
    if (isNaN(d)) return String(v);
    var s = Math.round((Date.now() - d) / 1000);
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 2592000) return Math.floor(s / 86400) + ' hari lalu';
    return UI.tanggal(v);
  }

  function toast(pesan, jenis) { UI.toast(pesan, jenis); }

  function galat(err) {
    if (!err) return;
    if (err.kode === 401) return;             // sudah ditangani panggil()
    toast(err.message || 'Terjadi kesalahan.', 'galat');
  }

  /** Rangka tunggu sederhana untuk sebuah wadah. */
  function tunggu(n) {
    var baris = '';
    for (var i = 0; i < (n || 5); i++) {
      baris += '<div class="rangka rangka-baris" style="width:' + (60 + (i % 4) * 10) + '%"></div>';
    }
    return '<div class="panel-kartu">' + baris + '</div>';
  }

  function kosong(ikon, judul, keterangan, tombol) {
    return '<div class="tabel-kosong">' +
      '<div class="ikon-wadah" style="margin:0 auto var(--s-md)">' + UI.ikon(ikon || 'info', 'ikon-lg') + '</div>' +
      '<b style="display:block;color:var(--teks-kuat);margin-bottom:.25rem">' + aman(judul) + '</b>' +
      '<p class="kecil" style="margin:0 auto;max-width:42ch">' + aman(keterangan || '') + '</p>' +
      (tombol || '') +
    '</div>';
  }

  /** Lencana status donasi / antrean / blast dengan warna yang konsisten. */
  function lencana(teks, jenis) {
    var kelas = { sukses: 'lencana-sukses', ingat: 'lencana-ingat', galat: 'lencana-galat',
                  emas: 'lencana-emas' }[jenis] || 'lencana-netral';
    return '<span class="lencana ' + kelas + '">' + aman(teks) + '</span>';
  }

  function saklar(nama, nyala, label, nonaktif) {
    return '<label class="saklar">' +
      '<input type="checkbox" data-saklar="' + aman(nama) + '"' + (nyala ? ' checked' : '') +
        (nonaktif ? ' disabled' : '') + '>' +
      '<span class="saklar-rel"></span>' +
      (label ? '<span class="kecil">' + aman(label) + '</span>' : '') +
    '</label>';
  }

  /** Paginasi seragam: dipakai donasi, log, dan CRM. */
  function paginasi(data, idWadah) {
    var total = data.totalHalaman || 1;
    if (total <= 1) {
      return '<div class="hal"><span>' + angka(data.total || 0) + ' baris</span></div>';
    }
    var kini = data.halaman || 1;
    var nomor = [];
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - kini) <= 1) nomor.push(i);
      else if (nomor[nomor.length - 1] !== '…') nomor.push('…');
    }
    var per = data.perHalaman || 25;
    var dari = (kini - 1) * per + 1;

    return '<div class="hal" data-hal="' + aman(idWadah || '') + '">' +
      '<span>' + angka(dari) + '–' + angka(Math.min(kini * per, data.total)) +
        ' dari ' + angka(data.total) + '</span>' +
      '<button type="button" data-ke="' + (kini - 1) + '"' + (kini <= 1 ? ' disabled' : '') + '>‹</button>' +
      nomor.map(function (n) {
        return n === '…' ? '<span>…</span>'
          : '<button type="button" data-ke="' + n + '" aria-current="' + (n === kini) + '">' + n + '</button>';
      }).join('') +
      '<button type="button" data-ke="' + (kini + 1) + '"' + (kini >= total ? ' disabled' : '') + '>›</button>' +
    '</div>';
  }

  // ======================================================= Modal

  var tombolPemanggil = null;

  function modal(opsi) {
    tutupModal();
    tombolPemanggil = D.activeElement;

    var w = D.createElement('div');
    w.className = 'modal-latar';
    w.innerHTML =
      '<div class="modal' + (opsi.lebar ? ' modal-lebar' : '') + '" role="dialog" aria-modal="true" ' +
        'aria-label="' + aman(opsi.judul) + '">' +
        '<div class="modal-kepala">' +
          '<h2>' + aman(opsi.judul) + '</h2>' +
          '<button type="button" class="tombol-bulat" data-tutup style="margin-left:auto" ' +
            'aria-label="Tutup">' + UI.ikon('tutup', 'ikon-sm') + '</button>' +
        '</div>' +
        '<div class="modal-isi">' + (opsi.isi || '') + '</div>' +
        (opsi.kaki === null ? '' : '<div class="modal-kaki">' + (opsi.kaki ||
          '<button type="button" class="tombol tombol-lembut" data-tutup>Tutup</button>') + '</div>') +
      '</div>';

    el('modal-wadah').appendChild(w);
    D.body.style.overflow = 'hidden';

    w.addEventListener('click', function (e) {
      if (e.target === w || e.target.closest('[data-tutup]')) tutupModal();
    });

    var fokus = w.querySelector('input,select,textarea,button:not([data-tutup])');
    if (fokus) setTimeout(function () { fokus.focus(); }, 40);

    if (opsi.saatBuka) opsi.saatBuka(w);
    return w;
  }

  function tutupModal() {
    var w = el('modal-wadah');
    if (!w || !w.firstChild) return;
    w.innerHTML = '';
    D.body.style.overflow = '';
    if (tombolPemanggil && tombolPemanggil.focus) tombolPemanggil.focus();
    tombolPemanggil = null;
  }

  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupModal(); });

  /** Konfirmasi dengan kata-kata manusia, bukan "Are you sure?". */
  function konfirmasi(judul, keterangan, labelYa, bahaya) {
    return new Promise(function (selesai) {
      var w = modal({
        judul: judul,
        isi: '<p style="margin:0">' + aman(keterangan) + '</p>',
        kaki: '<button type="button" class="tombol tombol-lembut" data-tutup>Batal</button>' +
              '<button type="button" class="tombol ' + (bahaya ? 'tombol-emas' : 'tombol-primer') +
              '" data-ya>' + aman(labelYa || 'Lanjutkan') + '</button>'
      });
      w.querySelector('[data-ya]').addEventListener('click', function () {
        tutupModal(); selesai(true);
      });
      w.addEventListener('click', function (e) {
        if (e.target === w || e.target.closest('[data-tutup]')) selesai(false);
      });
    });
  }

  // ======================================================= Formulir ringkas

  /** Bangun satu bidang formulir dari deskripsi objek. */
  function bidang(f) {
    var id = 'f-' + f.nama;
    var wajib = f.wajib ? ' required' : '';
    var nilai = f.nilai === undefined || f.nilai === null ? '' : String(f.nilai);
    var isi;

    if (f.tipe === 'area') {
      isi = '<textarea id="' + id + '" name="' + f.nama + '"' + wajib +
            (f.baris ? ' rows="' + f.baris + '"' : '') +
            (f.petunjuk ? ' placeholder="' + aman(f.petunjuk) + '"' : '') + '>' + aman(nilai) + '</textarea>';
    } else if (f.tipe === 'pilihan') {
      isi = '<select id="' + id + '" name="' + f.nama + '"' + wajib + '>' +
        (f.opsi || []).map(function (o) {
          var v = o.nilai !== undefined ? o.nilai : o;
          var t = o.label !== undefined ? o.label : o;
          return '<option value="' + aman(v) + '"' + (String(v) === nilai ? ' selected' : '') + '>' +
                 aman(t) + '</option>';
        }).join('') + '</select>';
    } else if (f.tipe === 'centang') {
      return '<div class="bidang"><label class="centang">' +
        '<input type="checkbox" id="' + id + '" name="' + f.nama + '"' + (f.nilai ? ' checked' : '') + '>' +
        '<span>' + aman(f.label) + '</span></label>' +
        (f.bantu ? '<span class="bantu">' + aman(f.bantu) + '</span>' : '') + '</div>';
    } else if (f.tipe === 'saklar') {
      return '<div class="bidang sela" style="flex-direction:row;align-items:center">' +
        '<span class="lajur"><label for="' + id + '" style="margin:0">' + aman(f.label) + '</label>' +
        (f.bantu ? '<span class="bantu">' + aman(f.bantu) + '</span>' : '') + '</span>' +
        '<label class="saklar"><input type="checkbox" id="' + id + '" name="' + f.nama + '"' +
        (f.nilai ? ' checked' : '') + '><span class="saklar-rel"></span></label></div>';
    } else {
      isi = '<input type="' + (f.tipe || 'text') + '" id="' + id + '" name="' + f.nama + '" ' +
            'value="' + aman(nilai) + '"' + wajib +
            (f.petunjuk ? ' placeholder="' + aman(f.petunjuk) + '"' : '') +
            (f.min !== undefined ? ' min="' + f.min + '"' : '') +
            (f.langkah ? ' step="' + f.langkah + '"' : '') + '>';
    }

    return '<div class="bidang">' +
      '<label for="' + id + '">' + aman(f.label) + (f.wajib ? ' <span class="wajib">*</span>' : '') + '</label>' +
      isi +
      (f.bantu ? '<span class="bantu">' + aman(f.bantu) + '</span>' : '') +
    '</div>';
  }

  /** Kumpulkan isi formulir menjadi objek biasa. */
  function nilaiForm(form) {
    var out = {};
    Array.prototype.forEach.call(form.querySelectorAll('[name]'), function (i) {
      if (i.type === 'checkbox') out[i.name] = i.checked;
      else if (i.type === 'number') out[i.name] = i.value === '' ? '' : Number(i.value);
      else out[i.name] = i.value;
    });
    return out;
  }

  /** Baca berkas jadi base64 untuk endpoint unggah. */
  function bacaBerkas(file, maksMB) {
    return new Promise(function (selesai, gagal) {
      var maks = (maksMB || 5) * 1024 * 1024;
      if (file.size > maks) {
        gagal(new Error('Ukuran berkas ' + Math.round(file.size / 1024 / 1024 * 10) / 10 +
                        ' MB melebihi batas ' + (maksMB || 5) + ' MB.'));
        return;
      }
      var r = new FileReader();
      r.onerror = function () { gagal(new Error('Berkas gagal dibaca.')); };
      r.onload = function () {
        selesai({
          nama: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: String(r.result).split(',')[1] || ''
        });
      };
      r.readAsDataURL(file);
    });
  }

  /** Unduh teks sebagai berkas — dipakai ekspor CSV. */
  function unduhTeks(namaFile, isi, mime) {
    try {
      var blob = new Blob([isi], { type: (mime || 'text/csv') + ';charset=utf-8;' });
      var a = D.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = namaFile;
      D.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch (e) {
      toast('Peramban menolak mengunduh berkas: ' + e.message, 'galat');
    }
  }

  /** Tombol dengan keadaan "sedang bekerja" supaya tidak ditekan dua kali. */
  function sibuk(tombol, sedang, labelSibuk) {
    if (!tombol) return;
    if (sedang) {
      tombol.dataset.labelAsli = tombol.innerHTML;
      tombol.disabled = true;
      tombol.innerHTML = aman(labelSibuk || 'Memproses…');
    } else {
      tombol.disabled = false;
      if (tombol.dataset.labelAsli) tombol.innerHTML = tombol.dataset.labelAsli;
    }
  }

  // ======================================================= Grafik sederhana

  /** Garis tren tanpa pustaka luar — SVG yang dihitung sendiri. */
  function grafikGaris(titik, opsi) {
    opsi = opsi || {};
    if (!titik.length) return kosong('diagram', 'Belum ada data', 'Grafik muncul setelah ada donasi masuk.');

    var l = 560, t = 170, pad = { a: 10, b: 26, k: 8, n: 8 };
    var maks = Math.max.apply(null, titik.map(function (p) { return p.nilai; })) || 1;
    var lebar = l - pad.k - pad.n;
    var tinggi = t - pad.a - pad.b;

    var x = function (i) { return pad.k + (titik.length === 1 ? lebar / 2 : i / (titik.length - 1) * lebar); };
    var y = function (v) { return pad.a + tinggi - (v / maks) * tinggi; };

    var garis = titik.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.nilai).toFixed(1); }).join(' ');
    var area = garis + ' L' + x(titik.length - 1).toFixed(1) + ' ' + (pad.a + tinggi) +
               ' L' + x(0).toFixed(1) + ' ' + (pad.a + tinggi) + ' Z';

    var label = '';
    [0, Math.floor(titik.length / 2), titik.length - 1].forEach(function (i, n) {
      if (!titik[i]) return;
      label += '<text class="grafik-sumbu" x="' + x(i).toFixed(1) + '" y="' + (t - 8) + '" ' +
        'text-anchor="' + (n === 0 ? 'start' : n === 2 ? 'end' : 'middle') + '">' +
        aman(UI.tanggal(titik[i].label)) + '</text>';
    });

    return '<svg class="grafik" viewBox="0 0 ' + l + ' ' + t + '" preserveAspectRatio="none" ' +
      'role="img" aria-label="' + aman(opsi.judul || 'Grafik tren') + '">' +
      '<path class="grafik-area" d="' + area + '"></path>' +
      '<path class="grafik-garis" d="' + garis + '"></path>' +
      '<circle class="grafik-titik" cx="' + x(titik.length - 1).toFixed(1) + '" cy="' +
        y(titik[titik.length - 1].nilai).toFixed(1) + '" r="3.5"></circle>' +
      label +
    '</svg>';
  }

  /** Daftar batang horizontal — alokasi program, rekap kategori. */
  function grafikBatang(item, opsi) {
    opsi = opsi || {};
    if (!item.length) return kosong('diagram', 'Belum ada data', opsi.kosong || '');
    var maks = Math.max.apply(null, item.map(function (i) { return i.nilai; })) || 1;

    return '<div class="batang">' + item.map(function (i) {
      return '<div class="batang-butir">' +
        '<span class="potong-1" style="font-weight:600">' + aman(i.label) + '</span>' +
        '<b class="angka">' + (opsi.rupiah ? rupiah(i.nilai) : angka(i.nilai)) + '</b>' +
        '<span class="batang-rel"><span class="batang-isi" style="width:' +
          (i.nilai / maks * 100).toFixed(1) + '%' + (i.warna ? ';background:' + aman(i.warna) : '') +
        '"></span></span>' +
      '</div>';
    }).join('') + '</div>';
  }

  // ======================================================= Menu & navigasi

  var MENU = [
    { grup: 'Ringkasan', butir: [
      { kunci: 'dasbor', label: 'Dasbor', ikon: 'diagram' }
    ] },
    { grup: 'Donasi', butir: [
      { kunci: 'donasi',  label: 'Daftar Donasi', ikon: 'kuitansi' },
      { kunci: 'program', label: 'Program',       ikon: 'hati' },
      { kunci: 'laporan', label: 'Laporan & Ekspor', ikon: 'berkas' }
    ] },
    { grup: 'Jangkauan', butir: [
      { kunci: 'crm',   label: 'CRM Kontak',   ikon: 'orangBanyak' },
      { kunci: 'blast', label: 'Blast WhatsApp', ikon: 'obrolan' }
    ] },
    { grup: 'Konten Situs', sa: true, butir: [
      { kunci: 'beranda',  label: 'Bagian Beranda', ikon: 'pustaka' },
      { kunci: 'berita',   label: 'Berita',         ikon: 'kitab' },
      { kunci: 'konten',   label: 'Statistik, Agenda & Audit', ikon: 'bintang' },
      { kunci: 'formulir', label: 'Formulir Donasi', ikon: 'kode' },
      { kunci: 'dokumen',  label: 'Dokumen Publik',  ikon: 'berkas' }
    ] },
    { grup: 'Sistem', sa: true, butir: [
      { kunci: 'pengaturan', label: 'Identitas & Pengaturan', ikon: 'gedung' },
      { kunci: 'notifikasi', label: 'Notifikasi',   ikon: 'surat' },
      { kunci: 'pengguna',   label: 'Akun Panel',   ikon: 'perisai' },
      { kunci: 'log',        label: 'Jejak Aktivitas', ikon: 'jam' },
      { kunci: 'sistem',     label: 'Status & Migrasi', ikon: 'putar' }
    ] }
  ];

  function rakitMenu() {
    var sa = P.sesi && P.sesi.me.peran === 'SUPERADMIN';
    el('sisi-menu').innerHTML = MENU.filter(function (g) { return !g.sa || sa; }).map(function (g) {
      return '<div class="sisi-grup">' + aman(g.grup) + '</div>' +
        g.butir.map(function (b) {
          return '<a href="#/' + b.kunci + '" data-halaman="' + b.kunci + '">' +
            UI.ikon(b.ikon, 'ikon-sm') + '<span>' + aman(b.label) + '</span>' +
            '<span class="hitung" id="hitung-' + b.kunci + '" hidden></span></a>';
        }).join('');
    }).join('');
  }

  function judulHalaman(kunci) {
    var hasil = null;
    MENU.forEach(function (g) {
      g.butir.forEach(function (b) { if (b.kunci === kunci) hasil = b.label; });
    });
    return hasil || 'Panel';
  }

  function tandaiMenu(kunci) {
    Array.prototype.forEach.call(el('sisi-menu').querySelectorAll('a'), function (a) {
      if (a.getAttribute('data-halaman') === kunci) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function subJudul(teks) { el('bar-sub').textContent = teks || ''; }

  function tutupSisi() {
    el('sisi').classList.remove('buka');
    el('tirai').hidden = true;
  }

  /** Pindah halaman: modul menerima wadah #isi dan merender sendiri. */
  function buka(kunci, paksa) {
    var sa = P.sesi && P.sesi.me.peran === 'SUPERADMIN';
    var adaModul = !!P.modul[kunci];
    var bolehSA = true;
    MENU.forEach(function (g) {
      g.butir.forEach(function (b) { if (b.kunci === kunci && g.sa && !sa) bolehSA = false; });
    });

    if (!adaModul || !bolehSA) {
      if (!bolehSA) toast('Halaman itu khusus Superadmin.', 'galat');
      kunci = 'dasbor';
    }

    if (P.halaman === kunci && !paksa) { tutupSisi(); return; }
    P.halaman = kunci;

    tandaiMenu(kunci);
    el('bar-judul').textContent = judulHalaman(kunci);
    subJudul('');
    tutupSisi();
    if (location.hash !== '#/' + kunci) {
      try { history.replaceState(null, '', '#/' + kunci); } catch (e) {}
    }

    var wadah = el('isi');
    wadah.innerHTML = tunggu(6);
    wadah.scrollTop = 0;

    Promise.resolve()
      .then(function () { return P.modul[kunci](wadah); })
      .catch(function (err) {
        galat(err);
        if (err.kode !== 401) {
          wadah.innerHTML = '<div class="panel-kartu">' +
            kosong('ingat', 'Halaman gagal dimuat', err.message || 'Coba muat ulang.',
              '<button type="button" class="tombol tombol-lembut tombol-kecil" ' +
              'style="margin-top:var(--s-md)" onclick="PANEL.buka(\'' + kunci + '\', true)">Coba lagi</button>') +
          '</div>';
        }
      });
  }

  // ======================================================= Layar masuk

  function tampilkanMasuk(pesan) {
    el('kerangka').hidden = true;
    el('layar-masuk').hidden = false;
    el('masuk-lambang').innerHTML = P.cfg.logo_url
      ? '<img src="' + aman(P.cfg.logo_url) + '" alt="">'
      : UI.ikon('masjid', 'ikon-lg');
    el('masuk-judul').textContent = 'Panel Pengelola';
    el('masuk-sub').textContent = P.cfg.nama_pesantren || 'Portal Donasi Pondok Pesantren';
    el('masuk-catatan').textContent =
      'Halaman ini hanya untuk pengurus. Seluruh tindakan tercatat pada jejak aktivitas.';

    var g = el('m-galat');
    if (pesan) { g.textContent = pesan; g.hidden = false; } else { g.hidden = true; }
    setTimeout(function () { el('m-username').focus(); }, 60);
  }

  function tampilkanPanel() {
    el('layar-masuk').hidden = true;
    el('kerangka').hidden = false;

    el('sisi-lambang').innerHTML = P.cfg.logo_url
      ? '<img src="' + aman(P.cfg.logo_url) + '" alt="">'
      : UI.ikon('masjid', 'ikon-sm');
    el('sisi-nama').textContent = P.cfg.nama_singkat || P.cfg.nama_pesantren || 'Portal Donasi';

    var me = P.sesi.me;
    el('aku-nama').textContent = me.nama || me.username || '—';
    el('aku-peran').textContent = me.peran === 'SUPERADMIN' ? 'Superadmin' : 'Admin';
    el('aku-avatar').textContent = UI.inisial(me.nama || me.username || '?');

    rakitMenu();
    buka((location.hash || '').replace('#/', '') || 'dasbor', true);
  }

  function masuk(username, sandi, tombol) {
    sibuk(tombol, true, 'Memeriksa…');
    el('m-galat').hidden = true;

    return API.post('login', { username: username, password: sandi })
      .then(function (res) {
        simpanSesi({ token: res.data.token, me: res.data.me });
        el('m-sandi').value = '';
        tampilkanPanel();
      })
      .catch(function (err) {
        var g = el('m-galat');
        g.textContent = err.message || 'Tidak bisa masuk.';
        g.hidden = false;
        el('m-sandi').select();
      })
      .then(function () { sibuk(tombol, false); });
  }

  function keluar() {
    var t = P.sesi && P.sesi.token;
    simpanSesi(null);
    API.bersihkanCache && API.bersihkanCache();
    if (t) API.post('logout', {}, t).catch(function () {});
    tampilkanMasuk('Anda sudah keluar dari panel.');
  }

  // ======================================================= Pemasangan awal

  function pasang() {
    UI.mulaiTema();

    // --- tombol kerangka
    el('tombol-tema').innerHTML = UI.ikon('bulan', 'ikon-sm');
    el('tombol-segar').innerHTML = UI.ikon('putar', 'ikon-sm');
    el('tombol-situs').innerHTML = UI.ikon('dunia', 'ikon-sm');
    el('sisi-buka').innerHTML = UI.ikon('menu', 'ikon-sm');
    el('sisi-tutup').innerHTML = UI.ikon('tutup', 'ikon-sm');
    el('m-lihat').innerHTML = UI.ikon('mata', 'ikon-sm');

    el('tombol-tema').addEventListener('click', function () { UI.gantiTema(); });
    el('tombol-segar').addEventListener('click', function () {
      API.bersihkanCache && API.bersihkanCache();
      buka(P.halaman, true);
      toast('Data dimuat ulang dari server.');
    });
    el('tombol-keluar').addEventListener('click', function () {
      konfirmasi('Keluar dari panel?', 'Sesi ini akan diakhiri dan Anda perlu masuk kembali.', 'Keluar')
        .then(function (ya) { if (ya) keluar(); });
    });

    el('sisi-buka').addEventListener('click', function () {
      el('sisi').classList.add('buka');
      el('tirai').hidden = false;
    });
    el('sisi-tutup').addEventListener('click', tutupSisi);
    el('tirai').addEventListener('click', tutupSisi);

    el('sisi-menu').addEventListener('click', function (e) {
      var a = e.target.closest('a[data-halaman]');
      if (!a) return;
      e.preventDefault();
      buka(a.getAttribute('data-halaman'));
    });

    global.addEventListener('hashchange', function () {
      var k = (location.hash || '').replace('#/', '');
      if (k && k !== P.halaman) buka(k);
    });

    // --- layar masuk
    el('m-lihat').addEventListener('click', function () {
      var i = el('m-sandi');
      var tampil = i.type === 'password';
      i.type = tampil ? 'text' : 'password';
      this.innerHTML = UI.ikon(tampil ? 'mataTutup' : 'mata', 'ikon-sm');
      this.setAttribute('aria-label', tampil ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      this.setAttribute('aria-pressed', String(tampil));
      i.focus();
    });

    el('form-masuk').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = el('m-username').value.trim();
      var s = el('m-sandi').value;
      if (!u || !s) {
        var g = el('m-galat');
        g.textContent = 'Nama pengguna dan kata sandi harus diisi.';
        g.hidden = false;
        return;
      }
      masuk(u, s, el('m-kirim'));
    });
  }

  // ======================================================= Ekspor

  global.PANEL = {
    P: P, el: el, aman: aman, rupiah: rupiah, angka: angka, waktu: waktu, jarakWaktu: jarakWaktu,
    ikon: function (n, k) { return UI.ikon(n, k); },
    panggil: panggil, panggilBanyak: panggilBanyak,
    toast: toast, galat: galat, tunggu: tunggu, kosong: kosong, lencana: lencana, saklar: saklar,
    paginasi: paginasi, modal: modal, tutupModal: tutupModal, konfirmasi: konfirmasi,
    bidang: bidang, nilaiForm: nilaiForm, bacaBerkas: bacaBerkas, unduhTeks: unduhTeks, sibuk: sibuk,
    grafikGaris: grafikGaris, grafikBatang: grafikBatang,
    buka: buka, subJudul: subJudul, tampilkanMasuk: tampilkanMasuk, tampilkanPanel: tampilkanPanel,
    keluar: keluar, pasang: pasang, muatSesi: muatSesi, simpanSesi: simpanSesi
  };
})(window);
